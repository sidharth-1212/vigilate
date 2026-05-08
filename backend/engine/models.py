# backend/engine/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from simple_history.models import HistoricalRecords

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_pro = models.BooleanField(default=False)
    dodo_customer_id = models.CharField(max_length=255, blank=True, null=True)
    
    # PRO TIER: Tracks the $19 API usage quota based on token cost
    api_spend = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    
    # FREE TIER: Tracks the 10 scans per day limit
    daily_scans = models.IntegerField(default=0)
    last_scan_date = models.DateField(default=timezone.now)

    subscription_id = models.CharField(max_length=255, blank=True, null=True)

    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user.email} - Pro: {self.is_pro} - Spend: ${self.api_spend:.2f} - Scans Today: {self.daily_scans}"

class ScanHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    risk_score = models.IntegerField(default=0) # 1-10
    analysis_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']