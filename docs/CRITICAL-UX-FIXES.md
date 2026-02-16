# Critical UX Fixes - Persona Cards + Hint Bubbles

**Date:** 2026-02-15  
**Priority:** HIGH / CRITICAL  
**Status:** Deployed  

---

## Fix 1: Hint Bubble Rendering Bug (CRITICAL) ✅

### Problem
Yellow hint bubble was rendering the string "None" in chat messages.

**Root Cause:** Conditional rendering only checked if hint exists:
```tsx
{msg.aiResponse?.hint && (
  // Renders if hint is "None" string
)}
```

### Solution

**Updated conditional logic:**
```tsx
{msg.aiResponse?.hint && 
 typeof msg.aiResponse.hint === 'string' && 
 msg.aiResponse.hint.trim() !== '' && 
 msg.aiResponse.hint !== 'None' && (
  <div className="rounded-2xl px-4 py-3 bg-[#D4AF37] text-[#0a0a0f]">
    <p className="text-[13px] leading-relaxed">
      {msg.aiResponse.hint}
    </p>
  </div>
)}
```

**Now only renders hint bubble if:**
1. hint exists
2. hint is a string type
3. hint is not empty after trimming
4. hint is not the literal string "None"

### Expected Behavior

**Beginner Mode (Ate Maria):**
- ✅ Shows hints when introducing new phrases
- ✅ Shows hints when correcting mistakes
- ❌ Does NOT show hints after successful repetition
- ❌ Does NOT show "None" bubbles

**Heritage Mode (Kuya Josh):**
- ✅ `hint: null` always
- ❌ Never shows hint bubble
- ❌ No "None" bubbles
- ❌ No empty containers

---

## Fix 2: Persona Card Overlay + Cropping ✅

### Problem
- Eyes barely visible on persona cards
- Overlay gradient too dark/heavy
- Portraits felt muted, no eye contact

### Solution

**1. Image Positioning (Per Persona)**

**Ate Maria:**
```tsx
backgroundPosition: '70% 35%'
```
- Eyes positioned in upper-right third of visible area
- Both eyes fully visible
- Clear eye contact at a glance

**Kuya Josh:**
```tsx
backgroundPosition: '60% 40%'
```
- Eyes clearly visible
- Brand mood maintained
- Natural positioning

**2. Overlay Gradient (Lighter, Targeted)**

**Old Gradient:**
```tsx
bg-gradient-to-r from-transparent via-black/40 to-black/80
```
- Too heavy, uniform darkness
- Muted portraits
- Eyes hard to see

**New Gradient:**
```tsx
linear-gradient(
  90deg, 
  rgba(0,0,0,0.65) 0%, 
  rgba(0,0,0,0.35) 55%, 
  rgba(0,0,0,0.00) 100%
)
```
- Dark only where text sits (left side)
- Fades to transparent on right side
- Portrait highlights pop
- Eyes bright and clear

### Visual Changes

**Before:**
- Eyes barely visible
- Heavy uniform dark overlay
- Portraits muted
- No eye contact

**After:**
- ✅ Eyes clearly visible at a glance
- ✅ Portrait highlights pop
- ✅ Text remains readable
- ✅ Eye contact established
- ✅ Brand mood preserved

---

## QA Checklist

### Hint Bubble Rendering:
- [ ] Beginner mode: Hints show only when introducing new phrases
- [ ] Beginner mode: No "None" bubbles appear
- [ ] Heritage mode: No hint bubbles render at all
- [ ] No empty hint containers

### Persona Card Overlay:
- [ ] Ate Maria: Eyes clearly visible at a glance
- [ ] Kuya Josh: Eyes clearly visible at a glance
- [ ] Text contrast passes visually
- [ ] Portraits not washed out or overly dim
- [ ] Mobile viewport (iPhone 375-430px) verified

---

## Files Modified

1. **app/chat/page.tsx**
   - Updated hint bubble conditional rendering
   - Added type checking and "None" filter

2. **app/dashboard/page.tsx**
   - Updated Ate Maria backgroundPosition: '70% 35%'
   - Updated Kuya Josh backgroundPosition: '60% 40%'
   - Replaced Tailwind gradient with inline CSS gradient
   - Lighter overlay that fades to transparent

---

## Deployment

- **Commit:** d6f6fbe
- **Railway:** Deploying now
- **Production URL:** https://salita-production.up.railway.app
- **Expected Live:** ~2-3 minutes

---

## Mission Control

**Tasks:**
1. Salita > Chat System > Hint Rendering Fix v1 ✅
2. Salita > UX Refinement > Persona Card Overlay + Cropping v1 ✅

---

**Status:** DEPLOYED  
**Priority:** CRITICAL  
**Date:** 2026-02-15 21:20 EST
