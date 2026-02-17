/**
 * POST /api/anam/session-token
 *
 * Server-side Anam session token for /start onboarding.
 * API key never exposed to client.
 * Returns a short-lived session token for the Anam JS SDK.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Avatar IDs (Anam stock gallery)
// Mia (studio) — closest to Character Bible vibe for trial
export const ANAM_AVATAR_ID = 'edf6fdcb-acab-44b8-b974-ded72665ee26'
// Default Anam LLM (required for session init; we use talk() so LLM won't fire)
const ANAM_LLM_ID = '0934d97d-0c3a-4f33-91b0-5e136a0ef466'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANAM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Anam API key not configured' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          name: 'Ate Maria',
          avatarId: ANAM_AVATAR_ID,
          llmId: ANAM_LLM_ID,
          // System prompt prevents LLM from responding to accidental user input
          // All speech is driven by talk() with locked script
          systemPrompt:
            'You are Ate Maria, a Tagalog tutor. Do not respond to user messages during onboarding — the teacher is guiding the session.',
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[ANAM SESSION TOKEN]', res.status, err)
      return NextResponse.json({ error: 'Failed to create Anam session' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ sessionToken: data.sessionToken })
  } catch (err) {
    console.error('[ANAM SESSION TOKEN]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
