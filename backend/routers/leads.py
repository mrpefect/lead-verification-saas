import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from bson import ObjectId
import database
from utils.auth_utils import get_current_user

router = APIRouter()


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


class CreateLeadInput(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    service: Optional[str] = ""
    source: Optional[str] = "manual"
    notes: Optional[str] = ""


class UpdateLeadInput(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service: Optional[str] = None
    status: Optional[str] = None
    verification_status: Optional[str] = None
    notes: Optional[str] = None


class WebhookLeadInput(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    service: Optional[str] = ""
    source: Optional[str] = "webhook"
    notes: Optional[str] = ""


class OTPInput(BaseModel):
    code: str


@router.get("/")
async def list_leads(
    request: Request,
    page: int = 1,
    limit: int = 20,
    status: str = "",
    verification_status: str = "",
    search: str = ""
):
    user = await get_business_owner(request)
    db = database.db
    query = {"business_id": user["business_id"]}
    if status:
        query["status"] = status
    if verification_status:
        query["verification_status"] = verification_status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    cursor = db.leads.find(query).skip(skip).limit(limit).sort("created_at", -1)
    leads = await cursor.to_list(limit)
    total = await db.leads.count_documents(query)
    return {"leads": [serialize_doc(l) for l in leads], "total": total, "page": page}


@router.post("/")
async def create_lead(request: Request, input: CreateLeadInput):
    user = await get_business_owner(request)
    db = database.db
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "business_id": user["business_id"],
        "name": input.name,
        "phone": input.phone,
        "email": input.email or "",
        "service": input.service or "",
        "source": input.source or "manual",
        "status": "new",
        "verification_status": "pending",
        "notes": input.notes or "",
        "created_at": now,
        "updated_at": now
    }
    result = await db.leads.insert_one(doc)
    lead_id = str(result.inserted_id)

    # Create notification
    await db.notifications.insert_one({
        "business_id": user["business_id"],
        "type": "new_lead",
        "title": "New Lead",
        "message": f"New lead captured: {input.name}",
        "read": False,
        "created_at": now
    })
    doc.pop("_id", None)
    return {"id": lead_id, **doc}


@router.get("/{lead_id}")
async def get_lead(request: Request, lead_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        doc = await db.leads.find_one({"_id": ObjectId(lead_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    return serialize_doc(doc)


@router.put("/{lead_id}")
async def update_lead(request: Request, lead_id: str, input: UpdateLeadInput):
    user = await get_business_owner(request)
    db = database.db
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    try:
        result = await db.leads.update_one(
            {"_id": ObjectId(lead_id), "business_id": user["business_id"]},
            {"$set": update_data}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Lead not found")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead updated"}


@router.delete("/{lead_id}")
async def delete_lead(request: Request, lead_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        result = await db.leads.delete_one({"_id": ObjectId(lead_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Lead not found")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}


@router.post("/{lead_id}/verify")
async def send_verification(request: Request, lead_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    verify_service = os.environ.get("TWILIO_VERIFY_SERVICE", "")

    if not all([twilio_sid, twilio_token, verify_service]):
        # Simulate for demo
        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {"verification_status": "pending", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Verification OTP sent (demo mode)", "demo": True}

    try:
        from twilio.rest import Client as TwilioClient
        tc = TwilioClient(twilio_sid, twilio_token)
        phone = lead["phone"]
        if not phone.startswith("+"):
            phone = "+" + phone
        tc.verify.services(verify_service).verifications.create(to=phone, channel="sms")
        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {"verification_status": "pending", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "OTP sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")


@router.post("/{lead_id}/verify/confirm")
async def confirm_verification(request: Request, lead_id: str, input: OTPInput):
    user = await get_business_owner(request)
    db = database.db
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    verify_service = os.environ.get("TWILIO_VERIFY_SERVICE", "")

    if not all([twilio_sid, twilio_token, verify_service]):
        # Demo mode - accept any code
        now = datetime.now(timezone.utc).isoformat()
        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {"verification_status": "verified", "status": "verified", "updated_at": now}}
        )
        await db.notifications.insert_one({
            "business_id": user["business_id"],
            "type": "verified_lead",
            "title": "Lead Verified",
            "message": f"Lead {lead['name']} has been verified",
            "read": False,
            "created_at": now
        })
        return {"verified": True, "message": "Lead verified (demo mode)"}

    try:
        from twilio.rest import Client as TwilioClient
        tc = TwilioClient(twilio_sid, twilio_token)
        phone = lead["phone"]
        if not phone.startswith("+"):
            phone = "+" + phone
        check = tc.verify.services(verify_service).verification_checks.create(to=phone, code=input.code)
        if check.status == "approved":
            now = datetime.now(timezone.utc).isoformat()
            await db.leads.update_one(
                {"_id": ObjectId(lead_id)},
                {"$set": {"verification_status": "verified", "status": "verified", "updated_at": now}}
            )
            await db.notifications.insert_one({
                "business_id": user["business_id"],
                "type": "verified_lead",
                "title": "Lead Verified",
                "message": f"Lead {lead['name']} has been verified",
                "read": False,
                "created_at": now
            })
            return {"verified": True}
        else:
            await db.leads.update_one(
                {"_id": ObjectId(lead_id)},
                {"$set": {"verification_status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"verified": False, "message": "Invalid OTP"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Webhook endpoint for external lead ingestion
@router.post("/webhook/ingest")
async def webhook_ingest(input: WebhookLeadInput, authorization: Optional[str] = Header(None)):
    db = database.db
    # Validate API key
    api_key = None
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    business = await db.businesses.find_one({"api_key": api_key})
    if not business:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if business.get("status") != "active":
        raise HTTPException(status_code=403, detail="Business account is not active")

    business_id = str(business["_id"])
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "business_id": business_id,
        "name": input.name,
        "phone": input.phone,
        "email": input.email or "",
        "service": input.service or "",
        "source": input.source or "webhook",
        "status": "new",
        "verification_status": "pending",
        "notes": input.notes or "",
        "created_at": now,
        "updated_at": now
    }
    result = await db.leads.insert_one(doc)

    await db.notifications.insert_one({
        "business_id": business_id,
        "type": "new_lead",
        "title": "New Lead via Webhook",
        "message": f"New lead from {input.source}: {input.name}",
        "read": False,
        "created_at": now
    })
    return {"id": str(result.inserted_id), "message": "Lead created successfully"}
