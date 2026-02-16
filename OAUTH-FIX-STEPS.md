# Google OAuth Fix — Action Steps for Norbert

**Severity:** 🔴 **CRITICAL**  
**Component:** Google OAuth Configuration  
**Cause:** Production environment variable missing  
**Time to Fix:** ~10 minutes

---

## The Problem

Salita's production build will fail Google OAuth because:
- Current `.env.local` has: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- This redirects OAuth callbacks to `localhost:3000` instead of Railway domain
- Google OAuth servers reject localhost callbacks from production requests

---

## The Fix (3 Steps)

### Step 1: Set Railway Environment Variable ⚡ CRITICAL

**Via Railway Dashboard:**
1. Go to https://railway.app → Your project (salita-production)
2. Click "Variables" tab
3. Click "Add Variable"
4. Set:
   ```
   Name: NEXT_PUBLIC_SITE_URL
   Value: https://salita-production.up.railway.app
   ```
5. Click Save
6. Redeploy

**Via Railway CLI (faster):**
```bash
cd ~/.openclaw/workspace/projects/salita
railway variables set NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app
railway up  # Redeploy
```

---

### Step 2: Verify Supabase OAuth Configuration ⚠️ VERIFICATION

**In Supabase Dashboard:**

1. **Go to:** https://supabase.com → wbcfrfpndsczqtuilfsl project
2. **Navigate:** Authentication → URL Configuration
3. **Verify/Update:**
   - Site URL: `https://salita-production.up.railway.app`
   - Redirect URLs: 
     ```
     https://salita-production.up.railway.app/auth/callback
     http://localhost:3000/auth/callback  (for local dev)
     ```
4. **Save changes**

5. **Then go to:** Authentication → Providers → Google
6. **Verify:**
   - Google OAuth is **ENABLED**
   - Client ID and Secret are present (should be already configured)

---

### Step 3: Test OAuth Flow 🧪 QUICK TEST

1. Visit: `https://salita-production.up.railway.app`
2. Click "Continue with Google"
3. Complete Google login
4. Verify redirect to dashboard (no error)
5. Check user exists in Supabase (go to SQL Editor, run):
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
   ```

---

## Expected Result

✅ Google OAuth login works on Railway  
✅ User is authenticated and redirected to dashboard  
✅ Profile is created in `profiles` table  

---

## If It Still Fails

Check logs on Railway:
```bash
railway logs -f
```

Look for:
- 401 errors → Supabase auth issue
- CSP violations → Security header issue (unlikely, we verified these)
- Redirect mismatch → Environment variable not applied

Common issues:
- [ ] Railway variable not applied (need redeploy)
- [ ] Supabase redirect URL missing `/auth/callback`
- [ ] Browser cache (try incognito)

---

## Files Reviewed

- `.env.local` — Contains localhost development URL
- `app/login/page.tsx` — OAuth login handler ✅ Secure
- `app/auth/signup/page.tsx` — OAuth signup handler ✅ Secure
- `app/auth/callback/route.ts` — OAuth callback endpoint ✅ Secure
- `middleware.ts` — Security headers ✅ All Google domains whitelisted
- `next.config.ts` — CSP configuration ✅ Google allowed

---

## Done!

Once Step 1 and 2 are complete, test Step 3. OAuth should work.

**Full security audit:** See `OAUTH-SECURITY-AUDIT.md`
