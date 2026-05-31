from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
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


class CreateAppointmentInput(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    service: Optional[str] = ""
    date: str
    time: str
    notes: Optional[str] = ""
    lead_id: Optional[str] = None


class UpdateAppointmentInput(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    service: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def list_appointments(
    request: Request,
    page: int = 1,
    limit: int = 20,
    status: str = "",
    search: str = ""
):
    user = await get_business_owner(request)
    db = database.db
    query = {"business_id": user["business_id"]}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"customer_phone": {"$regex": search, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    cursor = db.appointments.find(query).skip(skip).limit(limit).sort("created_at", -1)
    appts = await cursor.to_list(limit)
    total = await db.appointments.count_documents(query)
    return {"appointments": [serialize_doc(a) for a in appts], "total": total}


@router.post("/")
async def create_appointment(request: Request, input: CreateAppointmentInput):
    user = await get_business_owner(request)
    db = database.db
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "business_id": user["business_id"],
        "lead_id": input.lead_id,
        "customer_name": input.customer_name,
        "customer_phone": input.customer_phone,
        "customer_email": input.customer_email or "",
        "service": input.service or "",
        "date": input.date,
        "time": input.time,
        "status": "pending",
        "notes": input.notes or "",
        "created_at": now,
        "updated_at": now
    }
    result = await db.appointments.insert_one(doc)
    appt_id = str(result.inserted_id)

    # Update lead status if linked
    if input.lead_id:
        try:
            await db.leads.update_one(
                {"_id": ObjectId(input.lead_id), "business_id": user["business_id"]},
                {"$set": {"status": "booked", "updated_at": now}}
            )
        except Exception:
            pass

    await db.notifications.insert_one({
        "business_id": user["business_id"],
        "type": "appointment_booked",
        "title": "Appointment Booked",
        "message": f"New appointment for {input.customer_name} on {input.date} at {input.time}",
        "read": False,
        "created_at": now
    })
    doc.pop("_id", None)
    return {"id": appt_id, **doc}


@router.get("/{appt_id}")
async def get_appointment(request: Request, appt_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        doc = await db.appointments.find_one({"_id": ObjectId(appt_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return serialize_doc(doc)


@router.put("/{appt_id}")
async def update_appointment(request: Request, appt_id: str, input: UpdateAppointmentInput):
    user = await get_business_owner(request)
    db = database.db
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    try:
        result = await db.appointments.update_one(
            {"_id": ObjectId(appt_id), "business_id": user["business_id"]},
            {"$set": update_data}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment updated"}


@router.delete("/{appt_id}")
async def delete_appointment(request: Request, appt_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        result = await db.appointments.delete_one({"_id": ObjectId(appt_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted"}
