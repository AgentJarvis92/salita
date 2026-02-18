# Avatar Presence Integration for Salita

Integrating the self-hosted avatar-presence skill into Salita Phase 8+.

## What We're Replacing

- ~~Anam SDK (external dependency, licensing)~~
- ~~WebRTC video streaming (complex, bandwidth-heavy)~~

With:
- **Avatar Presence Skill** (self-hosted, realtime)
- **Three.js 3D character or video clips** (lightweight, no external licensing)

## Salita Implementation

### Phase 7 (Current: Voice-Only Onboarding)

Keep as-is: Text input + TTS output. No video needed yet.

### Phase 8: Scenario Engine with Avatar

Add visual presence to conversations.

#### Step 1: Install Avatar Presence Skill

```bash
# Copy skill to Salita
cp -r ~/.openclaw/workspace/skills/avatar-presence salita/skills/

# Install dependencies
cd salita
npm install three @react-three/fiber @react-three/drei zustand
```

#### Step 2: Create Ate Maria 3D Model

**Quick path (use ready-made):**
1. Find Filipina female avatar on Mixamo
2. Download .fbx with skeleton
3. Import into Blender
4. Add blend shapes for phonemes (A, E, I, O, U, M, F, V, TH, L, D, T, N, G, K, S, Z, SH, CH, J, R)
5. Export as .glb → `public/models/ate-maria.glb`

**Time estimate**: 3-5 hours for proficient Blender user

**Alternative**: Commission on Fiverr (1-2 weeks, $500-1000)

#### Step 3: Update Chat Component

```tsx
// app/chat/page.tsx

import { Avatar } from '@/skills/avatar-presence/components/Avatar'
import { useAvatarState } from '@/skills/avatar-presence/lib/avatar-state'

export default function ChatPage() {
  const { state } = useAvatarState()
  const audioRef = useRef<HTMLAudioElement>(null)

  return (
    <div className="flex h-screen gap-4">
      {/* Avatar (left side) */}
      <div className="flex-1">
        <Avatar
          type="3d"
          model="/models/ate-maria.glb"
          character="ate-maria"
          state={state}
          lipSync={true}
          audioRef={audioRef}
        />
      </div>

      {/* Chat interface (right side) */}
      <div className="flex-1 flex flex-col">
        {/* Transcript display */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* messages go here */}
        </div>

        {/* Input area */}
        <div className="p-4 border-t">
          {/* mic + text input */}
        </div>
      </div>

      {/* Audio element for playback + lip-sync */}
      <audio ref={audioRef} />
    </div>
  )
}
```

#### Step 4: Wire Up Audio Pipeline

```tsx
import { useAvatarState } from '@/skills/avatar-presence/lib/avatar-state'
import { useAudioRecorder } from '@/skills/avatar-presence/hooks/useAudioRecorder'

// In your chat component:

const { state, transitionTo } = useAvatarState()
const { startRecording, stopRecording } = useAudioRecorder()
const audioRef = useRef<HTMLAudioElement>(null)

const handleMicClick = async () => {
  startRecording()
  await transitionTo('listening')
}

const handleMicRelease = async () => {
  const audioBlob = await stopRecording()
  
  // Transcribe with Whisper
  const transcript = await transcribeAudio(audioBlob)
  
  // Get response from Claude
  await transitionTo('thinking')
  let fullResponse = ''
  for await (const chunk of generateResponse(transcript)) {
    fullResponse += chunk
    // Optional: display streaming response in real-time
  }
  
  // Generate TTS
  await transitionTo('talking')
  const ttsBlob = await fetch('/api/speech/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text: fullResponse, voice: 'nova' }),
  }).then(r => r.blob())
  
  // Play audio (avatar lip-syncs automatically)
  audioRef.current!.src = URL.createObjectURL(ttsBlob)
  audioRef.current!.play()
  
  await new Promise(resolve => {
    audioRef.current!.onended = resolve
  })
  
  await transitionTo('idle')
}
```

## Performance Metrics

### Expected Latency (End-to-End)

- Audio capture: 50ms
- Whisper: 500-1000ms
- Claude streaming: 200-500ms (first token)
- TTS generation: 500-1500ms
- Audio playback + lip-sync: 16ms (realtime)

**Total: 1.3-2.5 seconds** (much better than Anam's latency with licensing overhead)

### Bandwidth Usage

| Component | Per interaction |
|-----------|-----------------|
| Whisper upload | 100-200KB |
| Claude API | ~1KB |
| TTS download | 50-150KB |
| 3D model (one-time) | 500KB |
| **Total per interaction** | **~150-350KB** |

Much lower than Anam's video streaming (5-10MB per minute).

## Deployment

### Railway Configuration

Add to `railway.toml`:

```toml
[env]
OPENAI_API_KEY = { description = "OpenAI API key for Whisper + TTS" }
ANTHROPIC_API_KEY = { description = "Anthropic API key for Claude" }
```

### Static Assets (3D Models)

Host models on CDN:
```bash
# Option 1: Railway (built-in)
# Place models in public/models/

# Option 2: Cloudflare R2 (cheaper for large files)
# Upload to R2, reference via https://cdn.example.com/models/ate-maria.glb
```

## Cost Breakdown (Per 1000 interactions)

| Service | Cost |
|---------|------|
| Whisper (1 min avg) | $0.60 |
| Claude (200 tokens avg) | $0.60 |
| TTS (30s avg) | $1.50 |
| Avatar Presence skill | $0 (self-hosted) |
| **Total** | **$2.70** |

**vs Anam**: Anam charges $0.10+ per interaction (licensing + streaming) = $100+ for 1000. **33x cheaper.**

## Rollout Plan

### Week 1: Setup
- Create Ate Maria 3D model or use video clips
- Test with basic avatar state machine
- Integrate Whisper + Claude + TTS

### Week 2: Testing
- Test on iOS/Android (important for WebGL support)
- Fallback to video if 3D fails
- Optimize for mobile performance

### Week 3: Deploy
- Push to Railway production
- A/B test with users (avatar vs no avatar)
- Collect performance metrics

### Week 4+: Iterate
- Improve lip-sync accuracy if needed
- Add more animations (smiling, nodding, gestures)
- Record more character variations if using video approach

## Troubleshooting

### Avatar 3D Model Won't Load
1. Check model path in console
2. Verify `.glb` file is valid: `gltf-transform inspect model.glb`
3. Check file size (should be < 5MB)
4. Try fallback to video: set `type="video"`

### Lip-Sync Not Working
1. Verify audio element is passed: `audioRef={audioRef}`
2. Check blend shapes exist on model: inspect in Three.js devtools
3. Verify phoneme detection is working: check WebAudio API in browser console

### High Latency
1. Profile with DevTools → Performance tab
2. Check TTS generation time
3. Reduce Claude token limit if too verbose
4. Use streaming responses (don't wait for full response before playing audio)

## Next Steps

1. **Immediately**: Start creating/gathering 3D models
2. **This week**: Integrate audio pipeline with test implementation
3. **Next week**: Deploy Phase 8 with avatar
4. **Ongoing**: Gather user feedback on avatar presence

Questions? See `/skills/avatar-presence/` for complete documentation.
