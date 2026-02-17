'use client'

/**
 * /start — Phase 7: Voice-First Onboarding
 * Refinement patch 2026-02-17:
 *   - 4-line warm intro with paced pauses
 *   - Transcript appears AFTER voice completes (fadeInUp)
 *   - TTS segment shaping (short chunks, 200ms gaps)
 *   - Staggered Meaning / Sabihin mo cards
 *   - Avatar breathing animation (scale 1→1.01, 6s)
 *   - Mic glow replaces pulse ring
 *   - Transcript strip floats 60px above bottom chrome
 *   - "See? That felt natural." bridge after win1
 * Script: LOCKED 2026-02-17 — no paraphrasing, no GPT
 */

import { useState, useRef, useEffect, useCallback } from 'react'
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

// ─── TTS SHAPING ─────────────────────────────────────────────────────────────
// Maps display text → spoken segments (short chunks with 200ms gaps).
// Transcript always shows full display text — only TTS is shaped.
const TTS_SEGMENTS: Partial<Record<string, string[]>> = {
  [SCRIPT.win1Correct]:   ["Perfect.", "See? You're already speaking Tagalog."],
  [SCRIPT.win1Incorrect]: ["Almost.", "Say it like this.", "Ako si, then your name."],
  [SCRIPT.win2Correct]:   ["Ang galing.", "That means I'm good."],
  [SCRIPT.win2Incorrect]: ["Close.", "Try this.", "Mabuti ako."],
  [SCRIPT.transition1]:   ["That's it.", "You just had your first real conversation in Tagalog."],
  [SCRIPT.beginnerPost]:  ["Okay.", "We'll build this slowly and naturally.", "You won't feel lost."],
  [SCRIPT.heritagePost]:  ["Good.", "I won't baby you.", "But I'll catch you when you need it."],
}

