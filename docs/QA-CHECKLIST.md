# Salita QA Testing Checklist
## Use this checklist for all future QA tests

---

## Pre-Testing Setup

### Environment Preparation
- [ ] Verify production URL is live and accessible
- [ ] Clear browser cache, cookies, and local storage
- [ ] Test in incognito/private browsing mode
- [ ] Check recent deployment time (ensure fresh build)
- [ ] Verify test credentials are ready (if needed)

### Tools Ready
- [ ] Browser DevTools open (Console, Network tabs)
- [ ] Screenshot tool ready
- [ ] Note-taking document open
- [ ] Timer started (track testing duration)

---

## 1. SIGNUP FLOW TESTING

### 1.1 Email Signup - Valid Credentials
- [ ] Navigate to /auth/signup
- [ ] Take screenshot (clean state)
- [ ] Enter valid email: `qatest.YYYYMMDD.HHMM@example.com`
- [ ] Enter strong password: `TestPass123!`
- [ ] Enter matching confirm password: `TestPass123!`
- [ ] Click "Create account"
- [ ] **EXPECTED:** Redirect to dashboard or email confirmation page
- [ ] **VERIFY:** No console errors
- [ ] **VERIFY:** User session created
- [ ] Take screenshot (success state)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 1.2 Email Signup - Weak Password
- [ ] Navigate to /auth/signup (fresh page)
- [ ] Enter email: `qatest.weak@example.com`
- [ ] Enter weak password: `weak` (4 chars, no uppercase/numbers)
- [ ] Enter matching confirm: `weak`
- [ ] Click "Create account"
- [ ] **EXPECTED:** Validation error displayed
- [ ] **VERIFY:** Error message mentions password requirements
- [ ] **VERIFY:** Form does not submit
- [ ] Take screenshot (error state)

**Pass/Fail:** ___________  
**Error Message:** ___________________________________________

---

### 1.3 Email Signup - Mismatched Passwords
- [ ] Navigate to /auth/signup (fresh page)
- [ ] Enter email: `qatest.mismatch@example.com`
- [ ] Enter password: `TestPass123!`
- [ ] Enter confirm: `DifferentPass456!`
- [ ] Click "Create account"
- [ ] **EXPECTED:** Error: "Passwords do not match"
- [ ] **VERIFY:** Form does not submit
- [ ] Take screenshot (error state)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 1.4 Email Signup - Duplicate Email
- [ ] Navigate to /auth/signup
- [ ] Enter email of existing user
- [ ] Enter valid password
- [ ] Click "Create account"
- [ ] **EXPECTED:** Error: "Account with this email already exists" (or similar)
- [ ] **VERIFY:** Form does not submit
- [ ] Take screenshot (error state)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 1.5 Google OAuth Signup
- [ ] Navigate to /auth/signup
- [ ] Click "Sign up with Google" button
- [ ] **VERIFY:** Redirects to Google consent screen
- [ ] Select test Google account
- [ ] Grant permissions
- [ ] **CRITICAL:** Verify redirect URL is production URL (NOT localhost:8080)
- [ ] **EXPECTED:** Redirect to dashboard
- [ ] **VERIFY:** User session created
- [ ] **VERIFY:** User profile exists in database
- [ ] **VERIFY:** No console errors
- [ ] Take screenshot (dashboard)

**Pass/Fail:** ___________  
**Redirect URL:** ___________________________________________  
**Console Errors:** ___________________________________________

---

## 2. LOGIN FLOW TESTING

### 2.1 Email Login - Valid Credentials
- [ ] Navigate to /login
- [ ] Take screenshot (clean state)
- [ ] Enter valid email (existing user)
- [ ] Enter correct password
- [ ] Click "Sign in"
- [ ] **EXPECTED:** Redirect to dashboard
- [ ] **VERIFY:** User session created
- [ ] **VERIFY:** Dashboard loads with user data
- [ ] Take screenshot (dashboard)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 2.2 Email Login - Invalid Credentials
- [ ] Navigate to /login
- [ ] Enter valid email
- [ ] Enter incorrect password
- [ ] Click "Sign in"
- [ ] **EXPECTED:** Error message (e.g., "Invalid email or password")
- [ ] **VERIFY:** Form does not submit
- [ ] **VERIFY:** User not logged in
- [ ] Take screenshot (error state)

**Pass/Fail:** ___________  
**Error Message:** ___________________________________________

---

