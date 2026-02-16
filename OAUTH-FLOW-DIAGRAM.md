# SALITA OAuth 2.0 Flow Diagram

## Secure OAuth Flow (As Implemented)

```
┌─────────────────────────────────────────────────────────────────┐
│                         SALITA USER                              │
│                    (Browser/Client-Side)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Click "Continue with Google"
                              │
                    ┌─────────▼─────────┐
                    │  handleGoogleLogin │
                    │   supabase.auth    │
                    │ .signInWithOAuth   │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         │ 2. Redirect to Google OAuth Consent     │
         │    with state parameter (CSRF token)    │
         │                                         │
         ▼                                         ▼
    ┌──────────────────────────────────────────────────┐
    │         GOOGLE OAUTH SERVER                       │
    │  ✅ Verifies state parameter (CSRF protected)    │
    │  ✅ Verifies redirect_uri is whitelisted         │
    │  ✅ Generates authorization code                 │
    └──────────────────────────────────────────────────┘
         │
         │ 3. Redirect back to:
         │    /auth/callback?code=AUTH_CODE&state=STATE
         │
         ▼
    ┌──────────────────────────────────────────────────┐
    │        SALITA /auth/callback Route               │
    │        (SERVER-SIDE, Next.js API Route)          │
    │  ✅ Validates state parameter                    │
    │  ✅ Exchanges code for session (server-to-server)│
    │  ✅ Code never visible to client                 │
    │  ✅ Session tokens stored in httpOnly cookies    │
    │  ✅ Creates/updates user profile                 │
    └──────────────────────────────────────────────────┘
         │
         │ 4. Redirect to /dashboard
         │    with secure httpOnly session cookie
         │
         ▼
    ┌──────────────────────────────────────────────────┐
    │      SALITA DASHBOARD / PROTECTED ROUTES         │
    │  ✅ Middleware validates session on each request │
    │  ✅ Session token in secure httpOnly cookie      │
    │  ✅ Token refresh happens automatically          │
    │  ✅ Logout invalidates session                   │
    └──────────────────────────────────────────────────┘
```

---

## Vulnerability Points Identified

### 🟢 SECURE (No vulnerabilities found)

```
1. Authorization Code Exchange
   ┌─────────────────────────────────┐
   │ Auth Code + Client Secret       │
   │ (exchanged server-to-server)    │
   │ ✅ Code never stored in storage │
   │ ✅ Code never shown to user     │
   └─────────────────────────────────┘

2. Session Token Storage
   ┌─────────────────────────────────┐
   │ httpOnly Cookies                │
   │ ✅ Inaccessible from JavaScript │
   │ ✅ Protected from XSS theft     │
   │ ✅ Sent automatically with reqs │
   └─────────────────────────────────┘

3. CSRF Protection
   ┌─────────────────────────────────┐
   │ State Parameter (Supabase)      │
   │ ✅ Cryptographically random     │
   │ ✅ Validated on callback        │
   │ ✅ Prevents CSRF attacks        │
   └─────────────────────────────────┘
```

### 🟠 HIGH RISK (Vulnerabilities found)

```
1. Redirect URI Configuration
   ┌──────────────────────────────────────────┐
   │ redirectTo: ${NEXT_PUBLIC_SITE_URL}      │
   │            || window.location.origin     │
   │                                          │
   │ ⚠️ ISSUE: Fallback to window.location   │
   │           origin if env var missing      │
   │                                          │
   │ ATTACK SCENARIO:                         │
   │ 1. Attacker hosts: http://evil.com      │
   │ 2. User visits: http://evil.com/login   │
   │ 3. Google redirects to: evil.com/callback│
   │ 4. Attacker intercepts: auth code + session
   │                                          │
   │ 🔧 FIX: Fail if env var not set         │
   │    if (!process.env.NEXT_PUBLIC_SITE_URL)│
   │      throw new Error('Must configure')   │
   └──────────────────────────────────────────┘
```

