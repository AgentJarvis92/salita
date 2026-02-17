'use client'

/**
 * Voice Context Provider
 * 
 * Manages voice state across the app:
 * - voiceEnabled: persisted to localStorage + DB (profiles.voice_enabled)
 * - isRecording: current mic state
 * - micPermission: current browser permission state
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface VoiceContextType {
  voiceEnabled: boolean
  toggleVoice: () => void
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  micPermission: 'prompt' | 'granted' | 'denied'
  setMicPermission: (v: 'prompt' | 'granted' | 'denied') => void
}

const VoiceContext = createContext<VoiceContextType>({
  voiceEnabled: false,
  toggleVoice: () => {},
  isRecording: false,
  setIsRecording: () => {},
  micPermission: 'prompt',
  setMicPermission: () => {},
})

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Load persisted state from DB (primary) with localStorage fallback
  useEffect(() => {
    // Immediate: load from localStorage for fast UI
    const stored = localStorage.getItem('salita-voice-enabled')
    if (stored === 'true') setVoiceEnabled(true)

    // Then sync from DB if logged in
    if (!userId) return
    supabase
      .from('profiles')
      .select('voice_enabled')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.voice_enabled != null) {
          setVoiceEnabled(data.voice_enabled)
          localStorage.setItem('salita-voice-enabled', String(data.voice_enabled))
        }
      })
  }, [userId])

  // Check mic permission on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setMicPermission(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt')
        result.onchange = () => {
          setMicPermission(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt')
        }
      }).catch(() => {})
    }
  }, [])

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev
      localStorage.setItem('salita-voice-enabled', String(next))

      // Persist to DB
      if (userId) {
        supabase.from('profiles').update({ voice_enabled: next }).eq('user_id', userId).then(() => {})
      }

      return next
    })
  }, [userId])

  return (
    <VoiceContext.Provider value={{ voiceEnabled, toggleVoice, isRecording, setIsRecording, micPermission, setMicPermission }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
