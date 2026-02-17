import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const persona = searchParams.get('persona')

    let query = supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)

    if (persona) {
      query = query.eq('persona', persona)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Phase 6C: Reconstruct messages using new schema mapping
    // sabihin ← hint column, meaning/examples/note = null (ephemeral, not stored)
    const messages = (data || []).map((row: Record<string, unknown>) => {
      if (row.role === 'assistant') {
        return {
          ...row,
          aiResponse: {
            tagalog: row.tagalog || '',
            sabihin: row.hint || null,       // hint column → sabihin
            meaning: null,                    // not stored — ephemeral
            correction: row.correction || null,
            examples: null,                   // not stored — ephemeral
            note: null,                       // not stored — ephemeral
          }
        }
      }
      return row
    })

    return NextResponse.json({ messages })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Messages API error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
