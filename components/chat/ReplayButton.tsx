'use client'

import { useState, useCallback } from 'react'
import { synthesizeAndPlay, stopPlayback, isPlaying } from '@/lib/speech/tts'

interface ReplayButtonProps {
  text: string
  className?: string
}

type PlayState = 'idle' | 'loading' | 'playing' | 'error'

export default function ReplayButton({ text, className = '' }: ReplayButtonProps) {
  const [state, setState] = useState<PlayState>('idle')

  const handlePlay = useCallback(async () => {
    if (state === 'loading') return

    if (state === 'playing') {
      stopPlayback()
      setState('idle')
      return
    }

    // Cancel any other audio first
    stopPlayback()
    setState('loading')
    try {
      await synthesizeAndPlay(text)
      setState('idle')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }, [state, text])

  return (
    <button
      onClick={handlePlay}
      disabled={state === 'loading'}
      className={`
        inline-flex items-center justify-center w-7 h-7 rounded-full
        transition-all duration-200 touch-manipulation
        ${state === 'playing'
          ? 'bg-white/15 text-white/80'
          : state === 'error'
          ? 'bg-red-500/10 text-red-400/60'
          : 'bg-white/[0.06] hover:bg-white/10 text-white/40 hover:text-white/60'
        }
        ${className}
      `}
      aria-label={state === 'playing' ? 'Stop playback' : 'Replay audio'}
    >
      {state === 'loading' ? (
        <div className="w-3.5 h-3.5 border-[1.5px] border-white/15 border-t-white/50 rounded-full animate-spin" />
      ) : state === 'playing' ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
        </svg>
      )}
    </button>
  )
}
