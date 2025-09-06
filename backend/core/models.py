# backend/core/models.py

from django.db import models
from django.utils import timezone

# -----------------------------------------------------------------------------
# Helper Models
# -----------------------------------------------------------------------------

class School(models.Model):
    """
    A simple model to store school names, referenced by the Student model.
    """
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

# -----------------------------------------------------------------------------
# 1. Student & Historical Records
# -----------------------------------------------------------------------------

class Student(models.Model):
    """
    The core model for managing student information. [cite: 22]
    """
    # Choices for status fields to ensure data consistency
    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
    )
    STUDENT_STATUS_CHOICES = (
        ('Pending Qualification', 'Pending Qualification'),
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )
    SPONSORSHIP_STATUS_CHOICES = (
        ('Sponsored', 'Sponsored'),
        ('Unsponsored', 'Unsponsored'),
    )

    # Core Student Information
    student_id = models.CharField(max_length=20, unique=True, help_text="A unique ID for each student (e.g., CPB00002).") # [cite: 23]
    first_name = models.CharField(max_length=100) # [cite: 24]
    last_name = models.CharField(max_length=100) # [cite: 25]
    date_of_birth = models.DateField() # 
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES) # [cite: 27]
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True) # [cite: 28]

    # Compliance and Documentation
    has_birth_certificate = models.BooleanField(default=False) # 
    has_sponsorship_contract = models.BooleanField(default=False) # [cite: 30]

    # Academic Information
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True) # 
    current_grade = models.CharField(max_length=50) # [cite: 32]
    eep_enroll_date = models.DateField() # [cite: 33]
    out_of_program_date = models.DateField(blank=True, null=True) # [cite: 34]
    student_status = models.CharField(max_length=50, choices=STUDENT_STATUS_CHOICES, default='Pending Qualification') # [cite: 35]

    # Sponsorship Information
    sponsorship_status = models.CharField(max_length=50, choices=SPONSORSHIP_STATUS_CHOICES, default='Unsponsored') # [cite: 36]
    has_housing_sponsorship = models.BooleanField(default=False) # [cite: 37]
    sponsor_name = models.CharField(max_length=255, blank=True) # [cite: 38]

    # Guardian & Location Information
    guardian_name = models.CharField(max_length=255) # [cite: 39]
    guardian_contact_info = models.TextField(blank=True) # [cite: 40]
    home_location = models.CharField(max_length=255) # [cite: 41]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"


class AcademicReport(models.Model):
    """
    Stores historical academic reports for a student. [cite: 42]
    """
    PASS_FAIL_CHOICES = (
        ('Pass', 'Pass'),
        ('Fail', 'Fail'),
    )
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_reports') # [cite: 44]
    report_period = models.CharField(max_length=100, help_text='The period the report covers (e.g., "Q1 2025").') # [cite: 45]
    grade_level = models.CharField(max_length=50) # [cite: 46]
    subjects_and_grades = models.TextField() # [cite: 47]
    overall_average = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True) # [cite: 48]
    pass_fail_status = models.CharField(max_length=10, choices=PASS_FAIL_CHOICES) # [cite: 49]
    teacher_comments = models.TextField(blank=True) # [cite: 50]

    def __str__(self):
        return f"Academic Report for {self.student} - {self.report_period}"


class FollowUpRecord(models.Model):
    """
    Stores records from field worker follow-ups with students. [cite: 51]
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='follow_up_records') # [cite: 53]
    date_of_follow_up = models.DateField() # [cite: 54]
    location_of_follow_up = models.CharField(max_length=255) # [cite: 55]
    health_status_notes = models.TextField() # [cite: 56]
    risk_factors = models.TextField(help_text="A text field for a checklist of specific risk factors.") # [cite: 57]
    parent_work_status = models.CharField(max_length=255, blank=True) # [cite: 58]
    hygiene_products_provided = models.BooleanField(default=False) # [cite: 59]
    staff_notes = models.TextField(blank=True, help_text="Staff notes, recommendations, and protection concerns.") # [cite: 60]
    completed_by = models.CharField(max_length=100) # [cite: 61]
    reviewed_by = models.CharField(max_length=100, blank=True) # [cite: 62]

    def __str__(self):
        return f"Follow-Up for {self.student} on {self.date_of_follow_up}"

# -----------------------------------------------------------------------------
# 2. The Transaction Model
# -----------------------------------------------------------------------------

class Transaction(models.Model):
    """
    Tracks all income and expenses for the organization. [cite: 63]
    """
    TYPE_CHOICES = (
        ('Income', 'Income'),
        ('Expense', 'Expense'),
    )
    CATEGORY_CHOICES = (
        # You can expand this list based on your needs
        ('School Fees', 'School Fees'),
        ('Hot Lunches', 'Hot Lunches'),
        ('Gas', 'Gas'),
        ('Sponsorship', 'Sponsorship'),
        ('Donation', 'Donation'),
        ('Other', 'Other'),
    )

    date = models.DateField(default=timezone.now) # [cite: 64]
    description = models.CharField(max_length=255) # [cite: 65]
    location = models.CharField(max_length=255, blank=True) # [cite: 66]
    amount = models.DecimalField(max_digits=10, decimal_places=2) # 
    type = models.CharField(max_length=10, choices=TYPE_CHOICES) # [cite: 68]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES) # [cite: 69]
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True) # [cite: 70]

    def __str__(self):
        return f"{self.date} - {self.type}: {self.description} (${self.amount})"

# -----------------------------------------------------------------------------
# 3. The GovernmentFiling Model
# -----------------------------------------------------------------------------

class GovernmentFiling(models.Model):
    """
    Manages government and compliance documents and deadlines. [cite: 71]
    """
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Submitted', 'Submitted'),
        ('Approved', 'Approved'),
    )

    document_name = models.CharField(max_length=255) # [cite: 72]
    authority = models.CharField(max_length=255) # [cite: 73]
    due_date = models.DateField() # [cite: 74]
    submission_date = models.DateField(blank=True, null=True) # [cite: 75]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending') # [cite: 76]
    attached_file = models.FileField(upload_to='gov_filings/', blank=True, null=True) # [cite: 77]

    def __str__(self):
        return f"{self.document_name} for {self.authority} (Due: {self.due_date})"