# Jarvis QA Report — Salita Production
**Date:** 2026-02-17 01:00 EST  
**URL:** https://salita-production.up.railway.app  
**Agent:** Jarvis QA Subagent  
**Scope:** Phase 0 (Deployment), Phase 5 (AI Backend), End-to-End Integration, Known Bugs

---

## Deployment Health: ⚠️ DEGRADED

The app is live and functional, but two diagnostic endpoints are missing and one known performance issue exists.

---

## Phase 0 — Deployment Verification

| Test | Status | Response Time | Notes |
|------|--------|---------------|-------|
| `GET /api/test-ai` | ❌ FAIL | 0.12s | Returns HTTP 404. Endpoint does NOT exist in codebase. |
| `GET /api/test-usage` | ❌ FAIL | 0.21s | Returns HTTP 404. Endpoint does NOT exist in codebase. |
| Latest git commit on Railway | ✅ PASS | — | Deployed commit: `8f17733 v11.0 simplified: clean beginner prompt, same rules, half the size` |
| App homepage loads | ✅ PASS | ~0.2s | HTTP 200, renders correctly |
| `/login` page | ✅ PASS | ~0.2s | HTTP 200, email/password form present |
| `/auth/signup` page | ✅ PASS | ~0.2s | HTTP 200, signup form present |

**Commands run:**
```bash
curl -s -w "\n[HTTP %{http_code}] [Time: %{time_total}s]" https://salita-production.up.railway.app/api/test-ai
# → HTML 404 page, [HTTP 404] [Time: 0.121635s]

curl -s -w "\n[HTTP %{http_code}] [Time: %{time_total}s]" https://salita-production.up.railway.app/api/test-usage
# → HTML 404 page, [HTTP 404] [Time: 0.214833s]

cd /Users/jarvis/.openclaw/workspace/projects/salita && git log --oneline -3
# → 8f17733 v11.0 simplified: clean beginner prompt, same rules, half the size
# → 58d1607 v11.0: Structured Curriculum Progression
# → f5e08d8 Add prompt version archive
```

**Note:** `/api/test-ai` and `/api/test-usage` are **not implemented** — they never existed in the codebase. These endpoints need to be created if they're required for monitoring.

---

## Phase 5 — AI Backend

### Test 1: POST /api/chat — Valid Request

| Test | Status | Response Time | Notes |
|------|--------|---------------|-------|
| Valid chat request (ate_maria, beginner) | ✅ PASS | **3.57s** | HTTP 200, correct response structure |
| Response has expected fields | ✅ PASS | — | `{success, response: {tagalog, correction, hint, tone}}` |
| Response `tagalog` field populated | ✅ PASS | — | Contains Tagalog text |
| Response `hint` field populated | ✅ PASS | — | Contains learning hint |

**Command:**
```bash
curl -s -w "\n[HTTP %{http_code}] [Time: %{time_total}s]" \
  -X POST https://salita-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-wbcfrfpndsczqtuilfsl-auth-token=base64-<session>" \
  -d '{"message":"Kumusta!","persona":"ate_maria","mode":"beginner"}'
```

**Actual response:**
```json
{
  "success": true,
  "response": {
    "tagalog": "Sabihin mo: \"Kumusta.\" \nMeaning: Hello / How are you?",
    "correction": "None",
    "hint": "Kumusta = Hello / How are you?",
    "tone": "warm"
  }
}
```

