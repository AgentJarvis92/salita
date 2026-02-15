import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function GET() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a test. Return only valid JSON with one field: {"status": "connected"}'
        },
        {
          role: 'user',
          content: 'Test connection'
        }
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      response: result,
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
