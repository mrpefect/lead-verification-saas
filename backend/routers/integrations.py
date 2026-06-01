import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
import database
from utils.auth_utils import get_current_user

router = APIRouter()


async def get_business_owner(request: Request):
    db = database.db
    user = await get_current_user(request, db)
    if not user.get("business_id"):
        raise HTTPException(status_code=403, detail="Business access required")
    return user


class IntegrationsInput(BaseModel):
    twilio_sid: Optional[str] = None
    twilio_token: Optional[str] = None
    twilio_phone: Optional[str] = None
    twilio_verify_service: Optional[str] = None
    whatsapp_token: Optional[str] = None
    whatsapp_phone_id: Optional[str] = None
    calendly_url: Optional[str] = None
    google_calendar_id: Optional[str] = None


@router.get("/")
async def get_integrations(request: Request):
    user = await get_business_owner(request)
    db = database.db
    business = None
    try:
        business = await db.businesses.find_one({"_id": ObjectId(user["business_id"])}, {"integrations": 1, "api_key": 1})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    integrations = business.get("integrations", {})
    # Mask sensitive tokens
    masked = {}
    for k, v in integrations.items():
        if v and ("token" in k or "secret" in k):
            masked[k] = v[:4] + "****" + v[-4:] if len(v) > 8 else "****"
        else:
            masked[k] = v
    return {
        "integrations": masked,
        "api_key": business.get("api_key", ""),
        "webhook_url": f"{os.environ.get('FRONTEND_URL', '')}/api/leads/webhook/ingest"
    }


@router.put("/")
async def update_integrations(request: Request, input: IntegrationsInput):
    user = await get_business_owner(request)
    db = database.db
    update_data = {}
    for k, v in input.model_dump().items():
        if v is not None:
            update_data[f"integrations.{k}"] = v
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    try:
        await db.businesses.update_one({"_id": ObjectId(user["business_id"])}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "Integrations updated"}


@router.post("/test/twilio")
async def test_twilio(request: Request):
    user = await get_business_owner(request)
    db = database.db
    try:
        business = await db.businesses.find_one({"_id": ObjectId(user["business_id"])})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    integrations = business.get("integrations", {})
    sid = integrations.get("twilio_sid") or os.environ.get("TWILIO_ACCOUNT_SID", "")
    token = integrations.get("twilio_token") or os.environ.get("TWILIO_AUTH_TOKEN", "")

    if not all([sid, token]):
        return {"success": False, "message": "Twilio credentials not configured"}

    try:
        from twilio.rest import Client as TwilioClient
        tc = TwilioClient(sid, token)
        # Test by fetching account info
        account = tc.api.accounts(sid).fetch()
        return {"success": True, "message": f"Connected to Twilio account: {account.friendly_name}"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/regenerate-api-key")
async def regenerate_api_key(request: Request):
    import secrets
    user = await get_business_owner(request)
    db = database.db
    new_key = secrets.token_urlsafe(32)
    try:
        await db.businesses.update_one(
            {"_id": ObjectId(user["business_id"])},
            {"$set": {"api_key": new_key, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"api_key": new_key, "message": "API key regenerated"}