```
2. Missing Security Headers
   ┌──────────────────────────────────────────┐
   │ Headers NOT Present:                     │
   │ ❌ Content-Security-Policy               │
   │ ❌ X-Frame-Options                       │
   │ ❌ X-Content-Type-Options                │
   │ ❌ Strict-Transport-Security (HSTS)     │
   │ ❌ X-XSS-Protection                      │
   │ ❌ Referrer-Policy                       │
   │                                          │
   │ ATTACK SCENARIOS:                        │
   │ • Clickjacking (inject in iframe)        │
   │ • XSS (inject malicious scripts)         │
   │ • MIME-sniffing (upload as CSS/JS)       │
   │                                          │
   │ 🔧 FIX: Add headers in next.config.ts   │
   └──────────────────────────────────────────┘
```

```
3. Error Message Information Disclosure
   ┌──────────────────────────────────────────┐
   │ Current: Displays raw auth errors        │
   │                                          │
   │ EXAMPLES:                                │
   │ ✗ "Invalid email format"                 │
   │ ✗ "User not found"                       │
   │ ✗ "Invalid login credentials"            │
   │                                          │
   │ ATTACK (Account Enumeration):            │
   │ 1. Try email: attacker@gmail.com         │
   │    → "User not found"                    │
   │ 2. Try email: user@company.com           │
   │    → "Invalid login credentials"         │
   │ Result: Attacker knows which emails exist│
   │                                          │
   │ 🔧 FIX: Use generic messages for auth   │
   │    "Email or password is incorrect"      │
   └──────────────────────────────────────────┘
```

### 🟡 MEDIUM RISK (Best practices)

```
1. Missing Form Attributes
   ┌──────────────────────────────────────────┐
   │ <input type="password">                  │
   │        missing autocomplete="current-..."│
   │                                          │
   │ IMPACT:                                  │
   │ • Password managers can't auto-fill     │
   │ • Degrades user experience              │
   │ • Users might reuse weak passwords      │
   │                                          │
   │ 🔧 FIX: Add autocomplete attributes     │
   │    email: autocomplete="email"          │
   │    password: autocomplete="current-pass"│
   └──────────────────────────────────────────┘

2. No Client-Side Input Validation
   ┌──────────────────────────────────────────┐
   │ • Email field accepts any input         │
   │ • Password field accepts any input      │
   │ • No minimum length enforcement         │
   │ • No password strength requirements     │
   │                                          │
   │ 🔧 FIX: Add Zod schema validation      │
   │    - Email validation                   │
   │    - Password min 8 chars               │
   │    - Uppercase, number, special chars   │
   └──────────────────────────────────────────┘
```

---

## Attack Prevention Matrix

```
Attack Type          | Defense Mechanism           | Status
─────────────────────┼─────────────────────────────┼────────
CSRF                 | State parameter (Supabase)  | ✅ PASS
Clickjacking         | X-Frame-Options header      | ❌ FAIL
XSS (Script inject)  | Content-Security-Policy     | ❌ FAIL
MIME sniffing        | X-Content-Type-Options      | ❌ FAIL
Code interception    | Server-side exchange        | ✅ PASS
Token theft (XSS)    | httpOnly cookies            | ✅ PASS
Session fixation     | New session on auth         | ✅ PASS
Account enumeration  | Generic error messages      | ❌ FAIL
Open redirect        | Env var validation          | ⚠️ WARN
Weak passwords       | Client validation + policy  | ❌ FAIL
MITM (TLS)           | HTTPS + HSTS headers        | ⚠️ DEV ONLY
Concurrent sessions  | Auth state listener         | ✅ PASS
Logout validation    | Session invalidation        | ✅ PASS
Token refresh        | Automatic (Supabase)        | ✅ PASS
```

---

## Detailed OAuth Parameter Analysis

### Secure Parameters ✅

