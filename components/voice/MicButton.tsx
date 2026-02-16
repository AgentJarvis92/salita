'use client'

import { useState, useCallback } from 'react'
import { useVoice } from '@/lib/voice-context'
import { isWebSpeechAvailable, transcribeWebSpeech, requestMicPermission, createAudioRecorder, transcribeWhisper } from '@/lib/speech/stt'

interface MicButtonProps {
  onTranscription: (text: string) => void
  variant?: 'onboarding' | 'inline'
  className?: string
}

type MicState = 'idle' | 'requesting' | 'listening' | 'processing' | 'success' | 'error'

export default function MicButton({ onTranscription, variant = 'inline', className = '' }: MicButtonProps) {
  const { micPermission, setMicPermission, setIsRecording } = useVoice()
  const [state, setState] = useState<MicState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [recorder] = useState(() => typeof window !== 'undefined' ? createAudioRecorder() : null)

  const handleTap = useCallback(async () => {
    if (state === 'listening' || state === 'processing') return

    setErrorMsg('')

    // Request mic if not granted
    if (micPermission !== 'granted') {
      setState('requesting')
      const granted = await requestMicPermission()
      if (!granted) {
        setMicPermission('denied')
        setState('error')
        setErrorMsg('Microphone access denied. Please enable it in your browser settings.')
        return
      }
      setMicPermission('granted')
    }

    setState('listening')
    setIsRecording(true)

    try {
      let text: string

      if (isWebSpeechAvailable()) {
        const result = await transcribeWebSpeech('tl-PH')
        text = result.text
      } else {
        // Whisper fallback for Safari/iOS
        recorder?.start()
        // Listen for 5 seconds max
        await new Promise((r) => setTimeout(r, 5000))
        const blob = await recorder!.stop()
        const result = await transcribeWhisper(blob)
        text = result.text
      }

      setIsRecording(false)
      setState('success')
      onTranscription(text)

      // Reset after animation
      setTimeout(() => setState('idle'), 2000)
    } catch (err: any) {
      setIsRecording(false)
      if (err.message === 'mic-denied') {
        setMicPermission('denied')
        setState('error')
        setErrorMsg('Microphone access denied. Please enable it in your browser settings.')
      } else if (err.message === 'no-speech') {
        setState('error')
        setErrorMsg('No speech detected. Try again.')
        setTimeout(() => setState('idle'), 3000)
      } else {
        setState('error')
        setErrorMsg('Voice input unavailable. Please type instead.')
        setTimeout(() => setState('idle'), 3000)
      }
    }
  }, [state, micPermission, setMicPermission, setIsRecording, recorder, onTranscription])

  if (variant === 'onboarding') {
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleTap}
          disabled={state === 'processing'}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300 touch-manipulation
            ${state === 'listening'
              ? 'bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
              : state === 'success'
              ? 'bg-green-500 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
              : state === 'error'
              ? 'bg-red-500/20 border-2 border-red-500/50'
              : 'bg-[#D4AF37] hover:bg-[#D4AF37]/90 hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
            }
            ${state === 'listening' ? 'animate-pulse' : ''}
            ${className}
          `}
          aria-label={state === 'listening' ? 'Listening...' : 'Tap to speak Tagalog'}
        >
          {state === 'listening' ? (
            // Mic with waves
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          ) : state === 'success' ? (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
            </svg>
          ) : state === 'processing' ? (
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : (
            <svg className="w-10 h-10 text-[#0a0a0f]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>

        {/* Label */}
        <span className={`text-sm font-medium transition-all duration-300 ${
          state === 'listening' ? 'text-red-400 animate-pulse' :
          state === 'success' ? 'text-green-400' :
          state === 'processing' ? 'text-white/60' :
          state === 'error' ? 'text-red-400' :
          'text-white/70'
        }`}>
          {state === 'listening' ? 'Listening...' :
           state === 'success' ? 'Got it! ✨' :
           state === 'processing' ? 'Processing...' :
           state === 'error' ? '' :
           'Tap to Speak Tagalog 🎤'}
        </span>

        {/* Error banner */}
        {state === 'error' && errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 max-w-[300px] text-center">
            <p className="text-red-300 text-xs">{errorMsg}</p>
          </div>
        )}

        {/* Mic denied persistent banner */}
        {micPermission === 'denied' && state === 'idle' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 max-w-[300px] text-center">
            <p className="text-yellow-300 text-xs">🎤 Mic access denied. You can still type!</p>
          </div>
        )}
      </div>
    )
  }

  // Inline variant (next to text input)
  return (
    <button
      onClick={handleTap}
      disabled={state === 'processing'}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
        transition-all duration-200 touch-manipulation
        ${state === 'listening'
          ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
          : state === 'success'
          ? 'bg-green-500'
          : 'bg-white/[0.08] hover:bg-white/[0.12]'
        }
        ${className}
      `}
      aria-label={state === 'listening' ? 'Listening...' : 'Voice input'}
      title={state === 'listening' ? 'Listening...' : 'Voice input'}
    >
      {state === 'listening' ? (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      ) : state === 'processing' ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
      ) : state === 'success' ? (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
        </svg>
      ) : (
        <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      )}
    </button>
  )
}
