# Salita OAuth & Security Report
**Date:** 2026-02-16 | **Agent:** Security Specialist

---

## 🚨 CRITICAL FINDING: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

**Root Cause Confirmed.** The `.env.local` file had `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, causing Google OAuth to redirect users back to localhost after authentication.

**Fix Applied:** Changed to `https://salita-production.up.railway.app` in `.env.local`.

**⚠️ RAILWAY ACTION REQUIRED:** The Railway deployment environment variable `NEXT_PUBLIC_SITE_URL` MUST also be set to `https://salita-production.up.railway.app`. Since `NEXT_PUBLIC_` vars are baked into the build at compile time, a **redeploy is required** after changing this.

---

## 1. Environment Variables

| Variable | `.env.local` (before) | `.env.local` (after) | Railway (needs verification) |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ❌ `http://localhost:3000` | ✅ `https://salita-production.up.railway.app` | ⚠️ **MUST SET & REDEPLOY** |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Correct | ✅ Correct | Verify matches |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Correct | ✅ Correct | Verify matches |

---

## 2. OAuth Code Review

### `app/login/page.tsx` — ✅ Code is correct
- Uses `process.env.NEXT_PUBLIC_SITE_URL` for redirect
- Redirects to `${siteUrl}/auth/callback`
- Has null check for missing env var

### `app/auth/signup/page.tsx` — ✅ Code is correct
- Same pattern as login, uses `process.env.NEXT_PUBLIC_SITE_URL`
- Redirects to `${siteUrl}/auth/callback`
- Has null check for missing env var

### `app/auth/callback/route.ts` — ⚠️ Minor issue
- Exchanges code for session correctly
- Creates profile for new users
- Has open redirect protection (allowlist)
- **Issue:** Uses `createClient()` directly instead of `createServerClient()` from `@supabase/ssr`. This means cookies may not be properly set on the response, causing the session to be lost after redirect. **Recommendation:** Refactor to use `@supabase/ssr` `createServerClient` with proper cookie handling.

---

## 3. Supabase Configuration — ACTION REQUIRED

The following must be verified/set in the [Supabase Dashboard](https://supabase.com/dashboard/project/wbcfrfpndsczqtuilfsl/auth/url-configuration):

| Setting | Required Value |
|---|---|
| **Site URL** | `https://salita-production.up.railway.app` |
| **Redirect URLs** | `https://salita-production.up.railway.app/auth/callback` |
| **Google OAuth Provider** | Enabled with valid client ID & secret |

Also verify in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- **Authorized redirect URIs** must include: `https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback`
- **Authorized JavaScript origins** must include: `https://salita-production.up.railway.app`

---

## 4. Security Headers Review

### CSP (Content-Security-Policy) — ⚠️ Two issues

**Issue 1: Duplicate CSP headers**
CSP is set in BOTH `middleware.ts` AND `next.config.ts`. The middleware version includes `'unsafe-inline'` for scripts, the next.config version does not. When both are sent, browsers enforce the **most restrictive** policy. This means `'unsafe-inline'` may be blocked anyway.

**Recommendation:** Remove CSP from `next.config.ts` and keep only the middleware version (which is more complete).

**Issue 2: `form-action 'self'`**
Both CSP policies include `form-action 'self'`. Google OAuth uses a form POST redirect. This *shouldn't* block it since Supabase handles the redirect server-side, but if issues persist, add `https://accounts.google.com` to `form-action`.

### Other Headers — ✅ All good
- `X-Frame-Options: DENY` — Correct, prevents clickjacking
- `X-Content-Type-Options: nosniff` — Correct
- `Referrer-Policy: strict-origin-when-cross-origin` — Compatible with OAuth
- `frame-src https://accounts.google.com` — Allows Google sign-in popup
- `connect-src` includes Supabase URL — Correct

### Middleware Auth Check — ✅ No OAuth blocking
- Only protects `/chat` and `/dashboard`
- `/auth/callback` is NOT blocked
- `/login` and `/auth/signup` are NOT blocked

---

## 5. Summary of Required Actions

### Norbert must do:

1. **Railway:** Set `NEXT_PUBLIC_SITE_URL=https://salita-production.up.railway.app` in Railway env vars → **Redeploy**
2. **Supabase Dashboard:** Set Site URL to `https://salita-production.up.railway.app`
3. **Supabase Dashboard:** Add `https://salita-production.up.railway.app/auth/callback` to Redirect URLs
4. **Google Cloud Console:** Verify authorized redirect URI includes `https://wbcfrfpndsczqtuilfsl.supabase.co/auth/v1/callback`

### Code fixes (can be done in next commit):

5. **Remove duplicate CSP** from `next.config.ts` (keep middleware version only)
6. **Refactor callback route** to use `@supabase/ssr` `createServerClient` for proper cookie handling

### Already fixed:
- ✅ `.env.local` updated to use Railway URL
