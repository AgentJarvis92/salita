# Salita Comprehensive QA Protocol
## Phase 0 → Phase 6 Complete Validation

**Mission Control Reference:** `salita.json`  
**Current Phase:** Phase 6 (Polish + Security) @ 70%  
**QA Scope:** All completed phases (0-6)

---

## QA Team Assignments

### **🟣 Norbert (Lead QA + Functional)**
- Phase 0: Setup & OpenAI connection
- Phase 1: Auth flows (all 3 methods)
- Phase 2: Database + Analytics
- Phase 6: Polish (icons, metadata, signup page)

### **🟢 Cipher (Security + Auth)**
- Phase 1: Auth security validation
- Phase 6: Security hardening verification
- Cross-phase: Session management, cookies, headers

### **🟡 Jarvis (Integration + Deployment)**
- Phase 0: Environment setup
- Phase 5: AI backend integration
- Phase 6: Railway deployment verification
- Cross-phase: End-to-end flow testing

---

## Phase-by-Phase QA Checklist

### **PHASE 0: Setup + Cost Tracking**

**✅ Must Verify:**
- [ ] GitHub repo accessible (https://github.com/AgentJarvis92/salita)
- [ ] Supabase connected (test database read/write)
- [ ] OpenAI API working (test route returns valid response)
- [ ] Usage metrics table exists and functional
- [ ] All environment variables set correctly

**Test commands:**
```bash
curl https://salita.up.railway.app/api/test-ai
# Expected: {"success":true,"response":{...},"model":"gpt-4o"}

curl https://salita.up.railway.app/api/test-usage
# Expected: {"success":true,...}
```

**Owner:** Jarvis

---

### **PHASE 1: Authentication**

**✅ Must Verify:**
- [ ] **Email signup** works (test with new email)
- [ ] **Email login** works (test with existing account)
- [ ] **Google OAuth signup** works (test in incognito)
- [ ] **Google OAuth login** works (test with existing)
- [ ] Session persists on page refresh
- [ ] Session persists on tab close/reopen
- [ ] Logout clears session
- [ ] Protected routes redirect unauthenticated users
- [ ] No auth errors in console
- [ ] Supabase redirect URLs match Railway domain

**Test scenarios:**
1. Fresh signup (email) → verify account created in Supabase
2. Fresh signup (Google) → verify account created + profile
3. Login → refresh page → still logged in
4. Login → close tab → reopen → still logged in
5. Access /dashboard without login → redirects to /login
6. Logout → redirects to /login
7. After logout, cannot access protected routes

**Owners:** Norbert (functional), Cipher (security)

---

### **PHASE 2: Database + Profile + Analytics**

**✅ Must Verify:**
- [ ] **Tables exist:** profiles, messages, mistakes, analytics_events
- [ ] **Signup event** tracked (analytics_events has row)
- [ ] User profile created on first login
- [ ] Can query user profile by user_id
- [ ] Messages table schema correct (test insert)
- [ ] Analytics queries work (getUserEvents, hasUserCompletedEvent)

**Test queries:**
```sql
-- Check analytics tracking
SELECT * FROM analytics_events 
WHERE user_id = '<test_user_id>' 
ORDER BY created_at DESC;

-- Check profile creation
SELECT * FROM profiles WHERE user_id = '<test_user_id>';
```

**Owner:** Norbert

---

### **PHASE 3-4: UI Implementation (Dashboard + Chat)**

**✅ Must Verify:**
- [ ] Dashboard loads without errors
- [ ] Persona cards display (Ate Maria, Kuya Josh)
- [ ] Persona selection saves to database
- [ ] Chat UI loads correctly
- [ ] Message input field works
- [ ] Send button functional
- [ ] Message bubbles render (user right, AI left)
- [ ] Custom avatars display (not placeholders)
- [ ] Responsive design works (mobile + desktop)
- [ ] No layout bugs (scrolling, alignment)

**Visual checks:**
- Screenshot dashboard (verify design matches Variant)
- Screenshot chat interface (verify design matches Variant)
- Test on mobile viewport (375-430px)

**Owner:** Norbert

---

### **PHASE 5: AI Backend + Rate Limiting + Error Handling**

**✅ Must Verify:**
- [ ] `/api/chat` endpoint works
- [ ] Returns valid JSON (tagalog, english, hint, examples, tone)
- [ ] Response time < 2 seconds
- [ ] **Rate limiting:** 100 messages/day enforced
- [ ] **Rate limiting:** 3-5 second cooldown between messages
- [ ] Rate limit message displays when hit
- [ ] **Error handling:** Retry logic works (simulate failure)
- [ ] **Error handling:** Fallback message shows on persistent failure
- [ ] **Content moderation:** Unsafe content blocked
- [ ] Moderation fallback message displays
- [ ] Analytics events fire (first_message, three_messages_sent)
- [ ] Messages saved to database
- [ ] Error logs table populated on failures
- [ ] Moderation logs table populated when content flagged

**Test scenarios:**
1. Send message → verify AI responds < 2s
2. Send 101 messages in one day → verify rate limit kicks in
3. Send 2 messages < 3 seconds apart → verify cooldown
4. Simulate OpenAI API failure → verify fallback
5. Send unsafe content → verify moderation blocks it
6. Check analytics_events table for tracking

**Owner:** Jarvis (integration), Norbert (testing)

---

### **PHASE 6: Polish + Security**

**✅ Must Verify (Functional):**
- [ ] **Signup page** exists at `/auth/signup` (not 404)
- [ ] Signup page matches design
- [ ] Signup form validates input (email format, password strength)
- [ ] **PWA icons** exist (icon-192.png, icon-512.png, apple-touch-icon.png)
- [ ] PWA manifest references correct icons
- [ ] **Metadata warnings** resolved (no console errors)
- [ ] Autocomplete attributes on password inputs
- [ ] Login page links to signup page

**✅ Must Verify (Security - Cipher):**
- [ ] **Security headers present:**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] **OAuth redirect validation:**
  - [ ] Valid redirects work (/dashboard, /chat)
  - [ ] Invalid redirects blocked (default to /dashboard)
  - [ ] No open redirect vulnerability
