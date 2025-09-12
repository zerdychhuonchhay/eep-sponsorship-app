# backend/ngo_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # --- CORRECT ORDER ---
    # 1. Define specific API routes like token endpoints first.
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 2. Include the general app API routes after the specific ones.
    # This line includes all the URLs from your `core` app under the `/api/` prefix.
    path('api/', include('core.urls')), 
]

# This is crucial for serving uploaded media files (like profile photos) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)