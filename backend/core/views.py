# backend/core/views.py

from datetime import date, timedelta
from dateutil.parser import parse as parse_date
from django.db.models import Sum, Count, Q
from django.db import transaction
from django.core.mail import send_mail
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User, Group
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from rest_framework import viewsets, status, filters, generics, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response    
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import (
    Student, AcademicReport, FollowUpRecord, Transaction, 
    GovernmentFiling, Task, StudentStatus, AuditLog, Sponsor, RoleProfile, StudentDocument
)
from .serializers import (
    StudentSerializer, AcademicReportSerializer, FollowUpRecordSerializer,
    TransactionSerializer, GovernmentFilingSerializer, TaskSerializer,
    StudentLookupSerializer, StudentListSerializer, AuditLogSerializer, 
    SponsorSerializer, SponsorLookupSerializer, UserRegistrationSerializer, 
    UserSerializer, InviteUserSerializer, RoleSerializer, GroupSerializer,
    ChangePasswordSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, StudentDocumentSerializer
)
from .pagination import StandardResultsSetPagination
from . import ai_assistant
from .permissions import HasModulePermission

# --- NEW IMPORTS FOR AI SEARCH ---
import google.generativeai as genai
import json
from django.conf import settings
from rest_framework.views import APIView

# --- NEW: CONFIGURE GEMINI API ---
try:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
except (AttributeError, TypeError):
    # Handle case where key is not set or None, to prevent server crash on startup
    print("WARNING: GOOGLE_API_KEY not configured in settings. AI features will not work.")
    pass


