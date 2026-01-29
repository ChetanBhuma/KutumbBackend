# 🔒 Security Configuration Guide

## ⚠️ CRITICAL: JWT Secrets

### Current Status
**❌ INSECURE** - Weak JWT secret detected in `.env`:
```
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### Required Actions

#### 1. Generate Strong Secrets
```bash
# Generate JWT_SECRET (64 bytes)
openssl rand -base64 64

# Generate JWT_REFRESH_SECRET (64 bytes) 
openssl rand -base64 64
```

#### 2. Update .env
```.env
# JWT Configuration - REPLACE WITH GENERATED SECRETS
JWT_SECRET="<paste-generated-secret-here>"
JWT_REFRESH_SECRET="<paste-different-generated-secret-here>"
JWT_EXPIRES_IN="30m"  # Access token: 30 minutes
JWT_REFRESH_EXPIRES_IN="7d"  # Refresh token: 7 days
JWT_ISSUER="delhi-police-portal"
JWT_AUDIENCE="delhi-police-api"
```

#### 3. Environment-Specific Secrets
- **Development**: Use generated secrets, store in `.env` (not committed)
- **Staging**: Different secrets, store in secure vault
- **Production**: Different secrets, use environment variables or secrets manager (AWS Secrets Manager, HashiCorp Vault)

### Security Checklist
- [ ] JWT secrets are at least 256 bits (32 bytes)
- [ ] Access and refresh secrets are DIFFERENT
- [ ] Secrets are NOT committed to git
- [ ] Production secrets stored in secrets manager
- [ ] Secrets rotated every 90 days
- [ ] Old tokens invalidated after rotation

---

## 🔄 Refresh Token Rotation (Issue #7)

### Status
**✅ PARTIALLY IMPLEMENTED** - Tokens are refreshed but old ones not invalidated

### Implementation
Already updated in `citizenAuthService.ts:600-609`:
- Generates new refresh token
- Updates database
- ⚠️ **TODO**: Add previous token tracking for grace period

### Recommended Enhancement
```typescript
// Add to CitizenAuth schema
model CitizenAuth {
  // ... existing fields
  previousRefreshToken String?
  refreshTokenRotatedAt DateTime?
}
```

---

## 🛡️ CSRF Protection (Issue #8)

### Status
**❌ NOT IMPLEMENTED**

### Installation Required
```bash
cd backend
npm install csurf cookie-parser
npm install --save-dev @types/csurf @types/cookie-parser
```

### Implementation
```typescript
// backend/src/app.ts
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// Add after body parsers
app.use(cookieParser());

// CSRF protection (skip for certain routes)
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Apply to state-changing routes only
app.use('/api/v1', csrfProtection);

// Provide CSRF token endpoint
app.get('/api/v1/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
```

### Frontend Integration
```typescript
// Fetch CSRF token on app load
const response = await fetch('/api/v1/csrf-token');
const { csrfToken } = await response.json();

// Include in all state-changing requests
fetch('/api/v1/citizens', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
});
```

---

## 📱 Mobile Number Normalization (High Priority)

### Issue
Both `+919999999999` and `9999999999` accepted, causing:
- Duplicate accounts
- Login failures  
- OTP delivery issues

### Solution
```typescript
// backend/src/utils/phoneUtils.ts
export const normalizeMobile = (mobile: string): string => {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    
    // Validate length
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    
    if (digits.length === 12 && digits.startsWith('91')) {
        return `+${digits}`;
    }
    
    throw new Error(`Invalid mobile number: ${mobile}. Must be 10 digits or +91XXXXXXXXXX`);
};

// Apply to ALL mobile number inputs
const mobileNumber = normalizeMobile(req.body.mobileNumber);
```

### Migration Required
```sql
-- Normalize existing mobile numbers
UPDATE "CitizenAuth"
SET "mobileNumber" = '+91' || "mobileNumber"
WHERE "mobileNumber" ~ '^\d{10}$';
```

---

## 🔐 Additional Security Enhancements

### 1. Audit Logging
```typescript
// Log all security events
auditLogger.warn('Failed login attempt', {
    mobileNumber,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    attempts: auth.loginAttempts + 1,
    timestamp: new Date()
});
```

### 2. Session Timeout (Client-side)
```typescript
// frontend/lib/sessionManager.ts
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

let lastActivity = Date.now();

// Update on user activity
document.addEventListener('click', () => {
    lastActivity = Date.now();
});

// Check periodically
setInterval(() => {
    if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
        router.push('/login?reason=timeout');
    }
}, 60000); // Check every minute
```

### 3. Password Complexity
✅ **ALREADY IMPLEMENTED** in `citizenAuthRoutes.ts:59`
```regex
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
```

---

## ✅ Completed Fixes Summary

| Issue | Status | Files Modified |
|-------|--------|----------------|
| #1: OTP in API Response | ✅ FIXED | `citizenAuthController.ts` |
| #2: Token in Query Params | ✅ FIXED | `authenticate.ts` |
| #3: Missing Rate Limiters | ✅ FIXED | `citizenAuthRoutes.ts` |
| #4: Password Validation | ✅ VERIFIED | `citizenAuthRoutes.ts` |
| #5: OTP Brute Force | ✅ FIXED | `citizenAuthService.ts`, `schema.prisma` |
| #6: Weak JWT Secrets | 📝 DOCUMENTED | This guide |
| #7: Token Rotation | ⚠️ PARTIAL | Needs enhancement |
| #8: CSRF Protection | 📝 DOCUMENTED | Implementation guide provided |

---

## 🚀 Deployment Checklist

### Before Production
- [ ] Rotate all JWT secrets
- [ ] Implement CSRF protection
- [ ] Normalize existing mobile numbers
- [ ] Enable comprehensive audit logging
- [ ] Configure session timeout
- [ ] Test all security fixes
- [ ] Run security scan (OWASP ZAP, Burp Suite)
- [ ] Conduct penetration testing

### Ongoing
- [ ] Monitor failed login attempts
- [ ] Review audit logs weekly
- [ ] Rotate JWT secrets quarterly
- [ ] Update dependencies monthly
- [ ] Security training for developers

---

## 📞 Support

For security concerns, contact:
- Security Team: security@yourorg.com
- Emergency: security-emergency@yourorg.com
