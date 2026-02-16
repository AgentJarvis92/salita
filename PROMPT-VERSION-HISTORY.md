# AI System Prompt Version History

## v3.1 (2026-02-15) - CURRENT

**Status:** Active in production  
**Location:** `/lib/ai/systemPrompts.ts`  
**Deployment:** Phase 5 - AI Chat MVP  

**MAJOR UPDATE: Heritage Mode v2 - Conversational + State Aware**

**Changes from v3.0:**
- **Heritage Mode:** v1.0 → v2.0 (Complete redesign)
  - Removed hint system entirely
  - Pure conversational flow (no teaching bubbles)
  - State awareness (remembers context, no looping)
  - Inline natural corrections only
  - `hint: null` ALWAYS (not "None")
- **Beginner Mode:** Unchanged (v3.0 still current)

**Beginner Mode (Ate Maria) v3.0:**
- State-aware progression (remembers what was taught)
- Conditional hints (only when needed, not after success)
- English input handling (gentle redirect)
- No looping (never repeats same hint for same phrase)
- Clear lesson structure (advance only when user succeeds)
- Warm, encouraging, human tone

**Heritage Mode (Kuya Josh) v2.0:**
- **NO HINT SYSTEM** - `hint: null` always
- Pure conversational flow
- State awareness (remembers topic, no repeat questions)
- English input: Gentle Tagalog encouragement
- Inline natural corrections (no lectures)
- Casual, confident, natural tone
- Progression through scenarios, not drills

**Critical Improvements (Heritage v2):**
1. **Removed Hints** - Pure conversation, no teaching mode
2. **State Awareness** - Remembers context, progresses naturally
3. **Natural Corrections** - Inline, brief, no grammar breakdown
4. **Conversational Flow** - Real Filipino chat patterns

---

## v3.0 (2026-02-15) - DEPRECATED (Beginner only)

**Status:** Beginner mode still in use, Heritage deprecated  
**Location:** `/lib/ai/systemPrompts.ts`  
**Deployment:** Phase 5 - AI Chat MVP  

**Changes from v2.1:**
- **Beginner Mode:** State-aware progression (v3.0)
- **Heritage Mode:** Had hint system (deprecated in v3.1)

**Replaced by:** v3.1 with Heritage v2 (conversational)

---

## v2.1 (2026-02-15) - DEPRECATED

**Status:** Deprecated (both modes)  
**Location:** Archived  
**Reason for deprecation:** 
- Beginner: No state awareness, looping issues
- Heritage: Had hint system, not purely conversational

**Replaced by:** 
- Beginner: v3.0 (state-aware)
- Heritage: v2.0 (conversational)

---

## v2.0 (2026-02-15) - DEPRECATED

**Status:** Deprecated  
**Location:** Archived  

**Changes from v1.0:**
- Fixed over-explanation issue
- Enforced structured speaking flow
- Clearer anti-repetition rules

**Replaced by:** v2.1 with compact hints and brand alignment

---

## v1.0 (2026-02-15) - DEPRECATED

**Status:** Deprecated  
**Location:** Inline in `/app/api/chat/route.ts` (archived)  

**Issues:**
- Too many fields
- Redundancy between fields
- Cognitive overload

**Replaced by:** v2.0 with simplified structure
