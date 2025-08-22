// Debug utility for applied_at field issue
// Import this in the main app and access via window.debugAppliedAt

import { supabase } from '@/integrations/supabase/client';

export const debugAppliedAt = {
  // Test if the issue still exists
  async testPurchaseUpdate() {
    console.log('🧪 Testing purchase update for applied_at error...');
    
    try {
      // Get a test purchase
      const { data: purchases, error: fetchError } = await supabase
        .from('purchases')
        .select('id, status, user_id')
        .limit(1);
      
      if (fetchError) {
        console.error('❌ Error fetching test purchase:', fetchError);
        return { success: false, error: fetchError.message };
      }
      
      if (!purchases || purchases.length === 0) {
        console.log('ℹ️ No purchases found to test with');
        return { success: true, message: 'No purchases to test' };
      }
      
      const testPurchase = purchases[0];
      console.log('🔍 Testing with purchase:', testPurchase.id);
      
      // Try to update the purchase (same status to avoid side effects)
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ status: testPurchase.status })
        .eq('id', testPurchase.id)
        .eq('user_id', testPurchase.user_id);
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
        const hasAppliedAtError = updateError.message.includes('applied_at');
        return { 
          success: false, 
          error: updateError.message,
          isAppliedAtError: hasAppliedAtError
        };
      }
      
      console.log('✅ Update successful - no applied_at error detected');
      return { success: true, message: 'Update successful' };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Check current database schema
  async checkSchema() {
    console.log('📋 Checking purchases table schema...');
    
    try {
      // This might not work due to RLS, but let's try
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'purchases')
        .order('ordinal_position');
      
      if (error) {
        console.warn('⚠️ Could not check schema directly:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('📋 Purchases table columns:', data);
      const hasAppliedAt = data?.some(col => col.column_name === 'applied_at');
      console.log(`🔍 Has applied_at column: ${hasAppliedAt}`);
      
      return { success: true, data, hasAppliedAt };
      
    } catch (error) {
      console.error('❌ Schema check failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Try a direct SQL approach (might not work due to permissions)
  async tryDirectFix() {
    console.log('🔧 Attempting direct database fix...');
    
    try {
      // Try to remove applied_at column directly
      const { error } = await supabase.sql`
        ALTER TABLE purchases DROP COLUMN IF EXISTS applied_at CASCADE;
      `;
      
      if (error) {
        console.error('❌ Direct fix failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Direct fix executed successfully');
      return { success: true, message: 'Direct fix completed' };
      
    } catch (error) {
      console.error('❌ Direct fix error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user info
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id, user?.email);
      return user;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  },

  // Run all diagnostics
  async runDiagnostics() {
    console.log('🔍 Running applied_at diagnostics...');
    
    const results = {
      user: await this.getCurrentUser(),
      schema: await this.checkSchema(),
      updateTest: await this.testPurchaseUpdate(),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Diagnostic results:', results);
    
    if (results.updateTest?.isAppliedAtError) {
      console.log('🚨 Applied_at error confirmed - database fix needed');
    } else if (results.updateTest?.success) {
      console.log('🎉 No applied_at error detected - issue may be resolved');
    }
    
    return results;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugAppliedAt = debugAppliedAt;
  console.log('🔧 Applied_at debug utility loaded. Use window.debugAppliedAt to access functions.');
}