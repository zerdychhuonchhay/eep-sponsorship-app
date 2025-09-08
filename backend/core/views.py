# core/views.py

from datetime import date, timedelta
from dateutil.parser import parse as parse_date
from django.db.models import Sum, Count, Q
from django.db import transaction
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Student, AcademicReport, FollowUpRecord, Transaction, GovernmentFiling, Task, StudentStatus
from .serializers import (
    StudentSerializer, AcademicReportSerializer, FollowUpRecordSerializer,
    TransactionSerializer, GovernmentFilingSerializer, TaskSerializer,
    StudentLookupSerializer, StudentListSerializer
)
from .pagination import StandardResultsSetPagination

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.prefetch_related('academic_reports', 'follow_up_records').order_by('first_name', 'last_name')
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'student_id']
    ordering_fields = ['first_name', 'last_name', 'student_id', 'date_of_birth', 'student_status', 'sponsorship_status']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # UPDATED: More robust filtering for student list
        student_status = self.request.query_params.get('student_status')
        sponsorship_status = self.request.query_params.get('sponsorship_status')
        gender = self.request.query_params.get('gender')
        if student_status: queryset = queryset.filter(student_status=student_status)
        if sponsorship_status: queryset = queryset.filter(sponsorship_status=sponsorship_status)
        if gender: queryset = queryset.filter(gender=gender)
        return queryset

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        students = Student.objects.order_by('first_name', 'last_name').only('student_id', 'first_name', 'last_name')
        serializer = StudentLookupSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk_import')
    @transaction.atomic
    def bulk_import(self, request):
        students_data = request.data
        created_count, updated_count, errors = 0, 0, []
        for student_data in students_data:
            student_id = student_data.get('student_id')
            if not student_id:
                errors.append({"id": "Unknown", "message": "Missing student_id."}); continue
            try:
                # Exclude date fields from being processed if they are empty strings
                defaults = {key: value for key, value in student_data.items() if key != 'student_id'}
                for field in ['date_of_birth', 'eep_enroll_date', 'application_date', 'out_of_program_date']:
                    if field in defaults and not defaults[field]:
                         defaults.pop(field)

                student, created = Student.objects.update_or_create(student_id=student_id, defaults=defaults)
                if created: created_count += 1
                else: updated_count += 1
            except Exception as e: errors.append({"id": student_id, "message": str(e)})
        return Response({
            "createdCount": created_count, "updatedCount": updated_count, "skippedCount": len(errors),
            "errors": [f"{err['id']}: {err['message']}" for err in errors]
        })

    @action(detail=True, methods=['post'], url_path='academic-reports')
    def academic_reports(self, request, pk=None):
        student = self.get_object()
        serializer = AcademicReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=student); return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='follow-up-records')
    def follow_up_records(self, request, pk=None):
        student = self.get_object()
        serializer = FollowUpRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=student); return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AcademicReportViewSet(viewsets.ModelViewSet):
    queryset = AcademicReport.objects.select_related('student').all()
    serializer_class = AcademicReportSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['student__first_name', 'report_period', 'grade_level', 'overall_average', 'pass_fail_status']
    def get_queryset(self):
        queryset = super().get_queryset()
        if year := self.request.query_params.get('year'): queryset = queryset.filter(report_period__contains=year)
        if grade := self.request.query_params.get('grade'): queryset = queryset.filter(grade_level=grade)
        if status := self.request.query_params.get('status'): queryset = queryset.filter(pass_fail_status=status)
        return queryset

class FollowUpRecordViewSet(viewsets.ModelViewSet):
    queryset = FollowUpRecord.objects.select_related('student').all()
    serializer_class = FollowUpRecordSerializer
    pagination_class = StandardResultsSetPagination

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'description', 'category', 'type', 'amount']
    def get_queryset(self):
        queryset = super().get_queryset()
        if type := self.request.query_params.get('type'): queryset = queryset.filter(type=type)
        if category := self.request.query_params.get('category'): queryset = queryset.filter(category=category)
        return queryset

