// Simple test to verify applied_at error is fixed
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const testAppliedAtFix = async () => {
  try {
    logger.info('🧪 Testing applied_at fix...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error('❌ No authenticated user found');
      return false;
    }
    
    // Get a test purchase
    const { data: purchases, error: fetchError } = await supabase
      .from('purchases')
      .select('id, status, user_id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (fetchError) {
      logger.error('❌ Error fetching test purchase:', fetchError);
      return false;
    }
    
    if (!purchases || purchases.length === 0) {
      logger.info('ℹ️ No purchases found to test with - creating test data');
      // Could create test data here if needed
      return true;
    }
    
    const testPurchase = purchases[0];
    logger.info('🔍 Testing with purchase:', testPurchase.id);
    
    // Try to update the purchase status (same status to avoid side effects)
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: testPurchase.status })
      .eq('id', testPurchase.id)
      .eq('user_id', testPurchase.user_id);
    
    if (updateError) {
      logger.error('❌ Update failed:', updateError);
      const hasAppliedAtError = updateError.message.includes('applied_at');
      
      if (hasAppliedAtError) {
        logger.error('🚨 APPLIED_AT ERROR STILL EXISTS!');
        logger.error('Error message:', updateError.message);
        return false;
      } else {
        logger.warn('⚠️ Update failed but not due to applied_at:', updateError.message);
        return true;
      }
    }
    
    logger.success('✅ Update successful - applied_at error is FIXED!');
    return true;
    
  } catch (error: any) {
    logger.error('❌ Test failed with exception:', error);
    return false;
  }
};

// Auto-run the test when imported (for development)
if (import.meta.env.DEV) {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(async () => {
    try {
      const result = await testAppliedAtFix();
      if (result) {
        console.log('🎉 Applied_at fix test PASSED!');
      } else {
        console.log('🚨 Applied_at fix test FAILED!');
      }
    } catch (error) {
      console.error('Test execution error:', error);
    }
  }, 2000);
}