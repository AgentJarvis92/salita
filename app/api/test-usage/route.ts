import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001'
    const today = new Date().toISOString().split('T')[0]

    // Insert test row
    const { data: insertData, error: insertError } = await supabase
      .from('usage_metrics')
      .upsert({
        user_id: testUserId,
        message_count: 1,
        date: today,
      }, {
        onConflict: 'user_id,date',
      })
      .select()

    if (insertError) throw insertError

    // Query by user_id + date
    const { data: queryData, error: queryError } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', testUserId)
      .eq('date', today)
      .single()

    if (queryError) throw queryError

    return NextResponse.json({
      success: true,
      inserted: insertData,
      queried: queryData,
      message: 'Usage metrics table working!',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
