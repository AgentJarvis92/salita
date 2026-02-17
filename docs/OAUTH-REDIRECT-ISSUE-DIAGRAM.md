# OAuth Redirect Issue - Technical Flow Diagram

## Current Broken Flow (localhost:8080 redirect)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Continue with Google" on Salita login page     │
│    URL: https://salita-production.up.railway.app/login         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Client-side code calls Supabase SDK:                        │
│    supabase.auth.signInWithOAuth({                              │
│      provider: 'google',                                        │
│      options: {                                                 │
│        redirectTo: 'https://salita-production...auth/callback'  │
│      }                                                           │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Supabase redirects to Google OAuth:                         │
│    https://accounts.google.com/o/oauth2/v2/auth?               │
│      client_id=1093398881744-rbup2got4r6dnmqln...              │
│      redirect_uri=https://wbcfrfpndsczqtuilfsl.supabase.co/... │
│      state=...                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Google validates redirect_uri against authorized list:      │
│                                                                 │
│    Google Cloud Console → OAuth Client Config:                 │
│    ❌ http://localhost:8080/auth/callback                       │
│    ❌ http://localhost:8080/dashboard                           │
│    ❌ MISSING: https://salita-production.up.railway.app/...    │
│                                                                 │
│    ⚠️  Google sees Supabase redirect_uri is authorized         │
│    ⚠️  But also sees localhost:8080 in the list                │
│    ⚠️  May default to first URI or cached configuration        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User completes Google sign-in                               │
│    Sees permission prompt → clicks "Allow"                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Google redirects to Supabase with auth code:                │
│    https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback   │
│      ?code=AUTH_CODE                                            │
│      &state=...                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Supabase exchanges code for tokens and creates session      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. 🔴 Supabase redirects to final destination:                 │
│                                                                 │
│    ❌ ACTUAL: http://localhost:8080/dashboard                   │
│    ✅ EXPECTED: https://salita-production.up.railway.app/...   │
│                                                                 │
│    ⚠️  Issue: Supabase Site URL is set to localhost:8080       │
│    ⚠️  OR: Google's cached redirect configuration              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. ❌ Browser tries to load localhost:8080/dashboard           │
│    ❌ Fails: No server running on localhost                    │
│    ❌ User sees connection error                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fixed Flow (Production redirect)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Continue with Google" on Salita login page     │
│    URL: https://salita-production.up.railway.app/login         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Client-side code calls Supabase SDK:                        │
│    supabase.auth.signInWithOAuth({                              │
│      provider: 'google',                                        │
│      options: {                                                 │
│        redirectTo: 'https://salita-production...auth/callback'  │
│      }                                                           │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Supabase redirects to Google OAuth:                         │
│    https://accounts.google.com/o/oauth2/v2/auth?               │
│      client_id=1093398881744-rbup2got4r6dnmqln...              │
│      redirect_uri=https://wbcfrfpndsczqtuilfsl.supabase.co/... │
│      state=...                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Google validates redirect_uri against authorized list:      │
│                                                                 │
│    Google Cloud Console → OAuth Client Config (FIXED):         │
│    ✅ https://salita-production.up.railway.app/auth/callback   │
│    ✅ https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback│
│    ⚠️  localhost:8080 removed from authorized list             │
│                                                                 │
│    ✅ Google accepts Supabase redirect_uri                     │
│    ✅ No localhost fallback in configuration                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User completes Google sign-in                               │
│    Sees permission prompt → clicks "Allow"                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Google redirects to Supabase with auth code:                │
│    https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback   │
│      ?code=AUTH_CODE                                            │
│      &state=...                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Supabase exchanges code for tokens and creates session      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ✅ Supabase redirects to final destination:                 │
│                                                                 │
│    ✅ ACTUAL: https://salita-production.up.railway.app/auth... │
│    ✅ Uses Site URL from Supabase dashboard (FIXED)            │
│    ✅ Uses redirectTo parameter from client SDK                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Salita callback handler processes the auth code:            │
│    GET /auth/callback?code=AUTH_CODE                            │
│                                                                 │
│    - Exchanges code for session                                │
│    - Creates user profile if new user                          │
│    - Redirects to /dashboard                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. ✅ User lands on dashboard:                                │
│     https://salita-production.up.railway.app/dashboard         │
│     ✅ Authenticated and session active                        │
│     ✅ Can access chat and other protected routes              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Points (Where to Fix)

### 🔴 Point A: Google Cloud Console
**Location:** https://console.cloud.google.com → APIs & Services → Credentials  
**OAuth Client ID:** `1093398881744-rbup2got4r6dnmqln3l66g2rn0br927e`  
**Setting:** Authorized redirect URIs  

**Current (Broken):**
```
❌ http://localhost:8080/auth/callback
❌ http://localhost:8080/dashboard
```

**Fixed:**
```
✅ https://salita-production.up.railway.app/auth/callback
✅ https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback
⚠️  (Optional for local dev: http://localhost:3000/auth/callback)
```

---

### 🟡 Point B: Supabase Dashboard
**Location:** https://supabase.com/dashboard → Salita (`wbcfrfpndsczqtuilfsl`)  
**Section:** Authentication → URL Configuration  

**Settings to verify:**

1. **Site URL:**
   - ❌ Current: `http://localhost:8080` (WRONG)
   - ✅ Fixed: `https://salita-production.up.railway.app` (CORRECT)

2. **Redirect URLs:**
   - ✅ Must include: `https://salita-production.up.railway.app/**` (wildcard)
   - ✅ Or specific: `https://salita-production.up.railway.app/auth/callback`

3. **Google Provider:**
   - ✅ Enabled: YES
   - ✅ Client ID: `1093398881744-rbup2got4r6dnmqln3l66g2rn0br927e`
   - ✅ Client Secret: Configured

---

### 🟢 Point C: Railway Environment Variables
**Location:** Railway Dashboard → salita-production → Variables  
**Status:** ✅ Already correct (verified)  

**Current configuration:**
```
✅ NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app
✅ NEXT_PUBLIC_SUPABASE_URL=https://wbcfrfpndsczqtuilfsl.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
```

**Action:** No changes needed (unless forcing rebuild)

---

## Why `redirectTo` Parameter Doesn't Work Alone

```typescript
// This code in app/auth/signup/page.tsx:
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${siteUrl}/auth/callback`,  // ⚠️ NOT ENOUGH!
  },
})
```

**Why this isn't enough:**

1. **Supabase uses Site URL as base:**
   - The `redirectTo` parameter is combined with Supabase's configured Site URL
   - If Site URL is `localhost:8080`, the final redirect will be `localhost:8080/...`
   - `redirectTo` is relative to the Site URL, not absolute

2. **Google validates against pre-authorized URIs:**
   - Even if Supabase constructs the correct redirect URL
   - Google checks it against the authorized list in Cloud Console
   - If the URL isn't in the list, OAuth fails or defaults to first URI

3. **Caching and propagation delays:**
   - Google caches OAuth client configurations
   - Changes to authorized redirect URIs can take 5-10 minutes to propagate
   - Browser/Supabase SDK may also cache OAuth flows

**Solution:**
- Fix the **source of truth** (Google Cloud Console + Supabase Dashboard)
- The `redirectTo` parameter will then work correctly
- Application code doesn't need changes

---

## Testing the Fix

### Before Fix:
```
User clicks "Continue with Google"
  ↓
Google redirects to Supabase
  ↓
Supabase redirects to: http://localhost:8080/dashboard ❌
  ↓
Browser fails to connect (no server on localhost)
```

### After Fix:
```
User clicks "Continue with Google"
  ↓
Google redirects to Supabase
  ↓
Supabase redirects to: https://salita-production.up.railway.app/auth/callback ✅
  ↓
Callback handler processes auth code
  ↓
User redirected to: https://salita-production.up.railway.app/dashboard ✅
  ↓
Success! User is authenticated and can use the app
```

---

**Created:** Mon Feb 16, 2026 @ 7:34 PM EST  
**By:** Jarvis (Subagent)  
**Purpose:** Visual guide to understand OAuth redirect issue and fix
