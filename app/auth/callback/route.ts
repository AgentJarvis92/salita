import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    // Track signup event for new Google OAuth users
    // (We check if analytics_events table has any events for this user)
    if (!authError && user) {
      const { data: existingEvents } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      // If no existing events, this is a new signup
      if (!existingEvents || existingEvents.length === 0) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_name: 'signup',
          metadata: { method: 'google' }
        })
      }
    }
  }

  // Redirect to home page
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
