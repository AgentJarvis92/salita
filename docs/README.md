# Salita — AI Tagalog Tutor 🇵🇭

**Status:** Planning  
**Created:** 2026-02-15  
**Team:** Kevin (build), Jarvis (AI integration), Chris (testing/feedback), Nikki (UX feedback)

---

## Quick Links

- **Mission Control:** `~/.jarvis/mission-control/projects/salita.json`
- **Scope:** `SCOPE.md`
- **AI System Rules:** `AI-SYSTEM-RULES.md`
- **Build Plan:** `BUILD-PLAN.md`

---

## The Problem

~4 million Filipino Americans are losing Tagalog. No quality app exists to help them reconnect through real conversation.

---

## The Solution

Salita = AI conversation partner teaching Tagalog naturally.

**Core idea:** "Learn by talking." No lessons, flashcards, or quizzes.

---

## Core Principles

1. Conversation-first (chat is the product)
2. User MUST speak Tagalog immediately
3. AI must guide the user (never leave them stuck)
4. Must feel like texting a real Filipino person
5. Must be fast (<2 second response target)

---

## MVP Features

1. **Auth** — Apple/Google/Email login
2. **Tutor Selection** — Choose Ate Maria (warm) or Kuya Josh (casual)
3. **Chat UI** — iMessage-style interface
4. **Guided Learning** — Every AI message includes:
   - Tagalog (primary)
   - English (support)
   - Hint (how to respond)
   - Examples (quick-reply buttons)
   - Correction (when needed)
   - Cultural notes (when relevant)
5. **Conversational Onboarding** — Learn in chat (not forms)
6. **Memory** — Adapts to skill level and remembers mistakes
7. **Share** — Generate shareable images
8. **AI Influencer System** — Generate viral content for growth

---

## Success Criteria

- ✅ User speaks Tagalog within 30 seconds
- ✅ User sends 3+ Tagalog messages
- ✅ User always knows what to say
- ✅ No crashes
- ✅ Response time < 2 seconds
- ✅ Conversation lasts 5+ minutes naturally

---

## Build Approach

**Phase-by-phase, QA-gated:**
- 14 phases (Phase 0 = Setup → Phase 14 = AI Influencer System)
- Each phase has strict QA requirements
- **No skipping phases**
- **No shipping broken features**
- STOP if any QA fails

---

## Tech Stack

- Frontend: Next.js (React)
- Backend: Next.js API routes
- Database: Supabase (PostgreSQL)
- AI: OpenAI GPT-4
- Auth: Supabase Auth
- Hosting: Vercel

---

## Differentiation

**Generic AI language apps:**
- Support 50+ languages generically
- No cultural context
- Cartoon mascots
- Lesson-based

**Salita:**
- Filipino-first (built FOR Filipino Americans)
- Cultural context baked in (po/opo, family terms, slang)
- Realistic Filipino avatar (HeyGen)
- Conversation-first (no lessons)
- Heritage learner focus

**Positioning:** "Reconnect with your roots. Talk to Lola in Tagalog."

---

## Timeline

**MVP:** 4-6 weeks (14 phases)

---

## Notes

- All 3 source documents (Scope, AI Rules, Build Plan) are locked
- Do NOT modify scope without approval
- Do NOT skip phases
- Do NOT change AI system behavior
- Ask for clarification ONLY if something is missing (not for interpretation)

---

**Ready to build.**
