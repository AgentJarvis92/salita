# SALITA SECURITY - QUICK FIX GUIDE
## Copy-Paste Solutions for Critical Issues

**Estimated Time to Apply:** 40 minutes  
**Difficulty:** Easy  
**Impact:** Resolves 3 CRITICAL vulnerabilities

---

## ISSUE #1: Add Missing Security Headers
**Time:** 15 minutes  
**Impact:** Prevents XSS, clickjacking, MIME-sniffing attacks

### Step 1: Update `next.config.ts`

Replace your entire `next.config.ts` with:

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Legacy XSS protection (CSP is better)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Content Security Policy - CRITICAL
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://wbcfrfpndsczqtuilfsl.supabase.co https://accounts.google.com",
              "frame-src https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default config
```

### Step 2: Verify It Works

```bash
# Restart dev server
npm run dev

# In another terminal, check headers
curl -i http://localhost:3000 | grep -E "X-Frame|Content-Security|X-Content"
```

### Expected Output:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; ...
```

---

## ISSUE #2: Fix OAuth Open Redirect Vulnerability
**Time:** 5 minutes  
**Impact:** Prevents account hijacking via OAuth redirect

### Step 1: Update `app/login/page.tsx`

Find this code:
```typescript
const handleGoogleLogin = async () => {
  setLoading(true)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
    },
  })
  // ... rest of code
}
```

Replace with:
```typescript
const handleGoogleLogin = async () => {
  setLoading(true)
  setError('')
  
  // Require NEXT_PUBLIC_SITE_URL - fail if not set
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    setError('Configuration error. Please contact support.')
    setLoading(false)
    return
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,  // No fallback!
    },
  })

  if (error) {
    setError(error.message)
    setLoading(false)
  }
}
```

### Step 2: Verify Environment Variable

Check `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production:
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Step 3: Test OAuth Flow
```
1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. Should redirect to Google OAuth
4. Should return to http://localhost:3000/auth/callback
✅ If successful: Login works without error
```

---

## ISSUE #3: Use Generic Error Messages
**Time:** 15 minutes  
**Impact:** Prevents account enumeration attacks

### Step 1: Update Error Handling

Find this code in `app/login/page.tsx`:
```typescript
const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    setError(error.message)  // ❌ Shows raw error
    setLoading(false)
  } else {
    router.push('/')
  }
}
```

Replace with:
```typescript
const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // ✅ Use generic message for all auth failures
    setError('Email or password is incorrect')
    setLoading(false)
  } else {
    router.push('/')
  }
}
```

### Step 2: Do the Same for Signup

Find signup error handling:
```typescript
const handleEmailSignup = async (e: React.FormEvent) => {
  // ... signup code ...
  if (error) {
    setError(error.message)  // ❌ Shows raw error
  }
}
```

Replace with:
```typescript
const handleEmailSignup = async (e: React.FormEvent) => {
  // ... signup code ...
  if (error) {
    // ✅ Use generic message
    setError('Unable to create account. Please try again.')
    setLoading(false)
  }
}
```

### Step 3: Test Errors
```
1. Try wrong password: Should see "Email or password is incorrect"
2. Try non-existent email: Should see "Email or password is incorrect"
3. Try invalid email: Should see "Email or password is incorrect"
✅ All should show same message
```

---

## BONUS: Add Input Validation (Highly Recommended)
**Time:** 30 minutes  
**Impact:** Prevents weak passwords, improves UX

### Step 1: Install Zod (if not already installed)

```bash
npm install zod
```

### Step 2: Add Validation Schema

Add to top of `app/login/page.tsx`:

```typescript
import { z } from 'zod'

const authSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})
```

### Step 3: Use Validation in Login

Replace login handler:
```typescript
const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    // Validate input
    const validated = authSchema.parse({ email, password })

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      setError('Email or password is incorrect')
    } else {
      router.push('/')
    }
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      setError(validationError.errors[0].message)
    }
  } finally {
    setLoading(false)
  }
}
```

### Step 4: Use Validation in Signup

```typescript
const handleEmailSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    // Validate input
    const validated = authSchema.parse({ email, password })

    const { error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      setError('Unable to create account. Please try again.')
    } else {
      router.push('/')
    }
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      setError(validationError.errors[0].message)
    }
  } finally {
    setLoading(false)
  }
}
```

### Step 5: Test Validation
```
1. Leave email empty: "Email is required"
2. Enter bad email: "Please enter a valid email address"
3. Password < 8 chars: "Password must be at least 8 characters"
4. Password "Abc12345" (no special char): Allowed ✅
✅ Validation working
```

---

## BONUS: Add Form Autocomplete Attributes
**Time:** 5 minutes  
**Impact:** Enables password manager auto-fill

### Step 1: Update Email Input

Find:
```jsx
<input
  id="email"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="..."
/>
```

Change to:
```jsx
<input
  id="email"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"  // ADD THIS LINE
  className="..."
/>
```

### Step 2: Update Password Input

Find:
```jsx
<input
  id="password"
  type="password"
  required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="..."
/>
```

Change to:
```jsx
<input
  id="password"
  type="password"
  required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="current-password"  // ADD THIS LINE for login
  // OR use autoComplete="new-password" for signup
  className="..."
/>
```

### Step 3: Test in Browser
```
1. Open browser Developer Tools
2. Go to Settings > Passwords
3. Try saving a password
4. On next visit to login: Should auto-fill ✅
```

---

## VERIFICATION CHECKLIST

### After All Fixes:

```
Security Headers:
[ ] X-Frame-Options present
[ ] Content-Security-Policy present
[ ] X-Content-Type-Options present
[ ] Referrer-Policy present

OAuth:
[ ] Google OAuth still works
[ ] Redirects to /auth/callback
[ ] No open redirect warning

Error Messages:
[ ] All auth errors show generic message
[ ] No sensitive info leaked
[ ] Same message for all failure reasons

Validation:
[ ] Email validation works
[ ] Password validation works
[ ] Invalid inputs rejected
[ ] Error messages helpful

Forms:
[ ] Autocomplete attributes present
[ ] Password manager can auto-fill
[ ] Browser password suggestions work
```

---

## TESTING COMMANDS

```bash
# Restart server
npm run dev

# Test security headers
curl -i http://localhost:3000 | grep -i "x-frame\|content-security"

# Test OAuth flow
# 1. Visit http://localhost:3000/login
# 2. Click "Continue with Google"
# 3. Complete Google auth
# 4. Should redirect to dashboard

# Test error messages
# 1. Try email: test@test.com, password: wrong
# 2. Should see: "Email or password is incorrect"
# 3. Try email: notreal@test.com, password: anything
# 4. Should see SAME message
```

---

## PRODUCTION DEPLOYMENT CHECKLIST

Before deploying to production:

```
[ ] NEXT_PUBLIC_SITE_URL set to https://your-domain.com
[ ] HTTPS is enforced
[ ] All security headers present
[ ] Error messages are generic
[ ] Input validation working
[ ] OAuth flow tested end-to-end
[ ] Database security verified
[ ] Environment variables secured
[ ] No console.log statements with sensitive data
[ ] Monitoring and logging configured
```

---

## QUICK SUMMARY

| Issue | Fix | Time | Impact |
|-------|-----|------|--------|
| No CSP | Add header | 15m | Prevents XSS |
| Clickjacking | Add X-Frame-Options | 5m | Prevents UI redressing |
| Open Redirect | Remove fallback | 5m | Prevents account hijacking |
| Info Leakage | Generic errors | 15m | Prevents enumeration |
| No Validation | Add Zod schema | 30m | Prevents weak passwords |
| No Autocomplete | Add attributes | 5m | Improves UX |

**Total Time: 75 minutes → Production Ready**

---

## QUESTIONS?

Refer to:
- Full Report: `SECURITY-ASSESSMENT-CIPHER.md`
- Findings Summary: `SECURITY-FINDINGS-SUMMARY.md`
- OAuth Diagram: `OAUTH-FLOW-DIAGRAM.md`

---

**Quick Fix Guide Created By:** Cipher Security QA  
**Status:** READY TO IMPLEMENT  
**Last Updated:** 2026-02-16
