# SALITA — BUILD PLAN (STRICT — NO SKIPPING)

**Project:** AI Tagalog Tutor  
**Approach:** Phase-by-phase, QA-gated  
**Rule:** DO NOT SKIP PHASES. DO NOT SHIP BROKEN FEATURES. VERIFY EVERYTHING.

**Last Updated:** 2026-02-15 00:51 EST  
**Status:** Production-ready additions integrated

---

## MVP OBJECTIVE

A user can:
1. Sign up
2. Choose a tutor
3. Enter chat immediately
4. Be guided to speak Tagalog
5. Receive:
   - Tagalog response
   - English support
   - Hint (how to respond)
   - Examples (buttons)
   - Correction (if needed)
   - Cultural notes

---

## SUCCESS CRITERIA

MVP is complete ONLY if:
- ✅ User speaks Tagalog within 30 seconds
- ✅ User sends at least 3 Tagalog messages
- ✅ User always knows what to say
- ✅ No crashes
- ✅ Response time < 2 seconds
- ✅ Conversation lasts 5+ minutes naturally
- ✅ **Rate limits enforced (cost control)**
- ✅ **Error handling active (stability)**
- ✅ **Content moderation active (safety)**
- ✅ **Analytics tracking (success metrics)**

---

## TECH STACK

- **Frontend:** Next.js (React)
- **Backend:** Next.js API routes or Node.js/Express
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4
- **Auth:** Supabase Auth (Apple/Google/Email)
- **Hosting:** Vercel (frontend) + Railway/Vercel (backend)
- **Moderation:** OpenAI Moderation API

---

## BUILD PHASES

---

### PRE-PHASE 0 — AI TEST (MANDATORY BEFORE BUILD)

**STOP. DO NOT BUILD ANYTHING YET.**

Before starting development, you MUST test the AI system prompt.

**Where to test:**
- OpenAI Playground: https://platform.openai.com/playground
- Use exact system prompt from `AI-SYSTEM-RULES.md`

**Test scenarios:**

1. **Full onboarding flow:**
   - AI asks for name in Tagalog
   - AI asks skill level
   - AI asks goal
   - AI asks for full sentence
   - Validate: User sends 3+ Tagalog messages

2. **Beginner conversation:**
   - Simulate user with basic Tagalog
   - Validate: hints are clear, examples are simple

3. **Casual conversation (Kuya Josh persona):**
   - Test Taglish tone
   - Validate: feels friendly, not formal

**Validate:**
- ✅ AI always returns valid JSON
- ✅ All required fields present (tagalog, english, hint, examples, correction, note, tone)
- ✅ Hints are clear and actionable (start with "Sabihin:")
- ✅ Examples match hint
- ✅ Tone feels human (not robotic)
- ✅ Correction is positive (not harsh)
- ✅ Cultural notes are relevant (not spammy)

**Fix prompt issues BEFORE building infrastructure.**

**STOP if validation fails. Fix prompt before Phase 0.**

---

### PHASE 0 — SETUP + COST TRACKING

**Build:**
- Repo
- Next.js app
- Backend
- Supabase
- OpenAI

**ADDITION: Cost Tracking Table**

Create table: `usage_metrics`

```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message_count INT DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Behavior:**
- Increment `message_count` on every user message
- One row per user per day
- Used for rate limiting (Phase 5)

**QA:**
- ✅ App runs
- ✅ DB connected
- ✅ AI returns test response
- ✅ Usage metrics table created
- ✅ Can increment message count
- ✅ Can query per user per day

**STOP if fail.**

---

### PHASE 1 — AUTH

**Build:**
- Login/signup
- Sessions

**QA:**
- ✅ Signup works
- ✅ Login works
- ✅ Session persists
- ✅ Logout works

**STOP if fail.**

---

### PHASE 2 — DB + USER PROFILE + ANALYTICS

**Build:**
- Tables for users, profile, messages

**ADDITION: Analytics Events Table**

Create table: `analytics_events`

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Track events:**
- `signup` — user creates account
- `persona_selected` — user chooses tutor
- `first_message` — user sends first message
- `three_messages_sent` — user sends 3rd message
- `session_5_min` — user active for 5+ minutes

**QA:**
- ✅ Data saves and loads correctly
- ✅ Analytics events table created
- ✅ Events recorded correctly
- ✅ Data queryable

**STOP.**

---

### PHASE 3 — TUTOR SELECTION

**Build:**
- UI
- Save tutor
- Fire `persona_selected` analytics event

**QA:**
- ✅ Selection persists
- ✅ Analytics event fires

**STOP.**

---

### PHASE 4 — CHAT UI

**Build:**
- Chat interface
- Input
- Messages

**QA:**
- ✅ Messages send and display
- ✅ No UI bugs

**STOP.**

---

### PHASE 5 — AI CONNECTION + RATE LIMITING + ERROR HANDLING + CONTENT MODERATION

**Build:**
- Connect to OpenAI
- Return JSON

**ADDITION 1: Rate Limiting**

**Rules:**
- Max 100 messages per user per day
- 3-5 second cooldown between messages

**Check `usage_metrics` before processing:**

```javascript
const today = new Date().toISOString().split('T')[0];
const usage = await getUsageMetrics(userId, today);

