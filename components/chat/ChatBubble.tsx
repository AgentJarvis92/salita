'use client'

// Phase 6C: Updated to new JSON output contract
// Phase 7A: PlaybackButton on every AI message

import { useState } from 'react'
import ReplayButton from './ReplayButton'

// Phase 6C: New strict output contract schema
export interface AIResponse {
  tagalog: string
  sabihin: string | null
  meaning: string | null
  correction: string | null
  examples: string[] | null
  note: string | null
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
  const sabihin = aiResponse?.sabihin
  const meaning = aiResponse?.meaning
  const correction = aiResponse?.correction
  const examples = aiResponse?.examples
  const note = aiResponse?.note

  const hasSabihin = sabihin && sabihin.trim().length > 0
  const hasMeaning = meaning && meaning.trim().length > 0
  const hasCorrection = correction && correction.trim().length > 0 && correction !== 'None'
  const hasExamples = examples && examples.length > 0
  const hasNote = note && note.trim().length > 0

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

        {/* BEGINNER MODE — auto-show meaning + sabihin */}
        {mode === 'beginner' && (hasMeaning || hasSabihin) && (
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.07] backdrop-blur-lg space-y-1.5"
            style={{ backgroundColor: 'rgba(25, 40, 65, 0.35)' }}
          >
            {/* Meaning line */}
            {hasMeaning && (
              <p className="text-[12.5px] text-white/50 leading-snug">
                <span className="text-white/30 mr-1">Meaning:</span>
                <span className="text-white/60">{meaning}</span>
              </p>
            )}

            {/* Sabihin line */}
            {hasSabihin && (
              <p className="text-[12.5px] text-white/55 leading-snug">
                <span className="text-white/30 mr-1">Sabihin mo:</span>
                <span className="text-white/70 font-medium italic">{sabihin}</span>
              </p>
            )}

            {/* Replay button */}
            <div className="flex items-center gap-2 pt-0.5">
              <ReplayButton text={tagalog} />
            </div>
          </div>
        )}

        {/* BEGINNER MODE — no meaning/sabihin, just replay */}
        {mode === 'beginner' && !hasMeaning && !hasSabihin && tagalog && (
          <div className="flex items-center gap-2 mt-1">
            <ReplayButton text={tagalog} />
          </div>
        )}

        {/* HERITAGE MODE — inline controls, meaning collapsible */}
        {mode === 'heritage' && tagalog && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <ReplayButton text={tagalog} />
            {hasMeaning && (
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

        {/* HERITAGE — expanded meaning */}
        {mode === 'heritage' && meaningExpanded && hasMeaning && (
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.05] backdrop-blur-lg
              animate-in slide-in-from-top-1 duration-200"
            style={{ backgroundColor: 'rgba(25, 40, 65, 0.25)' }}
          >
            <p className="text-[12.5px] text-white/45 leading-snug">{meaning}</p>
          </div>
        )}

        {/* Correction — gentle, no emoji */}
        {hasCorrection && (
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.07] backdrop-blur-lg"
            style={{ backgroundColor: 'rgba(30, 50, 75, 0.3)' }}
          >
            <p className="text-[12.5px] text-white/50 leading-snug">
              <span className="text-white/30 mr-1.5">~</span>
              {correction}
            </p>
          </div>
        )}

        {/* Examples — rare, shown when present */}
        {hasExamples && (
          <div
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.05] backdrop-blur-lg space-y-1"
            style={{ backgroundColor: 'rgba(25, 40, 65, 0.2)' }}
          >
            {examples!.map((ex, i) => (
              <p key={i} className="text-[12px] text-white/40 leading-snug">
                <span className="text-white/20 mr-1">{i + 1}.</span>{ex}
              </p>
            ))}
          </div>
        )}

        {/* Note — rare cultural/contextual note */}
        {hasNote && (
          <div
            className="rounded-xl px-3.5 py-2 border border-white/[0.04] backdrop-blur-lg"
            style={{ backgroundColor: 'rgba(20, 35, 55, 0.2)' }}
          >
            <p className="text-[11.5px] text-white/35 leading-snug italic">{note}</p>
          </div>
        )}

      </div>
    </div>
  )
}
