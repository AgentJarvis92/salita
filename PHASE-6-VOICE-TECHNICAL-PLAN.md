# Phase 6: Voice Onboarding MVP — Technical Implementation Plan

**Date:** 2026-02-16  
**Status:** Awaiting approval  
**Objective:** Deliver 30-second "I just spoke Tagalog" magic moment

---

## 1. Technical Implementation Plan

### A. STT (Speech-to-Text)

**Recommended: Web Speech API (Primary)**
- Built into modern browsers
- Zero API cost
- Near-instant transcription
- Works offline
- Best for MVP speed

**Limitations:**
- Chrome/Edge only (no Safari on iOS)
- Requires HTTPS
- Less accurate than cloud services
- No Tagalog-specific training

**Fallback: OpenAI Whisper API**
- Use when Web Speech unavailable (Safari, older browsers)
- Cost: $0.006 per minute (~$0.003 per 30-sec onboarding)
- Supports Tagalog explicitly
- Higher accuracy
- Requires audio upload (100-300ms latency)

**Implementation:**
```typescript
// lib/speech/stt.ts
async function transcribe(audioBlob: Blob): Promise<string> {
  // Try Web Speech first
  if ('webkitSpeechRecognition' in window) {
    return transcribeWebAPI(audioBlob)
  }
  // Fallback to Whisper
  return transcribeWhisper(audioBlob)
}
```

---

### B. TTS (Text-to-Speech)

**Recommended: OpenAI TTS**
- Cost: $15/1M chars (~$0.001 per message)
- Natural Filipino accent available
- Streaming support (low latency)
- 6 voices available
- HD quality option

**Alternative: ElevenLabs**
- Cost: $0.30/1k chars (~$0.03 per message) **30x more expensive**
- Superior voice quality
- Custom voice cloning possible
- Filipino accent via fine-tuning

**Recommendation:** Start with OpenAI TTS for cost efficiency. ElevenLabs if voice quality is critical.

**Implementation:**
```typescript
// lib/speech/tts.ts
import OpenAI from 'openai'

async function synthesize(text: string): Promise<Blob> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova', // Warm, suitable for Ate Maria
    input: text,
  })
  return response.blob()
}
```

---

### C. Voice Toggle Persistence

