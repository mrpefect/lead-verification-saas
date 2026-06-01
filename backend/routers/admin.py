import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from bson import ObjectId
import database
from utils.auth_utils import get_current_user, hash_password

router = APIRouter()


async def require_super_admin(request: Request):
    db = database.db
    user = await get_current_user(request, db)
    if user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user


class CreateBusinessInput(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    website: str = ""
    services: List[str] = []
    owner_name: str = ""
    owner_password: str = "TempPass@123"
    subscription_plan: str = "starter"


class UpdateBusinessInput(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    services: Optional[List[str]] = None
    status: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None


def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/businesses")
async def list_businesses(request: Request, page: int = 1, limit: int = 20, search: str = ""):
    await require_super_admin(request)
    db = database.db
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    cursor = db.businesses.find(query, {"_id": 1, "name": 1, "email": 1, "phone": 1, "status": 1, "subscription_plan": 1, "subscription_status": 1, "created_at": 1}).skip(skip).limit(limit).sort("created_at", -1)
    businesses = await cursor.to_list(limit)
    total = await db.businesses.count_documents(query)
    return {"businesses": [serialize_doc(b) for b in businesses], "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.post("/businesses")
async def create_business(request: Request, input: CreateBusinessInput):
    await require_super_admin(request)
    db = database.db
    now = datetime.now(timezone.utc).isoformat()
    email = input.email.lower().strip()

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already in use")

    business_doc = {
        "name": input.name,
        "email": email,
        "phone": input.phone,
        "website": input.website,
        "services": input.services,
        "status": "active",
        "subscription_plan": input.subscription_plan,
        "subscription_status": "active",
        "api_key": secrets.token_urlsafe(32),
        "ai_settings": {
            "welcome_message": f"Hi! I'm the AI assistant for {input.name}. How can I help you?",
            "faqs": [],
            "ai_instructions": f"You are a helpful AI assistant for {input.name}.",
            "appointment_rules": "Appointments available Mon-Fri, 9AM-5PM."
        },
        "working_hours": {
            "monday": {"open": "09:00", "close": "17:00", "closed": False},
            "tuesday": {"open": "09:00", "close": "17:00", "closed": False},
            "wednesday": {"open": "09:00", "close": "17:00", "closed": False},
            "thursday": {"open": "09:00", "close": "17:00", "closed": False},
            "friday": {"open": "09:00", "close": "17:00", "closed": False},
            "saturday": {"open": "09:00", "close": "13:00", "closed": True},
            "sunday": {"open": "09:00", "close": "13:00", "closed": True}
        },
        "integrations": {"twilio_sid": "", "twilio_token": "", "twilio_phone": "", "whatsapp_token": "", "whatsapp_phone_id": "", "calendly_url": "", "google_calendar_id": ""},
        "created_at": now
    }
    biz_result = await db.businesses.insert_one(business_doc)
    business_id = str(biz_result.inserted_id)

    owner_doc = {
        "name": input.owner_name or input.name + " Owner",
        "email": email,
        "password_hash": hash_password(input.owner_password),
        "role": "business_owner",
        "business_id": business_id,
        "created_at": now
    }
    user_result = await db.users.insert_one(owner_doc)

    return {"id": business_id, "owner_id": str(user_result.inserted_id), "name": input.name, "email": email, "status": "active"}


@router.get("/businesses/{business_id}")
async def get_business(request: Request, business_id: str):
    await require_super_admin(request)
    db = database.db
    doc = None
    try:
        doc = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Business not found")
    return serialize_doc(doc)


@router.put("/businesses/{business_id}")
async def update_business(request: Request, business_id: str, input: UpdateBusinessInput):
    await require_super_admin(request)
    db = database.db
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    try:
        result = await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "Business updated successfully"}


@router.put("/businesses/{business_id}/suspend")
async def suspend_business(request: Request, business_id: str):
    await require_super_admin(request)
    db = database.db
    try:
        result = await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": {"status": "suspended"}})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "Business suspended"}


@router.put("/businesses/{business_id}/activate")
async def activate_business(request: Request, business_id: str):
    await require_super_admin(request)
    db = database.db
    try:
        result = await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": {"status": "active"}})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "Business activated"}


@router.delete("/businesses/{business_id}")
async def delete_business(request: Request, business_id: str):
    await require_super_admin(request)
    db = database.db
    try:
        obj_id = ObjectId(business_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")

    business = await db.businesses.find_one({"_id": obj_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Cascade delete every record tied to this business so the owner's email
    # can be reused for a fresh signup
    biz_id_str = str(obj_id)
    deleted = {
        "leads": (await db.leads.delete_many({"business_id": biz_id_str})).deleted_count,
        "appointments": (await db.appointments.delete_many({"business_id": biz_id_str})).deleted_count,
        "conversations": (await db.conversations.delete_many({"business_id": biz_id_str})).deleted_count,
        "notifications": (await db.notifications.delete_many({"business_id": biz_id_str})).deleted_count,
        "payment_transactions": (await db.payment_transactions.delete_many({"business_id": biz_id_str})).deleted_count,
    }

    # Owner email (used to also wipe pending password-reset tokens)
    owner_email = (business.get("email") or "").lower().strip()

    # Delete the owner user(s) attached to this business
    user_filter = {"role": "business_owner", "business_id": biz_id_str}
    deleted["users"] = (await db.users.delete_many(user_filter)).deleted_count

    # Clean up any pending password-reset / login-attempt records for that email
    if owner_email:
        await db.password_reset_tokens.delete_many({"email": owner_email})
        await db.login_attempts.delete_many({"identifier": {"$regex": f":{owner_email}$"}})

    # Finally remove the business document itself
    await db.businesses.delete_one({"_id": obj_id})

    return {"message": "Business and all related data deleted", "deleted": deleted}


@router.get("/leads")
async def list_all_leads(request: Request, page: int = 1, limit: int = 20, status: str = "", search: str = ""):
    await require_super_admin(request)
    db = database.db
    query = {}
    if status:
        query["status"] = status
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
    return {"leads": [serialize_doc(l) for l in leads], "total": total}


@router.get("/appointments")
async def list_all_appointments(request: Request, page: int = 1, limit: int = 20):
    await require_super_admin(request)
    db = database.db
    skip = (page - 1) * limit
    cursor = db.appointments.find({}).skip(skip).limit(limit).sort("created_at", -1)
    appointments = await cursor.to_list(limit)
    total = await db.appointments.count_documents({})
    return {"appointments": [serialize_doc(a) for a in appointments], "total": total}


@router.get("/analytics")
async def platform_analytics(request: Request):
    await require_super_admin(request)
    db = database.db
    total_businesses = await db.businesses.count_documents({})
    active_businesses = await db.businesses.count_documents({"status": "active"})
    total_leads = await db.leads.count_documents({})
    verified_leads = await db.leads.count_documents({"verification_status": "verified"})
    total_appointments = await db.appointments.count_documents({})
    confirmed_appointments = await db.appointments.count_documents({"status": "confirmed"})

    # Plan distribution
    plans = {}
    for plan in ["starter", "growth", "pro", "enterprise"]:
        plans[plan] = await db.businesses.count_documents({"subscription_plan": plan})

    return {
        "total_businesses": total_businesses,
        "active_businesses": active_businesses,
        "total_leads": total_leads,
        "verified_leads": verified_leads,
        "total_appointments": total_appointments,
        "confirmed_appointments": confirmed_appointments,
        "plan_distribution": plans
    }


@router.get("/users")
async def list_users(request: Request, page: int = 1, limit: int = 20):
    await require_super_admin(request)
    db = database.db
    skip = (page - 1) * limit
    cursor = db.users.find({}, {"password_hash": 0}).skip(skip).limit(limit)
    users = await cursor.to_list(limit)
    total = await db.users.count_documents({})
    for u in users:
        u["id"] = str(u.pop("_id"))
    return {"users": users, "total": total}


# ── Payments (all transactions) ──────────────────────────────────────────────
@router.get("/payments")
async def list_all_payments(request: Request, page: int = 1, limit: int = 20):
    await require_super_admin(request)
    db = database.db
    skip = (page - 1) * limit
    cursor = db.payment_transactions.find({}).skip(skip).limit(limit).sort("created_at", -1)
    transactions = await cursor.to_list(limit)
    total = await db.payment_transactions.count_documents({})
    for t in transactions:
        t["id"] = str(t.pop("_id"))
    return {"transactions": transactions, "total": total}


# ── Support tickets ───────────────────────────────────────────────────────────
class SupportTicketInput(BaseModel):
    subject: str
    message: str
    priority: Optional[str] = "medium"


class SupportUpdateInput(BaseModel):
    status: Optional[str] = None
    reply: Optional[str] = None


@router.get("/support")
async def list_tickets(request: Request):
    await require_super_admin(request)
    db = database.db
    cursor = db.support_tickets.find({}).sort("created_at", -1).limit(50)
    tickets = await cursor.to_list(50)
    for t in tickets:
        t["id"] = str(t.pop("_id"))
    return {"tickets": tickets}


@router.put("/support/{ticket_id}")
async def update_ticket(request: Request, ticket_id: str, input: SupportUpdateInput):
    await require_super_admin(request)
    db = database.db
    update = {}
    if input.status:
        update["status"] = input.status
    if input.reply:
        update.setdefault("replies", [])
        now = datetime.now(timezone.utc).isoformat()
        await db.support_tickets.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$push": {"replies": {"from": "admin", "message": input.reply, "created_at": now}}}
        )
    if update:
        await db.support_tickets.update_one({"_id": ObjectId(ticket_id)}, {"$set": update})
    return {"message": "Ticket updated"}


# ── System Settings ───────────────────────────────────────────────────────────
@router.get("/system-settings")
async def get_system_settings(request: Request):
    await require_super_admin(request)
    db = database.db
    doc = await db.system_settings.find_one({"_id": "global"})
    if not doc:
        return {}
    doc.pop("_id", None)
    return doc


@router.put("/system-settings")
async def update_system_settings(request: Request, body: dict):
    await require_super_admin(request)
    db = database.db
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.system_settings.update_one({"_id": "global"}, {"$set": body}, upsert=True)
    return {"message": "System settings updated"}
