import os
import json
import google.generativeai as genai
from datetime import date, timedelta
from django.db.models import Sum
from .models import Student, Transaction, Task, StudentStatus, SponsorshipStatus, Sponsor

# --- Tool Definitions ---

def get_student_count(status: str = None, sponsorship: str = None) -> str:
    # ... (this function remains the same)
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
    # ... (this function remains the same)
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
    # ... (this function remains the same)
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
    # ... (this function remains the same)
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

# --- NEW TOOL FOR REPORTING ---
def generate_report(
    report_type: str, 
    file_format: str, 
    student_status: str = None,
    sponsorship_status: str = None, 
    sponsor_name: str = None,
    start_date: str = None, 
    end_date: str = None
) -> str:
    """
    Generates a report and returns the data and instructions to the frontend.
    Args:
        report_type (str): The type of report. Supported: 'student_roster', 'financial'.
        file_format (str): The format to download. Supported: 'csv', 'pdf'.
        student_status (str): Filter for student status.
        sponsorship_status (str): Filter for sponsorship status.
        sponsor_name (str): The name of the sponsor to filter by.
        start_date (str): Start date for financial report (YYYY-MM-DD).
        end_date (str): End date for financial report (YYYY-MM-DD).
    """
    if report_type == 'student_roster':
        filters = {}
        if student_status: filters['student_status'] = student_status
        if sponsorship_status: filters['sponsorship_status'] = sponsorship_status
        if sponsor_name:
            try:
                sponsor = Sponsor.objects.get(name__iexact=sponsor_name)
                filters['sponsor'] = sponsor.id
            except Sponsor.DoesNotExist:
                return f"Sponsor named '{sponsor_name}' not found."
        
        students = Student.objects.filter(**filters).select_related('sponsor')
        data = [{
            'studentId': s.student_id, 'firstName': s.first_name, 'lastName': s.last_name,
            'dateOfBirth': s.date_of_birth.isoformat(), 'gender': s.gender, 'studentStatus': s.student_status,
            'sponsorshipStatus': s.sponsorship_status, 'sponsorName': s.sponsor.name if s.sponsor else 'N/A',
            'school': s.school, 'currentGrade': s.current_grade
        } for s in students]
        
        # This special string tells the frontend to trigger a download
        return f"[GENERATE_REPORT]\n{json.dumps({'type': 'student_roster', 'format': file_format, 'data': data})}"

    elif report_type == 'financial':
        if not start_date or not end_date:
            return "Start and end dates are required for financial reports."
        
        transactions = Transaction.objects.filter(date__range=[start_date, end_date])
        data = [{
            'date': t.date.isoformat(), 'description': t.description, 'category': t.category,
            'type': t.type, 'amount': float(t.amount)
        } for t in transactions]
        
        return f"[GENERATE_REPORT]\n{json.dumps({'type': 'financial', 'format': file_format, 'data': data, 'startDate': start_date, 'endDate': end_date})}"
        
    return f"Unsupported report type: {report_type}"

# --- Main Assistant Logic ---

def query_assistant(prompt: str, history: list) -> str:
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
                generate_report, # <-- ADD THE NEW TOOL HERE
            ]
        )
        
        chat = model.start_chat(history=history)
        response = chat.send_message(prompt)
        
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "I'm sorry, I encountered a problem while trying to answer your question. Please check the server logs for more details."