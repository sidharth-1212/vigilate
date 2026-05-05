from dodopayments import DodoPayments
import os

client = DodoPayments(
    bearer_token=os.getenv("DODO_API_KEY"),
    environment="test_mode"
)

def create_checkout(user_email, product_id):
    session = client.checkout_sessions.create(
        product_cart=[{"product_id": product_id, "quantity": 1}],
        customer={"email": user_email},
        return_url="http://localhost:5173/dashboard"
    )
    return session.checkout_url