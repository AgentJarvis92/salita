# 🔐 Cipher Security Report — Salita
**Audited by:** Cipher (Security QA Agent)  
**Date:** 2026-02-17  
**Target:** https://salita-production.up.railway.app  
**Scope:** HTTP Security Headers, HTTPS Enforcement, Auth Security, Redirect Validation, Cookie Security, Sensitive Data Leakage

---

## Executive Summary

Salita has a **solid security baseline** (good headers, HTTPS redirect, auth protection on most APIs), but has **two HIGH severity issues** that require immediate action: an **unauthenticated speech API** that can drain OpenAI billing, and an **auth callback that redirects to localhost** which breaks the email confirmation flow.

**Security Grade: B**

---

## Test Results

| # | Check | Status | Severity | Details |
|---|-------|--------|----------|---------|
| 1.1 | Content-Security-Policy present | ✅ PASS | — | Set via middleware + next.config.ts |
| 1.2 | CSP quality (no unsafe directives) | ⚠️ PARTIAL | MEDIUM | `unsafe-inline` in script-src and style-src; Google OAuth domains still in CSP despite OAuth removal |
| 1.3 | X-Frame-Options: DENY | ✅ PASS | — | `x-frame-options: DENY` confirmed |
| 1.4 | X-Content-Type-Options: nosniff | ✅ PASS | — | `x-content-type-options: nosniff` confirmed |
| 1.5 | Referrer-Policy | ✅ PASS | — | `strict-origin-when-cross-origin` confirmed |
| 1.6 | Strict-Transport-Security (HSTS) | ❌ FAIL | MEDIUM | HSTS header absent from all responses. Supabase itself has it, but the app does not. |
| 2.1 | HTTP → HTTPS redirect | ✅ PASS | — | `HTTP/1.1 301 Moved Permanently` to HTTPS |
| 3.1 | Weak password rejection | ✅ PASS | — | Zod schema enforces min 8 chars + uppercase + number. `"123"` would be rejected client-side |
| 3.2 | Invalid email rejection | ✅ PASS | — | Zod email validation rejects invalid format client-side |
| 3.3 | Login error — no account enumeration | ✅ PASS | — | Login returns generic: "Email or password is incorrect" |
| 3.4 | Signup error — no account enumeration | ❌ FAIL | MEDIUM | Signup leaks: "This email is already registered. Please sign in instead." — attackers can enumerate registered emails |
| 4.1 | Open redirect via `?next=` | ✅ PASS | — | `next` param ignored; code uses `redirect_to`. Tested: evil.com and javascript:alert(1) both safely fall through to `/dashboard` |
| 4.2 | Open redirect via `?redirect_to=` | ✅ PASS | — | Allowlist validation in callback route; `https://evil.com` correctly rejected, defaults to `/dashboard` |
| 4.3 | Auth callback redirect destination | ❌ FAIL | HIGH | `/auth/callback` redirects to `https://localhost:8080/dashboard` (internal Railway port). `requestUrl.origin` resolves to localhost inside Railway's container. Email confirmation links will FAIL for real users. |
| 5.1 | Cookie: HttpOnly | ✅ PASS | — | Supabase SSR sets `HttpOnly` on auth cookies |
| 5.2 | Cookie: Secure | ✅ PASS | — | `Secure` flag confirmed on Supabase-managed cookies |
| 5.3 | Cookie: SameSite | ✅ PASS | — | `SameSite=None` set (required for Supabase cross-origin auth flow) |
| 6.1 | /api/test-ai — no key leakage | ✅ PASS | — | Route returns 404 (doesn't exist); no key exposure |
| 6.2 | /api/chat — unauthenticated access | ✅ PASS | — | Returns `{"error":"Unauthorized"}` with no valid session |
| 6.3 | /api/speech/synthesize — auth required | ❌ FAIL | **HIGH** | **NO AUTHENTICATION.** Returns `200 audio/mpeg` with any POST. Attackers can call OpenAI TTS API at the owner's expense. No rate limiting on this endpoint. |
| 6.4 | /api/speech/transcribe — auth required | ❌ FAIL | **HIGH** | **NO AUTHENTICATION.** Endpoint accepts audio and calls OpenAI Whisper. Unauthenticated. Returns 500 on bad input but is callable without session. |
| 6.5 | Server version leakage | ⚠️ PARTIAL | LOW | `x-powered-by: Next.js` and `server: railway-edge` exposed in all responses. Not critical but unnecessary. |

---

## Critical Findings

### 🔴 CRITICAL-1: Unauthenticated Speech API (HIGH)

**Files:** `app/api/speech/synthesize/route.ts`, `app/api/speech/transcribe/route.ts`

**What:** Both speech endpoints have zero authentication checks. Anyone — including anonymous internet users — can call them.

**Command used:**
```bash
# Synthesize returns HTTP 200 + audio/mpeg with no session:
curl -X POST https://salita-production.up.railway.app/api/speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}' 
# → HTTP 200, audio/mpeg, 11040 bytes

# Chat (correctly protected) returns 401:
curl -X POST https://salita-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' 
# → {"error":"Unauthorized"}
```

**Impact:** 
- OpenAI TTS (`tts-1`) billed per character — no auth means unlimited free TTS for anyone
- Whisper transcription billed per minute — no auth means unlimited free transcription
- MAX_TEXT_LENGTH is 4096 but no rate limiting, no auth = uncapped abuse
- Potential for complete OpenAI quota exhaustion / financial damage

**Fix:**
```typescript
// At top of both route.ts files, add:
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}
```

---

### 🟠 HIGH-2: Auth Callback Redirects to localhost:8080 (HIGH)

**File:** `app/auth/callback/route.ts`

**What:** The callback route uses `requestUrl.origin` to construct the redirect URL. Inside Railway, Next.js sees the internal URL (`http://localhost:8080`), not the public URL.

**Command used:**
```bash
curl -I "https://salita-production.up.railway.app/auth/callback?code=test"
# → Location: https://localhost:8080/dashboard  ← WRONG
```

**Impact:** Email confirmation links (sent by Supabase during signup) resolve the callback, then redirect to `localhost:8080/dashboard` — which is unreachable from a user's browser. **New user email verification is likely broken in production.**

**Fix:**
```typescript
// In route.ts, use explicit origin instead of requestUrl.origin:
const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
return NextResponse.redirect(new URL('/dashboard', productionUrl))
```
Set `NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app` in Railway env vars.

---

### 🟡 MEDIUM-3: Account Enumeration via Signup (MEDIUM)

**File:** `app/auth/signup/page.tsx`

**What:** Signup error handler distinguishes "already registered" from other errors:
```javascript
if (signupError.message.includes('already registered')) {
  setError('This email is already registered. Please sign in instead.')
}
```

**Impact:** Attackers can enumerate registered user emails by submitting signup attempts. This is a user privacy violation.

**Fix:** Use a generic message regardless:
```javascript
setError('Unable to create account. Please try again.')
// Or: "If this email is new, check your inbox for a confirmation link."
```

---

### 🟡 MEDIUM-4: HSTS Not Set (MEDIUM)

**What:** `Strict-Transport-Security` header is completely absent from all Salita responses.

**Command:**
```bash
curl -I https://salita-production.up.railway.app/login
# (no Strict-Transport-Security header)
```

**Impact:** Browsers won't pin HTTPS; users on mixed-network environments could be silently downgraded via MITM.

**Fix — add to middleware.ts:**
```typescript
response.headers.set(
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains'
)
```

---

### 🟡 MEDIUM-5: CSP Contains Removed Google OAuth References (MEDIUM)

**What:** Even though Google OAuth was permanently removed, the CSP still allows:
- `script-src: https://accounts.google.com` 
- `connect-src: https://accounts.google.com`
- `frame-src: https://accounts.google.com`

**Impact:** Unnecessarily expands the XSS execution surface. If Google's CDN were compromised (or if an attacker found an XSS via a Google-hosted script), the current CSP would permit it.

**Fix — remove Google OAuth entries from middleware.ts and next.config.ts:**
```typescript
// Remove these lines:
"script-src 'self' 'unsafe-inline' https://accounts.google.com",  // remove accounts.google.com
"connect-src 'self' https://wbcfrfpndsczqtuilfsl.supabase.co https://accounts.google.com",  // remove accounts.google.com  
"frame-src https://accounts.google.com",  // remove entirely
```

---

### 🔵 LOW-6: x-powered-by Header Leaks Framework (LOW)

**What:** `x-powered-by: Next.js` exposed in all responses.

**Fix — in next.config.ts:**
```typescript
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // ... rest of config
}
```

---

## Summary by Area

| Area | Grade | Notes |
|------|-------|-------|
| HTTP Security Headers | B+ | All major headers present; missing HSTS; CSP has `unsafe-inline` |
| HTTPS Enforcement | A | Clean 301 redirect from HTTP → HTTPS |
| Auth Security | B | Good login messages; signup enumeration bug; validation is client-side only |
| Redirect Validation | B | Open redirect logic is correct; but callback broken (localhost:8080) |
| Cookie Security | A- | Supabase SSR cookies properly flagged (HttpOnly, Secure, SameSite) |
| API Auth Coverage | C | /api/chat protected ✅; /api/speech/* NOT protected ❌ |
| Data Leakage | B | No API key exposure; minor framework header leak |

---

## Priority Action Items

| Priority | Action | Effort |
|----------|--------|--------|
| 🔴 P0 — Do Now | Add auth check to `/api/speech/synthesize` and `/api/speech/transcribe` | 10 min |
| 🔴 P0 — Do Now | Fix auth callback localhost redirect (set `NEXT_PUBLIC_SITE_URL`) | 5 min |
| 🟡 P1 — This Sprint | Add HSTS header to middleware.ts | 2 min |
| 🟡 P1 — This Sprint | Fix signup account enumeration (generic error message) | 2 min |
| 🟡 P1 — This Sprint | Remove Google OAuth references from CSP | 5 min |
| 🔵 P2 — Nice to Have | Set `poweredByHeader: false` in next.config.ts | 1 min |
| 🔵 P2 — Nice to Have | Add rate limiting to speech endpoints (even post-auth) | 30 min |

---

## Overall Verdict

**Security Grade: B**

Salita has a good foundation — HTTPS enforcement works, X-Frame/XSS/Content-Type headers are set, the chat API is auth-protected, and the open redirect logic is sound. However, the **unprotected speech APIs** represent a critical billing abuse vector that could cost real money, and the **localhost callback bug** means new users cannot complete email verification in production. Both P0 items need fixing before any user growth or marketing.

Once P0 and P1 items are resolved, the grade would be **A-**.

---

*Report generated by Cipher (Security QA Agent) — 2026-02-17*
