from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
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


@router.get("/")
async def list_notifications(request: Request, page: int = 1, limit: int = 20, unread_only: bool = False):
    user = await get_business_owner(request)
    db = database.db
    query = {"business_id": user["business_id"]}
    if unread_only:
        query["read"] = False
    skip = (page - 1) * limit
    cursor = db.notifications.find(query).skip(skip).limit(limit).sort("created_at", -1)
    notifications = await cursor.to_list(limit)
    total = await db.notifications.count_documents(query)
    unread_count = await db.notifications.count_documents({"business_id": user["business_id"], "read": False})
    for n in notifications:
        n["id"] = str(n.pop("_id"))
    return {"notifications": notifications, "total": total, "unread_count": unread_count}


@router.put("/{notif_id}/read")
async def mark_read(request: Request, notif_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        await db.notifications.update_one(
            {"_id": ObjectId(notif_id), "business_id": user["business_id"]},
            {"$set": {"read": True}}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.put("/read-all")
async def mark_all_read(request: Request):
    user = await get_business_owner(request)
    db = database.db
    await db.notifications.update_many(
        {"business_id": user["business_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}
