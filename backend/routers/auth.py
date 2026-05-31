import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import database
from utils.auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_current_user, get_jwt_secret, JWT_ALGORITHM
)
from utils.email_utils import send_verification_email, send_password_reset_email
import jwt

router = APIRouter()


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    business_name: str = ""


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str


class VerifyEmailInput(BaseModel):
    token: str


class ResendVerificationInput(BaseModel):
    email: EmailStr


def _frontend_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")


@router.post("/register")
async def register(input: RegisterInput):
    db = database.db
    email = input.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed = hash_password(input.password)
    now = datetime.now(timezone.utc).isoformat()

    # Create business for business owner
    business_id = None
    business_name = input.business_name or f"{input.name}'s Business"
    business_doc = {
        "name": business_name,
        "email": email,
        "phone": "",
        "website": "",
        "services": [],
        "status": "active",
        "subscription_plan": "starter",
        "subscription_status": "trial",
        "api_key": secrets.token_urlsafe(32),
        "ai_settings": {
            "welcome_message": f"Hi! I'm the AI assistant for {business_name}. How can I help you today?",
            "faqs": [],
            "ai_instructions": f"You are a helpful AI assistant for {business_name}. Capture leads, answer questions, and help book appointments.",
            "appointment_rules": "Appointments are available Monday-Friday, 9AM-5PM."
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
        "integrations": {
            "twilio_sid": "", "twilio_token": "", "twilio_phone": "",
            "whatsapp_token": "", "whatsapp_phone_id": "",
            "calendly_url": "", "google_calendar_id": ""
        },
        "created_at": now
    }
    biz_result = await db.businesses.insert_one(business_doc)
    business_id = str(biz_result.inserted_id)

    # Generate email verification token (valid 24 hours)
    verification_token = secrets.token_urlsafe(32)
    verification_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    user_doc = {
        "name": input.name,
        "email": email,
        "password_hash": hashed,
        "role": "business_owner",
        "business_id": business_id,
        "email_verified": False,
        "email_verification_token": verification_token,
        "email_verification_expires_at": verification_expires,
        "created_at": now
    }
    await db.users.insert_one(user_doc)

    # Send verification email (non-blocking)
    verify_link = f"{_frontend_url()}/verify-email?token={verification_token}"
    await send_verification_email(email, input.name, verify_link)

    return {
        "message": "Account created. Please check your email to verify your account before logging in.",
        "email": email,
        "email_verified": False
    }


@router.post("/verify-email")
async def verify_email(input: VerifyEmailInput):
    db = database.db
    user = await db.users.find_one({"email_verification_token": input.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    if user.get("email_verified"):
        return {"message": "Email already verified. You can sign in now.", "already_verified": True}

    expires_at_raw = user.get("email_verification_expires_at")
    if expires_at_raw:
        expires_at = datetime.fromisoformat(expires_at_raw) if isinstance(expires_at_raw, str) else expires_at_raw
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True}}
    )
    return {"message": "Email verified successfully. You can now sign in.", "email": user["email"]}


@router.post("/resend-verification")
async def resend_verification(input: ResendVerificationInput):
    db = database.db
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return same response (avoid email enumeration)
    if user and not user.get("email_verified") and user.get("role") == "business_owner":
        verification_token = secrets.token_urlsafe(32)
        verification_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "email_verification_token": verification_token,
                "email_verification_expires_at": verification_expires
            }}
        )
        verify_link = f"{_frontend_url()}/verify-email?token={verification_token}"
        await send_verification_email(email, user.get("name", "there"), verify_link)
    return {"message": "If that email exists and is unverified, a new verification link has been sent."}


@router.post("/login")
async def login(input: LoginInput, response: Response, request: Request):
    db = database.db
    email = input.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until:
            locked_until_dt = datetime.fromisoformat(locked_until) if isinstance(locked_until, str) else locked_until
            if datetime.now(timezone.utc) < locked_until_dt.replace(tzinfo=timezone.utc) if locked_until_dt.tzinfo is None else locked_until_dt:
                raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user.get("password_hash", "")):
        # Increment attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Block unverified business owners
    if user.get("role") == "business_owner" and not user.get("email_verified", False):
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before signing in. Check your inbox for the verification link."
        )

    # Clear attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})

    user_id = str(user["_id"])
    role = user.get("role", "business_owner")
    access_token = create_access_token(user_id, email, role)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    result = {
        "id": user_id,
        "name": user.get("name", ""),
        "email": email,
        "role": role
    }
    if user.get("business_id"):
        result["business_id"] = str(user["business_id"])
    return result


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(request: Request):
    db = database.db
    user = await get_current_user(request, db)
    return user


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    db = database.db
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"], user.get("role", "business_owner"))
        response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/forgot-password")
async def forgot_password(input: ForgotPasswordInput):
    db = database.db
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        # Invalidate any prior unused tokens for this email
        await db.password_reset_tokens.update_many(
            {"email": email, "used": False},
            {"$set": {"used": True}}
        )
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "email": email,
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        reset_link = f"{_frontend_url()}/reset-password?token={token}"
        await send_password_reset_email(email, user.get("name", "there"), reset_link)
    # Always return same response (avoid email enumeration)
    return {"message": "If that email exists, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(input: ResetPasswordInput):
    db = database.db
    if len(input.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    record = await db.password_reset_tokens.find_one({"token": input.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    expires_at_raw = record["expires_at"]
    expires_at = datetime.fromisoformat(expires_at_raw) if isinstance(expires_at_raw, str) else expires_at_raw
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
    new_hash = hash_password(input.new_password)
    await db.users.update_one({"email": record["email"]}, {"$set": {"password_hash": new_hash}})
    await db.password_reset_tokens.update_one({"token": input.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully. You can now sign in with your new password."}
