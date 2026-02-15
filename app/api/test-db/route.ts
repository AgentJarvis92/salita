import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Create test table via SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `CREATE TABLE IF NOT EXISTS test_connection (
        id serial PRIMARY KEY,
        message text NOT NULL,
        created_at timestamptz DEFAULT now()
      )`
    })

    // If RPC doesn't exist, use direct insert approach
    // Try inserting directly - table may already exist
    const testMessage = `Test at ${new Date().toISOString()}`

    const { data: insertData, error: insertError } = await supabase
      .from('test_connection')
      .insert({ message: testMessage })
      .select()

    if (insertError) {
      return NextResponse.json({
        status: 'partial',
        note: 'Table may not exist yet. Create it in Supabase SQL Editor first.',
        sql: `CREATE TABLE test_connection (id serial PRIMARY KEY, message text NOT NULL, created_at timestamptz DEFAULT now());`,
        error: insertError.message
      }, { status: 200 })
    }

    // Read back
    const { data: readData, error: readError } = await supabase
      .from('test_connection')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)

    if (readError) {
      return NextResponse.json({ status: 'fail', error: readError.message }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      write: insertData,
      read: readData,
      message: 'Database read/write working!'
    })
  } catch (err: any) {
    return NextResponse.json({ status: 'fail', error: err.message }, { status: 500 })
  }
}
