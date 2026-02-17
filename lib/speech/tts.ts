/**
 * Text-to-Speech (TTS) Module
 * 
 * Uses OpenAI TTS API (voice: nova) via /api/speech/synthesize.
 * Supports streaming playback and reusable audio player.
 */

export interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  model?: 'tts-1' | 'tts-1-hd'
  speed?: number
}

// Phase 7A: Character voice mapping
// Ate Maria → nova (warm alto), Kuya Josh → onyx (calm mid-range male)
export function getVoiceForPersona(persona: string): 'nova' | 'onyx' {
  return persona === 'kuya_josh' ? 'onyx' : 'nova'
}

let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null

/** Generate speech audio from text. Returns an audio Blob (mp3). */
export async function synthesize(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options

  const res = await fetch('/api/speech/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, model, speed }),
  })

  if (!res.ok) throw new Error(`TTS failed: ${await res.text()}`)
  return res.blob()
}

/** Play an audio blob. Returns a promise that resolves when playback ends. */
export function playAudio(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    stopPlayback()
    currentUrl = URL.createObjectURL(blob)
    currentAudio = new Audio(currentUrl)
    currentAudio.onended = () => { cleanup(); resolve() }
    currentAudio.onerror = () => { cleanup(); reject(new Error('Audio playback failed')) }
    currentAudio.play().catch(reject)
  })
}

/** Synthesize text and immediately play it. */
export async function synthesizeAndPlay(text: string, options?: TTSOptions): Promise<void> {
  const blob = await synthesize(text, options)
  await playAudio(blob)
}

/** Stop any currently playing audio. */
export function stopPlayback(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  cleanup()
}

function cleanup(): void {
  if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null }
  currentAudio = null
}

/** Check if audio is currently playing. */
export function isPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused
}
