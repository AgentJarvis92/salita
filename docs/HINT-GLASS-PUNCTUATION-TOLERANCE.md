# Hint Glass Panel + Punctuation Tolerance

**Date:** 2026-02-15  
**Version:** 3.1.3 (Beginner 3.0.3)  
**Mission Control:** Salita > UX Refinement > Hint Glass + Punctuation Tolerance v1  

---

## Part A: Hint Glass Panel Styling ✅

### Problem
Hint bubble used the same yellow (#D4AF37) as CTAs (Send button, Play button).

**Visual conflict:** Users might think hint bubble is clickable/actionable.

### Solution
Changed hint bubble to **dark glass panel** style:

**OLD:**
```tsx
<div className="rounded-2xl px-4 py-3 bg-[#D4AF37] text-[#0a0a0f]">
```

**NEW:**
```tsx
<div className="rounded-2xl px-4 py-3 bg-white/[0.06] border border-white/10 backdrop-blur-md">
  <p className="text-[13px] leading-relaxed text-white/90">
```

### Styling Details

| Property | Value | Purpose |
|----------|-------|---------|
| Background | `bg-white/[0.06]` | Dark translucent base |
| Border | `border-white/10` | Subtle edge definition |
| Backdrop Blur | `backdrop-blur-md` | Glass effect (10-12px) |
| Text | `text-white/90` | High contrast readability |

### Result

**Before:**
- ❌ Yellow hint bubble looks like CTA
- ❌ Visual confusion with Send button
- ❌ Users might try to click hint

**After:**
- ✅ Premium glass panel look
- ✅ Yellow reserved ONLY for CTAs
- ✅ Clear visual hierarchy
- ✅ No clickable affordance

---

## Part B: Punctuation Tolerance (Beginner Mode) ✅

### Problem
Beginner mode was **too strict** with punctuation.

**Example:**
```
Target: "Kumusta ka?"
User: "Kumusta ka"
AI: "Almost! Just add a '?' at the end" ❌ FRUSTRATING
```

This breaks flow and discourages beginners over trivial formatting.

### Solution
**Ignore punctuation when comparing responses.**

Only correct **word/meaning errors**, NOT punctuation.

### Rules Added

```
6. PUNCTUATION TOLERANCE RULE (CRITICAL)
Missing punctuation (like "?" or "!") should PASS as correct.
Do NOT correct punctuation-only errors for beginners.

When comparing user response to target phrase:
- Ignore trailing punctuation: . , ! ? " " '
- Trim whitespace
- Compare meaning and words only
```

### Examples

#### Scenario 1: Missing Punctuation ✅ PASS
```
Target: "Kumusta ka?"
User: "Kumusta ka"
Result: PASS ✅
AI: "Magaling! 👏 Ngayon, sabihin mo: 'Mabuti ako.'"
```

#### Scenario 2: Missing Word ❌ FAIL (correct)
```
Target: "Kumusta ka?"
User: "Kumusta"
Result: FAIL ❌ (missing "ka")
AI: "Malapit na! (Almost there!) 😊 Sabihin: 'Kumusta ka?'"
```

#### Scenario 3: Grammar Error ❌ FAIL (correct)
```
Target: "Masaya akong matuto."
User: "Masaya ako matuto"
Result: FAIL ❌ (missing "ng")
AI: "Malapit na! (Almost there!) 😊 Sabihin: 'Masaya akong matuto.'"
```

#### Scenario 4: Perfect Match with Punctuation ✅ PASS
```
Target: "Masaya akong matuto."
User: "Masaya akong matuto."
Result: PASS ✅
AI: "Magaling! 👏 Ngayon, sabihin mo: 'Kumusta ka?'"
```

#### Scenario 5: Perfect Match without Punctuation ✅ PASS
```
Target: "Masaya akong matuto."
User: "Masaya akong matuto"
Result: PASS ✅ (punctuation ignored)
AI: "Magaling! 👏 Ngayon, sabihin mo: 'Kumusta ka?'"
```

### What AI Should NOT Do

❌ **WRONG:**
```
User: "Kumusta ka"
AI: "Almost! Don't forget the question mark."
```

✅ **RIGHT:**
```
User: "Kumusta ka"
AI: "Magaling! 👏 Ngayon, sabihin mo: 'Mabuti ako.'"
```

### Normalization Logic

When AI compares user input to target:

1. **Trim** whitespace
2. **Remove** trailing punctuation: `. , ! ? " " '`
3. **Compare** normalized strings
4. If match → **PASS** (move to next phrase)
5. If different → **FAIL** (gentle correction)

---

## Implementation

### Files Modified

**1. app/chat/page.tsx**
- Hint bubble styling changed from yellow to glass panel
- Added border, backdrop blur, translucent background

**2. lib/ai/systemPrompts.ts**
- Added Rule 6: PUNCTUATION TOLERANCE RULE (CRITICAL)
- Explicit examples of what should PASS vs FAIL
- Clear instruction to ignore punctuation
- Renumbered subsequent rules (7 → 8, 8 → 9, etc.)

---

## QA Test Scenarios

### Glass Panel Styling
- [ ] Hint bubble has dark glass appearance (not yellow)
- [ ] Border visible (subtle white/10)
- [ ] Text readable (white/90)
- [ ] No visual confusion with Send button (Send is only yellow CTA)
- [ ] Backdrop blur working (glass effect)

### Punctuation Tolerance
- [ ] Target: "Kumusta ka?" User: "Kumusta ka" → PASS (no correction)
- [ ] Target: "Kumusta ka?" User: "Kumusta" → FAIL (missing word, correct)
- [ ] Target: "Masaya akong matuto." User: "Masaya akong matuto" → PASS
- [ ] Target: "Masaya akong matuto." User: "Masaya ako matuto" → FAIL (grammar)
- [ ] AI never says "add a question mark" or "don't forget punctuation"

---

## Deployment

- **Commit:** f55bdec
- **Railway:** Deploying now
- **Production URL:** https://salita-production.up.railway.app
- **Expected Live:** ~2-3 minutes

---

## Impact

### Before:
- ❌ Yellow hint bubble looks like button
- ❌ Beginners fail for missing "?"
- ❌ Frustrating corrections over formatting
- ❌ Breaks learning flow

### After:
- ✅ Premium glass panel UI
- ✅ Yellow reserved for CTAs only
- ✅ Punctuation tolerance (focus on meaning)
- ✅ Smooth learning progression
- ✅ Only correct real mistakes

---

**Version:** 3.1.3 (Beginner 3.0.3)  
**Status:** DEPLOYED  
**Mission Control:** Salita > UX Refinement > Hint Glass + Punctuation Tolerance v1
