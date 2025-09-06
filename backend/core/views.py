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
    Receives a list of student data, checks for duplicates, and then
    creates multiple student records at once.
    """
    def post(self, request, *args, **kwargs):
        incoming_data = request.data
        
        # --- START: New Duplicate Check Logic ---
        
        # Get all existing student IDs from the database
        existing_ids = set(Student.objects.values_list('student_id', flat=True))
        
        # Get all IDs from the incoming file
        incoming_ids = [item['student_id'] for item in incoming_data if 'student_id' in item]
        
        # Find which incoming IDs already exist in the database
        duplicate_ids = set(existing_ids).intersection(incoming_ids)
        
        # If any duplicates are found, stop and return an error
        if duplicate_ids:
            return Response(
                {"error": "Duplicate student_id found.", "duplicates": list(duplicate_ids)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # --- END: New Duplicate Check Logic ---

        # If no duplicates are found, proceed with saving the data
        serializer = StudentSerializer(data=incoming_data, many=True)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            return Response({"error": f"Database Error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)