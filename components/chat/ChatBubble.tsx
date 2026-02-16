'use client'

import { useState } from 'react'
import ReplayButton from './ReplayButton'

interface AIResponse {
  tagalog: string
  correction: string
  hint: string | null
  tone: string
}

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content?: string
  aiResponse?: AIResponse
  mode: 'beginner' | 'heritage'
}

export default function ChatBubble({ role, content, aiResponse, mode }: ChatBubbleProps) {
  const [meaningExpanded, setMeaningExpanded] = useState(false)

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#D4AF37] text-[#0a0a0f]">
          <p className="text-[15px] leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  // Assistant message
  const tagalog = aiResponse?.tagalog || ''
  const hint = aiResponse?.hint
  const hasHint = hint && typeof hint === 'string' && hint.trim() !== '' && hint !== 'None'
  const correction = aiResponse?.correction
  const hasCorrection = correction && correction !== 'None'

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {/* Main Tagalog bubble */}
        <div
          className="rounded-2xl px-4 py-3 text-white border border-white/5 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(30, 58, 95, 0.25)' }}
        >
          <p className="text-[16px] leading-relaxed">{tagalog}</p>
        </div>

        {/* Mode-specific translation layer */}
        {mode === 'beginner' && hasHint && (
          /* Beginner: Auto-shown frosted glass translation card */
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.07] backdrop-blur-lg"
            style={{ backgroundColor: 'rgba(25, 40, 65, 0.35)' }}
          >
            <p className="text-[12.5px] text-white/50 leading-snug">
              <span className="text-white/30 mr-1">Meaning:</span>
              <span className="text-white/60">{hint}</span>
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <ReplayButton text={tagalog} />
            </div>
          </div>
        )}

        {mode === 'beginner' && !hasHint && tagalog && (
          /* Beginner with no hint: just show replay */
          <div className="flex items-center gap-2 mt-1">
            <ReplayButton text={tagalog} />
          </div>
        )}

        {mode === 'heritage' && tagalog && (
          /* Heritage: Inline controls, collapsed by default */
          <div className="flex items-center gap-1.5 mt-0.5">
            <ReplayButton text={tagalog} />
            {hasHint && (
              <button
                onClick={() => setMeaningExpanded(!meaningExpanded)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                  text-[11.5px] text-white/35 hover:text-white/50
                  bg-white/[0.04] hover:bg-white/[0.07]
                  transition-all duration-200 touch-manipulation"
              >
                <span>{meaningExpanded ? 'Hide meaning' : 'Show meaning'}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${meaningExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Heritage expanded meaning */}
        {mode === 'heritage' && meaningExpanded && hasHint && (
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.05] backdrop-blur-lg
              animate-in slide-in-from-top-1 duration-200"
            style={{ backgroundColor: 'rgba(25, 40, 65, 0.25)' }}
          >
            <p className="text-[12.5px] text-white/45 leading-snug">{hint}</p>
          </div>
        )}

        {/* Correction Box */}
        {hasCorrection && (
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.07] backdrop-blur-lg"
            style={{ backgroundColor: 'rgba(30, 50, 75, 0.3)' }}
          >
            <p className="text-[12.5px] text-white/50 leading-snug">
              <span className="text-white/30 mr-1">✏️</span>
              {correction}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