```
State Parameter:
  ├─ Generated: Randomly by Supabase
  ├─ Length: 32+ characters
  ├─ Validation: Checked on callback
  ├─ Storage: In secure storage
  └─ Result: CSRF attacks prevented

Code Parameter:
  ├─ Lifetime: ~10 minutes
  ├─ Used: Only once (exchange for token)
  ├─ Visibility: Only in URL redirect
  ├─ Exchange: Server-to-server (secure)
  └─ Result: Authorization code interception ineffective
```

### Risky Configurations ⚠️

```
Redirect URI (Current):
  URL: ${NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback
  ├─ Hardcoded part: ✅ /auth/callback (secure)
  ├─ Env var: ✅ NEXT_PUBLIC_SITE_URL (if set)
  └─ Fallback: ❌ window.location.origin (RISK!)
  
  Why fallback is risky:
  • If env var not configured
  • Attacker can set window.location.origin
  • Code is sent to attacker's domain
  • Session tokens compromised
  
  Example Attack:
  1. User on: http://attacker.com/login
  2. Clicks Google OAuth
  3. Google redirects to: http://attacker.com/auth/callback
  4. Attacker's code intercepts: auth code + tokens
  5. Full account compromise possible
```

---

## Session Token Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│ SECURE TOKEN LIFECYCLE (httpOnly Cookies)                    │
└──────────────────────────────────────────────────────────────┘

1. GENERATION (After OAuth callback)
   ├─ Access Token generated
   │  ├─ Lifespan: 1 hour
   │  ├─ Storage: httpOnly cookie
   │  └─ Usage: API authentication
   │
   ├─ Refresh Token generated
   │  ├─ Lifespan: 7 days
   │  ├─ Storage: httpOnly cookie
   │  └─ Usage: Get new access token
   │
   └─ Session Cookie created
      ├─ Storage: httpOnly
      ├─ Path: /
      └─ SameSite: Lax (needs verification)

2. TRANSMISSION (With each request)
   ├─ Browser automatically sends httpOnly cookies
   ├─ JavaScript cannot access cookies
   ├─ Cookies not shown in document.cookie
   ├─ CSRF tokens sent automatically
   └─ No manual bearer token handling needed

3. REFRESH (Automatic via Middleware)
   ├─ Middleware checks: supabase.auth.getUser()
   ├─ If token expired: Refresh token used
   ├─ New access token obtained
   ├─ Cookie updated with new token
   └─ User doesn't notice refresh

4. INVALIDATION (On logout)
   ├─ Session deleted on server
   ├─ Cookies cleared
   ├─ New login required
   ├─ Other tabs notified (via listener)
   └─ Full session termination

✅ SECURITY BENEFITS:
   • XSS: Can't access tokens (httpOnly)
   • CSRF: State parameter + SameSite
   • Man-in-the-middle: HTTPS required
   • Token theft: Secure storage
   • Replay: Tokens have expiration
```

---

## Recommendations Summary

```
IMMEDIATE (Do first):
  [ ] Add X-Frame-Options header (5 min)
  [ ] Add CSP header (15 min)
  [ ] Fix error messages (15 min)
  [ ] Fix redirect URI open redirect (5 min)
  Total: 40 minutes

SHORT TERM (This sprint):
  [ ] Add client input validation (30 min)
  [ ] Add autocomplete attributes (5 min)
  [ ] Add remaining security headers (10 min)
  [ ] Test multi-tab session sync (30 min)
  Total: 75 minutes

BEFORE PRODUCTION:
  [ ] Add HSTS header (production only)
  [ ] Verify cookie flags (Secure, SameSite)
  [ ] Security audit of entire auth flow
  [ ] Load testing with multiple concurrent users
  [ ] Penetration test OAuth implementation
  Total: 4-8 hours

ONGOING:
  [ ] Monitor security headers
  [ ] Log and alert on auth failures
  [ ] Regular security updates
  [ ] Quarterly security audits
```

---

**Diagram Created By:** Cipher Security QA  
**Diagram Status:** COMPLETE  
**Last Updated:** 2026-02-16 14:55 EST