class GovernmentFilingViewSet(viewsets.ModelViewSet):
    queryset = GovernmentFiling.objects.all()
    serializer_class = GovernmentFilingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['document_name', 'authority', 'due_date', 'status']

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['title', 'due_date', 'priority', 'status']
    def get_queryset(self):
        queryset = super().get_queryset()
        if status := self.request.query_params.get('status'): queryset = queryset.filter(status=status)
        if priority := self.request.query_params.get('priority'): queryset = queryset.filter(priority=priority)
        return queryset

@api_view(['GET'])
def dashboard_stats(request):
    # --- Date Range Filtering ---
    end_date_str = request.query_params.get('end_date')
    start_date_str = request.query_params.get('start_date')

    try:
        end_date = parse_date(end_date_str).date() if end_date_str else date.today()
        start_date = parse_date(start_date_str).date() if start_date_str else end_date - timedelta(days=29) # Default to 30 days
    except (ValueError, TypeError):
        end_date = date.today()
        start_date = end_date - timedelta(days=29)

    # --- Previous Period Calculation ---
    period_duration = end_date - start_date
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - period_duration
    
    # --- Helper to get stats for a period ---
    def get_stats_for_period(start, end):
        transactions_in_period = Transaction.objects.filter(date__range=[start, end])
        income = transactions_in_period.filter(type='Income').aggregate(total=Sum('amount'))['total'] or 0
        expense = transactions_in_period.filter(type='Expense').aggregate(total=Sum('amount'))['total'] or 0
        
        students_enrolled_by_end = Student.objects.filter(eep_enroll_date__lte=end)
        total_students = students_enrolled_by_end.count()
        
        active_students = students_enrolled_by_end.filter(
            (Q(out_of_program_date__gte=start) | Q(out_of_program_date__isnull=True)) &
            Q(student_status=StudentStatus.ACTIVE)
        ).count()
        
        return {
            "net_balance": float(income - expense),
            "active_students": active_students,
            "total_students": total_students,
        }

    current_period_stats = get_stats_for_period(start_date, end_date)
    previous_period_stats = get_stats_for_period(prev_start_date, prev_end_date)
    
    upcoming_filings = GovernmentFiling.objects.filter(due_date__gte=date.today()).count()
    status_dist = {
        item['student_status']: item['value'] 
        for item in Student.objects.filter(eep_enroll_date__lte=end_date).values('student_status').annotate(value=Count('student_id'))
    }
    
    monthly_breakdown = []
    current_month_start = end_date.replace(day=1)
    for i in range(12):
        month_start = (current_month_start - timedelta(days=i*30)).replace(day=1)
        next_month_start = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        month_end = next_month_start - timedelta(days=1)
        income_m = Transaction.objects.filter(type='Income', date__range=[month_start, month_end]).aggregate(total=Sum('amount'))['total'] or 0
        expense_m = Transaction.objects.filter(type='Expense', date__range=[month_start, month_end]).aggregate(total=Sum('amount'))['total'] or 0
        monthly_breakdown.append({'month': month_start.strftime('%b %y'), 'income': float(income_m), 'expense': float(expense_m)})

    return Response({
        'stats': {
            'total_students': current_period_stats['total_students'],
            'active_students': current_period_stats['active_students'],
            'net_balance': current_period_stats['net_balance'],
            'upcoming_filings': upcoming_filings,
        },
        'trends': {
            'total_students': previous_period_stats['total_students'],
            'active_students': previous_period_stats['active_students'],
            'net_balance': previous_period_stats['net_balance'],
        },
        'student_status_distribution': status_dist,
        'monthly_breakdown': list(reversed(monthly_breakdown))
    })

@api_view(['GET'])
def recent_transactions(request):
    recent = Transaction.objects.all().order_by('-date')[:5]
    serializer = TransactionSerializer(recent, many=True)
    return Response(serializer.data)