### 2.3 Google OAuth Login
- [ ] Navigate to /login
- [ ] Click "Continue with Google"
- [ ] Select existing Google account
- [ ] **EXPECTED:** Redirect to dashboard (skip consent if already granted)
- [ ] **VERIFY:** User session created
- [ ] **VERIFY:** No console errors
- [ ] Take screenshot (dashboard)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 2.4 Password Reset Flow
- [ ] Navigate to /login
- [ ] Look for "Forgot password?" link
- [ ] If exists: Click link
- [ ] **EXPECTED:** Redirect to password reset page
- [ ] Enter email
- [ ] Click "Send reset link"
- [ ] **EXPECTED:** Success message
- [ ] Check email inbox for reset link
- [ ] Click reset link
- [ ] **EXPECTED:** Redirect to password update page
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Submit
- [ ] **EXPECTED:** Success message, redirect to login
- [ ] Test login with new password

**Pass/Fail:** ___________  
**Feature Exists:** Y / N  
**Notes:** ___________________________________________

---

### 2.5 Remember Me Functionality
- [ ] Navigate to /login
- [ ] Look for "Remember me" checkbox
- [ ] If exists: Check checkbox
- [ ] Log in with valid credentials
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate to production URL
- [ ] **EXPECTED:** User still logged in (session persists)
- [ ] If unchecked: Session should expire on browser close

**Pass/Fail:** ___________  
**Feature Exists:** Y / N  
**Notes:** ___________________________________________

---

## 3. USER INTERFACE TESTING

### 3.1 Page Load Performance
- [ ] Open DevTools Network tab
- [ ] Navigate to /login
- [ ] Record page load time: __________ ms
- [ ] Navigate to /auth/signup
- [ ] Record page load time: __________ ms
- [ ] Log in and navigate to dashboard
- [ ] Record page load time: __________ ms
- [ ] **EXPECTED:** All pages load in < 2 seconds

**Pass/Fail:** ___________  
**Average Load Time:** ___________________________________________

---

### 3.2 Mobile Responsiveness
- [ ] Open browser responsive design mode (or use mobile device)
- [ ] Set viewport to iPhone (375x667)
- [ ] Test /login page
  - [ ] All elements visible
  - [ ] Buttons tappable (min 44px)
  - [ ] Text readable (min 16px)
  - [ ] No horizontal scroll
- [ ] Test /auth/signup page
  - [ ] All elements visible
  - [ ] Form fields properly sized
  - [ ] Keyboard doesn't cover inputs
- [ ] Test dashboard
  - [ ] Navigation works
  - [ ] Content readable
  - [ ] Touch targets adequate
- [ ] Take screenshots (iPhone view)

**Pass/Fail:** ___________  
**Issues Found:** ___________________________________________

---

### 3.3 Form Validation Feedback
- [ ] Test each form field individually
- [ ] **Email field:**
  - [ ] Enter invalid format (e.g., "notanemail")
  - [ ] **VERIFY:** Real-time validation error (or on blur)
  - [ ] **VERIFY:** Error message specific and helpful
- [ ] **Password field:**
  - [ ] Enter weak password
  - [ ] **VERIFY:** Requirements shown (8 chars, uppercase, numbers)
  - [ ] **VERIFY:** Visual indicator (red/green)
- [ ] **Confirm password field:**
  - [ ] Enter mismatched password
  - [ ] **VERIFY:** Error shown immediately (or on blur)
- [ ] **VERIFY:** All error messages user-friendly (no technical jargon)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 3.4 Navigation Between Pages
- [ ] Test all navigation links:
  - [ ] Login → Signup (via "Sign up" link)
  - [ ] Signup → Login (via "Sign in" link)
  - [ ] Dashboard → Profile
  - [ ] Dashboard → Chat
  - [ ] Dashboard → Home
- [ ] **VERIFY:** No broken links
- [ ] **VERIFY:** No 404 errors
- [ ] **VERIFY:** Smooth transitions

**Pass/Fail:** ___________  
**Broken Links:** ___________________________________________

---

## 4. CRITICAL BUG CHECKS

### 4.1 OAuth Redirect URL
- [ ] During OAuth flow, monitor Network tab
- [ ] **CRITICAL:** Redirect URL must be production URL
- [ ] **VERIFY:** No localhost:8080 references in:
  - [ ] Console logs
  - [ ] Network requests
  - [ ] Final redirect URL

**Pass/Fail:** ___________  
**Redirect URL:** ___________________________________________

---

