from rest_framework import serializers
import json
from .models import Student, AcademicReport, FollowUpRecord, Transaction, GovernmentFiling, Task, AuditLog, Sponsor

class AcademicReportSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField()
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = AcademicReport
        fields = ['id', 'student', 'student_name', 'report_period', 'grade_level', 
                  'subjects_and_grades', 'overall_average', 'pass_fail_status', 'teacher_comments']

class FollowUpRecordSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = FollowUpRecord
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), 
        pk_field='student_id', 
        allow_null=True, 
        required=False,
    )
    class Meta:
        model = Transaction
        fields = ['id', 'date', 'description', 'location', 'amount', 'type', 'category', 'student']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['student_id'] = instance.student.student_id if instance.student else None
        representation.pop('student', None) 
        return representation

class StudentLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['student_id', 'first_name', 'last_name']

class StudentListSerializer(serializers.ModelSerializer):
    sponsor_name = serializers.StringRelatedField(source='sponsor')

    class Meta:
        model = Student
        fields = [
            'student_id', 'first_name', 'last_name', 'date_of_birth', 
            'gender', 'profile_photo', 'student_status', 'sponsorship_status', 'sponsor_name'
        ]

class SponsorSerializer(serializers.ModelSerializer):
    sponsored_student_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Sponsor
        fields = ['id', 'name', 'email', 'sponsorship_start_date', 'sponsored_student_count']

# --- NEW SERIALIZER ADDED HERE ---
class SponsorLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sponsor
        fields = ['id', 'name']

class StudentSerializer(serializers.ModelSerializer):
    academic_reports = AcademicReportSerializer(many=True, read_only=True)
    follow_up_records = FollowUpRecordSerializer(many=True, read_only=True)
    # This was updated in the previous step to handle the relationship
    sponsor = serializers.PrimaryKeyRelatedField(queryset=Sponsor.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Student
        # Dynamically generate fields to include everything
        fields = [f.name for f in Student._meta.fields] + ['academic_reports', 'follow_up_records']


    def to_internal_value(self, data):
        json_fields = ['father_details', 'mother_details', 'previous_schooling_details']
        mutable_data = data.copy()
        for field_name in json_fields:
            if field_name in mutable_data and isinstance(mutable_data[field_name], str):
                try:
                    mutable_data[field_name] = json.loads(mutable_data[field_name])
                except json.JSONDecodeError:
                    raise serializers.ValidationError({field_name: "Invalid JSON format."})
        return super().to_internal_value(mutable_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.sponsor:
            representation['sponsor'] = instance.sponsor.id
            representation['sponsor_name'] = instance.sponsor.name
        else:
            representation['sponsor'] = None
            representation['sponsor_name'] = None
        return representation

class GovernmentFilingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentFiling
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if 'due_date' in ret:
            ret['dueDate'] = ret.pop('due_date')
        return ret
    def to_internal_value(self, data):
        if 'dueDate' in data:
            data['due_date'] = data.pop('dueDate')
        return super().to_internal_value(data)
        
class AuditLogSerializer(serializers.ModelSerializer):
    content_type = serializers.StringRelatedField()

    class Meta:
        model = AuditLog
        fields = ['id', 'timestamp', 'user_identifier', 'action', 'content_type', 'object_id', 'object_repr', 'changes']