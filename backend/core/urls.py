# backend/core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'sponsors', views.SponsorViewSet, basename='sponsor')
router.register(r'academic-reports', views.AcademicReportViewSet, basename='academicreport')
router.register(r'follow-up-records', views.FollowUpRecordViewSet, basename='followuprecord')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'filings', views.GovernmentFilingViewSet, basename='governmentfiling')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'audit-logs', views.AuditLogViewSet, basename='auditlog')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'documents', views.StudentDocumentViewSet, basename='studentdocument')
# --- NEW: Register SponsorshipViewSet ---
router.register(r'sponsorships', views.SponsorshipViewSet, basename='sponsorship')

urlpatterns = [
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/recent-transactions/', views.recent_transactions, name='recent-transactions'),
    path('ai-assistant/query/', views.query_ai_assistant, name='ai-assistant-query'),
    path('ai-assistant/student-filters/', views.AIAssistantStudentFilterView.as_view(), name='ai_student_filters'),
    path('user/me/', views.get_current_user, name='current-user'),
    path('register/', views.UserRegistrationView.as_view(), name='user-registration'),
    
    path('user/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('users/request-password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('users/password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    path('', include(router.urls)),
]