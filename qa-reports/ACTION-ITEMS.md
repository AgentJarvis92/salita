# Salita Production QA - Action Items

**Priority:** P0 = Critical (fix before public launch), P1 = High (fix within 24h), P2 = Medium (fix within week)

---

## 🔴 P0 - Critical (Fix Before Public Launch)

### 1. Fix Password Validation Bug
**Issue:** Form shows "Passwords do not match" error when passwords actually match

**Steps to Reproduce:**
1. Go to /auth/signup
2. Enter email: test@example.com
3. Enter password: TestPass123
4. Enter confirm password: TestPass123
5. Click "Create account"
6. See error: "Passwords do not match"

**Suspected Causes:**
- Form state not syncing with DOM values
- Browser autofill interfering with field values
- React state management issue

**Action Required:**
```javascript
// Debug steps:
1. Add console.log in form submit handler to see actual values
2. Check if password/confirmPassword state matches input values
3. Test with autocomplete="off" on form
4. Add onBlur validation to catch issues earlier
```

**Owner:** Kevin  
**Deadline:** Before public launch  
**Estimated Time:** 1-2 hours

---

### 2. Manually Test Google OAuth Flow
**Issue:** Could not test due to browser automation limitations

**Test Steps:**
1. Click "Sign up with Google" on /auth/signup
2. Select Google account
3. Grant permissions
4. **CRITICAL CHECK:** Verify redirect URL is `https://salita-production.up.railway.app` (NOT localhost:8080)
5. Verify user lands on dashboard
6. Check console for errors

**Expected:** Clean OAuth flow with no localhost references

**If localhost redirect occurs:**
- Check Supabase Auth settings → Google OAuth → Redirect URLs
- Should be: `https://salita-production.up.railway.app/auth/callback`

**Owner:** Kevin  
**Deadline:** Before public launch  
**Estimated Time:** 15 minutes

---

## 🟡 P1 - High Priority (Fix Within 24 Hours)

### 3. Fix Supabase Profile Fetch 406 Errors
**Issue:** Console shows repeated 406 errors when fetching user profile

**Error:**
```
Failed to load resource: the server responded with a status of 406 ()
URL: https://wbcfrfpndsczqtuilfsl.supabase.co/rest/v1/profiles?select=name&user_id=eq.3a88ecbc-01b6-4b86-ae79-4c7792eeab08
```

**Suspected Causes:**
- RLS policy missing or incorrect on profiles table
- Accept header mismatch in request
- Profile record doesn't exist for user

**Action Required:**
```sql
-- Check RLS policies on profiles table
SELECT * FROM profiles WHERE user_id = '3a88ecbc-01b6-4b86-ae79-4c7792eeab08';

-- Verify RLS policy allows user to read own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);
```

**Also check:**
- Supabase API settings → Accept header configuration
- Profile creation on signup (is profile created automatically?)

**Owner:** Kevin  
**Deadline:** Within 24 hours post-launch  
**Estimated Time:** 30 minutes

---

### 4. Add Error Logging for Signup
**Issue:** Need visibility into signup failures

**Action Required:**
```javascript
// Add to signup handler
try {
  const { data, error } = await supabase.auth.signUp({...});
  if (error) {
    console.error('[SIGNUP_ERROR]', {
      email: email,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    // Consider sending to error tracking service (Sentry, LogRocket, etc.)
  }
} catch (e) {
  console.error('[SIGNUP_EXCEPTION]', e);
}
```

**Owner:** Kevin  
**Deadline:** With hotfix deployment  
**Estimated Time:** 15 minutes

---

## 🟢 P2 - Medium Priority (Fix Within Week)

### 5. Add Password Reset Functionality
**Issue:** No "Forgot password?" link on login page

**Action Required:**
1. Add "Forgot password?" link on /login page
2. Create /auth/reset-password page
3. Implement Supabase password reset:
```javascript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://salita-production.up.railway.app/auth/update-password',
});
```
4. Create /auth/update-password page for password entry

**Owner:** Kevin  
**Deadline:** Within 1 week  
**Estimated Time:** 2-3 hours

---

### 6. Add "Remember Me" Checkbox
**Issue:** Session expires when browser closes

**Action Required:**
```javascript
// On login, set session duration based on checkbox
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    refreshSession: rememberMe ? true : false,
    // Could also adjust session duration here
  }
});
```

**Owner:** Kevin  
**Deadline:** Within 1 week  
**Estimated Time:** 30 minutes

---

### 7. Implement Real-time Form Validation
**Issue:** Validation only triggers on form submission

**Action Required:**
- Add `onChange` validation for email format
- Add `onBlur` validation for password requirements
- Show green checkmarks for valid fields
- Show red borders + error messages for invalid fields

**Example:**
```javascript
const [errors, setErrors] = useState({});

const validateEmail = (email) => {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return null;
};

// In input component
<input
  onBlur={(e) => {
    const error = validateEmail(e.target.value);
    setErrors({...errors, email: error});
  }}
  className={errors.email ? 'border-red-500' : 'border-gray-300'}
/>
```

**Owner:** Kevin  
**Deadline:** Within 1 week  
**Estimated Time:** 2 hours

---

### 8. Fix Form State Management
**Issue:** Email field value changes unexpectedly during submission

**Action Required:**
- Review form state management
- Ensure controlled components (value tied to React state)
- Add `autocomplete="off"` to prevent browser interference
- Test with React DevTools to watch state changes

**Owner:** Kevin  
**Deadline:** With validation bug fix  
**Estimated Time:** 30 minutes

---

### 9. Remove `user-scalable=no` from Viewport
**Issue:** Viewport restricts zoom, violating WCAG accessibility guidelines

**Current:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

**Change to:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Owner:** Kevin  
**Deadline:** Within 1 week  
**Estimated Time:** 5 minutes

---

## 📋 Testing Checklist (Post-Fix)

After addressing P0/P1 issues, re-test:

- [ ] Email signup with valid credentials → success
- [ ] Email signup with weak password → error message
- [ ] Email signup with mismatched passwords → specific error
- [ ] Email signup with duplicate email → error message
- [ ] Google OAuth signup → redirects to Railway URL
- [ ] Google OAuth signup → creates profile successfully
- [ ] Login with valid credentials → dashboard loads
- [ ] Login with invalid credentials → error message
- [ ] Profile fetch → no console errors
- [ ] Page refresh → session persists

---

## 🚀 Deployment Plan

### Immediate (Now)
1. Deploy current version to production
2. Enable Google OAuth as primary signup method
3. Monitor for critical errors

### Hotfix (Within 24h)
1. Fix password validation bug
2. Fix profile fetch 406 errors
3. Add error logging
4. Deploy hotfix

### Sprint 2 (Within 1 week)
1. Add password reset
2. Add "Remember me"
3. Implement real-time validation
4. Fix accessibility issues

---

## 📊 Success Metrics

Track after deployment:
- **Signup conversion rate** (visits to /auth/signup → successful account creation)
- **Google OAuth vs Email signup ratio**
- **Console error frequency** (406 errors)
- **Login success rate**
- **Time to first successful conversation** (onboarding completion)

---

**Questions?** Reach out to QA agent or review full report: `functional-test-report.md`

