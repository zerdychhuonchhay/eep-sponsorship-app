# backend/core/admin.py

from django.contrib import admin
from .models import (
    Student,
    AcademicReport,
    FollowUpRecord,
    Transaction,
    GovernmentFiling,
    Task,
    Sponsor,
)

class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'first_name', 'last_name', 'student_status', 'sponsorship_status', 'school')
    search_fields = ('first_name', 'last_name', 'student_id')
    list_filter = ('student_status', 'sponsorship_status', 'gender', 'city')

class TransactionAdmin(admin.ModelAdmin):
    list_display = ('date', 'description', 'type', 'category', 'amount', 'student')
    list_filter = ('type', 'category', 'date')
    search_fields = ('description', 'student__first_name', 'student__last_name')

class GovernmentFilingAdmin(admin.ModelAdmin):
    list_display = ('document_name', 'authority', 'due_date', 'status')
    list_filter = ('status', 'authority')
    search_fields = ('document_name',)

admin.site.register(Student, StudentAdmin)
admin.site.register(Sponsor)
admin.site.register(AcademicReport)
admin.site.register(FollowUpRecord)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(GovernmentFiling, GovernmentFilingAdmin)
admin.site.register(Task)