# Salita UX Refinement v2 - Positioning + Chat System

**Date:** 2026-02-15  
**Status:** Implementation Complete, Awaiting Deployment Verification  
**Version:** Chat System v2.1  

---

## Changes Implemented

### 1. Home Screen Positioning ✅

**REMOVED:**
- Headline: "MEET YOUR AI"

**REPLACED WITH:**
- Headline: "Start Speaking Tagalog"
- Subheadline: "Practice naturally with a mentor who understands your journey."

**Rationale:** Human, identity-driven tone. Not SaaS or chatbot-like.

---

### 2. Persona Copy Update ✅

**Ate Maria (BEGINNER badge):**
- Title: Ate Maria
- Description: "Start from zero. Clear English guidance. Gentle, patient support."

**Kuya Josh (HERITAGE badge):**
- Title: Kuya Josh
- Description: "You understand it. Let's help you speak it confidently."

**Rationale:** Short, emotionally resonant, not technical.

---

### 3. Beginner Mode Chat System Rules ✅

**STRICT FORMAT RULES:**

✅ **CORRECT FORMAT:**
```
AI Message: Kamusta! Masaya akong matulungan ka.
Hint Bubble: Sabihin (Say): "Kumusta!" Hint: This means "Hello."
```

❌ **WRONG FORMAT:**
```
Sabihin: "Kumusta! Masaya akong matulungan ka sa pag-aaral ng Tagalog."
(Too long, too repetitive)
```

**Rules:**
- AI message in Tagalog first
- Immediately below, compact gold hint bubble
- Do NOT repeat full paragraph translations
- Keep hints short and clean (1 sentence max)
- No verbose grammar explanations
- No repeating entire sentence inside hint

---

### 4. Beginner Correction Format ✅

**NEW FORMAT:**
```
Encouragement: Mabuti! Almost 😊
Correction: Try: "Masaya akong matuto."
Hint: This means "I am happy to learn."
```

**Rules:**
- Keep corrections short
- No lectures
- No paragraph breakdowns
- Always start with encouragement

---

### 5. Heritage Mode Chat System Rules ✅

**NATURAL CONVERSATIONAL FORMAT:**

✅ **CORRECT:**
```
User: Handa ka na?
AI: Oo, tara na! Subukan natin ang palengke scenario.
```

❌ **WRONG:**
```
AI: Handa ka na bang mag-practice? (Are you ready to practice?)
(Too much English, not natural)
```

**Rules:**
- No English hint bubble by default
- No "Sabihin (Say)" prefix
- No spoon-feeding
- Corrections inline and subtle
- Speak naturally as a Filipino mentor would

---

### 6. Brand Alignment Rules ✅

**Salita is NOT:**
- A chatbot tool
- A flashcard app
- A grammar drill system

**Salita IS:**
- A conversational mentor
- A heritage bridge
- A confidence builder

**Implementation:**
- Removed robotic language
- Removed SaaS tone
- All UI copy reflects emotional identity + growth

---

### 7. Optional Visual Differentiation ⏸️

**Deferred for now:**
- Warm accent glow for Beginner mode
- Cool accent glow for Heritage mode

Can implement later if needed.

---

## QA Checklist

- [x] Home headline updated to "Start Speaking Tagalog"
- [x] Home subheadline updated
- [x] Ate Maria description updated
- [x] Kuya Josh description updated
- [x] Beginner compact hint format enforced in prompt
- [x] No full paragraph repetition rule added
- [x] Heritage mode has no English by default
- [x] Correction format improved with encouragement
- [ ] Deployed to Railway (pending)
- [ ] Verified live on production URL (pending)

---

## Files Updated

1. **app/dashboard/page.tsx**
   - Updated headline: "Start Speaking Tagalog"
   - Updated subheadline: "Practice naturally with a mentor who understands your journey."
   - Updated Ate Maria description: "Start from zero. Clear English guidance. Gentle, patient support."
   - Updated Kuya Josh description: "You understand it. Let's help you speak it confidently."

2. **lib/ai/systemPrompts.ts**
   - Updated to v2.1
   - Enforced compact hint format for Beginner mode
   - Added explicit examples of correct vs wrong formats
   - Improved correction format with "Mabuti! Almost 😊" encouragement
   - Heritage mode more conversational and natural
   - Added brand identity context to both prompts

3. **docs/UX-REFINEMENT-V2.md** (this file)
   - Documentation of all changes
   - QA checklist
   - Rationale for each change

---

## Testing Plan

### Beginner Mode Tests:

1. **Initial Greeting Test**
   - Expected: Short Tagalog message + compact hint
   - Format: "Sabihin (Say): '<short phrase>' Hint: <1 sentence>"

2. **Learning Request Test**
   - User: "How do I say thank you?"
   - Expected: Short Tagalog + compact hint (not full paragraph)

3. **Correction Test**
   - User: "Ako ay Kevin" (incorrect)
   - Expected: "Mabuti! Almost 😊 Try: 'Ako si Kevin.' Hint: Use 'si' for names."

### Heritage Mode Tests:

1. **Natural Conversation Test**
   - User: "Kumusta?"
   - Expected: Natural Tagalog response, no English hint

2. **Inline Correction Test**
   - User: "Gusto ko mag-learn"
   - Expected: Natural correction inline, no English unless needed

---

## Next Steps

1. Deploy to Railway
2. Test Beginner mode (verify compact hints)
3. Test Heritage mode (verify no automatic English)
4. Verify corrections format
5. Mark task complete in Mission Control

---

**Version:** 2.1  
**Status:** Ready for deployment verification  
**Brand Alignment:** ✅ Human, identity-driven, emotional
