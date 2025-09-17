# backend/core/serializers.py

from datetime import date
from django.contrib.auth.models import User, Group
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.conf import settings
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
import json
from .models import Student, AcademicReport, FollowUpRecord, Transaction, GovernmentFiling, Task, AuditLog, Sponsor, RoleProfile

class AcademicReportSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField()
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = AcademicReport
        fields = ['id', 'student', 'student_name', 'report_period', 'grade_level', 
                  'subjects_and_grades', 'overall_average', 'pass_fail_status', 'teacher_comments']

class FollowUpRecordSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    # NEW: Dynamically generate student name and age for data integrity
    student_name = serializers.SerializerMethodField()
    child_current_age = serializers.SerializerMethodField()

    class Meta:
        model = FollowUpRecord
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_child_current_age(self, obj):
        today = date.today()
        dob = obj.student.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age

# REFACTORED: Simplified for clarity
class TransactionSerializer(serializers.ModelSerializer):
    # Use 'source' to map 'student' model field to 'student_id' in JSON for reads
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    # Use 'source' to map incoming 'student' JSON field to 'student' model field for writes
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), 
        pk_field='student_id', 
        allow_null=True, 
        required=False,
        write_only=True,
    )

    class Meta:
        model = Transaction
        fields = ['id', 'date', 'description', 'location', 'amount', 'type', 'category', 'student', 'student_id']


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

class SponsorLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sponsor
        fields = ['id', 'name']

class StudentSerializer(serializers.ModelSerializer):
    academic_reports = AcademicReportSerializer(many=True, read_only=True)
    follow_up_records = FollowUpRecordSerializer(many=True, read_only=True)
    sponsor = serializers.PrimaryKeyRelatedField(queryset=Sponsor.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Student
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
        
class AuditLogSerializer(serializers.ModelSerializer):
    content_type = serializers.StringRelatedField()

    class Meta:
        model = AuditLog
        fields = ['id', 'timestamp', 'user_identifier', 'action', 'content_type', 'object_id', 'object_repr', 'changes']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password')

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if not settings.DEBUG and not value.endswith('@extremelove.com'):
            raise ValidationError('Registration is only allowed for @extremelove.com email addresses.')
        
        if User.objects.filter(email__iexact=value).exists():
            raise ValidationError('A user with this email address already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(source='is_superuser', read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'status', 'last_login', 'is_admin', 'permissions')
        read_only_fields = ('id', 'username', 'email', 'status', 'last_login', 'is_admin', 'permissions')

    def get_role(self, obj):
        if obj.is_superuser:
            return 'Administrator'
        group = obj.groups.first()
        return group.name if group else None

    def get_status(self, obj):
        return 'Active' if obj.is_active else 'Inactive'
    
    def get_permissions(self, obj):
        if obj.is_superuser:
            return {}
        
        group = obj.groups.first()
        if group and hasattr(group, 'roleprofile'):
            return group.roleprofile.permissions
        return {}

class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.CharField()

    def validate_email(self, value):
        if not settings.DEBUG and not value.endswith('@extremelove.com'):
            raise serializers.ValidationError('Registration is only allowed for @extremelove.com email addresses.')
            
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return value

    def validate_role(self, value):
        if not Group.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"The role '{value}' does not exist.")
        return value

class RoleSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='group.name', read_only=True)
    id = serializers.IntegerField(source='group.id', read_only=True)

    class Meta:
        model = RoleProfile
        fields = ('id', 'name', 'permissions')

    def update(self, instance, validated_data):
        instance.permissions = validated_data.get('permissions', instance.permissions)
        instance.save()
        return instance

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password1 = serializers.CharField(required=True, write_only=True)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError({"old_password": "Your old password was entered incorrectly."})
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "The two password fields didn't match."})
        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password1'])
        user.save()
        return user

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password1 = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password1'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password2": "The two password fields didn't match."})
        
        try:
            uid = urlsafe_base64_decode(attrs['uidb64']).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist, DjangoValidationError):
            user = None

        if user is None or not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError('The reset link is invalid or has expired. Please request a new one.')
        
        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password1'])
        if not user.is_active:
            user.is_active = True
        user.save()
        return user