if (usage.message_count >= 100) {
  return {
    tagalog: "Grabe! Ang sipag mo ngayong araw! 🔥",
    english: "You're on fire today! 🔥 But let's take a break. Come back tomorrow 😊",
    hint: "Sabihin: 'Sige, bukas na lang'",
    examples: ["Sige, bukas na lang", "Okay"],
    correction: "",
    note: "",
    tone: "warm"
  };
}
```

**Cooldown:**
- Track last message timestamp
- If < 3 seconds since last message, disable input temporarily
- Show UI indicator: "Slow down... ⏳"

**ADDITION 2: Error Handling**

**Flow:**
1. Try AI request
2. If fail → retry up to 2 times
3. If still fail → return fallback

**Fallback response:**

```json
{
  "tagalog": "Sandali lang, nagkaka-problema ako ngayon.",
  "english": "Give me a moment, I'm having trouble right now.",
  "hint": "Sabihin: 'Sige' o 'Okay'.",
  "examples": ["Sige", "Okay"],
  "correction": "",
  "note": "",
  "tone": "warm"
}
```

**Also:**
- Log all failures to `error_logs` table

**ADDITION 3: Content Moderation**

**Flow:**
1. AI generates response
2. Run OpenAI Moderation API check
3. If flagged:
   - Do NOT show response
   - Replace with:

```json
{
  "tagalog": "Huwag nating pag-usapan yan. 😊",
  "english": "Let's keep things respectful 😊",
  "hint": "Sabihin: 'Okay' o 'Sige'",
  "examples": ["Okay", "Sige"],
  "correction": "",
  "note": "",
  "tone": "warm"
}
```

4. Log flagged content to `moderation_logs` table

**QA:**
- ✅ Response <2 seconds
- ✅ JSON valid
- ✅ Tagalog present
- ✅ Rate limit enforced
- ✅ Cooldown works
- ✅ Retry logic works
- ✅ Fallback displays on error
- ✅ Content moderation active
- ✅ Unsafe content blocked

**STOP.**

---

### PHASE 6 — RESPONSE RENDERING

**Build:**
- Show Tagalog
- English
- Hint
- Examples
- Notes

**QA:**
- ✅ All fields display correctly

**STOP.**

---

### PHASE 7 — CONVERSATIONAL ONBOARDING + RETENTION HOOK

**Build:**
- AI onboarding flow
- Save data
- Fire analytics events (`first_message`, `three_messages_sent`)

**ADDITION: Retention Hook**

At end of onboarding, AI must say:

```json
{
  "tagalog": "Magaling! 🇵🇭 Bukas, turuan kita kung paano makipag-usap sa iyong nanay sa Tagalog 😊",
  "english": "Great job! 🇵🇭 Tomorrow, I'll teach you how to talk to your mom in Tagalog 😊",
  "hint": "Sabihin: 'Sige!' o 'Salamat!'",
  "examples": ["Sige!", "Salamat!"],
  "correction": "",
  "note": "",
  "tone": "warm"
}
```

**Goal:** Encourage return usage.

**QA:**
- ✅ User sends 3 Tagalog messages
- ✅ Data stored
- ✅ Flow <60 sec
- ✅ Retention hook appears
- ✅ Analytics events fire

**STOP.**

---

### PHASE 8 — SUGGESTED REPLIES

**Build:**
- Buttons from examples[]

**QA:**
- ✅ Tap sends message

**STOP.**

---

### PHASE 9 — CORRECTIONS

**Build:**
- Detect errors
- Suggest fixes

**QA:**
- ✅ Accurate and positive
- ✅ Not intrusive

**STOP.**

---

### PHASE 10 — CULTURAL NOTES

**Build:**
- Add notes

**QA:**
- ✅ Relevant, not spammy

**STOP.**

---

### PHASE 11 — MEMORY

**Build:**
- Store mistakes

**QA:**
- ✅ System adapts

**STOP.**

---

### PHASE 12 — PROMPTS

**Build:**
- Conversation starters
- Daily prompt

**QA:**
- ✅ Works correctly

**STOP.**

---

### PHASE 13 — SHARE

**Build:**
- Generate image

**QA:**
- ✅ Image renders

**STOP.**

---

### PHASE 14 — AI INFLUENCER SYSTEM

**Build:**
- Persona profiles
- Script generator

**QA:**
- ✅ Outputs usable scripts

**STOP.**

---

## FINAL QA

### User must:
- ✅ Sign up
- ✅ Choose tutor
- ✅ Enter chat
- ✅ Speak Tagalog
- ✅ Receive guidance
- ✅ Share content

### App must:
- ✅ Not crash
- ✅ Be fast
- ✅ Feel human
- ✅ **Enforce rate limits (cost control)**
- ✅ **Handle errors gracefully (stability)**
- ✅ **Block unsafe content (safety)**
- ✅ **Track analytics (metrics)**
- ✅ **Show retention hook (growth)**

---

## PRODUCTION READINESS CHECKLIST

- ✅ **Cost control:** Rate limiting active (100 messages/day)
- ✅ **Stability:** Error handling + retry + fallback
- ✅ **Safety:** Content moderation via OpenAI API
- ✅ **Metrics:** Analytics events tracking success
- ✅ **Retention:** Onboarding hook encourages return

---

## OPTIONAL (DO NOT BLOCK MVP)

These are optional and should NOT delay launch:
- Waitlist landing page
- Referral system
- Streaks
- Emails
- Avatars / video tutors

---

## FINAL RULE

**DO NOT SKIP PHASES.**  
**DO NOT SHIP BROKEN FEATURES.**  
**VERIFY EVERYTHING.**

These additions are REQUIRED for a stable MVP.  
Do not skip. Do not simplify. Integrate into phases.

---

**START NOW.**
