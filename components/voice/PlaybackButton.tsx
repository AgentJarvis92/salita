'use client'

import { useState, useCallback } from 'react'
import { useVoice } from '@/lib/voice-context'
import { synthesizeAndPlay, stopPlayback } from '@/lib/speech/tts'

interface PlaybackButtonProps {
  text: string
  className?: string
}

type PlayState = 'idle' | 'loading' | 'playing' | 'error'

export default function PlaybackButton({ text, className = '' }: PlaybackButtonProps) {
  const { voiceEnabled } = useVoice()
  const [state, setState] = useState<PlayState>('idle')

  const handlePlay = useCallback(async () => {
    if (state === 'loading') return

    if (state === 'playing') {
      stopPlayback()
      setState('idle')
      return
    }

    setState('loading')
    try {
      await synthesizeAndPlay(text)
      setState('idle')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }, [state, text])

  // Auto-play when voice is enabled and component mounts (for new messages)
  // Handled by parent - not here to avoid unexpected playback

  if (!voiceEnabled) return null

  return (
    <button
      onClick={handlePlay}
      disabled={state === 'loading'}
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-full
        transition-all duration-200 touch-manipulation
        ${state === 'playing'
          ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
          : state === 'error'
          ? 'bg-red-500/20 text-red-400'
          : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70'
        }
        ${className}
      `}
      aria-label={state === 'playing' ? 'Stop playback' : 'Play audio'}
      title={state === 'playing' ? 'Stop' : 'Listen'}
    >
      {state === 'loading' ? (
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      ) : state === 'playing' ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : state === 'error' ? (
        <span className="text-xs">✕</span>
      ) : (
        <span className="text-sm">🔊</span>
      )}
    </button>
  )
}
