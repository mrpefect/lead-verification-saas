import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
import database
from utils.auth_utils import get_current_user
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

router = APIRouter()

PLANS = {
    "starter": {"name": "Starter", "price": 49.00, "currency": "usd", "features": ["500 leads/month", "AI Chatbot", "Basic Analytics", "Email Support"]},
    "growth": {"name": "Growth", "price": 99.00, "currency": "usd", "features": ["2000 leads/month", "AI Chatbot", "Advanced Analytics", "SMS Verification", "Priority Support"]},
    "pro": {"name": "Pro", "price": 199.00, "currency": "usd", "features": ["Unlimited leads", "AI Chatbot", "Full Analytics", "SMS + WhatsApp", "Integrations", "Dedicated Support"]},
    "enterprise": {"name": "Enterprise", "price": 499.00, "currency": "usd", "features": ["Unlimited everything", "Custom AI", "White-label", "API Access", "SLA", "24/7 Support"]}
}


def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


async def get_business_owner(request: Request):
    db = database.db
    user = await get_current_user(request, db)
    if not user.get("business_id"):
        raise HTTPException(status_code=403, detail="Business access required")
    return user


class CheckoutInput(BaseModel):
    plan_id: str
    origin_url: str


@router.get("/plans")
async def get_plans():
    return {"plans": [{"id": k, **v} for k, v in PLANS.items()]}


@router.post("/checkout")
async def create_checkout(request: Request, input: CheckoutInput):
    user = await get_business_owner(request)
    db = database.db

    if input.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan = PLANS[input.plan_id]
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/billing/webhook"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    success_url = f"{input.origin_url}/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{input.origin_url}/billing"

    checkout_req = CheckoutSessionRequest(
        amount=plan["price"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "business_id": user["business_id"],
            "plan_id": input.plan_id,
            "plan_name": plan["name"]
        }
    )

    session = await stripe_checkout.create_checkout_session(checkout_req)

    now = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.insert_one({
        "user_id": user["id"],
        "business_id": user["business_id"],
        "session_id": session.session_id,
        "amount": plan["price"],
        "currency": plan["currency"],
        "plan_id": input.plan_id,
        "plan_name": plan["name"],
        "payment_status": "initiated",
        "status": "pending",
        "created_at": now,
        "updated_at": now
    })

    return {"url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    user = await get_business_owner(request)
    db = database.db

    transaction = await db.payment_transactions.find_one({"session_id": session_id, "business_id": user["business_id"]})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # If already completed, don't recheck
    if transaction.get("payment_status") == "paid":
        return {"payment_status": "paid", "plan_id": transaction.get("plan_id"), "status": "complete"}

    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/billing/webhook"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        now = datetime.now(timezone.utc).isoformat()

        if status.payment_status == "paid" and transaction.get("payment_status") != "paid":
            plan_id = transaction.get("plan_id", "starter")
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "status": "complete", "updated_at": now}}
            )
            await db.businesses.update_one(
                {"_id": ObjectId(user["business_id"])},
                {"$set": {"subscription_plan": plan_id, "subscription_status": "active", "updated_at": now}}
            )
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "expired", "status": "expired", "updated_at": now}}
            )

        return {"payment_status": status.payment_status, "status": status.status, "plan_id": transaction.get("plan_id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    db = database.db
    body = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/billing/webhook"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    try:
        event = await stripe_checkout.handle_webhook(body, sig_header)
        if event.payment_status == "paid":
            now = datetime.now(timezone.utc).isoformat()
            transaction = await db.payment_transactions.find_one({"session_id": event.session_id})
            if transaction and transaction.get("payment_status") != "paid":
                plan_id = transaction.get("plan_id", "starter")
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete", "updated_at": now}}
                )
                await db.businesses.update_one(
                    {"_id": ObjectId(transaction["business_id"])},
                    {"$set": {"subscription_plan": plan_id, "subscription_status": "active"}}
                )
    except Exception:
        pass
    return {"received": True}


@router.get("/transactions")
async def get_transactions(request: Request):
    user = await get_business_owner(request)
    db = database.db
    cursor = db.payment_transactions.find({"business_id": user["business_id"]}).sort("created_at", -1).limit(20)
    transactions = await cursor.to_list(20)
    for t in transactions:
        t["id"] = str(t.pop("_id"))
    return {"transactions": transactions}


@router.get("/subscription")
async def get_subscription(request: Request):
    user = await get_business_owner(request)
    db = database.db
    business = None
    try:
        business = await db.businesses.find_one({"_id": ObjectId(user["business_id"])})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    plan_id = business.get("subscription_plan", "starter")
    plan_info = PLANS.get(plan_id, PLANS["starter"])
    return {
        "plan_id": plan_id,
        "plan_name": plan_info["name"],
        "status": business.get("subscription_status", "trial"),
        "price": plan_info["price"],
        "features": plan_info["features"]
    }
