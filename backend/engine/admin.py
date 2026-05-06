from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # This makes the admin table actually useful at a glance
    list_display = ('user', 'is_pro', 'scans_used')
    
    # Allows you to click 'Yes' or 'No' on the Pro status directly from the list
    list_editable = ('is_pro',)
    
    # Adds a sidebar to filter by Pro status or high usage
    list_filter = ('is_pro', 'scans_used')
    
    # Allows you to search by username or email
    search_fields = ('user__username', 'user__email')