// Setup Phase 2 database tables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

const migrations = [
  {
    name: 'profiles table',
    sql: `CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT,
      skill_level TEXT CHECK (skill_level IN ('beginner', 'understand_cant_speak', 'conversational')),
      goal TEXT CHECK (goal IN ('family', 'culture', 'travel', 'relationship', 'other')),
      selected_tutor TEXT CHECK (selected_tutor IN ('ate_maria', 'kuya_josh')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    );`
  },
  {
    name: 'profiles index',
    sql: `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);`
  },
  {
    name: 'messages table',
    sql: `CREATE TABLE IF NOT EXISTS messages (
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
    );`
  },
  {
    name: 'messages index',
    sql: `CREATE INDEX IF NOT EXISTS idx_messages_user_id_created ON messages(user_id, created_at DESC);`
  },
  {
    name: 'mistakes table',
    sql: `CREATE TABLE IF NOT EXISTS mistakes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      mistake TEXT NOT NULL,
      correction TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`
  },
  {
    name: 'mistakes index',
    sql: `CREATE INDEX IF NOT EXISTS idx_mistakes_user_id_created ON mistakes(user_id, created_at DESC);`
  },
  {
    name: 'analytics_events table',
    sql: `CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      event_name TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );`
  },
  {
    name: 'analytics_events user_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);`
  },
  {
    name: 'analytics_events name index',
    sql: `CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);`
  },
  {
    name: 'analytics_events created index',
    sql: `CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);`
  }
];

async function runMigrations() {
  console.log('🚀 Running Phase 2 migrations...\n');
  
  for (const migration of migrations) {
    try {
      // Try to run via RPC if available
      const { data, error } = await supabase.rpc('exec_sql', { sql: migration.sql });
      
      if (error) {
        // RPC not available - tables need to be created via Supabase dashboard
        console.log(`⚠️  ${migration.name}: RPC not available`);
        console.log('   Tables must be created via Supabase SQL Editor');
        console.log('   URL: https://supabase.com/dashboard/project/wbcfrfpndsczqtuilfsl/sql\n');
        return false;
      } else {
        console.log(`✅ ${migration.name}`);
      }
    } catch (err) {
      console.log(`⚠️  ${migration.name}: ${err.message}`);
      return false;
    }
  }
  
  console.log('\n✅ All migrations complete!');
  return true;
}

async function testTables() {
  console.log('\n🧪 Testing tables...\n');
  
  const tables = ['profiles', 'messages', 'mistakes', 'analytics_events'];
  let allExist = true;
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
      allExist = false;
    } else {
      console.log(`✅ ${table} exists`);
    }
  }
  
  return allExist;
}

async function main() {
  const migrated = await runMigrations();
  
  if (!migrated) {
    console.log('\n⚠️  Migrations could not be run programmatically.');
    console.log('📋 Execute PHASE-2-SCHEMA.sql manually in Supabase dashboard.\n');
  }
  
  const tablesExist = await testTables();
  
  if (tablesExist) {
    console.log('\n🎉 Phase 2 database setup complete!\n');
  } else {
    console.log('\n❌ Some tables missing. Run SQL manually.\n');
    process.exit(1);
  }
}

main().catch(console.error);
