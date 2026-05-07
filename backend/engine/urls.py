from django.urls import path
from . import views

urlpatterns = [
    path('summarize/', views.summarize_contract, name='summarize_contract'),
    path('checkout/', views.create_checkout, name='checkout'),
    path('webhook/dodo/', views.dodo_webhook, name='dodo_webhook'),
    path('history/', views.get_scan_history, name='get_scan_history'),
    path('history/<int:scan_id>/', views.delete_scan, name='delete_scan'),
    path('profile/', views.manage_profile, name='manage_profile'),
    path('profile/cancel/', views.cancel_subscription, name='cancel_subscription'),
]