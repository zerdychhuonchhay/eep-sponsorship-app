# backend/ngo_project/settings.py

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# It's recommended to move this to an environment variable in a real production app
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-secret-key-here')

# IMPORTANT: DEBUG should be False in production for security
DEBUG = False

# This allows your live Railway domain to be accessed.
ALLOWED_HOSTS = ['eep-sponsorship-app-production.up.railway.app']

# --- Application definition ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', # For serving static files
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # For static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Handles CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- THE CRUCIAL CORS SETTING FOR AI STUDIO ---
# This regular expression allows any URL from aistudio.google.com to connect.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.aistudio\.google\.com$",
]

# This allows your local development environment to connect when you run it locally
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# This allows the admin panel to work correctly on your live domain
CSRF_TRUSTED_ORIGINS = ['https://eep-sponsorship-app-production.up.railway.app']

ROOT_URLCONF = 'ngo_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ngo_project.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Static files (CSS, JavaScript) Configuration for Production ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- Media files (User uploads) Configuration ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'