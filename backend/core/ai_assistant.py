import os
import google.generativeai as genai
from datetime import date, timedelta
from django.db.models import Sum
from .models import Student, Transaction, Task, StudentStatus, SponsorshipStatus

# --- Tool Definitions ---
# These functions allow the AI model to query your database safely.

def get_student_count(status: str = None, sponsorship: str = None) -> str:
    """
    Gets the count of students based on their status or sponsorship.
    Args:
        status (str): The status to filter by (e.g., 'Active', 'Inactive', 'Pending Qualification').
        sponsorship (str): The sponsorship status to filter by (e.g., 'Sponsored', 'Unsponsored').
    """
    queryset = Student.objects.all()
    description = []
    if status:
        valid_statuses = [s[0] for s in StudentStatus.choices]
        if status not in valid_statuses:
            return f"Invalid status '{status}'. Valid options are: {', '.join(valid_statuses)}"
        queryset = queryset.filter(student_status=status)
        description.append(f"status is '{status}'")
    if sponsorship:
        valid_sponsorships = [s[0] for s in SponsorshipStatus.choices]
        if sponsorship not in valid_sponsorships:
            return f"Invalid sponsorship status '{sponsorship}'. Valid options are: {', '.join(valid_sponsorships)}"
        queryset = queryset.filter(sponsorship_status=sponsorship)
        description.append(f"sponsorship is '{sponsorship}'")
    
    count = queryset.count()
    
    if description:
        return f"There are {count} students where the {' and '.join(description)}."
    else:
        return f"There are a total of {count} students in the system."

def list_students(sponsorship: str, limit: int = 10) -> str:
    """
    Lists the names of students, filtered by sponsorship status.
    Args:
        sponsorship (str): The sponsorship status to filter by (e.g., 'Unsponsored', 'Sponsored').
        limit (int): The maximum number of students to list. Defaults to 10.
    """
    valid_sponsorships = [s[0] for s in SponsorshipStatus.choices]
    if sponsorship not in valid_sponsorships:
        return f"Invalid sponsorship status '{sponsorship}'. Valid options are: {', '.join(valid_sponsorships)}"

    students = Student.objects.filter(sponsorship_status=sponsorship).order_by('first_name', 'last_name')[:limit]
    
    if not students:
        return f"No students found with sponsorship status '{sponsorship}'."
        
    student_names = [f"- {s.first_name} {s.last_name} ({s.student_id})" for s in students]
    count = Student.objects.filter(sponsorship_status=sponsorship).count()
    
    response = f"Here are the first {len(student_names)} of {count} students with sponsorship status '{sponsorship}':\n" + "\n".join(student_names)
    if count > limit:
        response += f"\n...and {count - limit} more."
    return response

def get_financial_summary(period: str) -> str:
    """
    Provides a financial summary (income, expenses, net balance) for a given period.
    Args:
        period (str): The period to summarize. Supported values: 'last_month', 'this_month'.
    """
    today = date.today()
    if period == 'last_month':
        first_day_of_this_month = today.replace(day=1)
        end_date = first_day_of_this_month - timedelta(days=1)
        start_date = end_date.replace(day=1)
    elif period == 'this_month':
        start_date = today.replace(day=1)
        end_date = today
    else:
        return "Invalid period. Supported periods are 'last_month' and 'this_month'."

    transactions = Transaction.objects.filter(date__range=[start_date, end_date])
    income = transactions.filter(type='Income').aggregate(total=Sum('amount'))['total'] or 0
    expense = transactions.filter(type='Expense').aggregate(total=Sum('amount'))['total'] or 0
    net_balance = income - expense

    return (f"Financial summary for {start_date.strftime('%B %Y')}:\n"
            f"- Total Income: ${income:,.2f}\n"
            f"- Total Expenses: ${expense:,.2f}\n"
            f"- Net Balance: ${net_balance:,.2f}")

def get_tasks_summary(priority: str = None, due_period: str = None) -> str:
    """
    Provides a summary of tasks, optionally filtered by priority and due period.
    Args:
        priority (str): The task priority to filter by (e.g., 'High', 'Medium', 'Low').
        due_period (str): The due period to filter by. Supported values: 'this_week', 'overdue'.
    """
    queryset = Task.objects.exclude(status=Task.TaskStatus.DONE)
    today = date.today()
    description_parts = []
    
    if priority:
        valid_priorities = [p[0] for p in Task.TaskPriority.choices]
        if priority not in valid_priorities:
            return f"Invalid priority '{priority}'. Valid options are: {', '.join(valid_priorities)}"
        queryset = queryset.filter(priority=priority)
        description_parts.append(f"with '{priority}' priority")
    if due_period:
        if due_period == 'this_week':
            end_of_week = today + timedelta(days=6 - today.weekday())
            queryset = queryset.filter(due_date__range=[today, end_of_week])
            description_parts.append("due this week")
        elif due_period == 'overdue':
            queryset = queryset.filter(due_date__lt=today)
            description_parts.append("that are overdue")
        else:
            return "Invalid due_period. Supported values are 'this_week' and 'overdue'."
            
    tasks = queryset.order_by('due_date')[:10]
    
    if not tasks:
        return f"No matching tasks found."
        
    task_list = [f"- {t.title} (Due: {t.due_date.strftime('%Y-%m-%d')}, Priority: {t.priority})" for t in tasks]
    description = " ".join(description_parts)
    return f"Here are the top tasks {description}:\n" + "\n".join(task_list)

# --- Main Assistant Logic ---

def query_assistant(prompt: str, history: list) -> str:
    """
    Handles a user's query by interacting with the Gemini model and its defined tools.
    """
    api_key = os.environ.get("API_KEY")
    if not api_key:
        return "The AI Assistant is not configured. An API key is missing on the server."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            tools=[
                get_student_count,
                list_students,
                get_financial_summary,
                get_tasks_summary,
            ]
        )
        
        chat = model.start_chat(history=history)
        response = chat.send_message(prompt)
        
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "I'm sorry, I encountered a problem while trying to answer your question. Please check the server logs for more details."