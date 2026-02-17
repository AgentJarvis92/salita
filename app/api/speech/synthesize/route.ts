/**
 * POST /api/speech/synthesize
 * 
 * OpenAI TTS endpoint. Accepts text, returns audio/mpeg stream.
 * 
 * Body: { text: string, voice?: string, model?: string, speed?: number }
 * Response: audio/mpeg blob
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { openai } from '@/lib/openai'

export const runtime = 'nodejs'

const MAX_TEXT_LENGTH = 4096

export async function POST(request: NextRequest) {
  try {
    // Auth guard — require valid session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const {
      text,
      voice = 'nova',
      model = 'tts-1',
      speed = 1.0,
    } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` }, { status: 400 })
    }

    const response = await openai.audio.speech.create({
      model,
      voice,
      input: text,
      speed,
      response_format: 'mp3',
    })

    const buffer = Buffer.from(await response.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24h
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 })
  }
}
