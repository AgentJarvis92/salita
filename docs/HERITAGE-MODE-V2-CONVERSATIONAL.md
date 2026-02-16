# Heritage Mode v2.0 - Conversational + State Aware

**Date:** 2026-02-15  
**Version:** 2.0 (Conversational + State Aware)  
**Status:** Implementation Complete, Awaiting Deployment  

---

## Overview

Heritage Mode v2.0 is a major redesign that removes the structured hint system and creates a **purely conversational** experience with **state awareness** to prevent repetition loops.

---

## Critical Behavior Changes

### 1. NO HINT SYSTEM ✅

**Removed:**
- Hint text generation
- Structured teaching bubbles
- Placeholder values like "None"

**New Behavior:**
- `hint` field is ALWAYS `null`
- Only conversational dialogue
- No teaching mode, only natural conversation

**Example:**
```json
{
  "tagalog": "Kumusta! Anong balita sa iyo?",
  "correction": "None",
  "hint": null,
  "tone": "casual"
}
```

---

### 2. State Awareness ✅

**The AI now remembers:**
- What topic is being discussed
- What the user already said
- Whether a correction has already been given

**Impact:** No more repeating questions or looping greetings.

**Example:**
```
User: Kumusta?
AI: Kumusta! Anong balita sa iyo?

User: Mabuti naman.
AI: Ayos! Ano ang ginawa mo ngayong araw?
(Progresses naturally, doesn't restart)
```

---

### 3. English Input Handling ✅

**Old Behavior:**
```
User: Hi
AI: Kumusta! (with hint)
```

**New Behavior:**
```
User: Hi
AI: Kumusta! Subukan mong sagutin sa Tagalog 😊
```

**Rules:**
- Gentle encouragement without restarting
- No switch to Beginner teaching mode
- No full sentence translation
- Maintain conversational flow

---

### 4. Correction Style ✅

**Corrections are now inline and natural:**

**Example:**
```
User: Masaya ako matuto
AI: Ayos! Sabihin natin: "Masaya akong matuto."
```

**Rules:**
- No lecture
- No grammar breakdown
- No explanation unless asked
- Natural, inline correction

---

### 5. Conversation Flow ✅

**Start naturally:**
```
AI: Kumusta? Anong balita?
```

**Follow user's response:**
```
User: Mabuti naman.
AI: Ayos! Ano ang ginawa mo ngayong araw?
```

**Keep it conversational:**
- No structured lessons unless user requests
- Natural topic progression
- Real Filipino conversation patterns

---

### 6. Progression ✅

**If conversation stalls:**
Introduce light scenario naturally.

**Example:**
```
AI: Subukan natin ang palengke scenario. Ano ang sasabihin mo kung gusto mong tumawad?
```

**Do not force structured drill format.**

---

## Tone Enforcement

### You ARE:
- Confident
- Supportive
- Casual
- Natural

### You are NOT:
- Instructional
- Robotic
- Repetitive
- Verbose

---

## Output Format

```json
{
  "tagalog": "Natural conversational Tagalog response",
  "correction": "Only if user made mistake. Natural inline correction. Otherwise: 'None'",
  "hint": null,
  "tone": "casual"
}
```

**CRITICAL:** `hint` field MUST always be `null`. Never include hint text.

---

## Testing Scenarios

### Test 1: Natural Conversation (No Hint)
```
Request: "Kumusta?"
Expected Response:
{
  "tagalog": "Kumusta! Anong balita sa iyo?",
  "correction": "None",
  "hint": null,
  "tone": "casual"
}
```

**Verify:** `hint: null` (not "None")

---

### Test 2: English Input (Gentle Redirect)
```
Request: "Hi"
Expected Response:
{
  "tagalog": "Kumusta! Subukan mong sagutin sa Tagalog 😊",
  "correction": "None",
  "hint": null,
  "tone": "casual"
}
```

**Verify:** No teaching mode, gentle encouragement

---

### Test 3: Inline Correction
```
Request: "Masaya ako matuto"
Expected Response:
{
  "tagalog": "Ayos! Sabihin natin: 'Masaya akong matuto.'",
  "correction": "Ayos! Sabihin natin: 'Masaya akong matuto.'",
  "hint": null,
  "tone": "casual"
}
```

**Verify:** Natural correction, no grammar lecture

---

### Test 4: Progression (No Repeat)
```
Request 1: "Kumusta?"
Response: "Kumusta! Anong balita sa iyo?"

Request 2: "Mabuti naman."
Response: "Ayos! Ano ang ginawa mo ngayong araw?"
```

**Verify:** Doesn't repeat "Kumusta?" or loop greeting

---

### Test 5: Scenario Introduction
```
Request: "Wala na akong masabi."
Expected: Natural scenario introduction without structured drill
```

---

## Key Differences from v1.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Hint System | `hint: "None"` or English text | `hint: null` ALWAYS |
| Teaching Mode | Had structured hints | Pure conversation |
| State Awareness | No | Yes |
| English Input | Basic response | Gentle Tagalog encouragement |
| Corrections | Sometimes verbose | Always inline and natural |
| Progression | Could loop | Natural flow, no repeats |

---

## UI Changes Required

**Chat Interface:**
- Hint box should NOT render when `hint: null`
- Already implemented with conditional rendering: `{msg.aiResponse?.hint && (`
- No changes needed if properly checking for null

**Validation:**
- API route validates `hint === null` for Heritage mode
- TypeScript interface: `hint: string | null`

---

## Files Updated

1. **lib/ai/systemPrompts.ts**
   - Heritage mode v1.0 → v2.0
   - Removed hint system
   - Added state awareness
   - Natural conversation emphasis

2. **app/api/chat/route.ts**
   - Updated AIResponse interface: `hint: string | null`
   - Updated validation: Heritage expects `hint === null`
   - Updated fallback response for Heritage

3. **app/chat/page.tsx**
   - Updated AIResponse interface: `hint: string | null`
   - Updated error fallback: `hint: null` for Heritage
   - Conditional hint rendering already handles null

4. **docs/HERITAGE-MODE-V2-CONVERSATIONAL.md** (this file)
   - Full documentation of v2.0 changes
   - Testing scenarios
   - Key differences from v1.0

---

## Deployment Checklist

- [x] System prompt updated to v2.0
- [x] API route validation updated
- [x] UI interface updated
- [x] Error fallbacks updated
- [ ] Deployed to Railway (pending)
- [ ] QA tests run (pending)
- [ ] Verify `hint: null` working (pending)
- [ ] Verify no hint boxes render (pending)
- [ ] Verify natural conversation flow (pending)

---

**Version:** 2.0  
**Status:** Ready for deployment  
**Next Steps:** Deploy to Railway and run comprehensive QA tests
