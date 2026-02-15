# DESIGN WORKFLOW — SALITA

**Last Updated:** 2026-02-15

---

## CRITICAL RULE

**Kevin handles ALL UI design.**  
**Jarvis implements ONLY after receiving Variant design links.**

---

## NEW PHASE STRUCTURE

### **Phase 2: Database + Analytics** ✅ COMPLETE
- Backend foundation is LOCKED
- Do NOT modify unless critical for integration
- Tables: profiles, messages, mistakes, analytics_events
- Analytics: trackEvent, getUserEvents, hasUserCompletedEvent

### **Phase 2.5: Design Handoff** 🔄 CURRENT
**Kevin's Responsibilities:**
- Create UI designs in Variant
- Provide Variant links to Jarvis

**Jarvis' Responsibilities:**
- Review Variant designs
- Understand layout, hierarchy, components
- Prepare for implementation
- **DO NOT build UI yet**

### **Phase 3: UI Implementation** ⏳ NEXT
**For each screen:**
1. Receive Variant design link from Kevin
2. Analyze layout, spacing, components
3. Implement UI to match design exactly
4. Ensure mobile-first responsiveness (375-430px iPhone)
5. Confirm completion

**Screens to Implement:**
1. Dashboard / Home (includes AI selection)
2. Persona Selection (if separate screen)
3. Chat Interface (core experience)

### **Phase 4: Feature Integration**
- Save selected tutor to `profiles.selected_tutor`
- Fire `persona_selected` analytics event
- Save messages to `messages` table
- Load conversation history
- Fire analytics events: `first_message`, `three_messages_sent`, `session_5_min`

### **Phase 5: AI Chat MVP**
- Basic AI response system
- Simple, functional responses
- No advanced memory yet

### **Phase 6: Polish + QA**
- Fix UI inconsistencies
- Ensure responsiveness
- Improve performance
- Validate analytics flow

---

## ⚠️ DESIGN IMPLEMENTATION RULE (MANDATORY)

**Once Variant designs are approved:**

> **"This is the approved design. Do not reinterpret or simplify. Match layout, spacing, and structure as closely as possible. If anything is unclear, ask before building."**

**Enforcement:** MANDATORY  
**Added:** 2026-02-15

---

## IMPLEMENTATION RULES

### **MUST:**
- ✅ Match Variant design exactly (no reinterpretation)
- ✅ Match layout, spacing, and structure precisely
- ✅ Build mobile-first (375-430px iPhone)
- ✅ Use clean, modern styling
- ✅ Maintain consistent spacing
- ✅ Ask for clarification if design is unclear

### **MUST NOT:**
- ❌ Design UI independently
- ❌ Reinterpret or simplify approved designs
- ❌ Guess layouts or spacing
- ❌ Modify designs without approval
- ❌ Modify Phase 2 backend (database/analytics)
- ❌ Proceed without Variant design link

---

## PRODUCT VISION

**Salita is an AI-first conversational platform.**

### **Feels Like:**
"A modern AI product where users talk to an intelligent assistant"

### **NOT Like:**
"A language app with AI features"

---

## UI QUALITY REQUIREMENTS

### **Layout:**
- Clean, minimal, generous whitespace
- Soft shadows (no harsh effects)
- Rounded corners (12-16px)
- Consistent spacing scale

### **Typography:**
- Minimal text
- Clear hierarchy
- iOS-native feel (SF Pro / Inter)

### **Avatars:**
- Realistic, AI-driven
- NOT cartoon or playful
- Cinematic lighting
- Subtle glow

### **Mobile-First:**
- Target: 375px – 430px (iPhone)
- Feels like native iOS app
- NOT a desktop website scaled down

---

## PWA REQUIREMENTS

**Already Configured:**
- ✅ manifest.json
- ✅ Service worker
- ✅ iOS meta tags
- ✅ Theme color

**Still Missing:**
- ❌ App icons (icon-192.png, icon-512.png, apple-touch-icon.png)
- See `public/ICONS_README.md`

**Must Work:**
- "Add to Home Screen" on iOS + Android
- Standalone mode (no browser UI)
- Full-screen navigation

---

## CURRENT STATUS

**Waiting for Variant design links.**

**Ready to implement once designs are provided:**
1. Dashboard / Home
2. Persona Selection
3. Chat Interface

**Do NOT proceed without design input.**

---

## WORKFLOW SUMMARY

```
Kevin (Product/Design)          Jarvis (Engineering)
─────────────────────          ────────────────────

1. Create UI in Variant    →   
                                2. Review design
                                3. Analyze layout/components
                                4. Prepare implementation

5. Provide Variant link    →   
                                6. Implement UI exactly
                                7. Ensure responsiveness
                                8. Test mobile-first

9. Review implementation   →   
                                10. Iterate if needed

11. Approve               →   
                                12. Move to next screen
```

---

**Status:** Phase 2.5 (Design Handoff) — WAITING FOR VARIANT LINKS
