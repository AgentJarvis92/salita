import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const response = NextResponse.redirect(new URL('/dashboard', origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError) {
      console.error('OAuth callback error:', authError)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', origin))
    }

    // Track signup event for new Google OAuth users
    if (user) {
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

      // Create profile if doesn't exist
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        })
      }
    }

    return response
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}
