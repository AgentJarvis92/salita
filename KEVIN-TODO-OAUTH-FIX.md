# Kevin's Manual Task: Fix Google OAuth Redirect

**When:** When you get home
**Why:** OAuth currently redirects to localhost:8080 instead of production URL

## Steps:

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Navigate to: APIs & Services → Credentials
3. Find OAuth 2.0 Client ID for Salita
4. Edit "Authorized redirect URIs"
5. Remove: `http://localhost:8080/auth/callback`
6. Add: `https://salita-production.up.railway.app/auth/callback`
7. Save changes

## Verify:

1. Go to https://salita-production.up.railway.app/login
2. Click "Continue with Google"
3. Authorize app
4. Should redirect to: https://salita-production.up.railway.app/dashboard
5. NOT to: http://localhost:8080/...

---

**Reminder set by Jarvis on 2026-02-16 @ 5:45 PM EST**
