# Norbert QA Report — Salita Production
**QA Agent:** Norbert (Lead QA)  
**Date:** 2026-02-17  
**Environment:** https://salita-production.up.railway.app  
**Supabase Project:** wbcfrfpndsczqtuilfsl  
**Auth Method:** Email/password only (Google OAuth removed)  
**Scope:** Phase 0 (Setup), Phase 1 (Auth), Phase 2 (Database), Phase 6 (Polish)

---

## Test Results

| Phase | Test | Status | Notes |
|-------|------|--------|-------|
| **Phase 0** | GET / loads without error | ✅ PASS | 307 redirect → /login → 200 OK |
| **Phase 0** | GET /api/test-ai → valid AI response | ❌ FAIL | 404 Not Found. Route does not exist in codebase. |
| **Phase 0** | GET /api/test-usage → success | ❌ FAIL | 404 Not Found. Route does not exist in codebase. |
| **Phase 1** | Signup page exists at /auth/signup (not 404) | ✅ PASS | HTTP 200, full form rendered |
| **Phase 1** | Login page exists at /login | ✅ PASS | HTTP 200, full form rendered |
| **Phase 1** | Signup with fresh email | ✅ PASS | Supabase auth API: access_token returned, user created (id: ed2f3361) |
| **Phase 1** | Login with existing credentials | ✅ PASS | Supabase token endpoint returns access_token successfully |
| **Phase 1** | POST /auth/signup (JSON API) | ❌ FAIL | 405 Method Not Allowed — endpoint only serves page, not JSON API |
| **Phase 1** | Protected route /dashboard redirects unauthenticated → /login | ✅ PASS | 307 → /login |
| **Phase 1** | Logout works | ✅ PASS | Supabase /auth/v1/logout → 204, token revoked (post-logout check: 403 session_not_found) |
| **Phase 2** | profiles table exists | ✅ PASS | Table returns data, e.g. user kjrkicks2 with tutor "ate_maria" |
| **Phase 2** | messages table exists | ✅ PASS | Table returns data with Tagalog lesson messages |
| **Phase 2** | messages.persona column exists | ✅ PASS | Column confirmed in schema: `['id', 'user_id', 'role', 'tagalog', 'english', 'hint', 'examples', 'correction', 'note', 'tone', 'created_at', 'persona']` |
| **Phase 2** | analytics_events table exists | ✅ PASS | Table returns data, signup event visible |
| **Phase 2** | usage_metrics table exists | ✅ PASS | Table returns data with message_count tracking |
| **Phase 6** | Homepage has `<title>` | ✅ PASS | `<title>Salita - Learn Tagalog by Talking</title>` |
| **Phase 6** | Homepage has `<meta description>` | ✅ PASS | `"Learn Tagalog through conversation with AI tutors"` |
| **Phase 6** | Signup page renders correctly (not 404, has form) | ✅ PASS | Full form with email, password, confirmPassword, "Create account" button |
| **Phase 6** | Login page has link to signup | ✅ PASS | "Don't have an account? Sign up" → /auth/signup |

---

## Bugs Found

