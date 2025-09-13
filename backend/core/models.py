# backend/core/models.py

from django.db import models
from django.utils import timezone
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Group
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

# --- Choices Enums ---

class Gender(models.TextChoices):
    MALE = 'Male', 'Male'
    FEMALE = 'Female', 'Female'
    OTHER = 'Other', 'Other'

class StudentStatus(models.TextChoices):
    PENDING_QUALIFICATION = 'Pending Qualification', 'Pending Qualification'
    ACTIVE = 'Active', 'Active'
    INACTIVE = 'Inactive', 'Inactive'

class SponsorshipStatus(models.TextChoices):
    SPONSORED = 'Sponsored', 'Sponsored'
    UNSPONSORED = 'Unsponsored', 'Unsponsored'

class WellbeingStatus(models.TextChoices):
    GOOD = 'Good', 'Good'
    AVERAGE = 'Average', 'Average'
    POOR = 'Poor', 'Poor'
    NA = 'N/A', 'N/A'

class YesNo(models.TextChoices):
    YES = 'Yes', 'Yes'
    NO = 'No', 'No'
    NA = 'N/A', 'N/A'

class HealthStatus(models.TextChoices):
    EXCELLENT = 'Excellent', 'Excellent'
    GOOD = 'Good', 'Good'
    AVERAGE = 'Average', 'Average'
    ISSUES = 'Issues', 'Issues'

class InteractionStatus(models.TextChoices):
    EXCELLENT = 'Excellent', 'Excellent'
    GOOD = 'Good', 'Good'
    AVERAGE = 'Average', 'Average'

class TransportationType(models.TextChoices):
    SCHOOL_BUS = 'School Bus', 'School Bus'
    BICYCLE = 'Bicycle', 'Bicycle'
    WALKING = 'Walking', 'Walking'
    OTHER = 'Other', 'Other'

# --- Default Functions for JSONFields ---

def default_parent_details():
    return {"is_living": "N/A", "is_at_home": "N/A", "is_working": "N/A", "occupation": "", "skills": ""}

def default_schooling_details():
    return {"when": "", "how_long": "", "where": ""}

# --- Models ---

class Sponsor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    sponsorship_start_date = models.DateField()

    def __str__(self):
        return self.name

class Student(models.Model):
    student_id = models.CharField(max_length=100, unique=True, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.OTHER)
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    school = models.CharField(max_length=255, blank=True)
    current_grade = models.CharField(max_length=50, blank=True)
    eep_enroll_date = models.DateField()
    out_of_program_date = models.DateField(null=True, blank=True)
    student_status = models.CharField(max_length=50, choices=StudentStatus.choices, default=StudentStatus.PENDING_QUALIFICATION)
    sponsorship_status = models.CharField(max_length=50, choices=SponsorshipStatus.choices, default=SponsorshipStatus.UNSPONSORED)
    has_housing_sponsorship = models.BooleanField(default=False)
    sponsor = models.ForeignKey(Sponsor, on_delete=models.SET_NULL, null=True, blank=True, related_name='sponsored_students')
    application_date = models.DateField(default=timezone.now)
    has_birth_certificate = models.BooleanField(default=False)
    siblings_count = models.PositiveIntegerField(default=0)
    household_members_count = models.PositiveIntegerField(default=0)
    city = models.CharField(max_length=100, blank=True)
    village_slum = models.CharField(max_length=100, blank=True)
    guardian_name = models.CharField(max_length=255, blank=True)
    guardian_contact_info = models.CharField(max_length=255, blank=True)
    home_location = models.CharField(max_length=255, blank=True)
    father_details = models.JSONField(default=default_parent_details)
    mother_details = models.JSONField(default=default_parent_details)
    annual_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    guardian_if_not_parents = models.CharField(max_length=255, blank=True)
    parent_support_level = models.IntegerField(default=3)
    closest_private_school = models.CharField(max_length=255, blank=True)
    currently_in_school = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    previous_schooling = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    previous_schooling_details = models.JSONField(default=default_schooling_details)
    grade_level_before_eep = models.CharField(max_length=50, blank=True)
    child_responsibilities = models.TextField(blank=True)
    health_status = models.CharField(max_length=50, choices=HealthStatus.choices, default=HealthStatus.AVERAGE)
    health_issues = models.TextField(blank=True)
    interaction_with_others = models.CharField(max_length=50, choices=InteractionStatus.choices, default=InteractionStatus.AVERAGE)
    interaction_issues = models.TextField(blank=True)
    child_story = models.TextField(blank=True)
    other_notes = models.TextField(blank=True)
    risk_level = models.IntegerField(default=3)
    transportation = models.CharField(max_length=50, choices=TransportationType.choices, default=TransportationType.WALKING)
    has_sponsorship_contract = models.BooleanField(default=False)
    def __str__(self): return f"{self.first_name} {self.last_name} ({self.student_id})"

