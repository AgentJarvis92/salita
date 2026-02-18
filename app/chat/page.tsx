'use client'

/**
 * /chat — Phase 7: Live Avatar Conversation
 *
 * FaceTime with Ate Maria. Mic is always on (push-to-mute).
 * Responses spoken via Anam AI. Falls back to text-only if avatar fails.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient, AnamEvent } from '@anam-ai/js-sdk'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { isWebSpeechAvailable, requestMicPermission, createAudioRecorder, transcribeWhisper } from '@/lib/speech/stt'

interface AIResponse {
  tagalog: string
  sabihin: string | null
  meaning: string | null
  correction: string | null
  examples: string[] | null
  note: string | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content?: string
  aiResponse?: AIResponse
  timestamp: Date
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Avatar
  const [avatarReady, setAvatarReady] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(true)

  // Conversation
  const [messages, setMessages] = useState<Message[]>([])
  const [subtitle, setSubtitle] = useState('')
  const [textInput, setTextInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  // Mic — always on by default
  const [muted, setMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [micReady, setMicReady] = useState(false)

  // Refs
  const anamRef = useRef<ReturnType<typeof createClient> | null>(null)
  const cancelledRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const greetingSent = useRef(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const recorderRef = useRef<ReturnType<typeof createAudioRecorder> | null>(null)
  const recognitionRef = useRef<any>(null)
  const messagesRef = useRef<Message[]>([])
  const isSpeakingRef = useRef(false)
  const isSendingRef = useRef(false)
  const mutedRef = useRef(false)

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { isSpeakingRef.current = isSpeaking }, [isSpeaking])
  useEffect(() => { isSendingRef.current = isSending }, [isSending])
  useEffect(() => { mutedRef.current = muted }, [muted])

  // ─── AUTH ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      stopListening()
      anamRef.current?.stopStreaming().catch(() => {})
    }
  }, [])

  // ─── ANAM INIT ───────────────────────────────────────────────────────────
  const initAnam = useCallback(async () => {
    try {
      setConnecting(true)
      const res = await fetch('/api/anam/session-token', { method: 'POST' })
      if (!res.ok) throw new Error('Session token failed')
      const { sessionToken } = await res.json()

      const client = createClient(sessionToken, { disableInputAudio: true })
      anamRef.current = client

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 20000)
        client.addListener(AnamEvent.SESSION_READY, () => {
          clearTimeout(timeout)
          setAvatarReady(true)
          setConnecting(false)
          resolve()
        })
        client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
          clearTimeout(timeout)
          reject(new Error('Connection closed'))
        })
        if (videoRef.current) {
          client.streamToVideoElement('anam-video').catch(reject)
        } else {
          reject(new Error('Video element not found'))
        }
      })
    } catch (err) {
      console.error('[ANAM]', err)
      setAvatarFailed(true)
      setConnecting(false)
    }
  }, [])

  const handleTapToBegin = useCallback(async () => {
    setNeedsGesture(false)
    // Request mic permission immediately on first gesture
    const granted = await requestMicPermission()
    if (granted) {
      setMicReady(true)
    }
    initAnam()
  }, [initAnam])

  // ─── ANAM TALK ───────────────────────────────────────────────────────────
  const say = useCallback(async (text: string): Promise<void> => {
    if (cancelledRef.current || !anamRef.current || avatarFailed) return
    setIsSpeaking(true)
    setSubtitle(text)

    await new Promise<void>((resolve) => {
      const client = anamRef.current!
      const onStream = (event: { content: string; endOfSpeech: boolean; interrupted: boolean }) => {
        if (event.endOfSpeech || event.interrupted) {
          client.removeListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, onStream)
          setIsSpeaking(false)
          resolve()
        }
      }
      client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, onStream)
      client.talk(text).catch(() => {
        client.removeListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, onStream)
        setIsSpeaking(false)
        resolve()
      })
      setTimeout(() => {
        client.removeListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, onStream)
        setIsSpeaking(false)
        resolve()
      }, 30000)
    })

    await sleep(400)
    setSubtitle('')
  }, [avatarFailed])

  // ─── CONTINUOUS LISTENING ────────────────────────────────────────────────
  // Mic is always on. Restarts after each recognition result or timeout.
  // Pauses while avatar is speaking or sending.

  const startListening = useCallback(() => {
    if (cancelledRef.current || mutedRef.current || !micReady) return

    // Web Speech API path (Chrome/Edge)
    if (isWebSpeechAvailable()) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SR()
      recognition.lang = 'tl-PH'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript?.trim()
        if (text && !isSpeakingRef.current && !isSendingRef.current) {
          processUserSpeech(text)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        // Auto-restart if not muted and not busy
        if (!cancelledRef.current && !mutedRef.current) {
          setTimeout(() => {
            if (!isSpeakingRef.current && !isSendingRef.current && !mutedRef.current) {
              startListening()
            }
          }, 300)
        }
      }

      recognition.onerror = (e: any) => {
        // 'no-speech' and 'aborted' are normal — just restart
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.error('[MIC]', e.error)
        }
        setIsListening(false)
        if (!cancelledRef.current && !mutedRef.current) {
          setTimeout(() => startListening(), 500)
        }
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
        setIsListening(true)
      } catch {
        // Already started — ignore
      }
    } else {
      // iOS/Safari — use MediaRecorder + Whisper
      startWhisperListening()
    }
  }, [micReady])

  const startWhisperListening = useCallback(async () => {
    if (cancelledRef.current || mutedRef.current || isSpeakingRef.current || isSendingRef.current) return
    
    try {
      if (!recorderRef.current) {
        recorderRef.current = createAudioRecorder()
      }
      await recorderRef.current.start()
      setIsListening(true)

      // Record for 4 seconds
      await sleep(4000)

      if (cancelledRef.current || mutedRef.current) {
        try { await recorderRef.current.stop() } catch {}
        setIsListening(false)
        return
      }

      const blob = await recorderRef.current.stop()
      setIsListening(false)

      // Only transcribe if not busy
      if (!isSpeakingRef.current && !isSendingRef.current) {
        try {
          const result = await transcribeWhisper(blob, 'tl')
          if (result.text.trim() && !isSpeakingRef.current && !isSendingRef.current) {
            processUserSpeech(result.text.trim())
          }
        } catch {
          // Whisper failed — silently retry
        }
      }

      // Restart loop
      if (!cancelledRef.current && !mutedRef.current) {
        setTimeout(() => startWhisperListening(), 300)
      }
    } catch {
      setIsListening(false)
      if (!cancelledRef.current && !mutedRef.current) {
        setTimeout(() => startWhisperListening(), 1000)
      }
    }
  }, [micReady])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Start/stop listening based on mute state and avatar readiness
  useEffect(() => {
    if ((avatarReady || avatarFailed) && micReady && !muted) {
      // Don't start while speaking or sending
      if (!isSpeaking && !isSending) {
        startListening()
      }
    } else {
      stopListening()
    }
  }, [avatarReady, avatarFailed, micReady, muted, isSpeaking, isSending])

  // ─── PROCESS SPEECH ──────────────────────────────────────────────────────
  const processUserSpeech = useCallback((text: string) => {
    stopListening()
    sendMessage(text)
  }, [])

  // ─── SEND TO CHAT API ────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, isInitial = false) => {
    if (isSendingRef.current) return
    setIsSending(true)
    stopListening()

    if (!isInitial && text.trim()) {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMsg])
    }

    try {
      const history = messagesRef.current.map(msg => ({
        role: msg.role,
        content: msg.content,
        aiResponse: msg.aiResponse,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text || '',
          persona: 'ate_maria',
          conversationHistory: history,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed')

      const aiResponse: AIResponse = data.response
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        aiResponse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])

      if (avatarReady && !avatarFailed) {
        await say(aiResponse.tagalog)
        if (aiResponse.correction) {
          await sleep(600)
          await say(aiResponse.correction)
        }
      }
    } catch (err) {
      console.error('[CHAT]', err)
      setSubtitle('Sandali lang…')
      await sleep(2000)
      setSubtitle('')
    } finally {
      setIsSending(false)
      // Mic auto-resumes via useEffect when isSending becomes false
    }
  }, [avatarReady, avatarFailed, say, stopListening])

  // ─── INITIAL GREETING ────────────────────────────────────────────────────
  useEffect(() => {
    if (avatarReady && !greetingSent.current) {
      greetingSent.current = true
      const t = setTimeout(() => sendMessage('', true), 1500 + Math.random() * 800)
      return () => clearTimeout(t)
    }
  }, [avatarReady])

  useEffect(() => {
    if (avatarFailed && !greetingSent.current) {
      greetingSent.current = true
      sendMessage('', true)
    }
  }, [avatarFailed])

  // Scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [messages])

  // ─── TEXT INPUT ──────────────────────────────────────────────────────────
  const handleTextSubmit = useCallback(() => {
    const trimmed = textInput.trim()
    if (!trimmed || isSending || isSpeaking) return
    setTextInput('')
    stopListening()
    sendMessage(trimmed)
  }, [textInput, isSending, isSpeaking, sendMessage, stopListening])

  // ─── MUTE TOGGLE ────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setMuted(prev => !prev)
  }, [])

  // ─── LOADING ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0c10' }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/30 animate-spin" />
      </div>
    )
  }
  if (!user) return null

  const showInput = avatarReady || avatarFailed

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: '#0a0c10', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif' }}
    >
      <style>{`
        @keyframes subtitleIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        #anam-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 15%;
        }
      `}</style>

      {/* Tap gate */}
      {needsGesture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#0a0c10' }}>
          <button
            onClick={handleTapToBegin}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Start conversation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity={0.5}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Connecting */}
      {connecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: '#0a0c10' }}>
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/30 animate-spin" />
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col max-w-[430px] mx-auto">

        {/* Back */}
        <div className="absolute top-0 left-0 z-30 p-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/30 hover:text-white/50 transition-colors text-[13px]"
          >
            ← Back
          </button>
        </div>

        {/* Avatar video */}
        {!avatarFailed && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              id="anam-video"
              autoPlay
              playsInline
              muted={false}
              style={{ filter: 'contrast(0.97) saturate(0.9)' }}
            />
            <div
              className="absolute bottom-0 left-0 w-full pointer-events-none"
              style={{ height: '40%', background: 'linear-gradient(to top, rgba(10,12,16,1) 0%, rgba(10,12,16,0.6) 40%, transparent 100%)' }}
            />
          </div>
        )}

        {/* Text-only fallback */}
        {avatarFailed && (
          <div className="flex-1 overflow-y-auto px-5 pt-16 pb-4" ref={transcriptRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span
                  className="inline-block rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed max-w-[85%]"
                  style={{
                    background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {msg.role === 'user' ? msg.content : msg.aiResponse?.tagalog}
                  {msg.role === 'assistant' && msg.aiResponse?.correction && (
                    <span className="block mt-1.5" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      {msg.aiResponse.correction}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {isSending && (
              <div className="mb-3 text-left">
                <span className="inline-block rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Transcript overlay (avatar mode) */}
        {avatarReady && !avatarFailed && messages.length > 0 && (
          <div
            className="absolute left-0 w-full z-20 transition-all duration-300"
            style={{
              bottom: showTranscript ? 120 : 100,
              maxHeight: showTranscript ? '50vh' : 0,
              overflow: 'hidden',
              padding: '0 24px',
            }}
          >
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full text-center mb-2"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}
            >
              {showTranscript ? '↓ Hide' : `↑ ${messages.length} messages`}
            </button>
            {showTranscript && (
              <div
                ref={transcriptRef}
                className="overflow-y-auto rounded-xl p-3"
                style={{ maxHeight: 'calc(50vh - 40px)', background: 'rgba(10,12,16,0.9)' }}
              >
                {messages.map(msg => (
                  <div key={msg.id} className="mb-2">
                    <span style={{ fontSize: 12, color: msg.role === 'user' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)' }}>
                      {msg.role === 'user' ? `You: ${msg.content}` : `Maria: ${msg.aiResponse?.tagalog}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom overlay */}
        {!avatarFailed && (
          <div className="absolute left-0 w-full z-10" style={{ bottom: 40, padding: '0 24px' }}>

            {/* Subtitle */}
            {subtitle && (
              <p
                key={subtitle}
                className="text-white text-[16px] leading-relaxed text-center mb-4"
                style={{ animation: 'subtitleIn 0.3s ease-out both', opacity: 0.85 }}
              >
                {subtitle}
              </p>
            )}

            {/* Sending indicator */}
            {isSending && !subtitle && (
              <div className="flex justify-center mb-4">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Input row */}
            {showInput && (
              <div className="w-full flex gap-2 items-center">
                {/* Mic mute toggle */}
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
                  style={{
                    width: 44, height: 44,
                    background: muted ? 'rgba(255,60,60,0.15)' : isListening ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${muted ? 'rgba(255,60,60,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? (
                    // Mic off icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .87-.16 1.7-.45 2.47" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  ) : (
                    // Mic on icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isListening ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                  placeholder=""
                  className="flex-1 text-white rounded-2xl px-4 py-3 text-[15px] focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    caretColor: 'rgba(255,255,255,0.5)',
                  }}
                />

                {textInput.trim() && (
                  <button
                    onClick={handleTextSubmit}
                    disabled={isSending || isSpeaking}
                    className="rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
                    style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)' }}
                  >
                    <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.6)" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Text-only input (fallback) */}
        {avatarFailed && (
          <div className="flex-shrink-0 px-5 pb-8 pt-3">
            <div className="flex gap-2 items-center">
              <button
                onClick={toggleMute}
                className="flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
                style={{
                  width: 44, height: 44,
                  background: muted ? 'rgba(255,60,60,0.15)' : isListening ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${muted ? 'rgba(255,60,60,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .87-.16 1.7-.45 2.47" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isListening ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                placeholder=""
                className="flex-1 text-white rounded-2xl px-4 py-3 text-[15px] focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  caretColor: 'rgba(255,255,255,0.5)',
                }}
              />

              {textInput.trim() && (
                <button
                  onClick={handleTextSubmit}
                  disabled={isSending}
                  className="rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
                  style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)' }}
                >
                  <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.6)" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
