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

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    // Simple profile creation for new users
    if (user && !error) {
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
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
