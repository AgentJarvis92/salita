/**
 * POST /api/speech/transcribe
 * 
 * Whisper fallback endpoint for browsers without Web Speech API (Safari/iOS).
 * Accepts audio file upload, returns transcribed text.
 * 
 * Body: FormData with 'audio' file and optional 'language' string
 * Response: { text: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { openai } from '@/lib/openai'

export const runtime = 'nodejs'

// Max audio size: 25MB (OpenAI limit)
const MAX_SIZE = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Auth guard — require valid session
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const language = (formData.get('language') as string) || 'tl' // Tagalog default

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language,
      response_format: 'json',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (err) {
    console.error('Transcription error:', err)
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}
