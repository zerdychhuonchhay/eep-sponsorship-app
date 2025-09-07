# backend/core/serializers.py

from rest_framework import serializers
from .models import Student, AcademicReport, FollowUpRecord, Transaction, GovernmentFiling, Task

class AcademicReportSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField()
    class Meta:
        model = AcademicReport
        fields = '__all__'

class FollowUpRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpRecord
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    academic_reports = AcademicReportSerializer(many=True, read_only=True)
    follow_up_records = FollowUpRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class GovernmentFilingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentFiling
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'