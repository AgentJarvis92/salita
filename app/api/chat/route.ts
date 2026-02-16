import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { message, persona } = await request.json()

    if (!message || !persona) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ${persona === 'ate_maria' ? 'Ate Maria' : 'Kuya Josh'}, a Tagalog tutor. Help users learn Tagalog through natural conversation. Keep responses short and encouraging.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    const aiResponse = completion.choices[0].message.content || 'Sorry, I could not respond.'

    return NextResponse.json({
      response: aiResponse,
      success: true,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
