#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ngo_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # Custom command logic for 'createsuperuser_if_none_exists'
    # This is a safe way to create an initial admin user in production environments like Railway.
    # It will only run if the command `createsuperuser_if_none_exists` is used.
    if sys.argv[1:2] == ['createsuperuser_if_none_exists']:
        # Ensure Django is initialized before we try to import models
        import django
        django.setup()

        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Check for required environment variables
        username = os.environ.get('ADMIN_USERNAME')
        password = os.environ.get('ADMIN_PASSWORD')
        email = os.environ.get('ADMIN_EMAIL')

        if not all([username, password, email]):
            print("ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL environment variables are required.")
            sys.exit(1)

        # Check if any users already exist. If so, do nothing.
        if User.objects.exists():
            print('Admin user already exists. Skipping creation.')
        else:
            print('Creating new admin user...')
            User.objects.create_superuser(username=username, password=password, email=email)
            print('Admin user created successfully.')
        
        # Exit after our custom command is run
        sys.exit(0)

    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()