# --- Audit Logging Mixin ---
class AuditLoggingMixin:
    """Mixin to automatically log create, update, and delete actions."""

    def _log_action(self, request, instance, action, changes=None):
        user = request.user if request.user.is_authenticated else None
        user_identifier = str(user) if user else "Anonymous"
        content_type = ContentType.objects.get_for_model(instance.__class__)

        AuditLog.objects.create(
            user=user,
            user_identifier=user_identifier,
            action=action,
            content_type=content_type,
            object_id=instance.pk,
            object_repr=str(instance),
            changes=changes
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(self.request, instance, AuditLog.AuditAction.CREATE)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = self.get_serializer(old_instance).data
        
        instance = serializer.save()
        new_data = self.get_serializer(instance).data
        
        changes = {}
        for key, value in new_data.items():
            old_value = old_data.get(key)
            if isinstance(old_value, dict) and 'id' in old_value: old_value = old_value['id']
            if value != old_value:
                changes[key] = {'old': old_value, 'new': value}

        if changes:
            self._log_action(self.request, instance, AuditLog.AuditAction.UPDATE, changes=changes)

    def perform_destroy(self, instance):
        self._log_action(self.request, instance, AuditLog.AuditAction.DELETE)
        instance.delete()


# --- ViewSets ---
class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and managing user groups (roles).
    The 'Administrator' group is protected and cannot be modified via this API.
    """
    queryset = Group.objects.all().exclude(name='Administrator').order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAdminUser] # Only Admins can manage roles

# --- NEW: StudentDocumentViewSet for handling document deletion ---
class StudentDocumentViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    permission_classes = [HasModulePermission]
    module_name = 'students'  # Re-use students permissions
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    http_method_names = ['delete', 'head', 'options']  # Only allow deletion via this endpoint
class StudentViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'students'
    
    queryset = Student.objects.select_related('sponsor').prefetch_related('academic_reports', 'follow_up_records').order_by('first_name', 'last_name')
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'student_id']
    ordering_fields = ['first_name', 'last_name', 'student_id', 'date_of_birth', 'student_status', 'sponsorship_status']
    
    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'get_all':
            return StudentListSerializer
        return StudentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        student_status = self.request.query_params.get('student_status')
        sponsorship_status = self.request.query_params.get('sponsorship_status')
        gender = self.request.query_params.get('gender')
        sponsor_id = self.request.query_params.get('sponsor')

        if student_status: queryset = queryset.filter(student_status=student_status)
        if sponsorship_status: queryset = queryset.filter(sponsorship_status=sponsorship_status)
        if gender: queryset = queryset.filter(gender=gender)
        if sponsor_id: queryset = queryset.filter(sponsor_id=sponsor_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='all', pagination_class=None)
    def get_all(self, request):
        students = self.get_queryset()
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        students = Student.objects.order_by('first_name', 'last_name').only('student_id', 'first_name', 'last_name')
        serializer = StudentLookupSerializer(students, many=True)
        return Response(serializer.data)

    # NEW: Endpoint to get full details for multiple students by ID
    @action(detail=False, methods=['post'], url_path='bulk_details')
    def bulk_details(self, request):
        student_ids = request.data.get('student_ids', [])
        if not student_ids:
            return Response([], status=status.HTTP_200_OK)
        
        queryset = Student.objects.filter(student_id__in=student_ids)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='bulk_import')
    @transaction.atomic
    def bulk_import(self, request):
        students_data = request.data
        created_count, updated_count, errors = 0, 0, []
        
        required_fields_for_new = ['student_id', 'first_name', 'last_name']
        
        # Determine which students already exist
        incoming_ids = [s.get('student_id') for s in students_data if s.get('student_id')]
        existing_student_ids = set(Student.objects.filter(student_id__in=incoming_ids).values_list('student_id', flat=True))

        for student_data in students_data:
            student_id = student_data.get('student_id')
            if not student_id:
                errors.append({"id": "Unknown", "message": "Missing student_id."})
                continue

            is_existing = student_id in existing_student_ids

            # For new students, all required fields must be present.
            # For existing students, we only require the ID for identification.
            if not is_existing:
                missing_fields = [field for field in required_fields_for_new if not student_data.get(field)]
                if missing_fields:
                    error_msg = f"Missing required fields for new student: {', '.join(missing_fields)}"
                    errors.append({"id": student_id, "message": error_msg})
                    continue

            try:
                defaults = {key: value for key, value in student_data.items() if key != 'student_id'}
                for field in ['date_of_birth', 'eep_enroll_date', 'application_date', 'out_of_program_date']:
                    if field in defaults and not defaults[field]:
                         defaults.pop(field)

                student, created = Student.objects.update_or_create(student_id=student_id, defaults=defaults)
                if created: created_count += 1
                else: updated_count += 1
            except Exception as e: 
                errors.append({"id": student_id, "message": str(e)})
        
        return Response({
            "createdCount": created_count, "updatedCount": updated_count, "skippedCount": len(errors),
            "errors": [f"{err['id']}: {err['message']}" for err in errors]
        })

    @action(detail=False, methods=['post'], url_path='bulk_update')
    @transaction.atomic
    def bulk_update(self, request):
        student_ids = request.data.get('student_ids', [])
        updates = request.data.get('updates', {})

        if not student_ids or not updates:
            return Response({'error': 'student_ids and updates are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        allowed_fields = {'student_status', 'sponsorship_status'}
        update_keys = set(updates.keys())
        disallowed_keys = update_keys - allowed_fields
        if disallowed_keys:
            return Response({'error': f'Invalid update fields: {", ".join(disallowed_keys)}'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = Student.objects.filter(student_id__in=student_ids)
        updated_count = 0
        students_to_update = []
        fields_to_update_in_bulk = list(updates.keys())

        for student in queryset:
            has_changed = False
            changes = {}
            for field in fields_to_update_in_bulk:
                new_value = updates.get(field)
                old_value = getattr(student, field)
                if old_value != new_value:
                    setattr(student, field, new_value)
                    has_changed = True
                    changes[field] = {'old': old_value, 'new': new_value}
            
            if has_changed:
                students_to_update.append(student)
                self._log_action(self.request, student, AuditLog.AuditAction.UPDATE, changes)
                updated_count += 1
        
        if students_to_update:
            Student.objects.bulk_update(students_to_update, fields_to_update_in_bulk)

        return Response({'updatedCount': updated_count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='academic-reports')
    def academic_reports(self, request, pk=None):
        student = self.get_object()
        serializer = AcademicReportSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save(student=student)
            self._log_action(request, instance, AuditLog.AuditAction.CREATE)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='follow-up-records')
    def follow_up_records(self, request, pk=None):
        student = self.get_object()
        serializer = FollowUpRecordSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save(student=student)
            self._log_action(request, instance, AuditLog.AuditAction.CREATE)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# --- NEW: Action to add a document to a student ---
    @action(detail=True, methods=['post'], url_path='documents', parser_classes=[MultiPartParser])
    def add_document(self, request, pk=None):
        student = self.get_object()
        file = request.data.get('file')
        doc_type = request.data.get('document_type')

        if not file or not doc_type:
            return Response({'error': 'File and document_type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # If a document of this type already exists, replace it by deleting the old one.
        StudentDocument.objects.filter(student=student, document_type=doc_type).delete()
        
        document = StudentDocument.objects.create(
            student=student,
            document_type=doc_type,
            file=file,
            original_filename=file.name
        )
        serializer = StudentDocumentSerializer(document)
        
        self._log_action(request, document, AuditLog.AuditAction.CREATE)
        
        # Return the full student object so the frontend can update its state
        student_serializer = self.get_serializer(student)
        return Response(student_serializer.data, status=status.HTTP_201_CREATED)

class SponsorViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'sponsors'

    serializer_class = SponsorSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'email', 'sponsorship_start_date', 'sponsored_student_count']

    def get_queryset(self):
        return Sponsor.objects.annotate(
            sponsored_student_count=Count('sponsored_students')
        ).order_by('name')
    
    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        sponsors = Sponsor.objects.order_by('name').only('id', 'name')
        serializer = SponsorLookupSerializer(sponsors, many=True)
        return Response(serializer.data)

class AcademicReportViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'academics'

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

class FollowUpRecordViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'academics'

    queryset = FollowUpRecord.objects.select_related('student').all()
    serializer_class = FollowUpRecordSerializer
    pagination_class = StandardResultsSetPagination

class TransactionViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'transactions'

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

    @action(detail=False, methods=['get'], url_path='all', pagination_class=None)
    def get_all(self, request):
        start_date_str = request.query_params.get('start')
        end_date_str = request.query_params.get('end')
        queryset = self.get_queryset().order_by('date')
        if start_date_str and end_date_str:
            try:
                start_date = parse_date(start_date_str).date()
                end_date = parse_date(end_date_str).date()
                queryset = queryset.filter(date__range=[start_date, end_date])
            except (ValueError, TypeError):
                return Response({'error': 'Invalid date format provided.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class GovernmentFilingViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'filings'

    queryset = GovernmentFiling.objects.all()
    serializer_class = GovernmentFilingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['document_name', 'authority', 'due_date', 'status']

class TaskViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'tasks'

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

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'audit'

    queryset = AuditLog.objects.select_related('content_type').all()
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'user_identifier', 'action', 'object_repr']

    def get_queryset(self):
        queryset = super().get_queryset()
        if action := self.request.query_params.get('action'):
            queryset = queryset.filter(action=action)
        if object_type := self.request.query_params.get('object_type'):
            try:
                content_type = ContentType.objects.get(model=object_type)
                queryset = queryset.filter(content_type=content_type)
            except ContentType.DoesNotExist:
                return AuditLog.objects.none() 
        return queryset

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class RoleViewSet(viewsets.ModelViewSet):
    queryset = RoleProfile.objects.select_related('group').all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'group__name'
    http_method_names = ['get', 'patch', 'head', 'options']

class UserViewSet(viewsets.ModelViewSet):
    # --- MODIFIED: Corrected permission class usage ---
    permission_classes = [HasModulePermission]
    module_name = 'users'

    serializer_class = UserSerializer
    
    def get_queryset(self):
        return User.objects.all().order_by('username')
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        role_name = request.data.get('role')
        status_name = request.data.get('status')
        try:
            with transaction.atomic():
                if role_name:
                    new_role = Group.objects.get(name=role_name)
                    user.groups.clear()
                    user.groups.add(new_role)
                if status_name:
                    user.is_active = (status_name == 'Active')
                user.save()
        except Group.DoesNotExist:
            return Response({'error': f"Role '{role_name}' does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='invite')
    def invite_user(self, request):
        serializer = InviteUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data['email']
        role_name = serializer.validated_data['role']
        username = email.split('@')[0]
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    is_active=False
                )
                user.set_unusable_password()
                user.save()
                role_group = Group.objects.get(name=role_name)
                user.groups.add(role_group)
        except Group.DoesNotExist:
            return Response({'error': f"Role '{role_name}' does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': f'Invitation created for {email}. The user must be activated.'}, status=status.HTTP_201_CREATED)

# --- Dashboard & Other API Views ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    end_date_str = request.query_params.get('end_date')
    start_date_str = request.query_params.get('start_date')
    try:
        end_date = parse_date(end_date_str).date() if end_date_str else date.today()
        start_date = parse_date(start_date_str).date() if start_date_str else end_date - timedelta(days=29)
    except (ValueError, TypeError):
        end_date = date.today()
        start_date = end_date - timedelta(days=29)

    period_duration = end_date - start_date
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - period_duration
    
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
            "net_balance": float(income - expense), "active_students": active_students, "total_students": total_students,
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
            'total_students': current_period_stats['total_students'], 'active_students': current_period_stats['active_students'],
            'net_balance': current_period_stats['net_balance'], 'upcoming_filings': upcoming_filings,
        },
        'trends': {
            'total_students': previous_period_stats['total_students'], 'active_students': previous_period_stats['active_students'],
            'net_balance': previous_period_stats['net_balance'],
        },
        'student_status_distribution': status_dist,
        'monthly_breakdown': list(reversed(monthly_breakdown))
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_transactions(request):
    recent = Transaction.objects.all().order_by('-date')[:5]
    serializer = TransactionSerializer(recent, many=True)
    return Response(serializer.data)

# --- NEW: AI Assistant for Student Filters ---
class AIAssistantStudentFilterView(APIView):
    """
    An API view that uses the Gemini AI to parse a natural language query
    and return a structured JSON object of filters for the student model.
    """
    def post(self, request, *args, **kwargs):
        if not settings.GOOGLE_API_KEY:
            return Response(
                {"error": "AI Assistant is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        query = request.data.get('query')
        if not query:
            return Response(
                {"error": "Query parameter is missing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # This is the core of the feature: a well-defined prompt for the AI.
        prompt = f"""
            You are an expert data analyst for an NGO. Your task is to convert a user's natural language query into a JSON object of filters for a student database.

            The available filters and their exact possible values are:
            - "student_status": ["Active", "Inactive", "Pending Qualification"]
            - "sponsorship_status": ["Sponsored", "Unsponsored"]
            - "gender": ["Male", "Female", "Other"]
            - "sponsor_name": This should be a string representing the sponsor's name if mentioned.
            - "search": This should be a string for a general text search on the student's first or last name if a specific name is mentioned.

            Analyze the user's query: "{query}"

            Your response MUST be only the JSON object, with no extra text, explanation, or formatting like markdown ```json blocks.
            If a filter is not mentioned, do not include it in the JSON.
            If a name is mentioned (e.g., "show me Jane Doe" or "find John"), use the "search" key.
            If a sponsor's name is mentioned (e.g., "students sponsored by Hope Foundation"), use the "sponsor_name" key.
        """

        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            ai_response = model.generate_content(prompt)
            
            # Clean up the response to ensure it's valid JSON
            cleaned_text = ai_response.text.strip().replace("```json", "").replace("```", "").strip()
            
            # Parse the JSON string into a Python dictionary
            filters = json.loads(cleaned_text)
            
            return Response(filters, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response(
                {"error": "The AI returned an invalid format. Please try rephrasing your query."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            # Catch potential errors from the Gemini API (e.g., API key issues, content filtering)
            print(f"Error calling Gemini API: {e}")
            return Response(
                {"error": "There was a problem communicating with the AI assistant."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query_ai_assistant(request):
    prompt = request.data.get('prompt')
    history = request.data.get('history', [])
    if not prompt:
        return Response({'error': 'A prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        response_text = ai_assistant.query_assistant(prompt, history)
        return Response({'response': response_text})
    except Exception as e:
        print(f"Error in AI assistant view: {e}")
        return Response({'error': 'An internal error occurred while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

# --- NEW VIEWS for password management ---

class ChangePasswordView(generics.GenericAPIView):
    """
    An endpoint for an authenticated user to change their own password.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully"}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    An endpoint to request a password reset link.
    This is used by both the "Forgot Password" page and the admin's "Send Password Set" action.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email__iexact=email)
                
                # This should match the route in your frontend App.tsx
                # For development, it points to your local frontend server.
                frontend_base_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else 'http://localhost:5173'
                
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_link = f"{frontend_base_url}/#/reset-password/{uidb64}/{token}"

                # Send email (which will be printed to console in development)
                send_mail(
                    'Set Your Password for NGO Dashboard',
                    f'Hello,\n\nPlease click the link below to set your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nNGO Dashboard Team',
                    'noreply@extremelove.com',
                    [user.email],
                    fail_silently=False,
                )
            except User.DoesNotExist:
                # To prevent email enumeration, we don't reveal that the user doesn't exist.
                # The frontend will show a generic success message regardless.
                pass

        return Response(
            {"message": "If an account with this email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    """
    An endpoint to confirm the password reset and set a new password.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)