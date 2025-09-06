# backend/core/serializers.py

from rest_framework import serializers
from .models import (
    School,
    Student,
    AcademicReport,
    FollowUpRecord,
    Transaction,
    GovernmentFiling
)

# Each class here corresponds to a model and defines how it should be
# converted to and from JSON. 'ModelSerializer' does most of the work
# automatically by inspecting the linked model.

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class AcademicReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicReport
        fields = '__all__'


class FollowUpRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpRecord
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    # By defining the DateFields here, we can give them special rules.
    # The 'input_formats' list tells Django to try parsing the date
    # using any of these common formats.
    date_of_birth = serializers.DateField(input_formats=['%Y-%m-%d', '%m/%d/%Y', 'iso-8601'])
    eep_enroll_date = serializers.DateField(input_formats=['%Y-%m-%d', '%m/%d/%Y', 'iso-8601'])

    class Meta:
        model = Student
        fields = '__all__'
        
    # These lines create "nested" serializers. When you request a student,
    # the API response will include a full list of their academic reports
    # and follow-up records, not just their IDs.
    academic_reports = AcademicReportSerializer(many=True, read_only=True)
    follow_up_records = FollowUpRecordSerializer(many=True, read_only=True)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'


class GovernmentFilingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentFiling
        fields = '__all__'