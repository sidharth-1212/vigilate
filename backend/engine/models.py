# backend/engine/models.py
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    scans_used = models.IntegerField(default=0)
    is_pro = models.BooleanField(default=False)
    dodo_customer_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - Pro: {self.is_pro}"