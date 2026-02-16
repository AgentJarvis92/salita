import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { BEGINNER_SYSTEM_PROMPT, HERITAGE_SYSTEM_PROMPT } from '@/lib/ai/systemPrompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AIResponse {
  tagalog: string
  correction: string
  hint: string | null
  tone: string
}

function validateResponse(data: any, persona: string): boolean {
  const baseValid = (
    data &&
    typeof data.tagalog === 'string' &&
    data.tagalog.length > 0 &&
    typeof data.correction === 'string' &&
    typeof data.tone === 'string' &&
    (data.tone === 'warm' || data.tone === 'casual')
  )

  // Heritage mode: hint must be null
  if (persona === 'kuya_josh') {
    return baseValid && data.hint === null
  }

  // Beginner mode: hint must be a non-empty string
  return baseValid && typeof data.hint === 'string' && data.hint.length > 0
}

export async function POST(request: Request) {
  try {
    const { message, persona } = await request.json()

    if (!persona) {
      return NextResponse.json({ error: 'Missing persona' }, { status: 400 })
    }

    // Select system prompt based on persona (mode)
    const systemPrompt = persona === 'kuya_josh' 
      ? HERITAGE_SYSTEM_PROMPT 
      : BEGINNER_SYSTEM_PROMPT

    // For initial greeting (empty message)
    const userMessage = message || (persona === 'kuya_josh' 
      ? 'Kumusta' 
      : 'Hello, I want to learn Tagalog')

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 300,
        })

        const responseText = completion.choices[0].message.content || '{}'
        const responseData: AIResponse = JSON.parse(responseText)

        // Validate response
        if (validateResponse(responseData, persona)) {
          return NextResponse.json({
            success: true,
            response: responseData,
          })
        } else {
          console.error('Invalid AI response structure:', responseData)
          attempts++
          if (attempts >= maxAttempts) {
            throw new Error('AI response validation failed after 3 attempts')
          }
        }
      } catch (error: any) {
        console.error(`Attempt ${attempts + 1} failed:`, error)
        attempts++
        if (attempts >= maxAttempts) {
          throw error
        }
      }
    }

    // Fallback response if all attempts fail
    return NextResponse.json({
      success: true,
      response: {
        tagalog: 'Sandali lang, nagkaka-problema ako ngayon.',
        correction: 'None',
        hint: persona === 'kuya_josh' ? null : "Give me a moment, having trouble. Try saying: 'Sige' or 'Okay'",
        tone: persona === 'kuya_josh' ? 'casual' : 'warm',
      },
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
