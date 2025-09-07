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
    # Define specific, custom paths BEFORE the general router
    path('students/upload-preview/', views.StudentUploadPreview.as_view(), name='student-upload-preview'),
    path('students/bulk-create/', views.StudentBulkCreateView.as_view(), name='student-bulk-create'),
    path('import/analyze/', views.ExcelFileAnalyzerView.as_view(), name='excel-file-analyzer'),
    
    # The router should be last, as it has more general patterns
    path('', include(router.urls)),
]