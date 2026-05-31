from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime, timezone

import database
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from routers.leads import router as leads_router
from routers.conversations import router as conversations_router
from routers.appointments import router as appointments_router
from routers.analytics import router as analytics_router
from routers.chatbot import router as chatbot_router
from routers.billing import router as billing_router
from routers.settings import router as settings_router
from routers.notifications import router as notifications_router
from routers.integrations import router as integrations_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MongoDB
mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
_db = _client[os.environ['DB_NAME']]
database.client = _client
database.db = _db

app = FastAPI(title="AI Lead Verification CRM API", version="1.0.0")

# CORS
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
cors_origins_raw = os.environ.get('CORS_ORIGINS', frontend_url)
cors_origins = [u.strip() for u in cors_origins_raw.split(',') if u.strip() and u.strip() != '*']
if not cors_origins:
    cors_origins = [frontend_url, 'http://localhost:3000']

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(leads_router, prefix="/api/leads", tags=["Leads"])
app.include_router(conversations_router, prefix="/api/conversations", tags=["Conversations"])
app.include_router(appointments_router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(billing_router, prefix="/api/billing", tags=["Billing"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(integrations_router, prefix="/api/integrations", tags=["Integrations"])


@app.get("/api")
async def root():
    return {"message": "AI Lead Verification CRM", "status": "running"}


@app.on_event("startup")
async def startup_event():
    from utils.auth_utils import hash_password, verify_password

    # Create indexes
    await _db.users.create_index("email", unique=True)
    try:
        await _db.businesses.create_index("api_key", unique=True, sparse=True)
    except Exception:
        pass
    await _db.leads.create_index([("business_id", 1), ("created_at", -1)])
    await _db.login_attempts.create_index("identifier")
    try:
        await _db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        pass

    # Seed super admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@leadverify.ai")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    existing = await _db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await _db.users.insert_one({
            "name": "Super Admin",
            "email": admin_email,
            "password_hash": hashed,
            "role": "super_admin",
            "business_id": None,
            "email_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Super admin created: {admin_email}")
    else:
        update_set = {}
        if not verify_password(admin_password, existing.get("password_hash", "")):
            update_set["password_hash"] = hash_password(admin_password)
        if not existing.get("email_verified"):
            update_set["email_verified"] = True
        if update_set:
            await _db.users.update_one({"email": admin_email}, {"$set": update_set})

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Super Admin (pre-seeded, email auto-verified)
- Email: {admin_email}
- Password: {admin_password}
- Role: super_admin
- Login redirect: /admin/dashboard

## Business Owner (must verify email before login)
- Register at: POST /api/auth/register (fields: name, email, password, business_name)
- After register → redirected to /verify-email-sent
- Verification link: /verify-email?token={{token}} (24h expiry)
- Login blocked with 403 until email verified

### Quickly verify a freshly-registered user during testing
```
db.users.updateOne({{email: 'x@y.com'}}, {{$set: {{email_verified: true}}}})
```

## Resend Email Sandbox Note (IMPORTANT)
With the default sender `onboarding@resend.dev`, Resend **only delivers** to the
Resend account owner's verified address. For all other recipients the backend
logs a `[FALLBACK]` line with the link so dev/test can complete the flow. To
send to arbitrary recipients, verify a domain at https://resend.com/domains and
update `SENDER_EMAIL` in `/app/backend/.env`.

## Key Auth Endpoints
- POST /api/auth/register            → no auto-login, sends verification email
- POST /api/auth/verify-email        → {{token}}
- POST /api/auth/resend-verification → {{email}}
- POST /api/auth/forgot-password     → {{email}} (always returns generic message)
- POST /api/auth/reset-password      → {{token, new_password}} (1h token, single-use)
- POST /api/auth/login               → blocks unverified business owners with 403
- POST /api/auth/logout
- GET  /api/auth/me

## Frontend Auth Routes
- /login, /register
- /verify-email-sent, /verify-email?token=...
- /forgot-password, /reset-password?token=...
""")

    logger.info("CRM API startup complete")


@app.on_event("shutdown")
async def shutdown_db_client():
    _client.close()
