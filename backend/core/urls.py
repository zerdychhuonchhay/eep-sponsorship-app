# backend/core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'transactions', views.TransactionViewSet)
router.register(r'filings', views.GovernmentFilingViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'academic-reports', views.AcademicReportViewSet)
router.register(r'follow-up-records', views.FollowUpRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/recent-transactions/', views.RecentTransactionsView.as_view(), name='recent-transactions'),
]