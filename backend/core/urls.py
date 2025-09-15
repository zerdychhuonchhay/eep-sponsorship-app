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
router.register(r'groups', views.GroupViewSet, basename='group')  # New endpoint for managing groups

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/recent-transactions/', views.recent_transactions, name='recent-transactions'),
    path('ai-assistant/query/', views.query_ai_assistant, name='ai-assistant-query'),
    # --- NEW URL FOR AI STUDENT SEARCH ---
    path('ai-assistant/student-filters/', views.AIAssistantStudentFilterView.as_view(), name='ai_student_filters'),
    path('user/me/', views.get_current_user, name='current-user'),
    path('register/', views.UserRegistrationView.as_view(), name='user-registration'),
]