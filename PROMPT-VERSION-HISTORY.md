# AI System Prompt Version History

## v2.0 (2026-02-15) - CURRENT

**Status:** Active in production  
**Location:** `/lib/ai/systemPrompts.ts`  
**Deployment:** Phase 5 - AI Chat MVP  

**Changes from v1.0:**
- Fixed over-explanation issue in Beginner mode
- Enforced structured speaking flow
- Clearer anti-repetition rules
- Better correction handling
- Separated prompts into dedicated file (systemPrompts.ts)

**Beginner Mode (Ate Maria):**
- Always includes "Sabihin (Say): <exact sentence>"
- Short English hints (1-2 sentences max)
- Prioritizes speaking over explanation
- Warm, supportive tone
- Structured output: Tagalog + Sabihin + Hint + Correction (if needed)

**Heritage Mode (Kuya Josh):**
- Defaults to Tagalog only
- NO automatic English hints
- Only explains if user shows confusion
- Natural corrections with brief explanations
- Casual, confident tone
- Encourages longer natural responses

**QA Results:**
- ✅ Beginner: Shows "Sabihin" every message
- ✅ Beginner: Includes short hints
- ✅ Beginner: No long paragraphs
- ✅ Heritage: Defaults to Tagalog
- ✅ Heritage: No automatic English hints
- ✅ Heritage: Natural corrections
- ✅ Both: No repetition loops
- ✅ Both: Proper JSON structure

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
