import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildSystemPrompt, getSkillMode, type Persona } from '@/lib/ai/promptBuilder'
import { createClient } from '@/lib/supabase-server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rate limiting: 30 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW
    rateLimitMap.set(userId, { count: 1, resetTime })
    return { allowed: true, remaining: RATE_LIMIT - 1, resetTime: Math.floor(resetTime / 1000) }
  }

  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: Math.floor(userLimit.resetTime / 1000) }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count, resetTime: Math.floor(userLimit.resetTime / 1000) }
}

// Phase 6C: New strict JSON output contract
interface AIResponse {
  tagalog: string
  sabihin: string | null
  meaning: string | null
  correction: string | null
  examples: string[] | null
  note: string | null
}

function validateResponse(data: unknown): data is AIResponse {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  // tagalog: required non-empty string
  if (typeof d.tagalog !== 'string' || d.tagalog.trim().length === 0) return false

  // sabihin: string or null
  if (d.sabihin !== null && typeof d.sabihin !== 'string') return false

  // meaning: string or null
  if (d.meaning !== null && typeof d.meaning !== 'string') return false

  // correction: string or null — reject "None" string
  if (d.correction !== null && typeof d.correction !== 'string') return false
  if (d.correction === 'None' || d.correction === '') {
    // Normalize "None" / empty to null
    d.correction = null
  }

  // examples: string[] or null
  if (d.examples !== null) {
    if (!Array.isArray(d.examples)) return false
    if (!d.examples.every((e: unknown) => typeof e === 'string')) return false
  }

  // note: string or null
  if (d.note !== null && typeof d.note !== 'string') return false

  return true
}

export async function POST(request: Request) {
  try {
    // 🔒 AUTH CHECK - Prevent unauthorized API access
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ⏱️ RATE LIMIT - Prevent abuse (30 req/min per user)
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const { message, persona, conversationHistory } = await request.json()

    if (!persona) {
      return NextResponse.json({ error: 'Missing persona' }, { status: 400 })
    }

    // 📏 INPUT LENGTH LIMIT - Prevent token abuse
    if (message && message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long. Please keep it under 2000 characters.' },
        { status: 400 }
      )
    }

    // Phase 6A: Build system prompt from 4-layer architecture
    const validPersona = (persona === 'ate_maria' || persona === 'kuya_josh') ? persona as Persona : 'ate_maria'
    const mode = getSkillMode(validPersona)
    const systemPrompt = buildSystemPrompt(validPersona)

    // Phase 6A: Server log
    console.log(`[SALITA] tutor: ${validPersona} | mode: ${mode} | prompt_length: ${systemPrompt.length} chars`)

    // For initial greeting (empty message)
    const userMessage = message || (validPersona === 'kuya_josh'
      ? 'Kumusta'
      : 'Hello, I want to learn Tagalog')

    // Build conversation messages with sliding window
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt }
    ]

    // 🪟 SLIDING WINDOW - Last 15 messages only to prevent token overflow
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-15)
      recentHistory.forEach((msg: { role: string; content?: string; aiResponse?: AIResponse }) => {
        if (msg.role === 'user' && msg.content) {
          messages.push({ role: 'user', content: msg.content })
        } else if (msg.role === 'assistant' && msg.aiResponse) {
          messages.push({
            role: 'assistant',
            content: JSON.stringify(msg.aiResponse)
          })
        }
      })
    }

    messages.push({ role: 'user', content: userMessage })

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 400,
        })

        const responseText = completion.choices[0].message.content || '{}'
        const responseData = JSON.parse(responseText)

        if (validateResponse(responseData)) {
          // Phase 6C: DB mapping — sabihin→hint, drop tone, meaning/examples/note ephemeral
          try {
            // Save user message
            await supabase.from('messages').insert({
              user_id: user.id,
              role: 'user',
              persona: validPersona,
              tagalog: userMessage.match(/^[^a-zA-Z]*$/) ? userMessage : null,
              english: userMessage.match(/[a-zA-Z]/) ? userMessage : null,
            })

            // Save assistant response
            await supabase.from('messages').insert({
              user_id: user.id,
              role: 'assistant',
              persona: validPersona,
              tagalog: responseData.tagalog,
              hint: responseData.sabihin || null,       // sabihin → hint column
              correction: responseData.correction || null,
              tone: mode,                                // store mode as tone (no schema change)
            })
          } catch (dbError) {
            console.error('Failed to persist messages:', dbError)
            // Don't fail the request if DB write fails
          }

          return NextResponse.json({
            success: true,
            response: responseData,
          }, {
            headers: {
              'X-RateLimit-Limit': String(RATE_LIMIT),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-RateLimit-Reset': String(rateLimit.resetTime),
            },
          })
        } else {
          console.error('Invalid AI response structure:', responseData)
          attempts++
          if (attempts >= maxAttempts) {
            throw new Error('AI response validation failed after 3 attempts')
          }
        }
      } catch (error: unknown) {
        console.error(`Attempt ${attempts + 1} failed:`, error)
        attempts++
        if (attempts >= maxAttempts) {
          throw error
        }
      }
    }

    // Fallback response if all attempts fail
    const fallbackResponse: AIResponse = validPersona === 'kuya_josh'
      ? { tagalog: 'Sandali lang, nagkaka-problema ako ngayon.', sabihin: null, meaning: null, correction: null, examples: null, note: null }
      : { tagalog: 'Sandali lang, may problema ako. Subukan ulit tayo.', sabihin: 'Sige', meaning: 'Okay / Go ahead', correction: null, examples: null, note: null }

    return NextResponse.json({
      success: true,
      response: fallbackResponse,
    }, {
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
