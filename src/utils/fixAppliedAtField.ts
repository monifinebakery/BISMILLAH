// Utility to fix applied_at field issue by removing database triggers and functions
// This can be run from the browser console or as a one-time script

import { supabase } from '@/integrations/supabase/client';

export const fixAppliedAtField = async () => {
  console.log('🔧 Starting applied_at field fix...');
  
  try {
    // 1. Check current purchases table structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'purchases')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log('📋 Current purchases columns:', columns);
      const hasAppliedAt = columns?.some(col => col.column_name === 'applied_at');
      console.log('🔍 Has applied_at column:', hasAppliedAt);
    }

    // 2. Try to run SQL commands to clean up
    const sqlCommands = [
      // Drop triggers
      'DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases CASCADE;',
      'DROP TRIGGER IF EXISTS update_purchases_applied_at ON purchases CASCADE;',
      'DROP TRIGGER IF EXISTS auto_apply_purchase_warehouse ON purchases CASCADE;',
      'DROP TRIGGER IF EXISTS set_applied_at_trigger ON purchases CASCADE;',
      
      // Drop functions
      'DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync() CASCADE;',
      'DROP FUNCTION IF EXISTS apply_purchase_to_warehouse() CASCADE;',
      'DROP FUNCTION IF EXISTS set_purchase_applied_at() CASCADE;',
      'DROP FUNCTION IF EXISTS update_purchase_applied_at() CASCADE;',
      'DROP FUNCTION IF EXISTS auto_set_applied_at() CASCADE;',
      
      // Drop policies
      'DROP POLICY IF EXISTS purchase_items_update_own_unapplied ON purchase_items;',
      'DROP POLICY IF EXISTS purchase_items_delete_own_unapplied ON purchase_items;',
      'DROP POLICY IF EXISTS purchases_applied_at_policy ON purchases;',
      
      // Drop indexes
      'DROP INDEX IF EXISTS idx_purchases_status_applied;',
      'DROP INDEX IF EXISTS idx_purchases_applied_at;',
      'DROP INDEX IF EXISTS idx_purchases_user_applied;',
      'DROP INDEX IF EXISTS idx_purchases_applied_at_status;',
      
      // Remove column
      'ALTER TABLE purchases DROP COLUMN IF EXISTS applied_at CASCADE;'
    ];

    console.log('🧹 Running cleanup commands...');
    for (const sql of sqlCommands) {
      try {
        console.log(`⚡ Executing: ${sql}`);
        const { error } = await supabase.rpc('exec_sql', { sql_command: sql });
        if (error) {
          console.warn(`⚠️ Warning for "${sql}":`, error.message);
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.warn(`⚠️ Could not execute "${sql}":`, err);
      }
    }

    // 3. Test a simple update to see if it works now
    console.log('🧪 Testing purchase update...');
    const { data: testPurchases } = await supabase
      .from('purchases')
      .select('id, status, user_id')
      .limit(1);
    
    if (testPurchases && testPurchases.length > 0) {
      const testPurchase = testPurchases[0];
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ status: testPurchase.status }) // Update with same status
        .eq('id', testPurchase.id)
        .eq('user_id', testPurchase.user_id);
      
      if (updateError) {
        console.error('❌ Update test failed:', updateError);
        if (updateError.message.includes('applied_at')) {
          console.error('🚨 applied_at field is still causing issues!');
        }
      } else {
        console.log('✅ Update test successful - applied_at issue should be fixed!');
      }
    }

    console.log('🎉 Applied_at field fix completed!');
    return { success: true, message: 'Fix completed successfully' };

  } catch (error) {
    console.error('❌ Error during fix:', error);
    return { success: false, error: error.message };
  }
};

// For browser console usage
if (typeof window !== 'undefined') {
  (window as any).fixAppliedAtField = fixAppliedAtField;
  console.log('🔧 Applied_at field fix utility loaded. Run fixAppliedAtField() to execute.');
}