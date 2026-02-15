import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const results: any = {
    success: true,
    tables: {},
    tests: {},
    errors: []
  }
  
  try {
    // Test 1: Profiles table
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0)
    
    results.tables.profiles = !profilesError
    if (profilesError) results.errors.push(`profiles: ${profilesError.message}`)
    
    // Test 2: Messages table
    const { data: messagesCheck, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(0)
    
    results.tables.messages = !messagesError
    if (messagesError) results.errors.push(`messages: ${messagesError.message}`)
    
    // Test 3: Mistakes table
    const { data: mistakesCheck, error: mistakesError } = await supabase
      .from('mistakes')
      .select('*')
      .limit(0)
    
    results.tables.mistakes = !mistakesError
    if (mistakesError) results.errors.push(`mistakes: ${mistakesError.message}`)
    
    // Test 4: Analytics events table
    const { data: analyticsCheck, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(0)
    
    results.tables.analytics_events = !analyticsError
    if (analyticsError) results.errors.push(`analytics_events: ${analyticsError.message}`)
    
    // If all tables exist, run insert/query tests
    const allTablesExist = Object.values(results.tables).every(v => v)
    
    if (allTablesExist) {
      // Get a test user from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user) {
        // Test profile insert
        const testProfile = {
          user_id: user.id,
          name: 'Test User',
          skill_level: 'beginner',
          goal: 'family',
          selected_tutor: 'ate_maria'
        }
        
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .upsert(testProfile)
        
        results.tests.profile_insert = !profileInsertError
        if (profileInsertError) results.errors.push(`profile_insert: ${profileInsertError.message}`)
        
        // Test message insert with JSONB
        const testMessage = {
          user_id: user.id,
          role: 'assistant',
          tagalog: 'Kumusta',
          english: 'How are you',
          hint: 'Sabihin: Mabuti',
          examples: ['Mabuti', 'Okay lang'],
          tone: 'warm'
        }
        
        const { error: messageInsertError } = await supabase
          .from('messages')
          .insert(testMessage)
        
        results.tests.message_insert = !messageInsertError
        if (messageInsertError) results.errors.push(`message_insert: ${messageInsertError.message}`)
        
        // Test analytics event
        const testEvent = {
          user_id: user.id,
          event_name: 'test_event',
          metadata: { test: true }
        }
        
        const { error: eventInsertError } = await supabase
          .from('analytics_events')
          .insert(testEvent)
        
        results.tests.analytics_insert = !eventInsertError
        if (eventInsertError) results.errors.push(`analytics_insert: ${eventInsertError.message}`)
      } else {
        results.tests.note = 'No authenticated user - skipping insert tests'
      }
    }
    
    results.success = results.errors.length === 0
    
  } catch (error: any) {
    results.success = false
    results.errors.push(`Unexpected error: ${error.message}`)
  }
  
  return NextResponse.json(results)
}
