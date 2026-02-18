'use client'

/**
 * /start — Phase 7: Voice-First Pre-Auth Onboarding
 *
 * No video. No SDK bloat. Just voice + text.
 * Ate Maria speaks. User responds (voice or text).
 * 2 micro wins → mode select → account gate.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPEECH = {
  greeting: 'Kumusta.',
  askName: 'So tell me your name. In Tagalog you\'d say — Ako si, then your name.',
  nameCorrect: 'See? You just spoke Tagalog.',
  nameNudge: 'Try this — Ako si, then your name.',
  askHow: 'Now if someone asks you — Kamusta ka? — that means how are you. Try saying — Mabuti ako.',
  howCorrect: 'Mabuti. That\'s it.',
  howNudge: 'Almost. Just say — Mabuti ako.',
  transition: 'Want to start from the basics? Or just jump in?',
  beginnerAck: 'Okay. We\'ll go slow.',
  heritageAck: 'Got it. I won\'t hold back.',
} as const

const ASSIST = {
  name: 'Ako si ___',
  how: 'Mabuti ako',
} as const

type Step =
  | 'init'
  | 'ask-name'
  | 'ask-how'
  | 'transition'
  | 'mode-select'
  | 'account-gate'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export default function StartPage() {
  const router = useRouter()
  const audioContextRef = useRef<AudioContext | null>(null)

  const [step, setStep] = useState<Step>('init')
  const [subtitle, setSubtitle] = useState('')
  const [assistText, setAssistText] = useState('')
  const [textInput, setTextInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [nameAttempts, setNameAttempts] = useState(0)
  const [howAttempts, setHowAttempts] = useState(0)
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const assistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    return () => {
      cancelRef.current = true
      if (assistTimerRef.current) clearTimeout(assistTimerRef.current)
    }
  }, [])

  // ─── SPEECH ───────────────────────────────────────────────────────────────

  const speak = useCallback(async (text: string) => {
    if (cancelRef.current || !text) return

    setIsSpeaking(true)
    try {
      const response = await fetch('/api/speech/onboarding-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        console.error('TTS failed:', response.statusText)
        setIsSpeaking(false)
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
        setTimeout(resolve, 15000) // Safety timeout
      })

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[SPEAK]', err)
    } finally {
      setIsSpeaking(false)
    }
  }, [])

  // ─── ASSIST TEXT ──────────────────────────────────────────────────────────

  const startAssistTimer = useCallback((text: string) => {
    if (assistTimerRef.current) clearTimeout(assistTimerRef.current)
    setAssistText('')
    assistTimerRef.current = setTimeout(() => setAssistText(text), 4000)
  }, [])

  const clearAssist = useCallback(() => {
    if (assistTimerRef.current) clearTimeout(assistTimerRef.current)
    setAssistText('')
  }, [])

  // ─── USER INPUT ───────────────────────────────────────────────────────────

  const detectName = (t: string) => t.toLowerCase().includes('ako')
  const detectHow = (t: string) => t.toLowerCase().includes('mabuti')

  const handleUserInput = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setTextInput('')
      clearAssist()

      if (step === 'ask-name') {
        const correct = nameAttempts > 0 ? true : detectName(trimmed)
        setNameAttempts((a) => a + 1)

        if (correct) {
          await speak(SPEECH.nameCorrect)
          if (cancelRef.current) return
          setSubtitle('')
          await sleep(800 + Math.random() * 400)

          await speak(SPEECH.askHow)
          if (cancelRef.current) return
          setSubtitle(SPEECH.askHow)
          setStep('ask-how')
          startAssistTimer(ASSIST.how)
        } else {
          await speak(SPEECH.nameNudge)
          if (cancelRef.current) return
          setSubtitle('')
          startAssistTimer(ASSIST.name)
        }
      } else if (step === 'ask-how') {
        const correct = howAttempts > 0 ? true : detectHow(trimmed)
        setHowAttempts((a) => a + 1)

        if (correct) {
          await speak(SPEECH.howCorrect)
          if (cancelRef.current) return
          setSubtitle('')
          await sleep(1000 + Math.random() * 500)

          await speak(SPEECH.transition)
          if (cancelRef.current) return
          setSubtitle(SPEECH.transition)
          setStep('mode-select')
        } else {
          await speak(SPEECH.howNudge)
          if (cancelRef.current) return
          setSubtitle('')
          startAssistTimer(ASSIST.how)
        }
      }
    },
    [step, nameAttempts, howAttempts, speak, clearAssist, startAssistTimer]
  )

  const handleModeSelect = useCallback(
    async (mode: 'beginner' | 'heritage') => {
      const line = mode === 'beginner' ? SPEECH.beginnerAck : SPEECH.heritageAck
      await speak(line)
      if (cancelRef.current) return
      await sleep(600)
      setStep('account-gate')
    },
    [speak]
  )

  // ─── FLOW START ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 'init') return
    
    const startOnboarding = async () => {
      try {
        await sleep(300)
        await speak(SPEECH.greeting)
        if (cancelRef.current) return
        setSubtitle(SPEECH.greeting)
        await sleep(1200 + Math.random() * 600)

        if (cancelRef.current) return
        await speak(SPEECH.askName)
        if (cancelRef.current) return
        setSubtitle(SPEECH.askName)
        setStep('ask-name')
        startAssistTimer(ASSIST.name)
      } catch (err) {
        console.error('[ONBOARDING]', err)
        // Fallback: still transition to ask-name even if TTS fails
        setSubtitle(SPEECH.askName)
        setStep('ask-name')
        startAssistTimer(ASSIST.name)
      }
    }

    startOnboarding()
  }, [step, speak, startAssistTimer])

  // ─── SIGNUP ───────────────────────────────────────────────────────────────

  const handleSignup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSignupError('')
      setSignupLoading(true)

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupEmail, password: signupPassword }),
        })

        const data = await res.json()
        if (!res.ok) {
          setSignupError(data.error || 'Signup failed')
          setSignupLoading(false)
          return
        }

        router.push('/chat')
      } catch (err) {
        setSignupError('Network error')
        setSignupLoading(false)
      }
    },
    [signupEmail, signupPassword, router]
  )

  // ─── DERIVED ──────────────────────────────────────────────────────────────

  const showInput = ['ask-name', 'ask-how'].includes(step)

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0a0c10', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <div className="w-full max-w-md">
        {/* ── Header / Logo ── */}
        {step !== 'account-gate' && (
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 24 }}>🇵🇭</span>
            </div>
            <h1 className="text-white text-lg font-medium">Salita</h1>
          </div>
        )}

        {/* ── Main Content ── */}
        {step === 'ask-name' && (
          <div className="space-y-6">
            {/* Subtitle */}
            {subtitle && (
              <div key={subtitle} style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <p className="text-white text-base leading-relaxed" style={{ opacity: 0.85 }}>
                  {subtitle}
                </p>
              </div>
            )}

            {/* Assist text — delayed */}
            {assistText && (
              <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)', animation: 'fadeIn 0.5s ease-out' }}>
                {assistText}
              </p>
            )}

            {/* Input */}
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && textInput.trim() && handleUserInput(textInput)}
                placeholder="Type or speak..."
                className="flex-1 text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  caretColor: 'rgba(255,255,255,0.5)',
                }}
                autoFocus
              />
              {textInput.trim() && (
                <button
                  onClick={() => handleUserInput(textInput)}
                  className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                >
                  Send
                </button>
              )}
            </div>

            {/* Links */}
            <div className="text-center">
              <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Sign in
              </Link>
            </div>
          </div>
        )}

        {step === 'ask-how' && (
          <div className="space-y-6">
            {subtitle && (
              <div key={subtitle} style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <p className="text-white text-base leading-relaxed" style={{ opacity: 0.85 }}>
                  {subtitle}
                </p>
              </div>
            )}

            {assistText && (
              <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)', animation: 'fadeIn 0.5s ease-out' }}>
                {assistText}
              </p>
            )}

            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && textInput.trim() && handleUserInput(textInput)}
                placeholder="Type or speak..."
                className="flex-1 text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  caretColor: 'rgba(255,255,255,0.5)',
                }}
                autoFocus
              />
              {textInput.trim() && (
                <button
                  onClick={() => handleUserInput(textInput)}
                  className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                >
                  Send
                </button>
              )}
            </div>

            <div className="text-center">
              <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── MODE SELECT ── */}
        {step === 'mode-select' && (
          <div className="space-y-6">
            {subtitle && (
              <div key={subtitle} style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <p className="text-white text-base leading-relaxed text-center" style={{ opacity: 0.85 }}>
                  {subtitle}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleModeSelect('beginner')}
                className="w-full text-left rounded-xl px-5 py-4 text-sm font-medium transition-all hover:bg-opacity-20"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                }}
              >
                Basics
              </button>

              <button
                onClick={() => handleModeSelect('heritage')}
                className="w-full text-left rounded-xl px-5 py-4 text-sm font-medium transition-all hover:bg-opacity-20"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                }}
              >
                Jump in
              </button>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── ACCOUNT GATE ── */}
        {step === 'account-gate' && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-white text-lg font-medium mb-2">Save your progress.</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Pick up where you left off.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Email"
                className="w-full text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  caretColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <input
                type="password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Password"
                className="w-full text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  caretColor: 'rgba(255,255,255,0.5)',
                }}
              />
              {signupError && <p className="text-red-400 text-xs px-1">{signupError}</p>}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                {signupLoading ? 'Creating…' : 'Continue'}
              </button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Already have an account?
              </Link>
            </div>
          </div>
        )}

        {/* ── Status ── */}
        {isSpeaking && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', animation: 'pulse-subtle 1s infinite' }} />
              <span className="text-xs">Listening…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
