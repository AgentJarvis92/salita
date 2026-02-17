# 🔥 Salita OAuth Fix - Quick Action Guide

**Problem:** Google OAuth redirects to `localhost:8080` instead of production Railway URL  
**Root Cause:** External OAuth configuration (NOT code issue)  
**Time to Fix:** 10 minutes  

---

## ⚡ Fix It Now (2 Steps)

### Step 1: Update Google Cloud Console (5 min)

1. Go to: https://console.cloud.google.com
2. Navigate: **APIs & Services → Credentials**
3. Find OAuth Client: `1093398881744-rbup2got4r6dnmqln3l66g2rn0br927e`
4. Click **Edit**
5. **Authorized redirect URIs** section:
   - ❌ **Remove:** `http://localhost:8080/auth/callback`
   - ❌ **Remove:** `http://localhost:8080/dashboard`
   - ✅ **Add:** `https://salita-production.up.railway.app/auth/callback`
   - ✅ **Add:** `https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback`
6. Click **Save**
7. Wait 5 minutes for changes to propagate

---

### Step 2: Verify Supabase Configuration (3 min)

1. Go to: https://supabase.com/dashboard
2. Select: **Salita** project (`wbcfrfpndsczqtuilfsl`)
3. Navigate: **Authentication → URL Configuration**
4. **Site URL:** Set to `https://salita-production.up.railway.app`
5. **Redirect URLs:** Must include:
   - `https://salita-production.up.railway.app/**`
6. Click **Save**
7. Navigate: **Authentication → Providers → Google**
8. Verify: Google provider is **ENABLED**

---

## ✅ Test It (2 min)

1. Open **incognito browser**
2. Go to: https://salita-production.up.railway.app/login
3. Click **"Continue with Google"**
4. Sign in with Google
5. **Expected:** Redirected to `https://salita-production.up.railway.app/dashboard`
6. ✅ **Success!** OAuth is fixed

---

## 🔍 Why This Works

- `localhost:8080` is NOT in the Salita codebase
- It's configured in Google Cloud Console (old dev setup)
- Google OAuth uses pre-authorized redirect URIs
- Removing localhost and adding production URL fixes it

---

## 📋 If It Still Fails

Try Option 3: Force Railway Rebuild

```bash
cd ~/.openclaw/workspace/projects/salita
railway variables set NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app
railway up --detach
```

Wait 3 minutes for rebuild, then test again.

---

**Full Investigation:** See `oauth-fix-investigation.md` (detailed 20-page analysis)  
**Created:** Mon Feb 16, 2026 @ 7:34 PM EST  
**By:** Jarvis (Subagent)
