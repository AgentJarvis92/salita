'use client'

/**
 * /start — Phase 7: Voice-First Onboarding
 *
 * Public route. No auth. No Supabase calls until account gate.
 * Script is LOCKED — do not paraphrase or modify any line.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── LOCKED ONBOARDING SCRIPT (approved 2026-02-17) ─────────────────────────
// DO NOT MODIFY. DO NOT PARAPHRASE.
const SCRIPT = {
  intro1:       "Hi. I'm Ate Maria. We're going to speak Tagalog right now.",
  intro2:       "Don't worry. I've got you.",
  win1Prompt:   "First — tell me your name.",
  win1Correct:  "Perfect. See? You're already speaking Tagalog.",
  win1Incorrect: "Almost. Say it like this — Ako si, your name.",  // TTS-safe (no ___)
  win2Setup:    "Now I'll ask you something.",
  win2Question: "Kamusta ka?",
  win2Correct:  "Ang galing. That means I'm good.",
  win2Incorrect: "Close. Try this — Mabuti ako.",
  transition1:  "That's it. You just had your first real conversation in Tagalog.",
  transition2:  "Do you want to start from the very beginning? Or jump into real conversations?",
  beginnerPost: "Okay. We'll build this slowly and naturally. You won't feel lost.",
  heritagePost: "Good. I won't baby you. But I'll catch you when you need it.",
} as const

// Display text — shown on screen exactly as specified (with ___ placeholder)
const DISPLAY_INCORRECT_WIN1 = "Almost. Say it like this — Ako si ___."

type Step =
  | 'init'
  | 'intro'
  | 'win1-prompt'
  | 'win1-listen'
  | 'win1-result'
  | 'win2-prompt'
  | 'win2-listen'
  | 'win2-result'
  | 'transition'
  | 'mode-select'
  | 'post-select'
  | 'account-gate'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function isWebSpeechAvailable(): boolean {
  return typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function StartPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('init')
  const [needsGesture, setNeedsGesture] = useState(false)
  const [currentLine, setCurrentLine] = useState('')
  const [textInput, setTextInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'beginner' | 'heritage' | null>(null)
  const [win1Attempts, setWin1Attempts] = useState(0)
  const [win2Attempts, setWin2Attempts] = useState(0)
  const [micError, setMicError] = useState('')

  // Account gate
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingAudioRef = useRef<{ audio: HTMLAudioElement; url: string; resolve: () => void } | null>(null)
  const cancelledRef = useRef(false)
  const flowStartedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── AUDIO ─────────────────────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  const playLine = useCallback(async (text: string): Promise<void> => {
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

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
        }
        audio.onended = () => { cleanup(); resolve() }
        audio.onerror  = () => { cleanup(); resolve() }

        audio.play().catch((err) => {
          if (err.name === 'NotAllowedError') {
            // iOS / autoplay blocked — pause here, wait for gesture
            pendingAudioRef.current = { audio, url, resolve }
            setNeedsGesture(true)
            // resolve is intentionally not called yet
          } else {
            cleanup()
            resolve()
          }
        })
      })
    } catch {
      setIsAudioLoading(false)
    }
  }, [stopAudio])

  // Called when user taps "Tap to begin" or any first gesture
  const handleGestureUnlock = useCallback(() => {
    setNeedsGesture(false)
    if (pendingAudioRef.current) {
      const { audio, resolve } = pendingAudioRef.current
      pendingAudioRef.current = null
      audioRef.current = audio
      audio.play()
        .then(() => {
          audio.onended = () => {
            if (audioRef.current === audio) audioRef.current = null
            resolve()
          }
          audio.onerror = () => {
            if (audioRef.current === audio) audioRef.current = null
            resolve()
          }
        })
        .catch(() => resolve())
    } else if (!flowStartedRef.current) {
      startFlow()
    }
  }, []) // eslint-disable-line

  // ─── FLOW ──────────────────────────────────────────────────────────────────

  const startFlow = useCallback(async () => {
    if (flowStartedRef.current) return
    flowStartedRef.current = true
    if (cancelledRef.current) return

    // INTRO
    setStep('intro')
    setCurrentLine(SCRIPT.intro1)
    await playLine(SCRIPT.intro1)
    if (cancelledRef.current) return

    await sleep(1000)
    setCurrentLine(SCRIPT.intro2)
    await playLine(SCRIPT.intro2)
    if (cancelledRef.current) return

    // WIN 1 — prompt
    setCurrentLine(SCRIPT.win1Prompt)
    await playLine(SCRIPT.win1Prompt)
    if (cancelledRef.current) return
    setStep('win1-prompt')
    // Flow pauses here — waits for user input via handleUserInput
  }, [playLine])

  // On mount: try to auto-start
  useEffect(() => {
    const timer = setTimeout(() => {
      startFlow()
    }, 400)
    return () => {
      clearTimeout(timer)
      cancelledRef.current = true
      stopAudio()
    }
  }, []) // eslint-disable-line

  // ─── INPUT DETECTION ───────────────────────────────────────────────────────

  function detectWin1(text: string): boolean {
    return text.toLowerCase().includes('ako')
  }

  function detectWin2(text: string): boolean {
    return text.toLowerCase().includes('mabuti')
  }

  // ─── USER INPUT HANDLER ────────────────────────────────────────────────────

  const handleUserInput = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTextInput('')
    setMicError('')

    if (step === 'win1-prompt' || step === 'win1-listen') {
      setStep('win1-result')
      const correct = win1Attempts > 0 ? true : detectWin1(trimmed) // lenient on retry
      setWin1Attempts(a => a + 1)

      if (correct) {
        setCurrentLine(SCRIPT.win1Correct)
        await playLine(SCRIPT.win1Correct)
        if (cancelledRef.current) return
        await sleep(600)

        // WIN 2 — setup
        setCurrentLine(SCRIPT.win2Setup)
        await playLine(SCRIPT.win2Setup)
        if (cancelledRef.current) return
        await sleep(400)
        setCurrentLine(SCRIPT.win2Question)
        await playLine(SCRIPT.win2Question)
        if (cancelledRef.current) return
        setStep('win2-prompt')
      } else {
        setCurrentLine(DISPLAY_INCORRECT_WIN1)
        await playLine(SCRIPT.win1Incorrect)
        if (cancelledRef.current) return
        await sleep(600)
        setStep('win1-prompt')
      }
    }

    else if (step === 'win2-prompt' || step === 'win2-listen') {
      setStep('win2-result')
      const correct = win2Attempts > 0 ? true : detectWin2(trimmed)
      setWin2Attempts(a => a + 1)

      if (correct) {
        setCurrentLine(SCRIPT.win2Correct)
        await playLine(SCRIPT.win2Correct)
        if (cancelledRef.current) return
        await sleep(600)

        // TRANSITION
        setCurrentLine(SCRIPT.transition1)
        setStep('transition')
        await playLine(SCRIPT.transition1)
        if (cancelledRef.current) return
        await sleep(800)
        setCurrentLine(SCRIPT.transition2)
        await playLine(SCRIPT.transition2)
        if (cancelledRef.current) return
        setStep('mode-select')
      } else {
        setCurrentLine(SCRIPT.win2Incorrect)
        await playLine(SCRIPT.win2Incorrect)
        if (cancelledRef.current) return
        await sleep(600)
        setStep('win2-prompt')
      }
    }
  }, [step, win1Attempts, win2Attempts, playLine])

  // ─── MODE SELECTION ────────────────────────────────────────────────────────

  const handleModeSelect = useCallback(async (mode: 'beginner' | 'heritage') => {
    setSelectedMode(mode)
    setStep('post-select')
    const line = mode === 'beginner' ? SCRIPT.beginnerPost : SCRIPT.heritagePost
    setCurrentLine(line)
    await playLine(line)
    if (cancelledRef.current) return
    await sleep(600)
    setStep('account-gate')
  }, [playLine])

  // ─── MIC ───────────────────────────────────────────────────────────────────

  const handleMicPress = useCallback(async () => {
    if (isListening) return
    if (!isWebSpeechAvailable()) {
      setMicError('Mic not available in this browser — use the text box below.')
      inputRef.current?.focus()
      return
    }

    setIsListening(true)
    setMicError('')
    stopAudio()

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.lang = 'tl-PH'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setIsListening(false)
      handleUserInput(text)
    }
    recognition.onerror = () => {
      setIsListening(false)
      setMicError('Could not hear you — try typing below.')
      inputRef.current?.focus()
    }
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

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    })

    if (error) {
      setSignupError(error.message)
      setSignupLoading(false)
    } else {
      router.push('/chat')
    }
  }, [signupEmail, signupPassword, router])

  // ─── KEYBOARD ──────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textInput.trim()) {
      handleUserInput(textInput)
    }
  }

  // ─── DERIVED STATE ─────────────────────────────────────────────────────────

  const showInput = step === 'win1-prompt' || step === 'win1-listen' ||
                    step === 'win2-prompt' || step === 'win2-listen'

  const showWin1Cards = step === 'win1-prompt' || step === 'win1-listen'
  const showWin2Cards = step === 'win2-prompt' || step === 'win2-listen'

  const micPulsing = step === 'win1-prompt' || step === 'win2-prompt'

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center">

      {/* ── TAP TO BEGIN OVERLAY ── */}
      {needsGesture && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f]/95 flex flex-col items-center justify-center">
          <button
            onClick={handleGestureUnlock}
            className="px-8 py-4 rounded-2xl bg-[#D4AF37] text-[#0a0a0f] font-semibold text-lg tracking-wide hover:bg-[#D4AF37]/90 transition-colors"
          >
            Tap to begin
          </button>
        </div>
      )}

      {/* ── INIT / LOADING ── */}
      {step === 'init' && !needsGesture && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}

      {/* ── MAIN FLOW (intro → win2-result) ── */}
      {(step === 'intro' || step === 'win1-prompt' || step === 'win1-listen' ||
        step === 'win1-result' || step === 'win2-prompt' || step === 'win2-listen' ||
        step === 'win2-result' || step === 'transition') && (

        <div className="w-full max-w-[430px] px-6 flex flex-col items-center pt-14 pb-10 min-h-screen">

          {/* Avatar */}
          <div className="relative mb-8">
            <div
              className="w-32 h-32 rounded-full overflow-hidden border border-white/10"
              style={{
                animation: 'breathe 4s ease-in-out infinite',
              }}
            >
              <img
                src="/avatars/ate-maria-avatar.webp"
                alt="Ate Maria"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {isAudioLoading && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            )}
          </div>

          {/* Character name */}
          <p className="text-xs text-[#D4AF37] uppercase tracking-widest mb-5">Ate Maria</p>

          {/* Current speech line */}
          {currentLine ? (
            <p className="text-center text-white/90 text-[17px] leading-relaxed mb-6 min-h-[56px] px-2">
              {currentLine}
            </p>
          ) : (
            <div className="mb-6 min-h-[56px]" />
          )}

          {/* WIN 1 CARDS */}
          {showWin1Cards && (
            <div
              className="w-full rounded-xl px-4 py-3.5 mb-6 border border-white/[0.07] space-y-1.5"
              style={{ backgroundColor: 'rgba(25, 40, 65, 0.35)' }}
            >
              <p className="text-[13px] text-white/50">
                <span className="text-white/30 mr-1">Sabihin mo:</span>
                <span className="text-white/80 font-medium">Ako si ___</span>
              </p>
              <p className="text-[12px] text-white/40">
                <span className="text-white/25 mr-1">Meaning:</span>
                My name is ___
              </p>
            </div>
          )}

          {/* WIN 2 CARDS */}
          {showWin2Cards && (
            <div
              className="w-full rounded-xl px-4 py-3.5 mb-6 border border-white/[0.07] space-y-1.5"
              style={{ backgroundColor: 'rgba(25, 40, 65, 0.35)' }}
            >
              <p className="text-[15px] text-white/80 font-medium mb-1">Kamusta ka?</p>
              <p className="text-[13px] text-white/50">
                <span className="text-white/30 mr-1">Sabihin mo:</span>
                <span className="text-white/80 font-medium">Mabuti ako.</span>
              </p>
              <p className="text-[12px] text-white/40">
                <span className="text-white/25 mr-1">Meaning:</span>
                How are you? / I'm good.
              </p>
            </div>
          )}

          {/* MIC BUTTON */}
          {showInput && (
            <button
              onClick={handleMicPress}
              disabled={isListening}
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200 touch-manipulation"
              style={{
                backgroundColor: isListening ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.08)',
                animation: isListening
                  ? 'listening-ring 1s ease-in-out infinite'
                  : micPulsing
                  ? 'mic-pulse 2s ease-in-out infinite'
                  : 'none',
              }}
              aria-label={isListening ? 'Listening...' : 'Speak'}
            >
              {isListening ? (
                <svg className="w-7 h-7 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="4" height="16" rx="1" />
                  <rect x="10" y="2" width="4" height="20" rx="1" />
                  <rect x="16" y="6" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}

          {isListening && (
            <p className="text-[12px] text-[#D4AF37]/70 mb-3">Listening...</p>
          )}

          {/* TEXT INPUT (always visible fallback) */}
          {showInput && (
            <div className="w-full flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={step === 'win1-prompt' || step === 'win1-listen'
                  ? 'Ako si ___'
                  : 'Mabuti ako.'}
                className="flex-1 bg-white/[0.07] text-white rounded-2xl px-4 py-3 text-[15px] placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              />
              <button
                onClick={() => handleUserInput(textInput)}
                disabled={!textInput.trim()}
                className="bg-[#D4AF37] text-[#0a0a0f] rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-40 flex-shrink-0 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          )}

          {micError && (
            <p className="text-[12px] text-white/40 mt-2 text-center">{micError}</p>
          )}

          {/* Already have an account */}
          <div className="mt-auto pt-10">
            <Link href="/login" className="text-[12px] text-white/25 hover:text-white/40 transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── MODE SELECTION ── */}
      {step === 'mode-select' && (
        <div className="w-full max-w-[430px] px-6 flex flex-col items-center pt-14 pb-10 min-h-screen">

          <div
            className="w-28 h-28 rounded-full overflow-hidden border border-white/10 mb-6"
            style={{ animation: 'breathe 4s ease-in-out infinite' }}
          >
            <img src="/avatars/ate-maria-avatar.webp" alt="Ate Maria" className="w-full h-full object-cover object-top" />
          </div>

          <p className="text-xs text-[#D4AF37] uppercase tracking-widest mb-4">Ate Maria</p>

          <p className="text-center text-white/85 text-[17px] leading-relaxed mb-10 px-2">
            {SCRIPT.transition2}
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => handleModeSelect('beginner')}
              className="w-full text-left rounded-2xl px-5 py-4 border border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/[0.04] transition-all duration-200"
            >
              <p className="text-white font-medium mb-1">Beginner</p>
              <p className="text-white/40 text-[13px]">Start from the ground up. I'll guide you step by step.</p>
            </button>

            <button
              onClick={() => handleModeSelect('heritage')}
              className="w-full text-left rounded-2xl px-5 py-4 border border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/[0.04] transition-all duration-200"
            >
              <p className="text-white font-medium mb-1">Heritage</p>
              <p className="text-white/40 text-[13px]">You understand more than you think. Let's unlock it.</p>
            </button>
          </div>

          <div className="mt-auto pt-10">
            <Link href="/login" className="text-[12px] text-white/25 hover:text-white/40 transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── POST-SELECT TRANSITION ── */}
      {step === 'post-select' && (
        <div className="w-full max-w-[430px] px-6 flex flex-col items-center pt-14 pb-10 min-h-screen">
          <div
            className="w-28 h-28 rounded-full overflow-hidden border border-white/10 mb-6"
            style={{ animation: 'breathe 4s ease-in-out infinite' }}
          >
            <img src="/avatars/ate-maria-avatar.webp" alt="Ate Maria" className="w-full h-full object-cover object-top" />
          </div>
          <p className="text-xs text-[#D4AF37] uppercase tracking-widest mb-4">Ate Maria</p>
          <p className="text-center text-white/85 text-[17px] leading-relaxed px-2">
            {currentLine}
          </p>
          {isAudioLoading && (
            <div className="mt-6 w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* ── ACCOUNT GATE ── */}
      {step === 'account-gate' && (
        <div className="w-full max-w-[430px] px-6 flex flex-col pt-16 pb-10 min-h-screen">

          <div
            className="w-20 h-20 rounded-full overflow-hidden border border-white/10 mb-6 mx-auto"
            style={{ animation: 'breathe 4s ease-in-out infinite' }}
          >
            <img src="/avatars/ate-maria-avatar.webp" alt="Ate Maria" className="w-full h-full object-cover object-top" />
          </div>

          <h2 className="text-[22px] font-semibold text-center mb-2">Save your progress and continue.</h2>
          <p className="text-white/40 text-[14px] text-center mb-8">You've already started.</p>

          <form onSubmit={handleSignup} className="space-y-3">
            <input
              type="email"
              required
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white/[0.08] text-white rounded-2xl px-5 py-3.5 text-[15px] placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
            />
            <input
              type="password"
              required
              value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              placeholder="Password (8+ chars, 1 uppercase, 1 number)"
              className="w-full bg-white/[0.08] text-white rounded-2xl px-5 py-3.5 text-[15px] placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
            />

            {signupError && (
              <p className="text-red-400/80 text-[13px] px-1">{signupError}</p>
            )}

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full bg-[#D4AF37] text-[#0a0a0f] rounded-2xl py-3.5 font-semibold text-[16px] disabled:opacity-60 hover:bg-[#D4AF37]/90 transition-colors mt-2"
            >
              {signupLoading ? 'Creating account...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-[13px] text-white/35 hover:text-white/55 transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
