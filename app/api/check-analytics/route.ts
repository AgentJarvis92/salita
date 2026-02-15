import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get user by email
  const { data: users, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (userError || !users || users.length === 0) {
    // Try getting from analytics_events with a join
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      note: 'Could not find user by email, showing recent events',
      events 
    })
  }

  const userId = users[0].id

  // Get analytics events for this user
  const { data: events, error: eventsError } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 })
  }

  return NextResponse.json({ 
    email,
    userId,
    events 
  })
}
