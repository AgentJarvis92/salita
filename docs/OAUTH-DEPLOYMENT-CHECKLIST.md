# OAuth Deployment Checklist

**Purpose:** Prevent OAuth redirect issues when deploying to new environments  
**Created:** Mon Feb 16, 2026  
**Use this:** Every time you deploy Salita to a new domain/environment  

---

## Pre-Deployment Checklist

### ✅ 1. Identify Target Environment

- [ ] Environment name: _________________ (e.g., production, staging, dev)
- [ ] Target URL: _________________ (e.g., https://salita-production.up.railway.app)
- [ ] Deployment platform: _________________ (Railway, Vercel, etc.)

---

### ✅ 2. Update Google Cloud Console

**Location:** https://console.cloud.google.com → APIs & Services → Credentials

1. [ ] Navigate to OAuth 2.0 Client IDs
2. [ ] Find client: `1093398881744-rbup2got4r6dnmqln3l66g2rn0br927e` (or your client ID)
3. [ ] Click **Edit** (pencil icon)
4. [ ] Scroll to **Authorized redirect URIs**
5. [ ] Add new environment redirect URI:
   ```
   https://[YOUR-DOMAIN]/auth/callback
   ```
6. [ ] Add Supabase callback URI (if not already present):
   ```
   https://[YOUR-SUPABASE-PROJECT].supabase.co/auth/v1/callback
   ```
7. [ ] **Optional:** Remove old/unused redirect URIs (e.g., old localhost ports)
8. [ ] Click **Save**
9. [ ] **Wait 5-10 minutes** for Google to propagate changes

**Example URIs:**
```
Production:
✅ https://salita-production.up.railway.app/auth/callback
✅ https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback

Staging:
✅ https://salita-staging.up.railway.app/auth/callback

Local Development:
✅ http://localhost:3000/auth/callback
```

---

### ✅ 3. Update Supabase Dashboard

**Location:** https://supabase.com/dashboard → [Your Project] → Authentication

#### A. URL Configuration
1. [ ] Navigate to: **Authentication → URL Configuration**
2. [ ] Update **Site URL:**
   ```
   https://[YOUR-DOMAIN]
   ```
3. [ ] Update **Redirect URLs:** (Add new environment)
   ```
   https://[YOUR-DOMAIN]/**
   ```
   (The `/**` wildcard allows all callback paths)
4. [ ] Click **Save**

#### B. Google Provider Configuration
1. [ ] Navigate to: **Authentication → Providers → Google**
2. [ ] Verify Google provider is **ENABLED** (toggle should be ON)
3. [ ] Verify **Client ID** is present and correct
4. [ ] Verify **Client Secret** is configured (shows asterisks)
5. [ ] If creating new environment, ensure Google OAuth credentials are same as production
6. [ ] Click **Save** if any changes made

**Example configuration:**
```
Site URL: https://salita-production.up.railway.app
Redirect URLs:
  - https://salita-production.up.railway.app/**
  - http://localhost:3000/** (for local dev)
```

---

### ✅ 4. Set Environment Variables

**Location:** Railway Dashboard → Project → Service → Variables (or your deployment platform)

1. [ ] Set **NEXT_PUBLIC_SITE_URL:**
   ```
   https://[YOUR-DOMAIN]
   ```
2. [ ] Verify **NEXT_PUBLIC_SUPABASE_URL:**
   ```
   https://[YOUR-SUPABASE-PROJECT].supabase.co
   ```
3. [ ] Verify **NEXT_PUBLIC_SUPABASE_ANON_KEY** is set
4. [ ] Verify **SUPABASE_SERVICE_ROLE_KEY** is set (for server-side operations)
5. [ ] Verify **OPENAI_API_KEY** is set (for chat functionality)
6. [ ] Click **Save** or apply changes

**Verify via CLI (Railway example):**
```bash
railway variables get NEXT_PUBLIC_SITE_URL
# Should output: https://salita-production.up.railway.app
```

---

### ✅ 5. Deploy Application

1. [ ] Commit any code changes to git
2. [ ] Push to deployment branch (e.g., `main`, `production`)
3. [ ] Wait for build to complete
4. [ ] Monitor deployment logs for errors
5. [ ] Verify deployment status shows "Success"

**Railway CLI:**
```bash
cd ~/.openclaw/workspace/projects/salita
git add .
git commit -m "chore: deploy to production"
git push origin main

# Monitor deployment
railway logs --follow
```

---

## Post-Deployment Verification

### ✅ 6. Test OAuth Flow (Critical!)

**Use incognito/private browser to avoid cached sessions**

1. [ ] Open incognito browser
2. [ ] Navigate to: `https://[YOUR-DOMAIN]/login`
3. [ ] Click **"Continue with Google"**
4. [ ] Complete Google sign-in (enter email/password)
5. [ ] Click **"Allow"** on permission prompt
6. [ ] Verify redirect to: `https://[YOUR-DOMAIN]/dashboard` (NOT localhost!)
7. [ ] Verify dashboard loads successfully
8. [ ] Verify user name appears in header/profile
9. [ ] Navigate to: `https://[YOUR-DOMAIN]/chat`
10. [ ] Verify chat page loads (protected route works)

**Expected flow:**
```
Login page → Google sign-in → Permission prompt → 
Dashboard (on YOUR-DOMAIN, not localhost) ✅
```

**Red flags:**
```
❌ Redirects to localhost:8080 or localhost:3000
❌ Shows "Unable to connect" error
❌ Shows 401 Unauthorized error
❌ Stuck on "Loading..." screen
```

---

### ✅ 7. Verify Database

**Check that OAuth created user and profile**

1. [ ] Go to Supabase Dashboard → Authentication → Users
2. [ ] Verify new user appears in list
3. [ ] Note user ID (e.g., `abc123...`)
4. [ ] Go to SQL Editor
5. [ ] Run query:
   ```sql
   SELECT * FROM profiles 
   WHERE user_id = '[USER-ID-FROM-STEP-3]';
   ```
6. [ ] Verify profile row exists with correct `name` and `user_id`

---

### ✅ 8. Test Email Signup/Login (Regression Check)

**Ensure OAuth fix didn't break email authentication**

1. [ ] Open new incognito browser tab
2. [ ] Navigate to: `https://[YOUR-DOMAIN]/auth/signup`
3. [ ] Sign up with email/password (use test email)
4. [ ] Verify signup completes successfully
5. [ ] Check email for verification link (if enabled)
6. [ ] Log out
7. [ ] Navigate to: `https://[YOUR-DOMAIN]/login`
8. [ ] Log in with same email/password
9. [ ] Verify login works and redirects to dashboard

---

### ✅ 9. Test Session Persistence

1. [ ] While logged in, refresh the page
2. [ ] Verify user stays logged in (no redirect to login)
3. [ ] Close browser tab
4. [ ] Open new tab and go to: `https://[YOUR-DOMAIN]/dashboard`
5. [ ] Verify still logged in (session persists)
6. [ ] Open browser DevTools → Application → Cookies
7. [ ] Verify Supabase cookies are set and not expired

---

### ✅ 10. Check Error Logging

1. [ ] Open deployment logs (Railway/Vercel/etc.)
2. [ ] Look for errors related to OAuth:
   ```
   ❌ "OAuth callback failed"
   ❌ "Invalid redirect_uri"
   ❌ "Code exchange failed"
   ```
3. [ ] If errors found, investigate and fix
4. [ ] Verify no 401/403 errors on `/auth/callback` route

**Railway CLI:**
```bash
railway logs --follow | grep -i "oauth\|callback\|redirect"
```

---

## Rollback Plan (If OAuth Fails)

### If OAuth doesn't work after deployment:

1. [ ] Verify Google Cloud Console redirect URIs (wait 10 minutes after saving)
2. [ ] Verify Supabase Site URL matches deployment domain (exact match, no typos)
3. [ ] Verify Railway environment variable `NEXT_PUBLIC_SITE_URL` is correct
4. [ ] Force clean rebuild:
   ```bash
   railway up --detach
   ```
5. [ ] Clear browser cache and cookies
6. [ ] Test in completely fresh incognito browser
7. [ ] Check browser console for errors (F12 → Console tab)
8. [ ] If still failing, revert to previous deployment:
   ```bash
   railway deployment list
   railway redeploy [PREVIOUS-DEPLOYMENT-ID]
   ```

---

## Environment-Specific Notes

### Production
- Domain: `https://salita-production.up.railway.app`
- Supabase Project: `wbcfrfpndsczqtuilfsl`
- Google OAuth Client: `1093398881744-rbup2got4r6dnmqln3l66g2rn0br927e`

### Staging (if/when created)
- Domain: `https://salita-staging.up.railway.app`
- Supabase Project: (same as production or separate staging project)
- Google OAuth Client: (can use same or create separate staging client)

### Local Development
- Domain: `http://localhost:3000`
- Supabase Project: (same as production, or use local Supabase CLI)
- Google OAuth Client: (use production client with localhost redirect URI)

---

## Common Pitfalls to Avoid

### ❌ Don't:
- Deploy without updating Google Cloud Console redirect URIs
- Assume `redirectTo` parameter alone will work (it won't!)
- Skip the post-deployment OAuth test (always test in incognito!)
- Forget to wait 5-10 minutes after updating Google OAuth config
- Use production Google OAuth credentials in local `.env.local` (use Railway env vars)

### ✅ Do:
- Update **all three** config points (Google, Supabase, Railway) before deploying
- Test OAuth in incognito browser (avoids cached sessions)
- Document which redirect URIs are for which environments
- Remove old/unused redirect URIs to avoid confusion
- Keep local `.env.local` with `localhost:3000` for development

---

## Quick Reference: Configuration Locations

| Component | Location | Setting | Value |
|-----------|----------|---------|-------|
| **Google Console** | APIs & Services → Credentials | Authorized redirect URIs | `https://[DOMAIN]/auth/callback` |
| **Supabase** | Authentication → URL Config | Site URL | `https://[DOMAIN]` |
| **Supabase** | Authentication → URL Config | Redirect URLs | `https://[DOMAIN]/**` |
| **Railway** | Service → Variables | NEXT_PUBLIC_SITE_URL | `https://[DOMAIN]` |
| **Code** | app/auth/signup/page.tsx | redirectTo parameter | Uses `process.env.NEXT_PUBLIC_SITE_URL` |

---

## Documentation

- **Full investigation report:** `/oauth-fix-investigation.md` (detailed root cause analysis)
- **Quick action guide:** `/OAUTH-FIX-QUICK-ACTION.md` (2-step fix for current issue)
- **OAuth flow diagram:** `/docs/OAUTH-REDIRECT-ISSUE-DIAGRAM.md` (visual guide)
- **This checklist:** `/docs/OAUTH-DEPLOYMENT-CHECKLIST.md` (use for future deployments)

---

**Checklist Version:** 1.0  
**Last Updated:** Mon Feb 16, 2026  
**Created By:** Jarvis (Subagent)  
**Purpose:** Prevent OAuth redirect issues on future deployments

---

## Sign-Off

**Deployment completed by:** ___________________  
**Date:** ___________________  
**Environment:** ___________________  
**All checks passed:** [ ] Yes [ ] No  
**OAuth tested successfully:** [ ] Yes [ ] No  
**Notes:**

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________
