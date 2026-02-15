import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const migrations = [
    // Feature 2.1: Profiles table
    `CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT,
      skill_level TEXT CHECK (skill_level IN ('beginner', 'understand_cant_speak', 'conversational')),
      goal TEXT CHECK (goal IN ('family', 'culture', 'travel', 'relationship', 'other')),
      selected_tutor TEXT CHECK (selected_tutor IN ('ate_maria', 'kuya_josh')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`,
    
    // Feature 2.2: Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      tagalog TEXT,
      english TEXT,
      hint TEXT,
      examples JSONB,
      correction TEXT,
      note TEXT,
      tone TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_messages_user_id_created ON messages(user_id, created_at DESC)`,
    
    // Feature 2.2: Mistakes table
    `CREATE TABLE IF NOT EXISTS mistakes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      mistake TEXT NOT NULL,
      correction TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_mistakes_user_id_created ON mistakes(user_id, created_at DESC)`,
    
    // Feature 2.3: Analytics events table
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      event_name TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC)`,
  ]
  
  const results = []
  
  for (const sql of migrations) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        results.push({ sql: sql.substring(0, 60), error: error.message, success: false })
      } else {
        results.push({ sql: sql.substring(0, 60), success: true })
      }
    } catch (err: any) {
      results.push({ sql: sql.substring(0, 60), error: err.message, success: false })
    }
  }
  
  const allSuccess = results.every(r => r.success)
  
  return NextResponse.json({
    success: allSuccess,
    results,
    message: allSuccess 
      ? '✅ All tables created successfully' 
      : '⚠️  Some migrations failed - may need manual execution in Supabase SQL Editor'
  })
}
