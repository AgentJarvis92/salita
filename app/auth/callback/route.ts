import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    // Simple profile creation for new users
    if (user && !error) {
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        }, { onConflict: 'user_id' })
        .select()
        .maybeSingle()
    }
  }

  // SECURITY: Validate redirect target to prevent open redirect attacks
  const allowedRedirects = [
    '/dashboard',
    '/chat',
    '/'
  ]

  const redirectUrl = redirectTo || '/dashboard'
  const isAllowedRedirect = allowedRedirects.some(allowed => redirectUrl === allowed || redirectUrl.startsWith(allowed + '?'))

  if (isAllowedRedirect) {
    return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
  }

  // Default to dashboard if redirect is invalid
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
