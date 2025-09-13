# backend/core/authentication.py

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()

class EmailOrUsernameBackend(ModelBackend):
    """
    Custom authentication backend.

    Allows users to log in using their email address or username.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        
        # Check if the input is a valid email address or a username.
        # The Q object allows for OR queries in Django's ORM.
        try:
            user = UserModel.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
        except UserModel.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between a user existing and not existing.
            UserModel().set_password(password)
            return
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user