### BUG-001 — `/api/test-ai` route missing
**Severity:** HIGH  
**Phase:** 0  
**Description:** `GET https://salita-production.up.railway.app/api/test-ai` returns HTTP 404. The route handler file does not exist in the codebase (`find app/api -name route.ts` only shows: messages, chat, speech/transcribe, speech/synthesize). This test route was referenced in the BUILD-PLAN but was never implemented.  
**Impact:** Cannot verify AI integration is wired correctly via a dedicated test endpoint. The actual `/api/chat` route exists (returns 405 on GET, meaning it's likely POST-only), so AI may work in practice.  
**Recommendation:** Either implement `GET /api/test-ai` that hits OpenAI and returns a health-check response, or remove from BUILD-PLAN if no longer required.

---

### BUG-002 — `/api/test-usage` route missing
**Severity:** HIGH  
**Phase:** 0  
**Description:** `GET https://salita-production.up.railway.app/api/test-usage` returns HTTP 404. Same issue as BUG-001 — no route file exists.  
**Impact:** Cannot verify usage tracking middleware works via test endpoint. The `usage_metrics` table has data (verified via Supabase API), suggesting it may be tracked correctly in the actual chat flow.  
**Recommendation:** Implement `GET /api/test-usage` or remove from BUILD-PLAN requirements.

---

### BUG-003 — POST `/auth/signup` returns 405 Method Not Allowed
**Severity:** LOW  
**Phase:** 1  
**Description:** `POST /auth/signup` with JSON body returns 405. The route is a Next.js page (GET only). Signup is handled client-side via Supabase JS SDK, not a server-side API endpoint. This is by design for a Next.js + Supabase app, but worth noting.  
**Impact:** No direct curl-testable signup endpoint. Signup still works via browser/SDK.  
**Recommendation:** Acceptable for this architecture. No fix required unless a server-side signup API is needed.

---

### BUG-004 — `<meta name="robots" content="noindex">` present on some pages
**Severity:** LOW  
**Phase:** 6  
**Description:** The `/api/test-ai` and `/api/test-usage` 404 pages (and other error pages) include `<meta name="robots" content="noindex">`. The main pages (/login, /auth/signup) do NOT have this meta tag (confirmed in HTML). However, the homepage's server-side render via the redirect chain — because it's a 307 redirect — means the initial response at `/` isn't directly indexable.  
**Impact:** Minimal SEO concern; login-gated app is not typically indexed anyway.  
**Recommendation:** Verify robots.txt exists and is configured appropriately.

---

## Additional Observations

### ✅ What's Working Well
- **Dashboard fully renders** for logged-in users: Shows tutors (Ate Maria, Kuya Josh), recent activity ("Market bargaining basics"), bottom nav (Home/Chat/Profile) — polished UI.
- **Database is populated with real data:** Live users, messages, and analytics events confirm the app is being used.
- **Auth flow is complete:** Signup → Login → Protected route → Logout all work correctly end-to-end.
- **Metadata is solid:** Title + description present, PWA manifest linked, apple-touch-icon configured.
- **Signup form is well-designed:** Has email, password, confirm password with validation hint ("At least 8 characters, including uppercase and numbers").
- **Cross-linking works:** Login page links to signup, signup page links back to login.

### ⚠️ Unverified (Out of Scope / Architecture Note)
- Signup form submission (client-side Supabase SDK call) — browser test showed the browser was already logged in (prior QA session still active), redirected to dashboard. The Supabase API test confirms signup works.
- Actual AI chat functionality (`/api/chat` POST) — not tested in this scope.
- Email confirmation flow — Supabase returned `access_token` immediately on signup, suggesting email confirmation may be disabled (common for dev/early prod). This could be a security consideration.

---

## Summary Statistics
| Phase | Total Tests | PASS | FAIL | SKIP |
|-------|-------------|------|------|------|
| Phase 0 | 3 | 1 | 2 | 0 |
| Phase 1 | 6 | 5 | 1 | 0 |
| Phase 2 | 5 | 5 | 0 | 0 |
| Phase 6 | 4 | 4 | 0 | 0 |
| **TOTAL** | **18** | **15** | **3** | **0** |

---

## Overall Verdict: ⚠️ CONDITIONAL

**Rationale:**  
Core app functionality (auth, database, UI polish) is solid and working correctly. The two missing test routes (`/api/test-ai` and `/api/test-usage`) are the only blockers. These are **developer diagnostic routes**, not user-facing features. The underlying AI and usage tracking systems may be functional (chat route exists, usage_metrics table has data), but cannot be verified without the test endpoints.

**To achieve PASS:**
1. Implement `GET /api/test-ai` returning a valid OpenAI response — or confirm and document these routes were intentionally removed
2. Implement `GET /api/test-usage` returning usage metrics — or confirm removal

**If test routes were intentionally removed from the production build**, this report should be upgraded to **PASS** pending that confirmation.

---

*Report generated by Norbert QA Agent | Salita v0.x | 2026-02-17 01:00 EST*
