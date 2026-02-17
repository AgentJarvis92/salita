'use client'

/**
 * /start — Phase 7: Voice-First Onboarding
 * Anam integration: live video avatar (Mia) replaces static portrait.
 * anamClient.talk() drives all speech — locked script, no LLM.
 * Mic is muted during onboarding; user responds via Web Speech API / text.
 * Script: LOCKED 2026-02-17 — no paraphrasing, no GPT
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient, AnamEvent } from '@anam-ai/js-sdk'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── LOCKED SCRIPT ────────────────────────────────────────────────────────────
const SCRIPT = {
  intro1:        "Hi. I'm Ate Maria.",
  intro2:        "I'm really glad you're here.",
  intro3:        "We're going to speak Tagalog right now.",
  intro4:        "Don't worry. I've got you.",
  win1Prompt:    "First — tell me your name.",
  win1Correct:   "Perfect. See? You're already speaking Tagalog.",
  win1Incorrect: "Almost. Say it like this — Ako si, your name.",
  win1Natural:   "See? That felt natural.",
  win2Setup:     "Now I'll ask you something.",
  win2Question:  "Kamusta ka?",
  win2Correct:   "Ang galing. That means I'm good.",
  win2Incorrect: "Close. Try this — Mabuti ako.",
  transition1:   "That's it. You just had your first real conversation in Tagalog.",
  transition2:   "Do you want to start from the very beginning? Or jump into real conversations?",
  beginnerPost:  "Okay. We'll build this slowly and naturally. You won't feel lost.",
  heritagePost:  "Good. I won't baby you. But I'll catch you when you need it.",
} as const

type Step =
  | 'init' | 'connecting' | 'intro'
  | 'win1-prompt' | 'win1-listen' | 'win1-result'
  | 'win2-prompt' | 'win2-listen' | 'win2-result'
  | 'transition' | 'mode-select' | 'post-select' | 'account-gate'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function isWebSpeechAvailable(): boolean {
  return typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function StartPage() {
  const router = useRouter()

  const [step, setStep]                     = useState<Step>('init')
  const [needsGesture, setNeedsGesture]     = useState(true)   // iOS tap gate
  const [currentLine, setCurrentLine]       = useState('')
  const [textInput, setTextInput]           = useState('')
  const [isListening, setIsListening]       = useState(false)
  const [isSpeaking, setIsSpeaking]         = useState(false)
  const [anamReady, setAnamReady]           = useState(false)
  const [connectError, setConnectError]     = useState('')
  const [win1Attempts, setWin1Attempts]     = useState(0)
  const [win2Attempts, setWin2Attempts]     = useState(0)
  const [micError, setMicError]             = useState('')
  const [signupEmail, setSignupEmail]       = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError]       = useState('')
  const [signupLoading, setSignupLoading]   = useState(false)

  const anamRef      = useRef<ReturnType<typeof createClient> | null>(null)
  const cancelledRef = useRef(false)
  const flowStarted  = useRef(false)
  const inputRef     = useRef<HTMLInputElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)

  // ─── ANAM INIT ─────────────────────────────────────────────────────────────

  const initAnam = useCallback(async () => {
    try {
      setStep('connecting')
      const res = await fetch('/api/anam/session-token', { method: 'POST' })
      if (!res.ok) throw new Error('Session token failed')
      const { sessionToken } = await res.json()

      const client = createClient(sessionToken)
      anamRef.current = client

      // SESSION_READY fires when the avatar is live and ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Anam connection timeout')), 20000)
        client.addListener(AnamEvent.SESSION_READY, () => {
          clearTimeout(timeout)
          setAnamReady(true)
          resolve()
        })
        client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
          clearTimeout(timeout)
          reject(new Error('Connection closed'))
        })
        // Stream to the video element
        if (videoRef.current) {
          client.streamToVideoElement('anam-video').catch(reject)
        } else {
          reject(new Error('Video element not found'))
        }
      })
    } catch (err) {
      console.error('[ANAM INIT]', err)
      setConnectError('Could not connect avatar. Please refresh.')
      setStep('init')
    }
  }, [])

  const handleTapToBegin = useCallback(() => {
    setNeedsGesture(false)
    initAnam()
  }, [initAnam])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      anamRef.current?.stopStreaming().catch(() => {})
    }
  }, []) // eslint-disable-line

  // ─── ANAM TALK ─────────────────────────────────────────────────────────────
  // Calls anamClient.talk() and awaits endOfSpeech via MESSAGE_STREAM_EVENT_RECEIVED.

  const anamTalk = useCallback(async (text: string): Promise<void> => {
    if (cancelledRef.current || !anamRef.current) return
    setIsSpeaking(true)

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

      // Safety timeout: if no endOfSpeech fires within 30s, resolve anyway
      setTimeout(() => {
        client.removeListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, onStream)
        setIsSpeaking(false)
        resolve()
      }, 30000)
    })
  }, [])

  // ─── FLOW ──────────────────────────────────────────────────────────────────

  const startFlow = useCallback(async () => {
    if (flowStarted.current || !anamReady) return
    flowStarted.current = true
    if (cancelledRef.current) return

    setStep('intro')

    await anamTalk(SCRIPT.intro1)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro1)
    await sleep(600)

    await anamTalk(SCRIPT.intro2)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro2)
    await sleep(800)

    await anamTalk(SCRIPT.intro3)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro3)
    await sleep(1000)

    await anamTalk(SCRIPT.intro4)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro4)
    await sleep(800)

    await anamTalk(SCRIPT.win1Prompt)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.win1Prompt)
    setStep('win1-prompt')
  }, [anamReady, anamTalk])

  // Start flow once Anam is ready
  useEffect(() => {
    if (anamReady) startFlow()
  }, [anamReady, startFlow])

  // ─── USER INPUT ────────────────────────────────────────────────────────────

  const detectWin1 = (t: string) => t.toLowerCase().includes('ako')
  const detectWin2 = (t: string) => t.toLowerCase().includes('mabuti')

  const handleUserInput = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTextInput('')
    setMicError('')

    if (step === 'win1-prompt' || step === 'win1-listen') {
      setStep('win1-result')
      const correct = win1Attempts > 0 ? true : detectWin1(trimmed)
      setWin1Attempts(a => a + 1)

      if (correct) {
        await anamTalk(SCRIPT.win1Correct)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win1Correct)
        await sleep(600)

        await anamTalk(SCRIPT.win1Natural)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win1Natural)
        await sleep(600)

        await anamTalk(SCRIPT.win2Setup)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Setup)
        await sleep(300)

        await anamTalk(SCRIPT.win2Question)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Question)
        setStep('win2-prompt')
      } else {
        await anamTalk(SCRIPT.win1Incorrect)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win1Incorrect)
        await sleep(500)
        setStep('win1-prompt')
      }
    }

    else if (step === 'win2-prompt' || step === 'win2-listen') {
      setStep('win2-result')
      const correct = win2Attempts > 0 ? true : detectWin2(trimmed)
      setWin2Attempts(a => a + 1)

      if (correct) {
        await anamTalk(SCRIPT.win2Correct)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Correct)
        await sleep(500)

        setStep('transition')
        await anamTalk(SCRIPT.transition1)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.transition1)
        await sleep(700)

        await anamTalk(SCRIPT.transition2)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.transition2)
        setStep('mode-select')
      } else {
        await anamTalk(SCRIPT.win2Incorrect)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Incorrect)
        await sleep(500)
        setStep('win2-prompt')
      }
    }
  }, [step, win1Attempts, win2Attempts, anamTalk])

  const handleModeSelect = useCallback(async (mode: 'beginner' | 'heritage') => {
    setStep('post-select')
    const line = mode === 'beginner' ? SCRIPT.beginnerPost : SCRIPT.heritagePost
    await anamTalk(line)
    if (cancelledRef.current) return
    setCurrentLine(line)
    await sleep(500)
    setStep('account-gate')
  }, [anamTalk])

  // ─── MIC ───────────────────────────────────────────────────────────────────

  const handleMicPress = useCallback(async () => {
    if (isListening || isSpeaking) return
    if (!isWebSpeechAvailable()) {
      setMicError('Use the text input below.')
      inputRef.current?.focus()
      return
    }
    setIsListening(true)
    setMicError('')

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'tl-PH'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e: any) => { setIsListening(false); handleUserInput(e.results[0][0].transcript) }
    recognition.onerror = () => { setIsListening(false); setMicError('Could not hear you — type below.'); inputRef.current?.focus() }
    recognition.onend = () => setIsListening(false)
    recognition.start()

    if (step === 'win1-prompt') setStep('win1-listen')
    if (step === 'win2-prompt') setStep('win2-listen')
  }, [isListening, isSpeaking, step, handleUserInput])

  // ─── SIGNUP ────────────────────────────────────────────────────────────────

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError('')
    setSignupLoading(true)
    const { error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword })
    if (error) { setSignupError(error.message); setSignupLoading(false) }
    else router.push('/chat')
  }, [signupEmail, signupPassword, router])

  // ─── DERIVED ───────────────────────────────────────────────────────────────

  const showInput     = ['win1-prompt','win1-listen','win2-prompt','win2-listen'].includes(step)
  const showMicBtn    = showInput || step === 'intro' || step === 'win1-result' || step === 'win2-result'
  const showWin1Cards = step === 'win1-prompt' || step === 'win1-listen'
  const showWin2Cards = step === 'win2-prompt' || step === 'win2-listen'

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: '#0a0c10', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif' }}
    >

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes micGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(212,175,55,0.08); }
          50%       { box-shadow: 0 0 22px rgba(212,175,55,0.28); }
        }
        @keyframes listeningRing {
          0%, 100% { box-shadow: 0 0 0 2px rgba(212,175,55,0.25); }
          50%       { box-shadow: 0 0 0 5px rgba(212,175,55,0.08); }
        }
        @keyframes speakingGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,0.2); }
          50%       { box-shadow: 0 0 30px rgba(212,175,55,0.5); }
        }
        #anam-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 15%;
        }
      `}</style>

      {/* ── Ambient lights ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute rounded-full opacity-40" style={{ top:'-10%', right:'-20%', width:300, height:300, background:'radial-gradient(circle, #1e3a5f, transparent)', filter:'blur(80px)' }} />
        <div className="absolute rounded-full opacity-20" style={{ bottom:'20%', left:'-20%', width:250, height:250, background:'radial-gradient(circle, #8a3a3a, transparent)', filter:'blur(80px)' }} />
        <div className="absolute rounded-full" style={{ top:'40%', right:'10%', width:100, height:100, background:'#D4AF37', opacity:0.08, filter:'blur(80px)' }} />
      </div>

      {/* ── Noise texture ── */}
      <div className="pointer-events-none absolute inset-0 z-[9999] opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")` }}
      />

      {/* ── Tap to begin overlay (iOS gesture gate) ── */}
      {needsGesture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(10,12,16,0.96)' }}>
          <button
            onClick={handleTapToBegin}
            className="px-8 py-4 rounded-full font-semibold text-[17px] tracking-wide transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#D4AF37', color: '#0a0c10' }}
          >
            Tap to begin
          </button>
        </div>
      )}

      {/* ── Connecting overlay ── */}
      {step === 'connecting' && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ backgroundColor: '#0a0c10' }}>
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mb-4" />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Connecting…</p>
        </div>
      )}

      {/* ── Error state ── */}
      {connectError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ backgroundColor: '#0a0c10' }}>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{connectError}</p>
        </div>
      )}

      {/* ── Main container ── */}
      <div className="relative z-10 h-full flex flex-col max-w-[430px] mx-auto">

        {/* ── Anam Video Avatar (75vh) ── */}
        {step !== 'account-gate' && (
          <div className="relative w-full flex-shrink-0" style={{ height: '75vh' }}>
            <video
              ref={videoRef}
              id="anam-video"
              autoPlay
              playsInline
              muted={false}
              style={{
                filter: `contrast(0.97) saturate(0.9)${isSpeaking ? ' drop-shadow(0 0 20px rgba(212,175,55,0.2))' : ''}`,
                transition: 'filter 0.5s ease',
              }}
            />
            {/* Gradient fade */}
            <div
              className="absolute bottom-0 left-0 w-full pointer-events-none"
              style={{ height: '50%', background: 'linear-gradient(to top, rgba(10,12,16,1) 0%, rgba(10,12,16,0.7) 30%, transparent 100%)' }}
            />
          </div>
        )}

        {/* ── Bottom content — floats 60px above chrome ── */}
        {step !== 'account-gate' && step !== 'mode-select' && (
          <div
            className="absolute left-0 w-full z-10"
            style={{ bottom: 60, padding: '0 24px 0' }}
          >
            {/* Transcript strip */}
            {currentLine && (
              <div
                className="rounded-xl mb-5"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '16px',
                }}
              >
                <p
                  key={currentLine}
                  className="text-white text-[16px] leading-relaxed mb-0"
                  style={{ animation: 'fadeInUp 0.28s ease-out both' }}
                >
                  {currentLine}
                </p>

                {/* Win 1 support — staggered */}
                {showWin1Cards && (
                  <div className="mt-3 space-y-1">
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,1)', opacity: 0, animation: 'fadeInUp 0.28s ease-out 0.3s both' }}>
                      <span style={{ opacity: 0.65 }}>Meaning&nbsp;&nbsp;</span>My name is ___
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', opacity: 0, animation: 'fadeInUp 0.28s ease-out 0.6s both' }}>
                      <span style={{ opacity: 0.85 }}>Sabihin mo&nbsp;&nbsp;</span>Ako si ___
                    </p>
                  </div>
                )}

                {/* Win 2 support — staggered */}
                {showWin2Cards && (
                  <div className="mt-3 space-y-1">
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,1)', opacity: 0, animation: 'fadeInUp 0.28s ease-out 0.3s both' }}>
                      <span style={{ opacity: 0.65 }}>Meaning&nbsp;&nbsp;</span>How are you?
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', opacity: 0, animation: 'fadeInUp 0.28s ease-out 0.6s both' }}>
                      <span style={{ opacity: 0.85 }}>Sabihin mo&nbsp;&nbsp;</span>Mabuti ako.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Input area */}
            <div className="flex flex-col items-center gap-3">
              {/* Mic button */}
              {showMicBtn && (
                <button
                  onClick={showInput && !isSpeaking ? handleMicPress : undefined}
                  disabled={isListening || isSpeaking}
                  className="flex items-center justify-center rounded-full transition-transform active:scale-95 touch-manipulation"
                  style={{
                    width: 64, height: 64,
                    background: isListening ? 'rgba(212,175,55,0.15)' : isSpeaking ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isListening ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    animation: isListening ? 'listeningRing 1.5s ease-in-out infinite' : isSpeaking ? 'speakingGlow 2s ease-in-out infinite' : 'micGlow 5s ease-in-out infinite',
                  }}
                  aria-label={isListening ? 'Listening' : 'Speak'}
                >
                  {isSpeaking ? (
                    // Speaking indicator — animated dots
                    <div className="flex gap-1 items-center">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
                          style={{ animation: `fadeInUp 0.6s ease-in-out ${i * 0.2}s infinite alternate` }} />
                      ))}
                    </div>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
              )}

              {isListening && <p style={{ fontSize: 13, color: 'rgba(212,175,55,0.7)' }}>Listening...</p>}

              {showInput && !isListening && !isSpeaking && (
                <>
                  <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>or type below</p>
                  <div className="w-full flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleUserInput(textInput)}
                      placeholder={showWin1Cards ? 'Ako si ___' : 'Mabuti ako.'}
                      className="flex-1 text-white rounded-2xl px-4 py-3 text-[15px] focus:outline-none focus:ring-1"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        caretColor: '#D4AF37',
                      }}
                    />
                    <button
                      onClick={() => textInput.trim() && handleUserInput(textInput)}
                      disabled={!textInput.trim()}
                      className="rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                      style={{ width: 44, height: 44, background: '#D4AF37' }}
                    >
                      <svg width="18" height="18" fill="none" stroke="#0a0c10" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </>
              )}

              {micError && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{micError}</p>}

              <Link href="/login" style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}
                className="hover:text-white/50 transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── MODE SELECTION ── */}
        {step === 'mode-select' && (
          <div className="absolute bottom-0 left-0 w-full z-10" style={{ padding: '0 24px 40px' }}>
            <div
              className="rounded-xl mb-6"
              style={{
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '16px',
              }}
            >
              <p key={SCRIPT.transition2} className="text-white text-[16px] leading-relaxed"
                style={{ animation: 'fadeInUp 0.28s ease-out both' }}>{SCRIPT.transition2}</p>
            </div>

            <div className="space-y-3">
              <button onClick={() => handleModeSelect('beginner')}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-200 touch-manipulation"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                <p className="text-white font-semibold mb-1">Beginner</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Start from the ground up. I'll guide you step by step.</p>
              </button>

              <button onClick={() => handleModeSelect('heritage')}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-200 touch-manipulation"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                <p className="text-white font-semibold mb-1">Heritage</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>You understand more than you think. Let's unlock it.</p>
              </button>
            </div>

            <div className="text-center mt-5">
              <Link href="/login" style={{ fontSize: 12, color: '#64748b' }} className="hover:text-white/50 transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── ACCOUNT GATE ── */}
        {step === 'account-gate' && (
          <div className="flex flex-col h-full pt-16 pb-10 px-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src="/avatars/ate-maria-portrait.png" alt="Ate Maria"
                  className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} />
              </div>
            </div>
            <h2 className="text-[22px] font-semibold text-center text-white mb-2">
              Save your progress and continue.
            </h2>
            <p className="text-center mb-8" style={{ fontSize: 14, color: '#94a3b8' }}>You've already started.</p>

            <form onSubmit={handleSignup} className="space-y-3">
              <input type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                placeholder="Email" className="w-full text-white rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#D4AF37' }} />
              <input type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                placeholder="Password (8+ chars, 1 uppercase, 1 number)"
                className="w-full text-white rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#D4AF37' }} />
              {signupError && <p className="text-red-400/80 text-[13px] px-1">{signupError}</p>}
              <button type="submit" disabled={signupLoading}
                className="w-full rounded-2xl py-3.5 font-semibold text-[16px] disabled:opacity-60 transition-opacity mt-2"
                style={{ background: '#D4AF37', color: '#0a0c10' }}>
                {signupLoading ? 'Creating account...' : 'Continue'}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link href="/login" style={{ fontSize: 13, color: '#64748b' }} className="hover:text-white/50 transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