type Step =
  | 'init' | 'intro'
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
  const [needsGesture, setNeedsGesture]     = useState(false)
  const [currentLine, setCurrentLine]       = useState('')
  const [textInput, setTextInput]           = useState('')
  const [isListening, setIsListening]       = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [win1Attempts, setWin1Attempts]     = useState(0)
  const [win2Attempts, setWin2Attempts]     = useState(0)
  const [micError, setMicError]             = useState('')
  const [signupEmail, setSignupEmail]       = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError]       = useState('')
  const [signupLoading, setSignupLoading]   = useState(false)

  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const pendingRef   = useRef<{ audio: HTMLAudioElement; url: string; resolve: () => void } | null>(null)
  const cancelledRef = useRef(false)
  const flowStarted  = useRef(false)
  const inputRef     = useRef<HTMLInputElement>(null)

  // ─── AUDIO — single segment ────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  const playSegment = useCallback(async (text: string): Promise<void> => {
    if (cancelledRef.current) return
    stopAudio()
    try {
      setIsAudioLoading(true)
      const res = await fetch('/api/speech/onboarding-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      setIsAudioLoading(false)
      if (!res.ok || cancelledRef.current) return

      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
        }
        audio.onended = () => { cleanup(); resolve() }
        audio.onerror = () => { cleanup(); resolve() }
        audio.play().catch((err) => {
          if (err.name === 'NotAllowedError') {
            pendingRef.current = { audio, url, resolve }
            setNeedsGesture(true)
          } else {
            cleanup(); resolve()
          }
        })
      })
    } catch { setIsAudioLoading(false) }
  }, [stopAudio])

  // ─── AUDIO — shaped (segments + 200ms gaps) ────────────────────────────────

  const playLine = useCallback(async (text: string): Promise<void> => {
    const segments = TTS_SEGMENTS[text]
    if (segments) {
      for (let i = 0; i < segments.length; i++) {
        if (cancelledRef.current) return
        if (i > 0) await sleep(200)   // 200ms gap between segments
        await playSegment(segments[i])
      }
    } else {
      await playSegment(text)
    }
  }, [playSegment])

  const handleGestureUnlock = useCallback(() => {
    setNeedsGesture(false)
    if (pendingRef.current) {
      const { audio, resolve } = pendingRef.current
      pendingRef.current = null
      audioRef.current = audio
      audio.play()
        .then(() => {
          audio.onended = () => { if (audioRef.current === audio) audioRef.current = null; resolve() }
          audio.onerror = () => { if (audioRef.current === audio) audioRef.current = null; resolve() }
        })
        .catch(() => resolve())
    } else if (!flowStarted.current) {
      startFlow()
    }
  }, []) // eslint-disable-line

  // ─── FLOW ──────────────────────────────────────────────────────────────────
  // Transcript appears AFTER each spoken line completes.

  const startFlow = useCallback(async () => {
    if (flowStarted.current) return
    flowStarted.current = true
    if (cancelledRef.current) return

    setStep('intro')

    // Intro: 4 lines with paced pauses between
    await playLine(SCRIPT.intro1)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro1)
    await sleep(600)

    await playLine(SCRIPT.intro2)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro2)
    await sleep(800)

    await playLine(SCRIPT.intro3)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro3)
    await sleep(1000)

    await playLine(SCRIPT.intro4)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.intro4)
    await sleep(800)

    // Win 1 prompt
    await playLine(SCRIPT.win1Prompt)
    if (cancelledRef.current) return
    setCurrentLine(SCRIPT.win1Prompt)
    setStep('win1-prompt')
  }, [playLine])

  useEffect(() => {
    const t = setTimeout(() => startFlow(), 400)
    return () => { clearTimeout(t); cancelledRef.current = true; stopAudio() }
  }, []) // eslint-disable-line

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
        await playLine(SCRIPT.win1Correct)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win1Correct)
        await sleep(600)

        // Bridge — removes step-by-step lesson feel
        await playLine(SCRIPT.win1Natural)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win1Natural)
        await sleep(600)

        await playLine(SCRIPT.win2Setup)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Setup)
        await sleep(300)

        await playLine(SCRIPT.win2Question)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Question)
        setStep('win2-prompt')
      } else {
        await playLine(SCRIPT.win1Incorrect)
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
        await playLine(SCRIPT.win2Correct)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Correct)
        await sleep(500)

        setStep('transition')
        await playLine(SCRIPT.transition1)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.transition1)
        await sleep(700)

        await playLine(SCRIPT.transition2)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.transition2)
        setStep('mode-select')
      } else {
        await playLine(SCRIPT.win2Incorrect)
        if (cancelledRef.current) return
        setCurrentLine(SCRIPT.win2Incorrect)
        await sleep(500)
        setStep('win2-prompt')
      }
    }
  }, [step, win1Attempts, win2Attempts, playLine])

  const handleModeSelect = useCallback(async (mode: 'beginner' | 'heritage') => {
    setStep('post-select')
    const line = mode === 'beginner' ? SCRIPT.beginnerPost : SCRIPT.heritagePost
    await playLine(line)
    if (cancelledRef.current) return
    setCurrentLine(line)
    await sleep(500)
    setStep('account-gate')
  }, [playLine])

  // ─── MIC ───────────────────────────────────────────────────────────────────

  const handleMicPress = useCallback(async () => {
    if (isListening) return
    stopAudio()
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
  }, [isListening, step, stopAudio, handleUserInput])

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
        @keyframes avatarBreathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.01); }
        }
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
      `}</style>

      {/* ── Ambient lights ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute rounded-full opacity-40" style={{ top:'-10%', right:'-20%', width:300, height:300, background:'radial-gradient(circle, #1e3a5f, transparent)', filter:'blur(80px)' }} />
        <div className="absolute rounded-full opacity-20" style={{ bottom:'20%', left:'-20%', width:250, height:250, background:'radial-gradient(circle, #8a3a3a, transparent)', filter:'blur(80px)' }} />
        <div className="absolute rounded-full" style={{ top:'40%', right:'10%', width:100, height:100, background:'#D4AF37', opacity:0.08, filter:'blur(80px)' }} />
      </div>

      {/* ── Noise texture ── */}
      <div className="pointer-events-none absolute inset-0 z-[9999] opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height%3D'100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")` }}
      />

      {/* ── Tap to begin overlay ── */}
      {needsGesture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(10,12,16,0.92)' }}>
          <button
            onClick={handleGestureUnlock}
            className="px-8 py-4 rounded-full font-semibold text-[17px] tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#D4AF37', color: '#0a0c10' }}
          >
            Tap to begin
          </button>
        </div>
      )}

      {/* ── Main container ── */}
      <div className="relative z-10 h-full flex flex-col max-w-[430px] mx-auto">

        {/* ── Avatar (75vh) ── */}
        {step !== 'account-gate' && (
          <div className="relative w-full flex-shrink-0" style={{ height: '75vh' }}>
            <img
              src="/avatars/ate-maria-portrait.png"
              alt="Ate Maria"
              className="w-full h-full object-cover"
              style={{
                objectPosition: 'center 15%',
                filter: 'contrast(0.97) saturate(0.9) drop-shadow(0 20px 30px rgba(0,0,0,0.5))',
                animation: 'avatarBreathe 6s ease-in-out infinite',
                transformOrigin: 'center center',
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
            {/* Transcript strip — floating with blur */}
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
                {/* Transcript text — fadeInUp on each new line via key */}
                <p
                  key={currentLine}
                  className="text-white text-[16px] leading-relaxed mb-0"
                  style={{ animation: 'fadeInUp 0.28s ease-out both' }}
                >
                  {currentLine}
                </p>

                {/* Win 1 support — Meaning staggered 300ms, Sabihin mo 600ms */}
                {showWin1Cards && (
                  <div className="mt-3 space-y-1">
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,1)',
                        opacity: 0,
                        animation: 'fadeInUp 0.28s ease-out 0.3s both',
                      }}
                    >
                      <span style={{ opacity: 0.65 }}>Meaning&nbsp;&nbsp;</span>My name is ___
                    </p>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.85)',
                        opacity: 0,
                        animation: 'fadeInUp 0.28s ease-out 0.6s both',
                      }}
                    >
                      <span style={{ opacity: 0.85 }}>Sabihin mo&nbsp;&nbsp;</span>Ako si ___
                    </p>
                  </div>
                )}

                {/* Win 2 support — same stagger pattern */}
                {showWin2Cards && (
                  <div className="mt-3 space-y-1">
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,1)',
                        opacity: 0,
                        animation: 'fadeInUp 0.28s ease-out 0.3s both',
                      }}
                    >
                      <span style={{ opacity: 0.65 }}>Meaning&nbsp;&nbsp;</span>How are you?
                    </p>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.85)',
                        opacity: 0,
                        animation: 'fadeInUp 0.28s ease-out 0.6s both',
                      }}
                    >
                      <span style={{ opacity: 0.85 }}>Sabihin mo&nbsp;&nbsp;</span>Mabuti ako.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Input area */}
            <div className="flex flex-col items-center gap-3">
              {/* Mic button — soft glow, no pulse ring */}
              <button
                onClick={showInput ? handleMicPress : (needsGesture ? handleGestureUnlock : undefined)}
                disabled={isListening}
                className="flex items-center justify-center rounded-full transition-transform active:scale-95 touch-manipulation"
                style={{
                  width: 64, height: 64,
                  background: isListening ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isListening ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  animation: isListening
                    ? 'listeningRing 1.5s ease-in-out infinite'
                    : 'micGlow 5s ease-in-out infinite',
                }}
                aria-label={isListening ? 'Listening' : 'Speak'}
              >
                {isAudioLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>

              {isListening && <p style={{ fontSize: 13, color: 'rgba(212,175,55,0.7)' }}>Listening...</p>}

              {showInput && !isListening && (
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

              {/* Sign in link */}
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
              <p
                key={SCRIPT.transition2}
                className="text-white text-[16px] leading-relaxed"
                style={{ animation: 'fadeInUp 0.28s ease-out both' }}
              >
                {SCRIPT.transition2}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleModeSelect('beginner')}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-200 touch-manipulation"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              >
                <p className="text-white font-semibold mb-1">Beginner</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Start from the ground up. I'll guide you step by step.</p>
              </button>

              <button
                onClick={() => handleModeSelect('heritage')}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-200 touch-manipulation"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              >
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
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <img
                  src="/avatars/ate-maria-portrait.png"
                  alt="Ate Maria"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 15%' }}
                />
              </div>
            </div>

            <h2 className="text-[22px] font-semibold text-center text-white mb-2">
              Save your progress and continue.
            </h2>
            <p className="text-center mb-8" style={{ fontSize: 14, color: '#94a3b8' }}>
              You've already started.
            </p>

            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="email"
                required
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                placeholder="Email"
                className="w-full text-white rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#D4AF37' }}
              />
              <input
                type="password"
                required
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                placeholder="Password (8+ chars, 1 uppercase, 1 number)"
                className="w-full text-white rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#D4AF37' }}
              />
              {signupError && <p className="text-red-400/80 text-[13px] px-1">{signupError}</p>}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-2xl py-3.5 font-semibold text-[16px] disabled:opacity-60 transition-opacity mt-2"
                style={{ background: '#D4AF37', color: '#0a0c10' }}
              >
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
