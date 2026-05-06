import os
import PyPDF2
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
from django.utils import timezone

load_dotenv()

client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

# Model Pricing per 1 Million Tokens (Meta-Llama-3.3-70B-Instruct)
INPUT_TOKEN_PRICE_PER_M = 0.60
OUTPUT_TOKEN_PRICE_PER_M = 1.20
MAX_ALLOWANCE = 19.00

@api_view(['POST'])
@authentication_classes([TokenAuthentication]) 
@permission_classes([IsAuthenticated])
def summarize_contract(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    profile, created = UserProfile.objects.get_or_create(user=request.user)


    today = timezone.now().date()
    if profile.last_scan_date < today:
        profile.daily_scans = 0
        profile.last_scan_date = today
    # 1. Check the Dollar Value Paywall

    if not profile.is_pro:
        if profile.daily_scans >= 10:
            return Response({
                "error": "DAILY_LIMIT_REACHED", 
                "message": "You have used your 10 free scans for today. Upgrade to Pro for unlimited access!"
            }, status=403)
    else:
        # Pro users are limited by their $19 API spend quota
        if profile.api_spend >= MAX_ALLOWANCE:
            return Response({"error": "QUOTA_EXCEEDED", "message": "Usage limit reached."}, status=403)

    pdf_file = request.FILES['file']
    
    try:
        # 2. Inject Page Markers into the text
        reader = PyPDF2.PdfReader(pdf_file)
        document_text = ""
        
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                # Label each page clearly for the AI to reference
                document_text += f"\n\n--- [PAGE {page_num + 1}] ---\n\n{text}"
                
        # Optional: Still truncate if the document is absurdly large to prevent immediate timeout
        document_text = document_text[:50000] 

        # 3. The Upgraded, Strict Prompt
        # Flush these strings all the way to the left margin!
        system_prompt = """You are an elite corporate attorney and legal analyst. Your goal is to review legal documents, contracts, bylaws, and terms of service. You must protect the user from predatory clauses and explain the document in plain, highly detailed English. Do not skip sections."""

        user_prompt = f"""Analyze the following legal document. You MUST cite the exact page number for every point using the [PAGE X] markers. 
If this is not a standard contract (e.g., bylaws, NDA, terms of use), adapt your analysis to summarize the rules, rights, and risks for the relevant parties. Be extremely comprehensive and detailed.

Format your response exactly using Markdown with these headings:

### 📄 Executive Summary
(A comprehensive overview of the document, its purpose, and the parties involved).

### 🎯 Core Terms & Fulfillments
* **[Term]** (Page X): What are the main conditions, rules, or criteria outlined in this document?

### 💰 Benefits & Rights
* **[Benefit/Right]** (Page X): What rights, compensation, or protections are granted?

### ⚖️ Responsibilities & Restrictions
* **[Duty]** (Page X): What specific rules, obligations, or restrictions are imposed?

### 🚩 Red Flags & Risks
* **[Risk]** (Page X): What clauses are predatory, dangerous, highly unusual, or severely limit liability?

---
DOCUMENT TEXT:
{document_text}"""

        response = client.chat.completions.create(
            model="Meta-Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1, # Keep it low for factual legal accuracy
            top_p=0.1
        )
        
        # 4. Calculate the exact cost of this request
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        
        cost_input = (prompt_tokens / 1_000_000) * INPUT_TOKEN_PRICE_PER_M
        cost_output = (completion_tokens / 1_000_000) * OUTPUT_TOKEN_PRICE_PER_M
        total_cost = cost_input + cost_output
        
        # 5. Update the user's spending profile
        if profile.is_pro:
            profile.api_spend += total_cost
        else:
            profile.daily_scans += 1

        return Response({
            "success": True, 
            "analysis": response.choices[0].message.content,
            "cost_incurred": round(total_cost, 4),
            "remaining_balance": round(MAX_ALLOWANCE - profile.api_spend, 2)
        })

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