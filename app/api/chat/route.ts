import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { BEGINNER_SYSTEM_PROMPT, HERITAGE_SYSTEM_PROMPT } from '@/lib/ai/systemPrompts'
import { createClient } from '@/lib/supabase-server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rate limiting: 30 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

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

  // Beginner mode: hint must be string or null (allow null when no hint needed)
  return baseValid && (data.hint === null || typeof data.hint === 'string')
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
    if (!checkRateLimit(user.id)) {
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

    // Select system prompt based on persona (mode)
    const systemPrompt = persona === 'kuya_josh' 
      ? HERITAGE_SYSTEM_PROMPT 
      : BEGINNER_SYSTEM_PROMPT

    // For initial greeting (empty message)
    const userMessage = message || (persona === 'kuya_josh' 
      ? 'Kumusta' 
      : 'Hello, I want to learn Tagalog')

    // Build conversation history with context
    const messages: any[] = [{ role: 'system', content: systemPrompt }]
    
    // Add conversation history if provided (for state awareness)
    // 🪟 SLIDING WINDOW - Last 15 messages only to prevent token overflow
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-15)
      recentHistory.forEach((msg: any) => {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content })
        } else if (msg.role === 'assistant' && msg.aiResponse) {
          // Reconstruct assistant response for context
          messages.push({ 
            role: 'assistant', 
            content: JSON.stringify(msg.aiResponse) 
          })
        }
      })
    }
    
    // Add current user message
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
          max_tokens: 300,
        })

        const responseText = completion.choices[0].message.content || '{}'
        const responseData: AIResponse = JSON.parse(responseText)

        // Validate response
        if (validateResponse(responseData, persona)) {
          // 💾 PERSIST CONVERSATION - Save user message and AI response
          try {
            // Save user message
            await supabase.from('messages').insert({
              user_id: user.id,
              role: 'user',
              tagalog: userMessage.match(/[a-zA-Z]/) ? null : userMessage, // Tagalog if non-English
              english: userMessage.match(/[a-zA-Z]/) ? userMessage : null, // English if has Latin chars
            })

            // Save assistant response
            await supabase.from('messages').insert({
              user_id: user.id,
              role: 'assistant',
              tagalog: responseData.tagalog,
              hint: responseData.hint,
              correction: responseData.correction !== 'None' ? responseData.correction : null,
              tone: responseData.tone,
            })
          } catch (dbError) {
            console.error('Failed to persist messages:', dbError)
            // Don't fail the request if DB write fails
          }

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
