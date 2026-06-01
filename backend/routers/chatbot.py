import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
import database
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str = ""


class ChatInput(BaseModel):
    message: str
    session_id: Optional[str] = None
    lead_data: Optional[dict] = None


class WidgetLeadInput(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    service: Optional[str] = ""
    session_id: Optional[str] = None


def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/{business_id}/info")
async def get_chatbot_info(business_id: str):
    db = database.db
    business = None
    try:
        business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.get("status") != "active":
        raise HTTPException(status_code=403, detail="Business is not active")
    ai_settings = business.get("ai_settings", {})
    return {
        "business_id": business_id,
        "business_name": business.get("name", ""),
        "welcome_message": ai_settings.get("welcome_message", "How can I help you?"),
        "faqs": ai_settings.get("faqs", [])
    }


@router.post("/{business_id}/message")
async def chat_message(business_id: str, input: ChatInput):
    db = database.db
    business = None
    try:
        business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.get("status") != "active":
        raise HTTPException(status_code=403, detail="Business is not active")

    ai_settings = business.get("ai_settings", {})
    session_id = input.session_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Get or create conversation
    conv = await db.conversations.find_one({"session_id": session_id, "business_id": business_id})
    if not conv:
        conv_doc = {
            "business_id": business_id,
            "session_id": session_id,
            "customer_name": input.lead_data.get("name", "Visitor") if input.lead_data else "Visitor",
            "customer_phone": input.lead_data.get("phone", "") if input.lead_data else "",
            "messages": [],
            "created_at": now,
            "updated_at": now
        }
        result = await db.conversations.insert_one(conv_doc)
        conv = conv_doc
        conv["_id"] = result.inserted_id
    
    conv_id = str(conv["_id"])
    messages = conv.get("messages", [])

    # Build system prompt
    faqs_text = ""
    if ai_settings.get("faqs"):
        faqs_list = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in ai_settings["faqs"]])
        faqs_text = f"\n\nFAQs:\n{faqs_list}"

    system_prompt = f"""You are an AI assistant for {business.get('name', 'this business')}.

{ai_settings.get('ai_instructions', 'Help customers with their inquiries.')}

Appointment Rules: {ai_settings.get('appointment_rules', 'Contact us for appointment availability.')}
{faqs_text}

Your goals:
1. Welcome the visitor warmly
2. Understand their needs
3. Capture their name, phone number, and email if not already provided
4. Qualify them based on their service interest
5. Help them book an appointment if appropriate
6. Answer questions about the business

If you've captured their contact details (name + phone), let them know a team member will follow up.
Be concise, friendly, and professional. Keep responses under 100 words."""

    # Get AI response using emergentintegrations
    try:
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        chat = LlmChat(
            api_key=llm_key,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-4o-mini")

        # Add history to LlmChat (it handles internally, but we send current message)
        user_msg = UserMessage(text=input.message)
        ai_response = await chat.send_message(user_msg)
    except Exception as e:
        logger.warning(f"Chatbot LLM call failed: {e}")
        ai_response = "Thank you for reaching out! A team member will contact you shortly."

    # Store messages
    new_messages = messages + [
        {"role": "user", "content": input.message, "timestamp": now},
        {"role": "assistant", "content": ai_response, "timestamp": now}
    ]
    await db.conversations.update_one(
        {"_id": conv["_id"]},
        {"$set": {"messages": new_messages, "updated_at": now}}
    )

    return {
        "response": ai_response,
        "session_id": session_id,
        "conversation_id": conv_id
    }


@router.post("/{business_id}/lead")
async def create_chatbot_lead(business_id: str, input: WidgetLeadInput):
    db = database.db
    business = None
    try:
        business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    now = datetime.now(timezone.utc).isoformat()
    lead_doc = {
        "business_id": business_id,
        "name": input.name,
        "phone": input.phone,
        "email": input.email or "",
        "service": input.service or "",
        "source": "chatbot",
        "status": "new",
        "verification_status": "pending",
        "notes": f"Captured via chatbot (session: {input.session_id})" if input.session_id else "Captured via chatbot",
        "created_at": now,
        "updated_at": now
    }
    result = await db.leads.insert_one(lead_doc)
    lead_id = str(result.inserted_id)

    # Update conversation with lead_id
    if input.session_id:
        await db.conversations.update_one(
            {"session_id": input.session_id, "business_id": business_id},
            {"$set": {"lead_id": lead_id, "customer_name": input.name, "customer_phone": input.phone, "updated_at": now}}
        )

    await db.notifications.insert_one({
        "business_id": business_id,
        "type": "new_lead",
        "title": "New Lead via Chatbot",
        "message": f"New chatbot lead: {input.name} ({input.phone})",
        "read": False,
        "created_at": now
    })
    return {"id": lead_id, "message": "Lead captured successfully"}
