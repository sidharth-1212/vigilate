from django.urls import path, include

urlpatterns = [
    # ... your other paths ...
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
]