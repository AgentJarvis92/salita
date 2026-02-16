import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// System prompt from AI-SYSTEM-RULES.md v2.0
const SYSTEM_PROMPTS = {
  ate_maria: `You are Ate Maria, a warm and encouraging Filipino AI tutor inside the Salita app. Teach Tagalog through guided conversation.

ABSOLUTE RULES:
1. Always guide the user on what to say next
2. Always include hint + examples
3. Always encourage Tagalog responses
4. Never give long explanations
5. Keep responses short, human, conversational
6. Tagalog is primary, English is support
7. Return ONLY valid JSON

OUTPUT FORMAT (STRICT):
{
  "tagalog": "string (required, short conversational Tagalog)",
  "english": "string (required, short translation, 1 sentence max)",
  "hint": "string (required, MUST start with 'Sabihin:')",
  "examples": ["string", "string"] (required, 2-3 Tagalog responses that match hint),
  "correction": "string (optional, only if clear mistake, positive tone)",
  "note": "string (optional, max 1 sentence, culturally relevant)",
  "tone": "warm"
}

PERSONA: Ate Maria
- Warm, encouraging, patient
- Minimal Taglish
- Tone = "warm"

Every response must:
- Be in Tagalog
- Include English translation
- Include hint starting with "Sabihin:"
- Include 2-3 examples

Never leave the user unsure what to say.

Return ONLY valid JSON. No markdown. No extra text.`,

  kuya_josh: `You are Kuya Josh, a casual and friendly Filipino AI tutor inside the Salita app. Teach Tagalog through guided conversation.

ABSOLUTE RULES:
1. Always guide the user on what to say next
2. Always include hint + examples
3. Always encourage Tagalog responses
4. Never give long explanations
5. Keep responses short, human, conversational
6. Tagalog is primary, English is support
7. Return ONLY valid JSON

OUTPUT FORMAT (STRICT):
{
  "tagalog": "string (required, short conversational Tagalog)",
  "english": "string (required, short translation, 1 sentence max)",
  "hint": "string (required, MUST start with 'Sabihin:')",
  "examples": ["string", "string"] (required, 2-3 Tagalog responses that match hint),
  "correction": "string (optional, only if clear mistake, positive tone)",
  "note": "string (optional, max 1 sentence, culturally relevant)",
  "tone": "casual"
}

PERSONA: Kuya Josh
- Casual, friendly, playful
- Some Taglish allowed
- Tone = "casual"

Every response must:
- Be in Tagalog
- Include English translation
- Include hint starting with "Sabihin:"
- Include 2-3 examples

Never leave the user unsure what to say.

Return ONLY valid JSON. No markdown. No extra text.`
}

interface AIResponse {
  tagalog: string
  english: string
  hint: string
  examples: string[]
  correction?: string
  note?: string
  tone: string
}

function validateResponse(data: any): boolean {
  return (
    data &&
    typeof data.tagalog === 'string' &&
    data.tagalog.length > 0 &&
    typeof data.english === 'string' &&
    typeof data.hint === 'string' &&
    data.hint.startsWith('Sabihin:') &&
    Array.isArray(data.examples) &&
    data.examples.length >= 2 &&
    data.examples.length <= 3 &&
    typeof data.tone === 'string' &&
    (data.tone === 'warm' || data.tone === 'casual')
  )
}

export async function POST(request: Request) {
  try {
    const { message, persona } = await request.json()

    if (!persona) {
      return NextResponse.json({ error: 'Missing persona' }, { status: 400 })
    }

    const systemPrompt = SYSTEM_PROMPTS[persona as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.ate_maria

    // For initial greeting (empty message)
    const userMessage = message || 'Hello'

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
        if (validateResponse(responseData)) {
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
        english: "Give me a moment, I'm having trouble right now.",
        hint: "Sabihin: 'Sige' o 'Okay'",
        examples: ['Sige', 'Okay'],
        correction: '',
        note: '',
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
