# backend/core/views.py

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

        if not file:
            return Response(
                {"error": "No file was provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Read the excel file using pandas
            df = pd.read_excel(file)

            # ADD THIS LINE to clean the data immediately
            df = df.where(pd.notnull(df), None)
            
            # Get the column headers from the uploaded file
            headers = df.columns.tolist()
            
            # Get a sample of the first 5 rows for preview
            df_sample = df.head(5)
            df_sample = df_sample.where(pd.notnull(df_sample), None)
            preview_data = df_sample.to_dict('records')

            # Send back both the headers and the preview data
            return Response({
                "headers": headers,
                "preview_data": preview_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"There was an error processing the file: {e}"},
                status=status.HTTP_400_BAD_REQUEST
            )
class StudentBulkCreateView(APIView):
    """
    Receives a list of student data, filters out existing students,
    and creates records for new students only.
    """
    def post(self, request, *args, **kwargs):
        incoming_data = request.data
        
        # Get all existing student IDs from the database once for efficiency
        existing_ids = set(Student.objects.values_list('student_id', flat=True))
        
        # Filter the incoming data to find only the new students
        new_students_data = []
        for student_data in incoming_data:
            if student_data.get('student_id') not in existing_ids:
                new_students_data.append(student_data)
        
        # Calculate how many were new vs. existing
        created_count = len(new_students_data)
        skipped_count = len(incoming_data) - created_count
        
        # If there are no new students to create, just report back
        if not new_students_data:
            return Response(
                {"message": "No new students to import.", "created_count": 0, "skipped_count": skipped_count},
                status=status.HTTP_200_OK
            )

        # Proceed with saving only the new students
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