- [ ] **Input validation:**
  - [ ] Weak passwords rejected
  - [ ] Invalid emails rejected
  - [ ] Client-side validation working
- [ ] **Error messages:**
  - [ ] Generic errors shown (no account enumeration)
  - [ ] No stack traces visible

**Test commands:**
```bash
# Check security headers
curl -I https://salita.up.railway.app/ | grep -i "content-security\|x-frame\|x-content-type\|referrer"

# Expected output should include all 4 headers
```

**Browser dev tools check:**
1. Open Network tab
2. Load page
3. Check Response Headers for security headers
4. Verify no console security warnings

**Owners:** Norbert (functional), Cipher (security)

---

## Cross-Phase Integration Tests

### **End-to-End User Flow (CRITICAL)**

**Test as brand new user:**
1. [ ] Navigate to Railway URL
2. [ ] Click "Sign up"
3. [ ] Complete signup (email or Google)
4. [ ] Redirected to dashboard
5. [ ] Select persona (Ate Maria or Kuya Josh)
6. [ ] Persona saves to database
7. [ ] Navigate to chat
8. [ ] Send first message
9. [ ] Receive AI response < 2 seconds
10. [ ] Response is valid JSON with all fields
11. [ ] Send 2 more messages
12. [ ] Analytics tracking confirms 3 messages sent
13. [ ] Session persists on refresh
14. [ ] Logout works

**Owner:** All agents (rotate through steps)

---

### **Performance Tests**

**✅ Must Verify:**
- [ ] Initial page load < 3 seconds
- [ ] AI response time < 2 seconds (average)
- [ ] No memory leaks (open dev tools, check memory)
- [ ] Chat scrolling smooth (no lag)
- [ ] No console errors during normal use

**Owner:** Jarvis

---

### **Security Tests (Cipher)**

**✅ Must Verify:**
- [ ] **Session security:**
  - [ ] httpOnly cookies used
  - [ ] Secure flag on production
  - [ ] SameSite=Lax or Strict
- [ ] **HTTPS enforced** (HTTP redirects to HTTPS)
- [ ] **No sensitive data in URLs**
- [ ] **No sensitive data in localStorage**
- [ ] **XSS protection** (security headers)
- [ ] **Clickjacking protection** (X-Frame-Options)
- [ ] **OAuth state parameter** present (CSRF protection)

**Owner:** Cipher

---

## Success Criteria (Mission Control Reference)

### **Must Pass (from successCriteria):**
- [x] User speaks Tagalog within 30 seconds *(Phase 5 - via AI hints)*
- [x] User sends at least 3 Tagalog messages *(Phase 5 - analytics tracking)*
- [x] User always knows what to say *(Phase 5 - hints + examples)*
- [ ] No crashes *(All phases - integration test)*
- [ ] Response time < 2 seconds *(Phase 5 - AI backend)*
- [ ] Conversation lasts 5+ minutes naturally *(Phase 5-6 - functional test)*
- [x] Cost-controlled (rate limits enforced) *(Phase 5 - 100 msg/day + cooldown)*
- [x] Safe (content moderation active) *(Phase 5 - OpenAI moderation)*

---

## QA Report Template

Each agent must deliver:

### **Agent: [Name]**
**Phases tested:** [List]  
**Date:** [Timestamp]

#### **Test Results:**
| Test | Status | Notes |
|------|--------|-------|
| Phase 0: Setup | ✅/❌ | ... |
| Phase 1: Auth | ✅/❌ | ... |
| ... | ... | ... |

#### **Bugs Found:**
1. [Description] - Severity: 🔴/🟠/🟡
2. ...

#### **Screenshots:**
- Dashboard: [path/to/screenshot]
- Chat: [path/to/screenshot]
- Security headers: [path/to/screenshot]

#### **Overall Grade:** A/B/C/D/F

#### **Production Ready?** YES / NO / CONDITIONAL

If NO/CONDITIONAL, list blockers:
- [ ] Blocker 1
- [ ] Blocker 2

---

## Execution Order

1. **Phase 1:** Norbert runs Phase 0-2 functional tests
2. **Phase 2:** Cipher runs Phase 1 + Phase 6 security tests (parallel)
3. **Phase 3:** Jarvis runs Phase 5 integration + deployment tests (parallel)
4. **Phase 4:** All agents run cross-phase integration tests (collaborate)
5. **Phase 5:** Compile unified report + production readiness verdict

**Total time estimate:** 2-3 hours

---

## Final Verdict Criteria

**Production-ready if:**
- ✅ All Phase 0-6 tests pass
- ✅ Security grade B+ or higher
- ✅ No critical bugs (🔴)
- ✅ Success criteria met (Mission Control)
- ✅ End-to-end user flow works flawlessly

**Not production-ready if:**
- ❌ Any Phase 0-2 tests fail (foundation broken)
- ❌ Security grade < B
- ❌ Critical bugs exist
- ❌ Auth broken
- ❌ AI backend broken

---

**Status:** READY TO EXECUTE  
**Trigger:** After Salita fix team completes current work  
**Report delivery:** Group 11 + Kevin
