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

    return NextResponse.json({ messages: data || [] })
  } catch (error: any) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