**Database Change:**
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN voice_enabled BOOLEAN DEFAULT false;
```

**Frontend State:**
```typescript
// lib/voice-context.tsx
const VoiceContext = createContext({
  voiceEnabled: false,
  toggleVoice: () => {},
})
```

---

### D. Mic Permissions Flow

**UX:**
1. User lands on chat
2. Sees large "Tap to Speak Tagalog 🎤" button
3. Taps → browser requests mic permission
4. **If granted:** Mic activates, listens
5. **If denied:** Fallback to text input, show "Enable mic in settings" banner

**Implementation:**
```typescript
async function requestMic(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop()) // Release immediately
    return true
  } catch (err) {
    console.error('Mic denied:', err)
    return false
  }
}
```

---

## 2. Selected STT/TTS Services

| Component | Service | Cost | Rationale |
|-----------|---------|------|-----------|
| **STT** | Web Speech API (primary) | $0 | Instant, free, good enough for MVP |
| **STT Fallback** | OpenAI Whisper | $0.006/min | Safari/iOS compatibility |
| **TTS** | OpenAI TTS | $15/1M chars | Cost-effective, natural Filipino accent |

**Total Voice Cost per User (30-day estimate):**
- 100 messages/user/month
- 50% use voice playback
- Avg 50 chars per message
- **TTS:** 50 msgs × 50 chars × $0.000015 = **$0.04/user/month**
- **STT:** Mostly free (Web Speech), Whisper fallback ~$0.01/user
- **Total:** **~$0.05/user/month**

**At 1,000 users:** $50/month voice cost (negligible)

---

## 3. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Safari mic permission issues** | High | High | Clear fallback UI + text input always visible |
| **STT accuracy poor for Tagalog** | Medium | Medium | Use Whisper fallback, accept imperfect transcription |
| **TTS latency > 2 sec** | Low | Medium | Stream audio, show "Generating..." indicator |
| **User confusion (when to speak?)** | Medium | High | Clear visual cues: mic icon pulses when listening |
| **Mic permission permanently denied** | Medium | Medium | Graceful degradation to text-only mode |
| **Mobile data usage concerns** | Low | Low | TTS files ~50KB each, acceptable |

**Highest Risk:** Safari mic permissions. Mitigation: Always show text input as fallback.

---

## 4. Estimated Effort

### Development Time (3 Agents Parallel)

**Agent 1: Voice Infrastructure** (8-10 hours)
- STT integration (Web Speech + Whisper fallback): 3h
- TTS integration (OpenAI): 2h
- Audio playback controls: 2h
- Mic permission flow: 2h
- Error handling: 1h

**Agent 2: UI Voice Experience** (6-8 hours)
- Onboarding voice moment design: 2h
- Mic CTA button: 1h
- Voice toggle in header: 1h
- Playback button on AI messages: 1h
- Mobile responsive design: 2h
- Loading/error states: 1h

**Agent 3: QA Voice Validation** (4-6 hours)
- Desktop testing (Chrome/Edge/Safari): 2h
- Mobile testing (iOS Safari/Chrome): 2h
- Latency testing: 1h
- Denial-of-permission testing: 1h

**Total: 18-24 hours (wall-clock: 2-3 days with parallel work)**

### Cost Estimate
- Development: 20 hours × $0 (internal)
- Voice API costs: ~$50/month @ 1k users
- Infrastructure: $0 (use existing Railway)

**Total: ~$50/month ongoing**

---

## 5. Confirmation: Phase 7 Remains Untouched

✅ **Confirmed:** Phase 7 (Full Voice Chat Engine) is NOT part of this scope.

**Phase 7 features (future, not now):**
- Continuous mic mode
- Pronunciation grading
- Speech confidence scoring
- Lip sync avatars
- Voice-only conversation mode
- Advanced audio processing

**Phase 6 keeps it simple:**
- Voice playback (TTS)
- Single-phrase voice input (onboarding only)
- Optional toggle for text users

---

## 6. Implementation Sequence

**Week 1 (Days 1-3):**
1. Update Mission Control with new scope
2. Add `voice_enabled` column to profiles table
3. Agent 1 builds voice infrastructure
4. Agent 2 builds UI components
5. Integration testing

**Week 1 (Days 4-5):**
1. Agent 3 runs full QA (desktop + mobile)
2. Fix critical bugs
3. Deploy to Railway staging
4. Final validation

**Week 2 (Day 1):**
1. Production deployment
2. Monitor latency + errors
3. Gather user feedback

---

## 7. Success Metrics (Phase 6 Specific)

✅ **MVP Voice Criteria:**
1. User can speak one Tagalog phrase during onboarding
2. STT transcribes with >70% accuracy
3. AI responds verbally within 3 seconds
4. Voice toggle persists across sessions
5. Graceful fallback to text if mic denied
6. Works on iOS Safari + Android Chrome

---

## 8. Architecture Changes

**New Files:**
```
lib/speech/
  ├── stt.ts          # Web Speech + Whisper fallback
  ├── tts.ts          # OpenAI TTS integration
  └── voice-context.tsx  # Voice state management

components/voice/
  ├── MicButton.tsx   # Large onboarding CTA
  ├── VoiceToggle.tsx # Header toggle
  └── PlaybackButton.tsx # AI message playback

app/api/speech/
  └── transcribe/route.ts  # Whisper fallback endpoint
```

**Database Migration:**
```sql
-- 20260216_add_voice_enabled.sql
ALTER TABLE profiles ADD COLUMN voice_enabled BOOLEAN DEFAULT false;
```

**No rewrites.** All changes are additive.

---

## 9. Approval Checklist

Before proceeding, confirm:
- [ ] STT/TTS service selection approved (Web Speech + OpenAI)
- [ ] Cost estimate acceptable (~$50/month @ 1k users)
- [ ] Risk mitigation strategy approved
- [ ] 2-3 day timeline acceptable
- [ ] Phase 7 scope exclusion confirmed
- [ ] Mission Control updated

**Ready to proceed?** Reply "APPROVED" to spawn 3 agents and begin Phase 6 implementation.
