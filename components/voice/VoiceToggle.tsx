'use client'

import { useVoice } from '@/lib/voice-context'

export default function VoiceToggle() {
  const { voiceEnabled, toggleVoice } = useVoice()

  return (
    <button
      onClick={toggleVoice}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation hover:bg-white/10"
      aria-label={voiceEnabled ? 'Disable voice playback' : 'Enable voice playback'}
      title={voiceEnabled ? 'Voice playback on' : 'Voice playback off'}
    >
      {voiceEnabled ? (
        <span className="text-xl" role="img" aria-label="Sound on">🔊</span>
      ) : (
        <span className="text-xl opacity-50" role="img" aria-label="Sound off">🔇</span>
      )}
    </button>
  )
}
