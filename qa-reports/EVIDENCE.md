# Salita Production QA - Evidence & Screenshots

## Visual Evidence Collected

### 1. Login Page (Initial State)
**File:** b2451a2b-a7d0-4496-ba26-ba749dd2181e.png  
**URL:** https://salita-production.up.railway.app/login

**Observations:**
- Clean, centered login card
- Salita 🇵🇭 branding prominent
- "Learn Tagalog by talking" tagline
- "Continue with Google" button with Google logo
- Email and Password fields
- "Sign in" button (blue)
- "Don't have an account? Sign up" link

**Status:** ✅ Professional, clean UI

---

### 2. Signup Page (Initial State)
**File:** 764f9775-a8f1-4224-af5f-263ac57126b3.png  
**URL:** https://salita-production.up.railway.app/auth/signup

**Observations:**
- Similar design to login page
- Heading: "Create an account to learn Tagalog"
- "Sign up with Google" button
- Three fields: Email address, Password, Confirm password
- Password requirement helper: "At least 8 characters, including uppercase and numbers"
- "Create account" button
- "Already have an account? Sign in" link

**Status:** ✅ Clear signup flow, good UX

---

### 3. Signup Page (With Validation Error)
**File:** ef22e424-3002-4b40-895e-6937382b491d.png  
**URL:** https://salita-production.up.railway.app/auth/signup

**Observations:**
- Red/pink error banner: "Passwords do not match"
- Email field shows: qa.test.20260216.1922@example.com
- Password fields show masked values (••••••••)
- Form still in editable state

**Critical Finding:** Email field value different from what was entered (qatest1@salita-test.com)

**Status:** ⚠️ Validation bug identified

---

### 4. Dashboard (Authenticated User)
**File:** c63d7e1c-e107-45fa-bb67-44fbf8fdaf05.png  
**URL:** https://salita-production.up.railway.app/ (redirected from /auth/signup)

**Observations:**
- Personalized greeting: "KUMUSTA, QATEST202602161922"
- Large heading: "Start Speaking Tagalog"
- Subtitle: "Practice naturally with a mentor who understands your journey"
- Two tutor cards:
  - **Ate Maria** (BEGINNER badge) - "Start from zero. Clear English guidance. Gentle, patient support."
  - **Kuya Josh** (HERITAGE badge) - "You understand it. Let's help you speak it confidently."
- "Recent Activity" section:
  - "Continue Learning"
  - "Market bargaining basics" (lesson title)
  - Play button (yellow/gold)
- Bottom navigation bar:
  - Home (house icon)
  - Chat (message icon)
  - Profile (person icon)

**Status:** ✅ Excellent post-login experience, clear next steps, engaging design

---

## Console Evidence

### Profile Fetch Errors (406)
```
Failed to load resource: the server responded with a status of 406 ()
URL: https://wbcfrfpndsczqtuilfsl.supabase.co/rest/v1/profiles?select=name&user_id=eq.3a88ecbc-01b6-4b86-ae79-4c7792eeab08
```

**Occurrences:** 3 times in rapid succession  
**Timestamp:** 2026-02-17 00:23:41-43 UTC

**Analysis:**
- Supabase REST API rejecting request
- 406 = "Not Acceptable" suggests accept header mismatch
- User ID: 3a88ecbc-01b6-4b86-ae79-4c7792eeab08
- Querying profiles table for `name` field
- May indicate RLS policy issue or missing table data

---

## API Testing Evidence

### POST /api/auth/signup → 404
```bash
$ curl -X POST https://salita-production.up.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"qatest.valid@example.com","password":"ValidPass123","confirmPassword":"ValidPass123"}'
```

**Response:** Next.js 404 page (HTML)  
**HTTP Status:** 404

**Conclusion:** No custom auth API endpoints. Salita uses Supabase Auth SDK directly (expected pattern).

---

## Network Analysis

### SSL Certificate
- **Issuer:** Let's Encrypt (R13)
- **Valid:** Feb 4, 2026 - May 5, 2026
- **Domain:** *.up.railway.app (wildcard)
- **Protocol:** TLS 1.3
- **Cipher:** AEAD-CHACHA20-POLY1305-SHA256

**Status:** ✅ Valid, modern encryption

---

### Page Load Performance
- **Login page:** < 1 second
- **Signup page:** < 1 second
- **Dashboard:** < 1.5 seconds (includes Supabase data fetch)

**Status:** ✅ Excellent performance

---

## Testing Artifacts Location

All screenshots stored in:
- `/Users/jarvis/.openclaw/media/browser/`

Referenced in test report with full filenames.

---

## Evidence Summary

| Category | Status | Evidence |
|----------|--------|----------|
| UI Design | ✅ Pass | Screenshots 1-4 |
| Page Load | ✅ Pass | Network timing |
| Auth Flow | ⚠️ Partial | Form validation bug |
| Dashboard | ✅ Pass | Screenshot 4 |
| API Structure | ✅ Confirmed | curl test |
| SSL/Security | ✅ Pass | Certificate analysis |
| Console Errors | ⚠️ Issues Found | 406 errors logged |

