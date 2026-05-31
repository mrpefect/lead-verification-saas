from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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


class FAQ(BaseModel):
    question: str
    answer: str


class AISettingsInput(BaseModel):
    welcome_message: Optional[str] = None
    faqs: Optional[List[FAQ]] = None
    ai_instructions: Optional[str] = None
    appointment_rules: Optional[str] = None


class WorkingHoursDay(BaseModel):
    open: str
    close: str
    closed: bool


class BusinessSettingsInput(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    services: Optional[List[str]] = None


@router.get("/")
async def get_settings(request: Request):
    user = await get_business_owner(request)
    db = database.db
    try:
        business = await db.businesses.find_one({"_id": ObjectId(user["business_id"])})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    business["id"] = str(business.pop("_id"))
    return business


@router.put("/")
async def update_settings(request: Request, input: BusinessSettingsInput):
    user = await get_business_owner(request)
    db = database.db
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    try:
        result = await db.businesses.update_one({"_id": ObjectId(user["business_id"])}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "Settings updated"}


@router.put("/ai")
async def update_ai_settings(request: Request, input: AISettingsInput):
    user = await get_business_owner(request)
    db = database.db
    update_data = {}
    if input.welcome_message is not None:
        update_data["ai_settings.welcome_message"] = input.welcome_message
    if input.faqs is not None:
        update_data["ai_settings.faqs"] = [f.model_dump() for f in input.faqs]
    if input.ai_instructions is not None:
        update_data["ai_settings.ai_instructions"] = input.ai_instructions
    if input.appointment_rules is not None:
        update_data["ai_settings.appointment_rules"] = input.appointment_rules
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    try:
        await db.businesses.update_one({"_id": ObjectId(user["business_id"])}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "AI settings updated"}


@router.put("/working-hours")
async def update_working_hours(request: Request, body: Dict[str, Any]):
    user = await get_business_owner(request)
    db = database.db
    try:
        await db.businesses.update_one(
            {"_id": ObjectId(user["business_id"])},
            {"$set": {"working_hours": body, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"message": "Working hours updated"}
