# Auth Testing Playbook

## Admin Credentials
- Email: admin@leadverify.ai
- Password: Admin@12345
- Role: super_admin

## Testing Steps

### 1. Login Test
```bash
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leadverify.ai","password":"Admin@12345"}'
```

### 2. Verify Token
```bash
curl -b cookies.txt http://localhost:8001/api/auth/me
```

### 3. Register Business Owner
```bash
curl -c biz_cookies.txt -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","email":"john@test.com","password":"Test@1234","business_name":"Test Business"}'
```

### 4. Test Leads (as business owner)
```bash
curl -b biz_cookies.txt -X POST http://localhost:8001/api/leads/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","phone":"+1234567890","service":"Consultation","source":"manual"}'
```
