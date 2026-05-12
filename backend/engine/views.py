import os
import PyPDF2
from rest_framework.response import Response
from openai import OpenAI
from dotenv import load_dotenv
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import UserProfile, ScanHistory
import requests
from dodopayments import DodoPayments
from django.views.decorators.csrf import csrf_exempt
import json
from django.utils import timezone
from django.http import JsonResponse
import re
from datetime import timedelta
import docx
from decimal import Decimal

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
    if profile.last_scan_date.month != today.month or profile.last_scan_date.year != today.year:
        profile.daily_scans = 0
        profile.last_scan_date = today

    # 1. Check the Paywall Limits
    if not profile.is_pro:
        if profile.daily_scans >= 5:
            return Response({
                "error": "DAILY_LIMIT_REACHED", # Keeping this error code so the React frontend doesn't break
                "message": "You have used your 5 free scans for this month. Upgrade to Pro for unlimited access!"
            }, status=403)
    else:
        # Pro users are limited by their $19 API spend quota
        if profile.api_spend >= MAX_ALLOWANCE:
            return Response({"error": "QUOTA_EXCEEDED", "message": "Usage limit reached."}, status=403)

    uploaded_file = request.FILES['file']
    if uploaded_file.size > 10 * 1024 * 1024:
        return Response({
            "error": "File too large. Maximum size is 10MB to ensure stable processing."
        }, status=400)
    file_extension = os.path.splitext(uploaded_file.name)[1].lower()
    document_text = ""
    
    try:
        # --- RESTORED FEATURE: PDF & DOCX Support ---
        if file_extension == '.pdf':
            reader = PyPDF2.PdfReader(uploaded_file)
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    document_text += f"\n\n--- [PAGE {page_num + 1}] ---\n\n{text}"
                    
        elif file_extension == '.docx':
            doc = docx.Document(uploaded_file)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            paras_per_page = 20 
            for page_num in range(0, len(paragraphs), paras_per_page):
                chunk = "\n".join(paragraphs[page_num:page_num + paras_per_page])
                document_text += f"\n\n--- [PAGE {(page_num // paras_per_page) + 1}] ---\n\n{chunk}"
                
        else:
            return Response({"error": "Unsupported file format. Please upload a PDF or DOCX."}, status=400)

        if profile.is_pro:
            document_text = document_text[:600000]  # ~150 pages
        else:
            document_text = document_text[:50000]

        # --- TIER FEATURE: Deep Extraction vs Basic Summary ---
        if profile.is_pro:
            system_prompt = """You are an elite corporate attorney and legal analyst. Your goal is to review legal documents, contracts, bylaws, and terms of service. You must protect the user from predatory clauses and perform deep clause extraction. Identify hidden indemnification traps, non-competes, IP grabs, and liability caps. Be extremely comprehensive and detailed. Format headers using simple CAPS."""
        else:
            system_prompt = """You are a legal assistant. Provide a basic, surface-level summary of this document and highlight any obvious general risks. Keep the analysis brief. Format headers using simple CAPS."""

        # 2. FIXED PROMPT: Read the whole document, prioritize Top 10 risks, NO page numbers
        user_prompt = f"""You MUST start your response with a risk score on the very first line in this exact format: "RISK_SCORE: X" (where X is a number from 1 to 10, with 10 being highly predatory). Then provide the analysis.
        
Analyze the following legal document. You MUST analyze the ENTIRE document from start to finish. Do not stop scanning until you have reached the absolute final section. 

To ensure the report remains readable and impactful, extract ONLY the Top 10 most severe, predatory, or high-risk clauses you find across the entire document. Do not summarize the first half; scan everything and surface the absolute worst terms.

Format your response exactly using Markdown with these headings:

### Executive Summary
(A comprehensive overview of the document, its purpose, and the parties involved).

### Core Terms & Fulfillments
* **[Term]**: What are the main conditions, rules, or criteria outlined?

### Benefits & Rights
* **[Benefit/Right]**: What rights, compensation, or protections are granted?

### Responsibilities & Restrictions
* **[Duty]**: What specific rules, obligations, or restrictions are imposed?

### Red Flags & Risks
> **[Risk 1]**: What clauses are predatory, dangerous, highly unusual, or severely limit liability?

> **[Risk 2]**: Another risk description...

(CRITICAL INSTRUCTION: You MUST leave a completely blank empty line between each risk. Every individual risk must start with its own '>' character. Do NOT combine them into a single block).

---
DOCUMENT TEXT:
{document_text}"""

        response = client.chat.completions.create(
            model="Meta-Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1, 
            top_p=0.1,
            max_tokens=4096
        )

        raw_content = response.choices[0].message.content

        risk_score = 5 # Default
        match = re.search(r'RISK_SCORE[^\d]*(\d+)', raw_content, re.IGNORECASE)
        if match:
            try:
                extracted_score = int(match.group(1))
                if 1 <= extracted_score <= 10:
                    risk_score = extracted_score
            except ValueError:
                pass
        
        scan_record = ScanHistory.objects.create(
            user=request.user,
            filename=uploaded_file.name,
            risk_score=risk_score,
            analysis_text=raw_content
        )

        # 4. Calculate the exact cost of this request
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        
        cost_input = (prompt_tokens / 1_000_000) * INPUT_TOKEN_PRICE_PER_M
        cost_output = (completion_tokens / 1_000_000) * OUTPUT_TOKEN_PRICE_PER_M
        total_cost = cost_input + cost_output
        profile.api_spend += Decimal(str(total_cost))
        
        # 5. Update the user's spending profile
        if not profile.is_pro:
            profile.daily_scans += 1

        profile.save()

        return Response({
            "success": True, 
            "analysis": response.choices[0].message.content,
            "scan_id": scan_record.id,
            "cost_incurred": round(total_cost, 4),
            "risk_score": risk_score,
            "remaining_balance": round(MAX_ALLOWANCE - float(profile.api_spend), 2)
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_checkout(request):
    if request.user.userprofile.is_pro:
        return Response({"error": "You are already a Pro user."}, status=400)
        
    env_mode = os.getenv('DODO_PAYMENTS_ENV', 'live_mode')
    client = DodoPayments(
        bearer_token=os.getenv("DODO_PAYMENTS_API_KEY"),
        environment=env_mode
    )

    return_url = f"{os.getenv('FRONTEND_URL')}/dashboard?payment=success"
    product_id = os.getenv('PRODUCT_ID')

    # 1. Catch missing environment variables
    if not product_id:
        print("🚨 Backend Error: PRODUCT_ID is missing from .env")
        return Response({"error": "Billing configuration error."}, status=500)
        
    # 2. Catch missing user emails (The usual culprit for 422s)
    if not request.user.email:
        print(f"🚨 Backend Error: User {request.user.username} has no email address.")
        return Response({"error": "Your account requires an email address for billing. Please update it in the Profile tab."}, status=400)

    try:
        session = client.checkout_sessions.create(
            product_cart=[{"product_id": product_id, "quantity": 1}],
            customer={
                "email": request.user.email, 
                "name": request.user.get_full_name() or request.user.username
            },
            return_url=return_url,
            metadata={"user_id": str(request.user.id)}
        )
        return Response({"checkout_url": session.checkout_url})
        
    except Exception as e:
        # 3. Expose the actual API error to the terminal!
        print(f"🚨 Dodo API Rejection: {str(e)}")
        return Response({"error": f"Gateway error: {str(e)}"}, status=500)
   
@csrf_exempt 
def dodo_webhook(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method Not Allowed"}, status=405)

    webhook_secret = os.getenv('DODO_WEBHOOK_SECRET')
    
    try:
        env_mode = os.getenv('DODO_PAYMENTS_ENV', 'live_mode')
        
        client = DodoPayments(
            bearer_token=os.getenv("DODO_PAYMENTS_API_KEY"),
            environment=env_mode,
            webhook_key=webhook_secret 
        )
        
        dodo_headers = {
            "webhook-id": request.headers.get("webhook-id", ""),
            "webhook-signature": request.headers.get("webhook-signature", ""),
            "webhook-timestamp": request.headers.get("webhook-timestamp", ""),
        }

        client.webhooks.unwrap(
            request.body,
            headers=dodo_headers
        )

        verified_payload = client.webhooks.unwrap(
            request.body,
            headers=dodo_headers
        )
        
    except Exception as e:
        print(f"🚨 Security Alert: Webhook verification failed! {e}")
        return JsonResponse({"error": f"Verification failed: {str(e)}"}, status=400)

    # If unwrap succeeds, safely read the JSON
    try:
        event_type = verified_payload.get("type")
        payload_data = verified_payload.get("data", {})

        # --- EVENT 1 & 2: Successful Payments & Upgrades ---
        if event_type in ["payment.succeeded", "subscription.active"]:
            user_id = payload_data.get("metadata", {}).get("user_id")
            subscription_id = payload_data.get("subscription_id")
            
            if user_id:
                profile = UserProfile.objects.get(user__id=user_id)
                profile.is_pro = True
                if subscription_id:
                    profile.subscription_id = subscription_id
                profile.save()
                print(f"💰 SUCCESS: User {user_id} securely upgraded to PRO!")
                return JsonResponse({"status": "success"}, status=200)

        # --- EVENT 3: The Kill Switch (Downgrades) ---
        elif event_type in ["subscription.canceled", "subscription.cancelled"]:
            subscription_id = payload_data.get("subscription_id")
            if subscription_id:
                try:
                    profile = UserProfile.objects.get(subscription_id=subscription_id)
                    profile.is_pro = False
                    profile.subscription_id = None
                    profile.api_spend = 0.0
                    profile.save()
                    print(f"📉 ALERT: Subscription {subscription_id} cancelled.")
                    return JsonResponse({"status": "success"}, status=200)
                except UserProfile.DoesNotExist:
                    pass
                    
        # --- EVENT 4: Payment Failure Logging ---
        elif event_type == "payment.failed":
            user_id = payload_data.get("metadata", {}).get("user_id", "Unknown")
            print(f"⚠️ WARNING: Payment failed or declined for user {user_id}.")
            return JsonResponse({"status": "logged"}, status=200)

        return JsonResponse({"status": "ignored"}, status=200)
        
    except UserProfile.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        print(f"🚨 Webhook Processing Error: {e}")
        return JsonResponse({"error": "Server error"}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_scan_history(request):
    profile = request.user.userprofile
    
    # --- TIER FEATURE: Unlimited vs 24-Hour History ---
    if profile.is_pro:
        scans = ScanHistory.objects.filter(user=request.user).order_by('-created_at')
    else:
        # Free Tier: Only show scans from the last 24 hours
        time_threshold = timezone.now() - timedelta(hours=24)
        scans = ScanHistory.objects.filter(user=request.user, created_at__gte=time_threshold).order_by('-created_at')
        
    data = [{
        "id": s.id,
        "filename": s.filename,
        "risk_score": s.risk_score,
        "analysis": s.analysis_text,
        "date": s.created_at.strftime("%b %d, %Y")
    } for s in scans]
    return Response(data)

@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_scan(request, scan_id):
    try:
        # We ensure they can only delete THEIR OWN scans
        scan = ScanHistory.objects.get(id=scan_id, user=request.user)
        scan.delete()
        return Response({"success": True})
    except ScanHistory.DoesNotExist:
        return Response({"error": "Scan not found or access denied"}, status=404)
    
@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        # 1. Base response data
        response_data = {
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "email": request.user.email,
            "is_pro": profile.is_pro,
            "api_spend": float(profile.api_spend),
            "daily_scans": profile.daily_scans,
            "cancel_at_period_end": False,
            "billing_date": None
        }

        # 2. Fetch live subscription data from Dodo Payments
        if profile.is_pro and profile.subscription_id:
            try:
                env_mode = os.getenv('DODO_PAYMENTS_ENV', 'live_mode')
                client = DodoPayments(
                    bearer_token=os.getenv("DODO_PAYMENTS_API_KEY"),
                    environment=env_mode
                )
                sub = client.subscriptions.retrieve(profile.subscription_id)
                
                # Update response with live Dodo data
                response_data["cancel_at_period_end"] = sub.cancel_at_next_billing_date
                
                # Safely extract the billing date
                date_val = getattr(sub, 'next_billing_date', None)
                if date_val:
                    response_data["billing_date"] = str(date_val)
                    
            except Exception as e:
                print(f"Failed to fetch live Dodo subscription: {e}")

        return Response(response_data)

    if request.method == 'PUT':
        # Update user details
        request.user.first_name = request.data.get('first_name', request.user.first_name)
        request.user.last_name = request.data.get('last_name', request.user.last_name)
        request.user.save()
        return Response({"success": True})
    
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    profile = request.user.userprofile
    if not profile.is_pro:
        return Response({"error": "You do not have an active subscription."}, status=400)
    
    if not profile.subscription_id:
        return Response({"error": "No active billing ID found. Please contact support."}, status=400)

    try:
        env_mode = os.getenv('DODO_PAYMENTS_ENV', 'live_mode')
        client = DodoPayments(
            bearer_token=os.getenv("DODO_PAYMENTS_API_KEY"),
            environment=env_mode
        )
        
        # 1. Fire the Kill Signal
        response = client.subscriptions.update(
            subscription_id=profile.subscription_id,
            cancel_at_next_billing_date=True,
            cancel_reason="cancelled_by_customer"
        )
        
        # 2. Verify Dodo registered the cancellation intent
        if response.cancel_at_next_billing_date:
            print(f"✅ API Success: Dodo scheduled cancellation for {profile.subscription_id}")
            
            # WE DELETED THE LOCAL DOWNGRADE HERE. 
            # The Webhook will handle it at the end of the month!
            
            return Response({"success": True, "message": "Auto-renew cancelled. You keep Pro access until the end of your billing cycle."})
        else:
            print(f"⚠️ API Warning: Dodo did not accept the cancellation request.")
            return Response({"error": "Cancellation pending or failed at gateway."}, status=500)

    except Exception as e:
        print(f"🚨 API FATAL: Failed to reach Dodo API for cancellation: {e}")
        return Response({"error": "Payment gateway unreachable. Please try again later."}, status=502)