### 4.2 Signup Button Functionality
- [ ] Click "Create account" multiple times rapidly
- [ ] **VERIFY:** No duplicate account creation
- [ ] **VERIFY:** Button disabled during submission
- [ ] **VERIFY:** Loading indicator shown
- [ ] **VERIFY:** No unhandled errors

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 4.3 Redirect Loops
- [ ] Test all authentication redirects
- [ ] **VERIFY:** No infinite redirect loops
- [ ] **VERIFY:** Logged-in user accessing /login → redirects once to dashboard
- [ ] **VERIFY:** Logged-out user accessing dashboard → redirects once to /login
- [ ] Check console for "too many redirects" errors

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

### 4.4 Session Persistence
- [ ] Log in to application
- [ ] Refresh page (Cmd+R / Ctrl+R)
- [ ] **VERIFY:** User still logged in
- [ ] Navigate to different page
- [ ] Refresh page
- [ ] **VERIFY:** User still logged in
- [ ] Close browser tab
- [ ] Reopen production URL in new tab
- [ ] **VERIFY:** User still logged in (if "Remember me" enabled)

**Pass/Fail:** ___________  
**Notes:** ___________________________________________

---

## 5. DASHBOARD (POST-LOGIN)

### 5.1 Dashboard Rendering
- [ ] Log in successfully
- [ ] **VERIFY:** Dashboard loads without errors
- [ ] **VERIFY:** User greeting displayed (personalized)
- [ ] **VERIFY:** Main content visible
- [ ] **VERIFY:** Navigation bar present
- [ ] Take screenshot (full dashboard)

**Pass/Fail:** ___________  
**Console Errors:** ___________________________________________

---

### 5.2 Console Error Check
- [ ] Open DevTools Console
- [ ] Navigate through entire app flow (signup → login → dashboard)
- [ ] **CHECK FOR:**
  - [ ] 4xx errors (client errors)
  - [ ] 5xx errors (server errors)
  - [ ] JavaScript exceptions
  - [ ] Network failures
- [ ] Document all errors with:
  - [ ] Error message
  - [ ] URL that caused error
  - [ ] HTTP status code
  - [ ] Timestamp

**Pass/Fail:** ___________  
**Errors Found:** ___________________________________________

---

## 6. SECURITY & BEST PRACTICES

### 6.1 HTTPS Verification
- [ ] Check URL bar for padlock icon
- [ ] Click padlock → View certificate
- [ ] **VERIFY:** Certificate valid
- [ ] **VERIFY:** Not expired
- [ ] **VERIFY:** Matches production domain

**Pass/Fail:** ___________  
**Certificate Expiry:** ___________________________________________

---

### 6.2 Sensitive Data Handling
- [ ] Open DevTools Network tab
- [ ] Submit login form
- [ ] Click on request in Network tab
- [ ] **VERIFY:** Passwords not visible in URL
- [ ] **VERIFY:** Passwords not in query parameters
- [ ] **VERIFY:** Request uses HTTPS
- [ ] **VERIFY:** Response doesn't leak sensitive data

**Pass/Fail:** ___________  
**Issues Found:** ___________________________________________

---

### 6.3 Accessibility Quick Check
- [ ] Test keyboard navigation (Tab key)
- [ ] **VERIFY:** Can navigate entire form with keyboard only
- [ ] **VERIFY:** Focus indicators visible
- [ ] Test form with screen reader (if available)
- [ ] **VERIFY:** Error messages announced
- [ ] **VERIFY:** Form labels properly associated

**Pass/Fail:** ___________  
**Issues Found:** ___________________________________________

---

## 7. POST-TEST CLEANUP

### Documentation
- [ ] Compile all screenshots into EVIDENCE.md
- [ ] Document all bugs in main report
- [ ] Rate severity: Critical / High / Medium / Low
- [ ] Create action items with priorities
- [ ] Generate executive summary

### Deliverables Checklist
- [ ] functional-test-report.md (full report)
- [ ] SUMMARY.md (executive summary)
- [ ] ACTION-ITEMS.md (prioritized bugs)
- [ ] EVIDENCE.md (screenshots & logs)
- [ ] README.md (navigation hub)

---

## Test Completion Summary

**Total Tests Run:** _____ / _____  
**Tests Passed:** _____  
**Tests Failed:** _____  
**Critical Bugs:** _____  
**Medium Issues:** _____  
**Minor Issues:** _____  

**Production Readiness Verdict:** ✅ GO / ⚠️ CONDITIONAL GO / ❌ NO-GO

**Tester Signature:** _____________________  
**Date:** _____________________  
**Time Spent:** _____ minutes

