# backend/core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'schools', views.SchoolViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'academic-reports', views.AcademicReportViewSet)
router.register(r'follow-up-records', views.FollowUpRecordViewSet)
router.register(r'transactions', views.TransactionViewSet)
router.register(r'gov-filings', views.GovernmentFilingViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    # Add this new URL for the upload preview endpoint
    path('students/upload-preview/', views.StudentUploadPreview.as_view(), name='student-upload-preview'),
]