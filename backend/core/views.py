# backend/core/views.py

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