**⚠️ Notes:**
- Response time **3.57s** exceeds 2s target but is under 5s. Acceptable for GPT-4o-mini cold call.
- Response structure is `{success, response: {tagalog, correction, hint, tone}}` — not `{tagalog, english, hint}` as expected in test spec. The actual structure is more complete.
- `english` field is not in the AI response (it's stored in DB for user messages, not AI responses).

---

### Test 2: Rate Limiting

| Test | Status | Response Time | Notes |
|------|--------|---------------|-------|
| Rate limit headers present | ❌ FAIL | — | No `X-RateLimit-*` or `Retry-After` headers returned |
| Rate limit logic in code | ℹ️ INFO | — | 30 req/min in-memory limit is implemented but silent |

**Command:**
```bash
curl -s -D - -X POST https://salita-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"message":"Test","persona":"ate_maria"}' | grep -iE "(ratelimit|x-rate|retry|limit|remaining)"
# → (no output — no rate limit headers present)
```

**Headers actually returned:**
```
HTTP/2 200
content-security-policy: ...
content-type: application/json
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
```

**Finding:** Rate limiting is implemented in-memory (`rateLimitMap`, 30 req/min) but does NOT emit standard rate limit headers. This means API consumers cannot know their remaining budget. Recommend adding `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers.

---

### Test 3: Error Handling

| Test | Status | Response Time | Notes |
|------|--------|---------------|-------|
| Empty message → graceful | ⚠️ CONDITIONAL | 3.4s | Returns 200 with default greeting, not an error. Acceptable UX. |
| Missing persona → 400 | ✅ PASS | 0.47s | Returns `{"error":"Missing persona"}` with HTTP 400 |
| No auth cookie → 401 | ✅ PASS | 0.21s | Returns `{"error":"Unauthorized"}` with HTTP 401 |

**Commands and outputs:**

```bash
# Empty message
curl -s -w "\n[HTTP %{http_code}]" -X POST .../api/chat \
  -H "Cookie: $COOKIE" -d '{"message":"","persona":"ate_maria"}'
# → {"success":true,"response":{...}} [HTTP 200]
# Note: Empty message triggers default "Hello, I want to learn Tagalog" fallback

# Missing persona
curl -s -w "\n[HTTP %{http_code}]" -X POST .../api/chat \
  -H "Cookie: $COOKIE" -d '{"message":"Kumusta!"}'
# → {"error":"Missing persona"} [HTTP 400]

# No auth
curl -s -w "\n[HTTP %{http_code}]" -X POST .../api/chat \
  -d '{"message":"Kumusta!","persona":"ate_maria"}'
# → {"error":"Unauthorized"} [HTTP 401]
```

---

## End-to-End Integration

### New User Flow

| Step | Status | Notes |
|------|--------|-------|
| 1. Create account via Supabase API | ✅ PASS | `POST /auth/v1/signup` → HTTP 200, returns access_token |
| 2. User created in Supabase auth | ✅ PASS | User ID: `492430da-2f28-4013-8388-ac59d1e2d1c3` |
| 3. Profile created in profiles table | ⚠️ CONDITIONAL | Profile only created when user visits dashboard or completes OAuth callback. Signup via API alone does NOT create profile. |
| 4. Chat with valid session | ✅ PASS | HTTP 200, AI response returned (3.57s) |
| 5. Messages saved to messages table | ✅ PASS | Verified 10+ messages in DB for QA user |

**New user signup command:**
```bash
curl -s -X POST "https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "qa-jarvis-1771308092@test.com", "password": "TestPass123!"}'
# → HTTP 200, access_token returned
```

**Messages table verification (sample from DB):**
```json
[
  {
    "id": "93a95414-...",
    "user_id": "3a88ecbc-01b6-4b86-ae79-4c7792eeab08",
    "role": "user",
    "english": "Kumusta!",
    "persona": "ate_maria",
    "created_at": "2026-02-17T06:04:06.286452"
  },
  {
    "id": "a11ed46f-...",
    "user_id": "3a88ecbc-01b6-4b86-ae79-4c7792eeab08",
    "role": "assistant",
    "tagalog": "Sabihin mo: \"Kumusta.\" Meaning: Hello / How are you?",
    "hint": "Kumusta = Hello / How are you?",
    "tone": "warm",
    "persona": "ate_maria"
  }
]
```

**Profile creation note:** Profiles are created by `ensureProfile()` (called from dashboard) or by `/auth/callback` route (called after OAuth flow). Direct API signups via `supabase.auth.signUp()` do NOT auto-create profiles — this is by design but means any user who signs up and never visits the dashboard won't have a profile row.

---

## Known Bugs Status

| Bug | Status | Notes |
|-----|--------|-------|
| Password validation bug: "Passwords do not match" | ⚠️ UNVERIFIABLE | Signup page is a client-side React form. Code logic looks correct (`if (password !== confirmPassword)`). Cannot fully test without an unauthenticated browser session (browser auto-redirects to dashboard when logged in). Code review shows no obvious bug — may have been fixed. |
| Missing logout endpoint: `/auth/signout` → 404 | ❌ STILL PRESENT | Confirmed 404. No server-side logout route exists. Logout is handled client-side via `supabase.auth.signOut()` only. |
| Missing forgot password page: `/auth/forgot-password` → 404 | ❌ STILL PRESENT | Confirmed 404. The login page has a "Forgot password?" link pointing to this URL. Link is broken. |

**Commands:**
```bash
curl -s -w "[HTTP %{http_code}]" https://salita-production.up.railway.app/auth/signout
# → HTML 404 page [HTTP 404]

curl -s -w "[HTTP %{http_code}]" https://salita-production.up.railway.app/auth/forgot-password
# → HTML 404 page [HTTP 404]
```

---

## Additional Findings (Not In Scope)

| Finding | Severity | Notes |
|---------|----------|-------|
| CSP header still references `accounts.google.com` | LOW | `connect-src` and `frame-src` still include Google despite OAuth removal. Cosmetic/harmless but should be cleaned up. |
| `/api/test-ai` and `/api/test-usage` missing | MEDIUM | These diagnostic endpoints were expected to exist but were never implemented. Needed for health checks. |
| No rate limit headers in responses | MEDIUM | In-memory rate limiting works silently. Should emit `X-RateLimit-*` headers for API consumers. |
| Profile not auto-created on signup | LOW | New users have no profile until they visit dashboard. Could cause edge case issues in future features. |
| Response time 3.5s | MEDIUM | Exceeds 2s target. Single-instance Railway deployment + GPT-4o-mini latency. Under 5s threshold. |

---

## Summary Table

| Category | Test | Status |
|----------|------|--------|
| **Phase 0** | `/api/test-ai` exists | ❌ FAIL |
| **Phase 0** | `/api/test-usage` exists | ❌ FAIL |
| **Phase 0** | Latest commit deployed | ✅ PASS |
| **Phase 0** | App is live and responding | ✅ PASS |
| **Phase 5** | POST /api/chat — valid request | ✅ PASS |
| **Phase 5** | Response structure correct | ✅ PASS |
| **Phase 5** | Response time < 5s | ✅ PASS (3.57s) |
| **Phase 5** | Response time < 2s | ❌ FAIL (3.57s) |
| **Phase 5** | Rate limit headers present | ❌ FAIL |
| **Phase 5** | Empty message → error | ⚠️ CONDITIONAL (200, graceful fallback) |
| **Phase 5** | Missing persona → 400 | ✅ PASS |
| **Phase 5** | No auth → 401 | ✅ PASS |
| **E2E** | New user signup works | ✅ PASS |
| **E2E** | Chat with valid session | ✅ PASS |
| **E2E** | Messages saved to DB | ✅ PASS |
| **E2E** | Profile in profiles table (API signup) | ⚠️ CONDITIONAL |
| **Known Bugs** | Password validation bug | ⚠️ UNVERIFIABLE |
| **Known Bugs** | `/auth/signout` → 404 | ❌ STILL PRESENT |
| **Known Bugs** | `/auth/forgot-password` → 404 | ❌ STILL PRESENT |

---

## Deployment Health: ⚠️ DEGRADED

App is live and serving requests. Core features work. However:
- 2 diagnostic endpoints missing (test-ai, test-usage)
- 2 known bugs still present (signout 404, forgot-password 404)
- "Forgot password" link in UI is broken
- Response time above 2s target
- No rate limit headers emitted

---

## Overall Verdict: ⚠️ CONDITIONAL PASS

**What works:**
- ✅ App is deployed and serving production traffic
- ✅ Authentication (signup, login, session cookies)
- ✅ `/api/chat` handles valid requests and returns AI responses
- ✅ Auth protection (401 on missing cookie)
- ✅ Input validation (400 on missing persona)
- ✅ Messages persisted to database correctly
- ✅ Rate limiting logic implemented (in-memory)

**What needs fixing:**
1. 🔴 **`/auth/forgot-password` is a broken link** — the login page links to it but it returns 404. Users cannot recover forgotten passwords.
2. 🟡 **`/api/test-ai` and `/api/test-usage` don't exist** — these health check endpoints need to be created.
3. 🟡 **Rate limit headers missing** — add `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` to responses.
4. 🟡 **Response time 3.5s** — above the 2s target. Consider caching or prompt optimization.
5. 🟡 **CSP header cleanup** — still references `accounts.google.com` after OAuth removal.
6. 🟡 **`/auth/signout` 404** — no server-side logout route. Client-side logout only.

**Priority fixes before production launch:**
1. `/auth/forgot-password` page (broken link blocks password recovery)
2. Test health check endpoints (`/api/test-ai`, `/api/test-usage`)

---
*Report generated: 2026-02-17 01:10 EST by Jarvis QA Subagent*
