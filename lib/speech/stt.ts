/**
 * Speech-to-Text (STT) Module
 * 
 * Primary: Web Speech API (Chrome/Edge) - free, instant
 * Fallback: OpenAI Whisper via /api/speech/transcribe (Safari/iOS)
 */

export interface STTResult {
  text: string
  confidence: number
  source: 'webspeech' | 'whisper'
}

export interface STTError {
  type: 'not-supported' | 'mic-denied' | 'mic-unavailable' | 'network' | 'unknown'
  message: string
}

/** Check if Web Speech API is available */
export function isWebSpeechAvailable(): boolean {
  if (typeof window === 'undefined') return false
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

/** Request microphone permission. Returns true if granted. */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch {
    return false
  }
}

/** Check current mic permission state without prompting */
export async function checkMicPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return result.state as 'granted' | 'denied' | 'prompt'
  } catch {
    return 'prompt'
  }
}

/**
 * Transcribe using Web Speech API (Chrome/Edge).
 * Returns a promise that resolves with the transcription result.
 */
export function transcribeWebSpeech(lang: string = 'tl-PH'): Promise<STTResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      reject(new Error('Web Speech API not available'))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    let resolved = false

    recognition.onresult = (event: any) => {
      resolved = true
      const result = event.results[0][0]
      resolve({
        text: result.transcript,
        confidence: result.confidence,
        source: 'webspeech',
      })
    }

    recognition.onerror = (event: any) => {
      if (!resolved) {
        if (event.error === 'not-allowed') {
          reject(new Error('mic-denied'))
        } else if (event.error === 'no-speech') {
          reject(new Error('no-speech'))
        } else {
          reject(new Error(event.error))
        }
      }
    }

    recognition.onend = () => {
      if (!resolved) reject(new Error('no-speech'))
    }

    recognition.start()
  })
}

/**
 * Create an audio recorder for Whisper fallback (Safari/iOS).
 */
export function createAudioRecorder() {
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let stream: MediaStream | null = null

  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start()
    },
    stop(): Promise<Blob> {
      return new Promise((resolve) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          resolve(new Blob(chunks, { type: 'audio/webm' }))
          return
        }
        mediaRecorder.onstop = () => {
          stream?.getTracks().forEach(t => t.stop())
          resolve(new Blob(chunks, { type: mediaRecorder!.mimeType }))
        }
        mediaRecorder.stop()
      })
    },
  }
}

/**
 * Transcribe audio blob using OpenAI Whisper via API endpoint.
 */
export async function transcribeWhisper(blob: Blob, lang: string = 'tl'): Promise<STTResult> {
  const formData = new FormData()
  formData.append('audio', blob, 'recording.webm')
  formData.append('language', lang.split('-')[0])

  const res = await fetch('/api/speech/transcribe', { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`Transcription failed: ${await res.text()}`)

  const data = await res.json()
  return { text: data.text, confidence: 0.9, source: 'whisper' }
}
