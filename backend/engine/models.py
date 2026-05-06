# backend/engine/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_pro = models.BooleanField(default=False)
    dodo_customer_id = models.CharField(max_length=255, blank=True, null=True)
    
    # PRO TIER: Tracks the $19 API usage quota based on token cost
    api_spend = models.FloatField(default=0.0)
    
    # FREE TIER: Tracks the 10 scans per day limit
    daily_scans = models.IntegerField(default=0)
    last_scan_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email} - Pro: {self.is_pro} - Spend: ${self.api_spend:.2f} - Scans Today: {self.daily_scans}"