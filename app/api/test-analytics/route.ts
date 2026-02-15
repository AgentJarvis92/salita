import { NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const testUserId = '00000000-0000-0000-0000-000000000001'
  const results: Record<string, any> = {}

  // Track all 5 event types
  results.signup = await trackEvent(testUserId, 'signup')
  results.persona_selected = await trackEvent(testUserId, 'persona_selected', { persona: 'ate_maria' })
  results.first_message = await trackEvent(testUserId, 'first_message')
  results.three_messages_sent = await trackEvent(testUserId, 'three_messages_sent')
  results.session_5_min = await trackEvent(testUserId, 'session_5_min', { duration: 300 })

  // Query by user_id
  const { data: byUser, error: userErr } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  results.query_by_user = { count: byUser?.length, error: userErr?.message || null }

  // Query by event_name
  const { data: byName, error: nameErr } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('event_name', 'persona_selected')
    .order('created_at', { ascending: false })
    .limit(10)

  results.query_by_name = { count: byName?.length, error: nameErr?.message || null }

  // Verify JSONB metadata
  const metadataEvent = byName?.find(e => e.metadata?.persona === 'ate_maria')
  results.jsonb_metadata = {
    stored_correctly: !!metadataEvent,
    sample: metadataEvent?.metadata || null,
  }

  // Cleanup test data
  await supabase.from('analytics_events').delete().eq('user_id', testUserId)

  return NextResponse.json({ success: true, results })
}
