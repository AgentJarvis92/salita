/**
 * POST /api/speech/onboarding-synthesize
 *
 * Guest TTS endpoint for pre-auth onboarding (/start route).
 * No auth required. Voice fixed to 'nova' (Ate Maria).
 * Rate limited by IP: 30 requests per minute.
 *
 * Body: { text: string }
 * Response: audio/mpeg
 */

import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export const runtime = 'nodejs'

const MAX_TEXT_LENGTH = 500
const RATE_LIMIT = 30
const RATE_WINDOW = 60 * 1000

const ipMap = new Map<string, { count: number; resetTime: number }>()

function checkIp(ip: string): boolean {
  const now = Date.now()
  const entry = ipMap.get(ip)
  if (!entry || now > entry.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkIp(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Ate Maria — fixed for onboarding
      input: text,
      speed: 1.0,
      response_format: 'mp3',
    })

    const buffer = Buffer.from(await response.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[ONBOARDING TTS]', err)
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 })
  }
}
