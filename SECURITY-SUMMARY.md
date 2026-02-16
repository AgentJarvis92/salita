# Salita OAuth Security Summary

**Audit Date:** Mon Feb 16 2026  
**Auditor:** Jarvis (Security Specialist)  
**Time:** 60 minutes

---

## Status Dashboard

| Category | Status | Notes |
|----------|--------|-------|
| **OAuth Code** | ✅ SECURE | Login, signup, callback all correctly implemented |
| **Security Headers** | ✅ SECURE | CSP allows Google, no CORS/CSRF issues |
| **Authentication Middleware** | ✅ SECURE | Protected routes work, proper auth checks |
| **Callback Protection** | ✅ SECURE | Open-redirect protection in place |
| **Environment Config** | 🚨 CRITICAL | Localhost URL in production environment |
| **Supabase Setup** | ⚠️ VERIFY | Need to confirm OAuth provider + redirect URLs |

---

## What's Secure ✅

1. **OAuth Login Handler** (`app/login/page.tsx`)
   - Validates `NEXT_PUBLIC_SITE_URL` exists
   - Properly constructs callback URL
   - Handles errors gracefully
   - **VERDICT:** ✅ Secure & correct

2. **OAuth Signup Handler** (`app/auth/signup/page.tsx`)
   - Same pattern as login (consistent)
   - Validates environment variable
   - Proper error handling
   - **VERDICT:** ✅ Secure & correct

3. **OAuth Callback Route** (`app/auth/callback/route.ts`)
   - Correctly exchanges authorization code for session
   - Creates user profile automatically
   - Uses dynamic origin (not hardcoded)
   - Prevents open-redirect attacks (allowlist)
   - **VERDICT:** ✅ Secure & correct

4. **Security Headers** (`middleware.ts` + `next.config.ts`)
   - X-Frame-Options: DENY (clickjacking protection)
   - X-Content-Type-Options: nosniff (MIME sniffing protection)
   - X-XSS-Protection: enabled (legacy XSS protection)
   - Referrer-Policy: strict (privacy)
   - CSP allows Google OAuth domains ✅
   - **VERDICT:** ✅ Secure & correct

5. **Authentication Middleware**
   - Protects `/chat` and `/dashboard` routes
   - Redirects unauthenticated users to login
   - **VERDICT:** ✅ Secure & correct

6. **HTTPS Enforcement**
   - Railway auto-redirects HTTP → HTTPS
   - CSP has `upgrade-insecure-requests`
   - **VERDICT:** ✅ Secure & correct

---

## What Needs Fixing 🚨

**CRITICAL ISSUE: Environment Variable**

Local `.env.local` has:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

This is correct for **local development** ✅ but **breaks production** 🚨

**On Railway, it must be overridden with:**
```env
NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app
```

**Impact if not fixed:**
- Google OAuth redirects to `localhost:3000/auth/callback`
- Google servers reject callback (localhost not in production whitelist)
- Users see "Unable to sign in with Google" error
- OAuth authentication fails entirely

**Fix time:** 5 minutes

---

## What to Verify ⚠️

**Supabase Dashboard Checklist:**

1. **Authentication → URL Configuration**
   - [ ] Site URL: `https://salita-production.up.railway.app`
   - [ ] Redirect URLs includes: `https://salita-production.up.railway.app/auth/callback`

2. **Authentication → Providers → Google**
   - [ ] Google OAuth is ENABLED
   - [ ] Client ID is set
   - [ ] Client Secret is set

**Verification time:** 5 minutes

---

## Code Quality Assessment

### What's Done Well ✅

1. **Separation of Concerns**
   - OAuth logic isolated in handlers
   - Middleware handles auth checks
   - Callback route separate from login/signup

2. **Error Handling**
   - User-friendly error messages
   - Graceful fallback if `NEXT_PUBLIC_SITE_URL` missing
   - Supabase errors properly surfaced

3. **Security Best Practices**
   - Environment variables for sensitive config
   - CSP whitelist for third-party scripts
   - Open-redirect protection
   - Protected routes
   - HTTPS enforcement

4. **User Experience**
   - Quick signup flow
   - Email + OAuth options
   - Proper redirects post-auth
   - Clear error messages

### What Could Be Improved (Future)

1. **CSP Hardening**
   - Currently uses `'unsafe-inline'` for scripts
   - Future: Use nonce-based approach or hash-based for better security

2. **Rate Limiting**
   - No rate limit on login attempts
   - Future: Add per-IP rate limiting

3. **Audit Logging**
   - No OAuth attempt logging
   - Future: Log failed logins for security monitoring

4. **Token Refresh**
   - Supabase handles this ✅
   - Current implementation delegates to Supabase (good)

---

## Deployment Readiness

| Criteria | Status | Notes |
|----------|--------|-------|
| Code is secure | ✅ YES | All OAuth handlers reviewed & approved |
| Headers are safe | ✅ YES | CSP/CORS/security headers correct |
| Routes are protected | ✅ YES | Auth middleware enforces login |
| Redirect URLs valid | ✅ YES | Using dynamic origin |
| Open-redirect safe | ✅ YES | Allowlist validation in place |
| Environment config | 🚨 NO | Railway env var not set yet |
| Supabase setup | ⚠️ PENDING | Need to verify in dashboard |

**Deployment Status:** 🟡 **READY PENDING ENV VAR FIX**

---

## Final Recommendation

**✅ SAFE TO DEPLOY** once:

1. Railway environment variable is set: `NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app`
2. Supabase OAuth provider is enabled with correct redirect URLs
3. Quick smoke test of Google login on staging

**No code changes needed.** Implementation is already secure and correct.

---

**Audit Completed:** Mon Feb 16 14:54 EST 2026  
**Next Step:** Norbert to fix environment variable + verify Supabase config
