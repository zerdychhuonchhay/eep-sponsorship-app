# backend/core/views.py

from django.db.models import Count
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
from rest_framework import viewsets
from .models import (
    School,
    Student,
    AcademicReport,
    FollowUpRecord,
    Transaction,
    GovernmentFiling
)
from .serializers import (
    SchoolSerializer,
    StudentSerializer,
    AcademicReportSerializer,
    FollowUpRecordSerializer,
    TransactionSerializer,
    GovernmentFilingSerializer
)

# Each ViewSet provides the logic for the API endpoints for a specific model.
# By using ModelViewSet, we get a full set of CRUD operations without
# having to write the logic for each action (list, create, retrieve, etc.)

class SchoolViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows schools to be viewed or edited.
    """
    queryset = School.objects.all()
    serializer_class = SchoolSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows students to be viewed or edited.
    """
    queryset = Student.objects.all().order_by('first_name')
    serializer_class = StudentSerializer
    pagination_class = None # Disable pagination for simplicity; adjust as needed


class AcademicReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows academic reports to be viewed or edited.
    """
    queryset = AcademicReport.objects.all()
    serializer_class = AcademicReportSerializer


class FollowUpRecordViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows follow-up records to be viewed or edited.
    """
    queryset = FollowUpRecord.objects.all()
    serializer_class = FollowUpRecordSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows transactions to be viewed or edited.
    """
    queryset = Transaction.objects.all().order_by('-date')
    serializer_class = TransactionSerializer


class GovernmentFilingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows government filings to be viewed or edited.
    """
    queryset = GovernmentFiling.objects.all().order_by('due_date')
    serializer_class = GovernmentFilingSerializer

class StudentUploadPreview(APIView):
    """
    A view to handle Excel file uploads for student data preview.
    It reads the Excel file, converts it to JSON, and returns it.
    """
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        # Get the requested sheet name from the form data
        sheet_name = request.POST.get('sheet_name')

        if not file or not sheet_name:
            return Response(
                {"error": "A file and a sheet name are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Tell pandas which specific sheet to read
            df = pd.read_excel(file, dtype=str, sheet_name=sheet_name)

            # ADD THIS LINE to clean the data immediately
            df = df.where(pd.notnull(df), None)
            
            # Get the column headers from the uploaded file
            headers = df.columns.tolist()
            
            # THIS IS THE FIX: We now process the entire DataFrame (df), not just a sample.
            all_data = df.to_dict('records')
            cleaned_preview_data = []
            for row in all_data:
                cleaned_row = {}
                for key, value in row.items():
                    if pd.isna(value):
                        cleaned_row[key] = None
                    else:
                        cleaned_row[key] = value
                cleaned_preview_data.append(cleaned_row)

            return Response({
                "headers": headers,
                "preview_data": cleaned_preview_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"There was an error processing the file: {e}"},
                status=status.HTTP_400_BAD_REQUEST
            )
class StudentBulkCreateView(APIView):
    """
    Receives a list of student data, cleans it, checks for duplicates,
    and then creates records for new students only.
    """
    def post(self, request, *args, **kwargs):
        incoming_data = request.data
        
        # --- START: Robust Data Cleaning Logic ---
        # This is the same cleaning logic from our preview endpoint.
        cleaned_data = []
        for student_data in incoming_data:
            cleaned_row = {}
            for key, value in student_data.items():
                # Use pandas' robust isna() to check for any null-like value
                if pd.isna(value):
                    cleaned_row[key] = None
                else:
                    cleaned_row[key] = value
            # After cleaning, try to parse and reformat date fields
            for date_field in ['date_of_birth', 'eep_enroll_date']:
                if cleaned_row.get(date_field):
                    try :
                        date_obj = pd.to_datetime(cleaned_row[date_field])
                        cleaned_row[date_field] = date_obj.strftime('%Y-%m-%d')
                    except Exception:
                        # If parsing fails, it will be caught by the serializer's validation
                        pass
            cleaned_data.append(cleaned_row)
        # --- END: Robust Data Cleaning Logic ---

        existing_ids = set(Student.objects.values_list('student_id', flat=True))
        
        new_students_data = []
        # Use the fully cleaned data from now on
        for student_data in cleaned_data:
            if student_data.get('student_id') and student_data.get('student_id') not in existing_ids:
                new_students_data.append(student_data)
        
        created_count = len(new_students_data)
        skipped_count = len(incoming_data) - created_count
        
        if not new_students_data:
            return Response(
                {"message": "No new students to import.", "created_count": 0, "skipped_count": skipped_count},
                status=status.HTTP_200_OK
            )

        serializer = StudentSerializer(data=new_students_data, many=True)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(
                {
                    "message": "Import successful.",
                    "created_count": created_count,
                    "skipped_count": skipped_count
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
class ExcelFileAnalyzerView(APIView):
    """
    Analyzes an uploaded Excel file and returns a list of its sheet names.
    """
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Use pandas.ExcelFile to efficiently get sheet names without loading data
            xls = pd.ExcelFile(file)
            sheet_names = xls.sheet_names
            return Response({"sheet_names": sheet_names}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Could not analyze the file: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        
class DashboardStatsView(APIView):
    """
    A view to provide summary statistics and chart data for the main dashboard.
    """
    def get(self, request, *args, **kwargs):
        # ... (the simple stat calculations remain the same)
        total_students = Student.objects.count()
        active_students = Student.objects.filter(student_status='Active').count()
        sponsored_students = Student.objects.filter(sponsorship_status='Sponsored').count()
        unsponsored_students = Student.objects.filter(sponsorship_status='Unsponsored').count()

        # --- START: New Chart Data Logic ---
        # Group students by their 'current_grade' and count how many are in each group
        students_by_grade = (
            Student.objects
            .values('current_grade')
            .annotate(count=Count('id'))
            .order_by('current_grade')
        )
        # --- END: New Chart Data Logic ---

        stats = {
            'total_students': total_students,
            'active_students': active_students,
            'sponsored_students': sponsored_students,
            'unsponsored_students': unsponsored_students,
            'students_by_grade': list(students_by_grade), # Add the new chart data to the response
        }
        
        return Response(stats, status=status.HTTP_200_OK)