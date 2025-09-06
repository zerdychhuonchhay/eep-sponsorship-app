# backend/core/admin.py

from django.contrib import admin
from .models import (
    School,
    Student,
    AcademicReport,
    FollowUpRecord,
    Transaction,
    GovernmentFiling
)

# -----------------------------------------------------------------------------
# Inline Admin Models for a Better User Experience
# This allows related records to be edited on the same page as the parent record.
# This directly enables the user flow for adding follow-up records from the
# student's detail page.
# -----------------------------------------------------------------------------

class AcademicReportInline(admin.TabularInline):
    """
    Allows adding and editing Academic Reports directly within the Student admin page.
    'TabularInline' provides a compact, table-based layout.
    """
    model = AcademicReport
    extra = 1  # Provides one empty slot for a new report by default.

class FollowUpRecordInline(admin.TabularInline):
    """
    Allows adding and editing Follow-Up Records directly within the Student admin page.
    This is crucial for the field worker and admin user flows.
    """
    model = FollowUpRecord
    extra = 1  # Provides one empty slot for a new follow-up by default.

# -----------------------------------------------------------------------------
# Custom Admin Model for the Student
# -----------------------------------------------------------------------------

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    """
    Customizes the admin interface for the Student model.
    """
    # Link the inline models here
    inlines = [AcademicReportInline, FollowUpRecordInline]

    # Fields to display in the main list view
    list_display = ('student_id', 'first_name', 'last_name', 'student_status', 'sponsorship_status', 'school')

    # Filters that appear on the right-hand side
    list_filter = ('student_status', 'sponsorship_status', 'school', 'gender')

    # Search fields to easily find students
    search_fields = ('first_name', 'last_name', 'student_id')

# -----------------------------------------------------------------------------
# Register the rest of the models with the default admin interface
# -----------------------------------------------------------------------------

admin.site.register(School)
admin.site.register(Transaction)
admin.site.register(GovernmentFiling)