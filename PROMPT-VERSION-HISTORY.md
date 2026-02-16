# AI System Prompt Version History

## v3.0 (2026-02-15) - CURRENT

**Status:** Active in production  
**Location:** `/lib/ai/systemPrompts.ts`  
**Deployment:** Phase 5 - AI Chat MVP  

**MAJOR UPDATE: Beginner Mode State-Aware v3**

**Changes from v2.1:**
- **State Awareness:** Remembers what was taught, no looping
- **Progression Tracking:** Only advances after user succeeds
- **Conditional Hints:** Only shows hints when introducing new phrases or correcting
- **English Input Handling:** Gentle redirect without restarting lesson
- **No Looping Rule:** Never repeats same phrase/hint multiple turns
- **Clear Lesson Flow:** Greeting → Identity → Question → Response → Expand

**Beginner Mode (Ate Maria) v3.0:**
- State-aware progression (remembers what was taught)
- Conditional hints (only when needed, not after success)
- English input handling (gentle redirect: "Sa Tagalog, sabihin natin: 'Kumusta!' 😊")
- No looping (never repeats same hint for same phrase)
- Clear lesson structure (advance only when user succeeds)
- Warm, encouraging, human tone
- NOT robotic, repetitive, or verbose

**Heritage Mode (Kuya Josh) v2.1:**
- Unchanged (still working well)
- Defaults to Tagalog only
- NO automatic English hints
- Natural corrections with brief explanations
- Casual, confident tone

**Critical Improvements:**
1. **State Awareness** - AI remembers conversation context
2. **Progression** - No restart after user replies
3. **Conditional Hints** - Only when introducing or correcting
4. **No Looping** - Avoids repetition loops
5. **English Handling** - Gentle redirect without full restart

---

## v2.1 (2026-02-15) - DEPRECATED

**Status:** Deprecated (Beginner only)  
**Location:** Archived  
**Reason for deprecation:** No state awareness, looping issues

**Issues:**
- No memory of what was already taught
- Would repeat same hints multiple turns
- Would restart lesson after user replies
- No progression tracking

**Replaced by:** v3.0 with state-aware Beginner mode

---

## v2.0 (2026-02-15) - DEPRECATED

**Status:** Deprecated  
**Location:** Archived  
**Deployment:** Phase 5 - AI Chat MVP  

**Changes from v1.0:**
- Fixed over-explanation issue in Beginner mode
- Enforced structured speaking flow
- Clearer anti-repetition rules
- Better correction handling
- Separated prompts into dedicated file (systemPrompts.ts)

**Beginner Mode (Ate Maria) v2.0:**
- Always includes "Sabihin (Say): <exact sentence>"
- Short English hints (1-2 sentences max)
- Prioritizes speaking over explanation
- Warm, supportive tone

**Heritage Mode (Kuya Josh) v2.0:**
- Defaults to Tagalog only
- NO automatic English hints
- Natural corrections with brief explanations
- Casual, confident tone

**Replaced by:** v2.1 with compact hints and brand alignment

---

## v1.0 (2026-02-15) - DEPRECATED

**Status:** Deprecated  
**Location:** Inline in `/app/api/chat/route.ts` (archived)  
**Reason for deprecation:** Over-explanation, inconsistent structure

**Issues:**
- Too many separate fields (tagalog, english, hint, examples, correction, note)
- Redundancy between fields
- Cognitive overload for users
- Unclear what to focus on

**Replaced by:** v2.0 with simplified 4-field structure
