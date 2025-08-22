import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Starting applied_at field database cleanup...')

    // SQL commands to clean up applied_at references
    const cleanupCommands = [
      // Drop triggers that might be setting applied_at
      'DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases CASCADE;',
      'DROP TRIGGER IF EXISTS update_purchases_applied_at ON purchases CASCADE;',
      'DROP TRIGGER IF EXISTS auto_apply_purchase_warehouse ON purchases CASCADE;',
      'DROP TRIGGER IF EXISTS set_applied_at_trigger ON purchases CASCADE;',
      
      // Drop functions that might reference applied_at
      'DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync() CASCADE;',
      'DROP FUNCTION IF EXISTS apply_purchase_to_warehouse() CASCADE;',
      'DROP FUNCTION IF EXISTS set_purchase_applied_at() CASCADE;',
      'DROP FUNCTION IF EXISTS update_purchase_applied_at() CASCADE;',
      'DROP FUNCTION IF EXISTS auto_set_applied_at() CASCADE;',
      
      // Drop policies that reference applied_at
      'DROP POLICY IF EXISTS purchase_items_update_own_unapplied ON purchase_items;',
      'DROP POLICY IF EXISTS purchase_items_delete_own_unapplied ON purchase_items;',
      'DROP POLICY IF EXISTS purchases_applied_at_policy ON purchases;',
      
      // Drop indexes that reference applied_at
      'DROP INDEX IF EXISTS idx_purchases_status_applied;',
      'DROP INDEX IF EXISTS idx_purchases_applied_at;',
      'DROP INDEX IF EXISTS idx_purchases_user_applied;',
      'DROP INDEX IF EXISTS idx_purchases_applied_at_status;'
    ]

    const results = []
    
    // Execute each cleanup command
    for (const command of cleanupCommands) {
      try {
        console.log(`Executing: ${command}`)
        const { error } = await supabaseAdmin.rpc('exec', { 
          query: command 
        })
        
        if (error) {
          console.warn(`Warning for "${command}": ${error.message}`)
          results.push({ command, status: 'warning', message: error.message })
        } else {
          console.log(`✅ Success: ${command}`)
          results.push({ command, status: 'success' })
        }
      } catch (err) {
        console.error(`Error executing "${command}": ${err}`)
        results.push({ command, status: 'error', message: String(err) })
      }
    }

    // Check if applied_at column still exists
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'purchases')
      .eq('column_name', 'applied_at')

    const hasAppliedAt = columns && columns.length > 0
    console.log(`Applied_at column exists: ${hasAppliedAt}`)

    // If applied_at column still exists, try to remove it
    if (hasAppliedAt) {
      try {
        const { error: dropError } = await supabaseAdmin.rpc('exec', {
          query: 'ALTER TABLE purchases DROP COLUMN IF EXISTS applied_at CASCADE;'
        })
        
        if (dropError) {
          console.error('Failed to drop applied_at column:', dropError)
          results.push({ 
            command: 'ALTER TABLE purchases DROP COLUMN applied_at', 
            status: 'error', 
            message: dropError.message 
          })
        } else {
          console.log('✅ Successfully dropped applied_at column')
          results.push({ 
            command: 'ALTER TABLE purchases DROP COLUMN applied_at', 
            status: 'success' 
          })
        }
      } catch (err) {
        console.error('Error dropping applied_at column:', err)
        results.push({ 
          command: 'ALTER TABLE purchases DROP COLUMN applied_at', 
          status: 'error', 
          message: String(err) 
        })
      }
    }

    // Test a simple update operation
    const { data: testPurchases } = await supabaseAdmin
      .from('purchases')
      .select('id, status, user_id')
      .limit(1)

    let testResult = null
    if (testPurchases && testPurchases.length > 0) {
      const testPurchase = testPurchases[0]
      const { error: testError } = await supabaseAdmin
        .from('purchases')
        .update({ status: testPurchase.status })
        .eq('id', testPurchase.id)
        .eq('user_id', testPurchase.user_id)

      testResult = {
        success: !testError,
        error: testError?.message || null,
        stillHasAppliedAtIssue: testError?.message?.includes('applied_at') || false
      }
    }

    const response = {
      success: true,
      message: 'Database cleanup completed',
      results,
      appliedAtColumnExists: hasAppliedAt,
      testUpdate: testResult,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Cleanup completed:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})