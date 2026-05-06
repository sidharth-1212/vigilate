import os
import PyPDF2
from rest_framework.decorators import api_view
from rest_framework.response import Response
from openai import OpenAI
from dotenv import load_dotenv
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import UserProfile
import requests
from dodopayments import DodoPayments
from django.views.decorators.csrf import csrf_exempt
import json

load_dotenv()

client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

@api_view(['POST'])
@authentication_classes([TokenAuthentication]) 
@permission_classes([IsAuthenticated])
def summarize_contract(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    # 1. Fetch or create the user's profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    # 2. Check the Paywall Limit (1 free scan)
    if not profile.is_pro and profile.scans_used >= 1:
        return Response({"error": "PAYWALL_REACHED"}, status=403) # <--- Triggers frontend paywall

    pdf_file = request.FILES['file']
    
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = "".join([page.extract_text() for page in reader.pages])[:15000]

        prompt = f"""
        You are an expert contract lawyer. Analyze the following legal text and provide a simple, 
        plain-English summary for a freelancer. Format in two sections: 'Summary' and 'Red Flags'.
        Contract Text: {text}
        """

        response = client.chat.completions.create(
            model="Meta-Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "You are a helpful legal assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            top_p=0.1
        )
        
        # 3. Success! Increment their usage count
        profile.scans_used += 1
        profile.save()

        return Response({"success": True, "analysis": response.choices[0].message.content})

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_checkout(request):
    env_mode = os.getenv('DODO_PAYMENTS_ENV', 'live_mode')
    client = DodoPayments(
        bearer_token=os.getenv("DODO_PAYMENTS_API_KEY"),
        environment=env_mode
    )

    # Use your production URL from .env
    return_url = f"{os.getenv('FRONTEND_URL')}/dashboard?payment=success"

    try:
        session = client.checkout_sessions.create(
            product_cart=[{"product_id": "pdt_0NeCKcV9gh3bqGULtWNk5", "quantity": 1}], # Ensure this is your LIVE ID
            customer={
                "email": request.user.email, 
                "name": request.user.get_full_name() or request.user.username
            },
            return_url=return_url,
            metadata={"user_id": str(request.user.id)}
        )
        return Response({"checkout_url": session.checkout_url})
    except Exception as e:
        return Response({"error": "Failed to create checkout"}, status=500)
    
@csrf_exempt # Dodo doesn't have our CSRF token, so we exempt this specific view
@api_view(['POST'])
@authentication_classes([]) # No Token needed; Dodo calls this, not the user
@permission_classes([])
def dodo_webhook(request):
    payload = request.data
    event_type = payload.get("type")

    # When a subscription or payment is successful
    if event_type == "subscription.created" or event_type == "order.created":
        # Pull that user_id we tucked into the metadata earlier!
        user_id = payload.get("metadata", {}).get("user_id")
        
        if user_id:
            try:
                profile = UserProfile.objects.get(user__id=user_id)
                profile.is_pro = True
                profile.save()
                print(f"💰 SUCCESS: User {user_id} upgraded to PRO!")
                return Response({"status": "success"}, status=200)
            except UserProfile.DoesNotExist:
                return Response({"error": "User not found"}, status=404)

    return Response({"status": "ignored"}, status=200)