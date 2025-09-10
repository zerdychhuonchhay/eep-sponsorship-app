# [your_django_app]/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'sponsors', views.SponsorViewSet, basename='sponsor') # ADD THIS LINE
router.register(r'academic-reports', views.AcademicReportViewSet, basename='academicreport')
router.register(r'follow-up-records', views.FollowUpRecordViewSet, basename='followuprecord')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'filings', views.GovernmentFilingViewSet, basename='governmentfiling')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'audit-logs', views.AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/recent-transactions/', views.recent_transactions, name='recent-transactions'),
    path('ai-assistant/query/', views.query_ai_assistant, name='ai-assistant-query'),
]