class AcademicReport(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_reports', to_field='student_id')
    report_period = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=50)
    subjects_and_grades = models.TextField(blank=True)
    overall_average = models.FloatField(default=0)
    pass_fail_status = models.CharField(max_length=10, choices=[('Pass', 'Pass'), ('Fail', 'Fail')])
    teacher_comments = models.TextField(blank=True)
    def __str__(self): return f"Report for {self.student.first_name} - {self.report_period}"
    @property
    def student_name(self): return f"{self.student.first_name} {self.student.last_name}"

class FollowUpRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='follow_up_records', to_field='student_id')
    child_name = models.CharField(max_length=255, blank=True) 
    child_current_age = models.PositiveIntegerField()
    date_of_follow_up = models.DateField()
    location = models.CharField(max_length=255)
    parent_guardian = models.CharField(max_length=255, blank=True)
    physical_health = models.CharField(max_length=20, choices=WellbeingStatus.choices, default=WellbeingStatus.NA)
    physical_health_notes = models.TextField(blank=True)
    social_interaction = models.CharField(max_length=20, choices=WellbeingStatus.choices, default=WellbeingStatus.NA)
    social_interaction_notes = models.TextField(blank=True)
    home_life = models.CharField(max_length=20, choices=WellbeingStatus.choices, default=WellbeingStatus.NA)
    home_life_notes = models.TextField(blank=True)
    drugs_alcohol_violence = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    drugs_alcohol_violence_notes = models.TextField(blank=True)
    risk_factors_list = models.JSONField(default=list)
    risk_factors_details = models.TextField(blank=True)
    condition_of_home = models.CharField(max_length=20, choices=WellbeingStatus.choices, default=WellbeingStatus.NA)
    condition_of_home_notes = models.TextField(blank=True)
    mother_working = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    father_working = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    other_family_member_working = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    current_work_details = models.TextField(blank=True)
    attending_church = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    staff_notes = models.TextField(blank=True)
    changes_recommendations = models.TextField(blank=True)
    child_protection_concerns = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    human_trafficking_risk = models.CharField(max_length=10, choices=YesNo.choices, default=YesNo.NA)
    completed_by = models.CharField(max_length=100)
    date_completed = models.DateField(default=timezone.now)
    reviewed_by = models.CharField(max_length=100, blank=True)
    date_reviewed = models.DateField(null=True, blank=True)
    def __str__(self): return f"Follow-Up for {self.student.first_name} on {self.date_of_follow_up}"

class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        INCOME = 'Income', 'Income'
        EXPENSE = 'Expense', 'Expense'
    date = models.DateField()
    description = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20, choices=TransactionType.choices)
    category = models.CharField(max_length=100)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions', to_field='student_id')
    def __str__(self): return f"{self.date} - {self.description} (${self.amount})"

class GovernmentFiling(models.Model):
    class FilingStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        SUBMITTED = 'Submitted', 'Submitted'
    document_name = models.CharField(max_length=255)
    authority = models.CharField(max_length=255)
    due_date = models.DateField()
    submission_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=FilingStatus.choices, default=FilingStatus.PENDING)
    attached_file = models.FileField(upload_to='filings/', null=True, blank=True)
    def __str__(self): return f"{self.document_name} - Due: {self.due_date}"

class Task(models.Model):
    class TaskStatus(models.TextChoices):
        TO_DO = 'To Do', 'To Do'
        IN_PROGRESS = 'In Progress', 'In Progress'
        DONE = 'Done', 'Done'
    class TaskPriority(models.TextChoices):
        HIGH = 'High', 'High'
        MEDIUM = 'Medium', 'Medium'
        LOW = 'Low', 'Low'
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    priority = models.CharField(max_length=20, choices=TaskPriority.choices, default=TaskPriority.MEDIUM)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.TO_DO)
    def __str__(self): return self.title

class AuditLog(models.Model):
    class AuditAction(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
    
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    user_identifier = models.CharField(max_length=255, default="System") 
    action = models.CharField(max_length=10, choices=AuditAction.choices)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255)
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(max_length=255) 

    changes = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.action} on {self.object_repr} by {self.user_identifier} at {self.timestamp}'
    
class RoleProfile(models.Model):
    """
    Extends the default Django Group to store a JSON field with detailed permissions.
    """
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='roleprofile')
    # Default permissions grant read-only access to key modules for a new role
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"Permissions for {self.group.name}"
    
# --- ADD THIS SIGNAL AT THE END OF THE FILE ---
# This signal automatically creates a RoleProfile every time a new Group is created in Django.
@receiver(post_save, sender=Group)
def create_or_update_role_profile(sender, instance, created, **kwargs):
    if created:
        RoleProfile.objects.create(group=instance)
