from django.urls import path
from . import views

urlpatterns = [
    path('summarize/', views.summarize_contract, name='summarize_contract'),
    path('checkout/', views.create_checkout, name='checkout'),
    path('webhook/dodo/', views.dodo_webhook, name='dodo_webhook'),
]