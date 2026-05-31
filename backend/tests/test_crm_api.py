"""
CRM API Backend Tests - Auth, Leads, Admin, Appointments, Analytics
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_EMAIL = "admin@leadverify.ai"
ADMIN_PASSWORD = "Admin@12345"
TEST_OWNER_EMAIL = "TEST_owner_abc123@example.com"
TEST_OWNER_PASSWORD = "Test@1234"
TEST_BUSINESS_NAME = "TEST Business ABC"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_session(session):
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return session


@pytest.fixture(scope="module")
def owner_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Register
    resp = s.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test Owner",
        "email": TEST_OWNER_EMAIL,
        "password": TEST_OWNER_PASSWORD,
        "business_name": TEST_BUSINESS_NAME
    })
    if resp.status_code == 400 and "already registered" in resp.text:
        # Login instead
        resp = s.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_OWNER_EMAIL, "password": TEST_OWNER_PASSWORD})
    assert resp.status_code == 200, f"Owner auth failed: {resp.text}"
    return s


# --- Auth Tests ---
class TestAuth:
    """Auth endpoint tests"""

    def test_api_root(self):
        resp = requests.get(f"{BASE_URL}/api")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "running"
        print("API root OK")

    def test_login_admin_success(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "super_admin"
        assert data["email"] == ADMIN_EMAIL
        assert "access_token" not in data  # cookie-based auth
        print(f"Admin login OK: {data['email']}")

    def test_login_invalid_credentials(self):
        s = requests.Session()
        resp = s.post(f"{BASE_URL}/api/auth/login", json={"email": "bad@test.com", "password": "wrongpass"})
        assert resp.status_code == 401
        print("Invalid login 401 OK")

    def test_get_me_admin(self, admin_session):
        resp = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "super_admin"
        print(f"GET /api/auth/me OK: {data['role']}")

    def test_register_business_owner(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "business_owner"
        assert "business_id" in data
        print(f"Business owner registered OK, business_id: {data.get('business_id')}")


# --- Admin Tests ---
class TestAdmin:
    """Admin endpoint tests"""

    def test_get_businesses(self, admin_session):
        resp = admin_session.get(f"{BASE_URL}/api/admin/businesses")
        assert resp.status_code == 200
        data = resp.json()
        # Paginated response
        businesses = data.get("businesses") if isinstance(data, dict) else data
        assert businesses is not None
        print(f"Admin businesses: {len(businesses)} items")

    def test_get_admin_analytics(self, admin_session):
        resp = admin_session.get(f"{BASE_URL}/api/admin/analytics")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        print(f"Admin analytics keys: {list(data.keys())}")

    def test_admin_leads(self, admin_session):
        resp = admin_session.get(f"{BASE_URL}/api/admin/leads")
        assert resp.status_code == 200
        print("Admin leads OK")

    def test_unauthorized_admin_access(self):
        s = requests.Session()
        resp = s.get(f"{BASE_URL}/api/admin/businesses")
        assert resp.status_code in [401, 403]
        print("Unauthorized admin access blocked OK")


# --- Leads Tests ---
class TestLeads:
    """Leads CRUD tests"""

    created_lead_id = None

    def test_create_lead(self, owner_session):
        resp = owner_session.post(f"{BASE_URL}/api/leads/", json={
            "name": "TEST Lead John",
            "email": "TEST_lead@example.com",
            "phone": "+11234567890",
            "source": "manual",
            "status": "new"
        })
        assert resp.status_code in [200, 201], f"Create lead failed: {resp.text}"
        data = resp.json()
        assert "id" in data
        TestLeads.created_lead_id = data["id"]
        print(f"Lead created: {data['id']}")

    def test_get_leads(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/leads/")
        assert resp.status_code == 200
        data = resp.json()
        # Paginated response
        leads = data.get("leads") if isinstance(data, dict) else data
        assert leads is not None
        print(f"Leads list: {len(leads)} items")

    def test_get_lead_by_id(self, owner_session):
        if not TestLeads.created_lead_id:
            pytest.skip("No lead created")
        resp = owner_session.get(f"{BASE_URL}/api/leads/{TestLeads.created_lead_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == TestLeads.created_lead_id
        print(f"Get lead by ID OK")

    def test_update_lead(self, owner_session):
        if not TestLeads.created_lead_id:
            pytest.skip("No lead created")
        resp = owner_session.put(f"{BASE_URL}/api/leads/{TestLeads.created_lead_id}", json={"status": "contacted"})
        assert resp.status_code == 200
        print(f"Update lead OK")

    def test_delete_lead(self, owner_session):
        if not TestLeads.created_lead_id:
            pytest.skip("No lead created")
        resp = owner_session.delete(f"{BASE_URL}/api/leads/{TestLeads.created_lead_id}")
        assert resp.status_code in [200, 204]
        print(f"Delete lead OK")


# --- Appointments Tests ---
class TestAppointments:
    """Appointments endpoint tests"""

    def test_get_appointments(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/appointments/")
        assert resp.status_code == 200
        print(f"Appointments OK")

    def test_create_appointment(self, owner_session):
        resp = owner_session.post(f"{BASE_URL}/api/appointments/", json={
            "customer_name": "TEST Appt Lead",
            "customer_phone": "+11234567890",
            "date": "2026-03-01",
            "time": "10:00",
            "service": "Consultation",
            "notes": "Test appointment"
        })
        assert resp.status_code in [200, 201], f"Create appointment failed: {resp.text}"
        print("Create appointment OK")


# --- Analytics Tests ---
class TestAnalytics:
    """Analytics endpoint tests"""

    def test_get_analytics(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/analytics/")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        print(f"Analytics keys: {list(data.keys())}")


# --- Conversations Tests ---
class TestConversations:
    """Conversations endpoint tests"""

    def test_get_conversations(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/conversations/")
        assert resp.status_code == 200
        print("Conversations OK")


# --- Settings Tests ---
class TestSettings:
    """Settings endpoint tests"""

    def test_get_settings(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/settings/")
        assert resp.status_code == 200
        print("Settings OK")


# --- Integrations Tests ---
class TestIntegrations:
    """Integrations endpoint tests"""

    def test_get_integrations(self, owner_session):
        resp = owner_session.get(f"{BASE_URL}/api/integrations/")
        assert resp.status_code == 200
        print("Integrations OK")
