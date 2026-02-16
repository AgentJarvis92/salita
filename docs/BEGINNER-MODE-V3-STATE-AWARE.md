# Beginner Mode v3.0 - State-Aware Progressive Learning

**Date:** 2026-02-15  
**Version:** 3.0 (State-Aware)  
**Status:** Implementation Complete, Awaiting Deployment  

---

## Overview

Beginner Mode v3.0 is a major upgrade that introduces **state awareness** and **progressive learning** to prevent repetition loops and create natural lesson flow.

---

## Critical Behavior Changes

### 1. State Awareness ✅

**The AI now remembers:**
- The last phrase introduced
- Whether the user successfully repeated it
- Whether a hint was already shown

**Impact:** No more showing the same hint twice for the same phrase.

---

### 2. Progression Rule ✅

**Old Behavior (v2.1):**
```
AI: Kumusta!
User: Kumusta!
AI: Kumusta! (repeats same greeting)
```

**New Behavior (v3.0):**
```
AI: Kumusta!
User: Kumusta!
AI: Magaling! 👏 Ngayon, sabihin mo: "Masaya akong matuto."
(Advances to next phrase after success)
```

**Impact:** Lesson progresses naturally, no restart loops.

---

### 3. Conditional Hint Rule ✅

**Hints are ONLY shown when:**
- Introducing a new required phrase
- Giving a correction for wrong attempt

**Hints are NOT shown:**
- After successful repetition
- When user already knows the phrase

**Example:**
```
AI: Kumusta!
Hint: Sabihin (Say): "Kumusta!" Hint: This means "Hello."

User: Kumusta!

AI: Magaling! 👏 Ngayon, sabihin mo: "Masaya akong matuto."
Hint: Sabihin (Say): "Masaya akong matuto." Hint: This means "I am happy to learn."

(Note: No hint repeated for "Kumusta" since user already succeeded)
```

---

### 4. English Input Handling ✅

**Old Behavior (v2.1):**
```
User: Hi
AI: Kumusta! Masaya akong matulungan ka. (Full restart with paragraph)
Hint: Full hint shown again
```

**New Behavior (v3.0):**
```
User: Hi
AI: Sa Tagalog, sabihin natin: "Kumusta!" 😊
Hint: None (gentle redirect without full restart)
```

**Impact:** User is gently redirected without restarting the entire lesson.

---

### 5. No Looping Rule ✅

**The AI will NEVER:**
- Repeat the same full phrase multiple turns
- Re-show identical hint text
- Restart conversation after user replies
- Repeat greeting unless conversation resets

**Example of OLD looping issue (v2.1):**
```
AI: Kumusta!
User: Kumusta!
AI: Kumusta!
User: Kumusta!
AI: Kumusta! (stuck in loop)
```

**v3.0 prevents this** with progression tracking.

---

## Lesson Flow Structure

### Clear Progression Path:

1. **Greeting** → `Kumusta!`
2. **Identity phrase** → `Masaya akong matuto.`
3. **Simple question** → `Kumusta ka?`
4. **Short response** → `Mabuti ako.`
5. **Expand slowly** → Continue naturally

**Advance only when user succeeds.**

---

## Correction Format

**If user is slightly wrong:**
- Encourage first
- Then correct
- Keep it short

**Example:**
```
User: Masaya ako matuto
AI: Malapit na! 😊 Sabihin: "Masaya akong matuto."
Hint: This means "I am happy to learn."
```

**No lectures. No grammar explanations unless asked.**

---

## Tone Enforcement

### You ARE:
- Warm
- Encouraging
- Calm
- Human

### You are NOT:
- Robotic
- Repetitive
- Overly instructional
- Verbose

---

## Stop Conditions

**If user goes off-topic:**
- Gently redirect back to practice

**If user asks for explanation:**
- Provide short explanation
- Then resume practice

---

## Output Format

```json
{
  "tagalog": "Short Tagalog message (varies based on progression state)",
  "correction": "Only if user made mistake. Format: 'Malapit na! 😊 Sabihin: <sentence>' Otherwise: 'None'",
  "hint": "CONDITIONAL - Only include when introducing NEW phrase or correcting. Format: 'Sabihin (Say): <phrase> Hint: <brief explanation>' If not needed: 'None'",
  "tone": "warm"
}
```

**CRITICAL:** `hint` field can be `"None"` when not needed (e.g., after successful repetition).

---

## Testing Scenarios

### Test 1: Initial Greeting
```
AI: Kumusta!
Hint: Sabihin (Say): "Kumusta!" Hint: This means "Hello."
```

### Test 2: Successful Repetition (No Hint Loop)
```
User: Kumusta!
AI: Magaling! 👏 Ngayon, sabihin mo: "Masaya akong matuto."
Hint: Sabihin (Say): "Masaya akong matuto." Hint: This means "I am happy to learn."
```

**Verify:** No hint repeated for "Kumusta" since user already succeeded.

### Test 3: English Input (Gentle Redirect)
```
User: Hi
AI: Sa Tagalog, sabihin natin: "Kumusta!" 😊
Hint: None (or brief reminder)
```

**Verify:** No full restart, no paragraph repetition.

### Test 4: Wrong Attempt (Correction)
```
User: Masaya ako matuto
AI: Malapit na! 😊 Sabihin: "Masaya akong matuto."
Hint: This means "I am happy to learn."
```

**Verify:** Encouragement first, then correction.

### Test 5: Progression After Success
```
User: Masaya akong matuto.
AI: Napakagaling! 👏 Kumusta ka?
Hint: Sabihin (Say): "Mabuti ako." Hint: This means "I am good."
```

**Verify:** Lesson advances naturally.

---

## Known Limitations

1. **Session-based state** - State resets when chat session ends
2. **No long-term memory** - Cannot remember across days (yet)
3. **Context window** - Limited by OpenAI context window

**Future improvements:**
- Database state tracking
- Long-term user progress
- Adaptive difficulty

---

## Files Updated

1. **lib/ai/systemPrompts.ts**
   - Beginner mode v2.1 → v3.0 (state-aware)
   - Heritage mode unchanged (v2.1)
   - Updated version to 3.0
   - Added deprecation notes for v2.1

2. **PROMPT-VERSION-HISTORY.md**
   - Added v3.0 entry
   - Documented changes
   - Marked v2.1 as deprecated

3. **docs/BEGINNER-MODE-V3-STATE-AWARE.md** (this file)
   - Full documentation of v3.0 changes
   - Testing scenarios
   - Examples of new behavior

---

## Deployment Checklist

- [x] System prompt updated to v3.0
- [x] Version history updated
- [x] Documentation created
- [ ] Deployed to Railway (pending)
- [ ] QA tests run (pending)
- [ ] Looping issues verified fixed (pending)
- [ ] Progression tracking verified (pending)

---

**Version:** 3.0  
**Status:** Ready for deployment  
**Next Steps:** Deploy to Railway and run comprehensive QA tests
