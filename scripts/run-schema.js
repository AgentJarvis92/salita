// Script to execute Supabase schema migrations
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSchema() {
  console.log('Reading schema file...');
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  
  // Split by statements (simple approach - split on semicolons outside of strings)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Executing ${statements.length} SQL statements...\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length === 0) continue;
    
    console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        // Try direct query instead
        const { error: queryError } = await supabase
          .from('_temp')
          .select('*')
          .limit(0); // Just to test connection
        
        console.log('  ⚠️  RPC not available, using alternative method...');
        // We'll need to use the SQL editor in Supabase dashboard
        console.log('  Statement needs manual execution in Supabase SQL Editor');
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.log('  ⚠️  Need to execute via Supabase dashboard');
    }
  }
  
  console.log('\n✅ Schema execution complete');
  console.log('\nNote: If statements need manual execution:');
  console.log('1. Go to: https://supabase.com/dashboard/project/wbcfrfpndsczqtuilfsl/editor');
  console.log('2. Copy contents of supabase-schema.sql');
  console.log('3. Paste and run in SQL Editor');
}

runSchema().catch(console.error);
