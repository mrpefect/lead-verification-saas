from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
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


@router.get("/")
async def list_conversations(request: Request, page: int = 1, limit: int = 20, search: str = ""):
    user = await get_business_owner(request)
    db = database.db
    query = {"business_id": user["business_id"]}
    if search:
        query["$or"] = [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"customer_phone": {"$regex": search, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    cursor = db.conversations.find(query, {"messages": 0}).skip(skip).limit(limit).sort("updated_at", -1)
    conversations = await cursor.to_list(limit)
    total = await db.conversations.count_documents(query)
    return {"conversations": [serialize_doc(c) for c in conversations], "total": total}


@router.get("/{conv_id}")
async def get_conversation(request: Request, conv_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        doc = await db.conversations.find_one({"_id": ObjectId(conv_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return serialize_doc(doc)


@router.delete("/{conv_id}")
async def delete_conversation(request: Request, conv_id: str):
    user = await get_business_owner(request)
    db = database.db
    try:
        result = await db.conversations.delete_one({"_id": ObjectId(conv_id), "business_id": user["business_id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}
