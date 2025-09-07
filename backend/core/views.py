# backend/core/views.py

from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from .models import (
    Student,
    AcademicReport,
    FollowUpRecord,
    Transaction,
    GovernmentFiling,
    Task
)
from .serializers import (
    StudentSerializer,
    AcademicReportSerializer,
    FollowUpRecordSerializer,
    TransactionSerializer,
    GovernmentFilingSerializer,
    TaskSerializer
)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().prefetch_related('academic_reports', 'follow_up_records')
    serializer_class = StudentSerializer

    @action(detail=True, methods=['post'], url_path='academic-reports')
    def add_academic_report(self, request, pk=None):
        student = self.get_object()
        serializer = AcademicReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=student)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], url_path='follow-up-records')
    def add_follow_up_record(self, request, pk=None):
        student = self.get_object()
        serializer = FollowUpRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=student)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AcademicReportViewSet(viewsets.ModelViewSet):
    queryset = AcademicReport.objects.all()
    serializer_class = AcademicReportSerializer

class FollowUpRecordViewSet(viewsets.ModelViewSet):
    queryset = FollowUpRecord.objects.all()
    serializer_class = FollowUpRecordSerializer
    
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

class GovernmentFilingViewSet(viewsets.ModelViewSet):
    queryset = GovernmentFiling.objects.all()
    serializer_class = GovernmentFilingSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class DashboardStatsView(views.APIView):
    def get(self, request, *args, **kwargs):
        total_students = Student.objects.count()
        active_students = Student.objects.filter(student_status='Active').count()
        upcoming_filings = GovernmentFiling.objects.filter(
            due_date__gte=timezone.now(), status='Pending'
        ).count()

        total_income = Transaction.objects.filter(type='Income').aggregate(total=Sum('amount'))['total'] or 0
        total_expense = Transaction.objects.filter(type='Expense').aggregate(total=Sum('amount'))['total'] or 0
        net_balance = total_income - total_expense

        status_distribution_query = Student.objects.values('student_status').annotate(value=Count('student_status')).order_by()
        status_distribution = {item['student_status']: item['value'] for item in status_distribution_query}

        monthly_breakdown = []
        today = timezone.now().date()
        for i in range(12, 0, -1):
            start_date = (today.replace(day=1) - timedelta(days=(i-1)*30)).replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            month_name = start_date.strftime("%b")
            income = Transaction.objects.filter(type='Income', date__range=[start_date, end_date]).aggregate(total=Sum('amount'))['total'] or 0
            expense = Transaction.objects.filter(type='Expense', date__range=[start_date, end_date]).aggregate(total=Sum('amount'))['total'] or 0
            monthly_breakdown.append({'month': month_name, 'income': income, 'expense': expense})

        stats_data = {
            'total_students': total_students,
            'active_students': active_students,
            'net_balance': net_balance,
            'upcoming_filings': upcoming_filings,
            'income_vs_expense': {'income': total_income, 'expense': total_expense},
            'student_status_distribution': status_distribution,
            'monthly_breakdown': monthly_breakdown,
        }
        return Response(stats_data)

class RecentTransactionsView(views.APIView):
    def get(self, request, *args, **kwargs):
        recent_transactions = Transaction.objects.order_by('-date')[:5]
        serializer = TransactionSerializer(recent_transactions, many=True)
        return Response(serializer.data)