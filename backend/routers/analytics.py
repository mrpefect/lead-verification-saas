from fastapi import APIRouter, HTTPException, Request
from bson import ObjectId
import database
from utils.auth_utils import get_current_user
from datetime import datetime, timezone, timedelta

router = APIRouter()


async def get_business_owner(request: Request):
    db = database.db
    user = await get_current_user(request, db)
    if not user.get("business_id"):
        raise HTTPException(status_code=403, detail="Business access required")
    return user


@router.get("/")
async def get_analytics(request: Request):
    user = await get_business_owner(request)
    db = database.db
    biz_id = user["business_id"]

    total_leads = await db.leads.count_documents({"business_id": biz_id})
    new_leads = await db.leads.count_documents({"business_id": biz_id, "status": "new"})
    verified_leads = await db.leads.count_documents({"business_id": biz_id, "verification_status": "verified"})
    qualified_leads = await db.leads.count_documents({"business_id": biz_id, "status": "qualified"})
    booked_leads = await db.leads.count_documents({"business_id": biz_id, "status": "booked"})
    closed_leads = await db.leads.count_documents({"business_id": biz_id, "status": "closed"})

    total_appointments = await db.appointments.count_documents({"business_id": biz_id})
    pending_appts = await db.appointments.count_documents({"business_id": biz_id, "status": "pending"})
    confirmed_appts = await db.appointments.count_documents({"business_id": biz_id, "status": "confirmed"})
    completed_appts = await db.appointments.count_documents({"business_id": biz_id, "status": "completed"})

    total_conversations = await db.conversations.count_documents({"business_id": biz_id})

    verification_rate = (verified_leads / total_leads * 100) if total_leads > 0 else 0
    appointment_rate = (total_appointments / total_leads * 100) if total_leads > 0 else 0
    conversion_rate = (closed_leads / total_leads * 100) if total_leads > 0 else 0

    # Lead source breakdown
    pipeline_source = [
        {"$match": {"business_id": biz_id}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    source_data = await db.leads.aggregate(pipeline_source).to_list(10)
    lead_sources = [{"source": s["_id"] or "unknown", "count": s["count"]} for s in source_data]

    # Recent lead trend (last 7 days)
    trend = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        next_day = day + timedelta(days=1)
        count = await db.leads.count_documents({
            "business_id": biz_id,
            "created_at": {"$gte": day_str, "$lt": next_day.strftime("%Y-%m-%d")}
        })
        trend.append({"date": day_str, "leads": count})

    return {
        "leads": {
            "total": total_leads,
            "new": new_leads,
            "verified": verified_leads,
            "qualified": qualified_leads,
            "booked": booked_leads,
            "closed": closed_leads
        },
        "appointments": {
            "total": total_appointments,
            "pending": pending_appts,
            "confirmed": confirmed_appts,
            "completed": completed_appts
        },
        "conversations": {"total": total_conversations},
        "rates": {
            "verification_rate": round(verification_rate, 1),
            "appointment_rate": round(appointment_rate, 1),
            "conversion_rate": round(conversion_rate, 1)
        },
        "lead_sources": lead_sources,
        "lead_trend": trend
    }
