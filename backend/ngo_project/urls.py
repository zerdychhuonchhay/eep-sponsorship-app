# your_project/urls.py (e.g., backend/backend/urls.py)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # This line includes all the URLs from your `core` app under the `/api/` prefix
    path('api/', include('core.urls')), 
]

# This is crucial for serving uploaded media files (like profile photos) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)