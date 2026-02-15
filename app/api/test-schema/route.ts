import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const tests = []
  
  // Test 1: Check profiles table exists
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(0)
  
  tests.push({
    table: 'profiles',
    exists: !profilesError,
    error: profilesError?.message
  })
  
  // Test 2: Check messages table exists
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(0)
  
  tests.push({
    table: 'messages',
    exists: !messagesError,
    error: messagesError?.message
  })
  
  // Test 3: Check mistakes table exists
  const { data: mistakes, error: mistakesError } = await supabase
    .from('mistakes')
    .select('*')
    .limit(0)
  
  tests.push({
    table: 'mistakes',
    exists: !mistakesError,
    error: mistakesError?.message
  })
  
  // Test 4: Check analytics_events table exists
  const { data: analytics, error: analyticsError } = await supabase
    .from('analytics_events')
    .select('*')
    .limit(0)
  
  tests.push({
    table: 'analytics_events',
    exists: !analyticsError,
    error: analyticsError?.message
  })
  
  const allExist = tests.every(t => t.exists)
  
  return NextResponse.json({
    success: allExist,
    tables: tests,
    message: allExist 
      ? '✅ All Phase 2 tables exist' 
      : '❌ Some tables missing - run SQL in Supabase dashboard'
  })
}
