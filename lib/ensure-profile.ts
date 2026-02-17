import { SupabaseClient, User } from '@supabase/supabase-js'

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[ensureProfile] Read error:', error)
    throw error
  }

  if (!data) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        selected_tutor: null,
        skill_level: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle()

    if (insertError) {
      console.error('[ensureProfile] Upsert error:', insertError)
      throw insertError
    }

    return newProfile
  }

  return data
}
