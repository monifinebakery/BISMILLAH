// src/utils/debugOrderService.ts - Auto-run debug in development

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// ✅ AUTO-RUN: Automatically run debug when imported in development
if (import.meta.env.DEV) {
  logger.success('🔧 Debug Order Service loaded in development mode');
  
  // ✅ Auto-run after a short delay to let auth context load
  setTimeout(async () => {
    logger.info('🚀 Auto-running order debug check...');
    await autoDebugCheck();
  }, 3000); // 3 seconds delay
}

// ✅ ENHANCED: Debug order verification with multiple methods
const autoDebugCheck = async () => {
  try {
    logger.info('🔍 Starting automatic debug check...');
    
    // ✅ STEP 1: Test database connection
    logger.debug('Step 1: Testing database connection...');
    const dbTest = await testDatabaseConnection();
    if (!dbTest) {
      logger.error('❌ Database connection failed - stopping auto debug');
      return;
    }
    
    // ✅ STEP 2: Check current session
    logger.debug('Step 2: Checking current session...');
    const session = await debugCurrentUser();
    if (!session) {
      logger.warn('⚠️ No active session - user might not be logged in yet');
      return;
    }
    
    // ✅ STEP 3: Test with known problematic order
    const testOrderId = '250813BFGHUYE'; // Your problematic order
    logger.info('Step 3: Testing problematic order:', testOrderId);
    
    const debugResult = await debugOrderVerification(testOrderId);
    logger.success('🎯 Auto-debug completed with result:', debugResult);
    
    // ✅ STEP 4: Also test the fixed version
    const fixedResult = await verifyOrderExistsFixed(testOrderId);
    logger.success('✅ Fixed verification result:', fixedResult);
    
  } catch (error) {
    logger.error('❌ Auto-debug check failed:', error);
  }
};
export const debugOrderVerification = async (orderId: string) => {
  const cleanOrderId = orderId.trim().toUpperCase();
  
  logger.info('🔍 Debug Order Verification Started:', { 
    originalOrderId: orderId,
    cleanOrderId: cleanOrderId,
    length: cleanOrderId.length,
    timestamp: new Date().toISOString()
  });

  try {
    // ✅ METHOD 1: Exact match query (current method)
    logger.debug('🔍 Method 1: Exact match query...');
    const { data: exactMatch, error: exactError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', cleanOrderId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled');

    logger.debug('📊 Method 1 Result:', { 
      data: exactMatch, 
      error: exactError,
      count: exactMatch?.length || 0
    });

    // ✅ METHOD 2: Case insensitive query
    logger.debug('🔍 Method 2: Case insensitive query...');
    const { data: caseInsensitive, error: caseError } = await supabase
      .from('user_payments')
      .select('*')
      .ilike('order_id', cleanOrderId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled');

    logger.debug('📊 Method 2 Result:', { 
      data: caseInsensitive, 
      error: caseError,
      count: caseInsensitive?.length || 0
    });

    // ✅ METHOD 3: Get all orders with similar pattern
    logger.debug('🔍 Method 3: Pattern matching query...');
    const { data: patternMatch, error: patternError } = await supabase
      .from('user_payments')
      .select('*')
      .ilike('order_id', `%${cleanOrderId}%`)
      .eq('is_paid', true)
      .eq('payment_status', 'settled');

    logger.debug('📊 Method 3 Result:', { 
      data: patternMatch, 
      error: patternError,
      count: patternMatch?.length || 0
    });

    // ✅ METHOD 4: Get all paid orders for inspection
    logger.debug('🔍 Method 4: All paid orders query...');
    const { data: allPaid, error: allError } = await supabase
      .from('user_payments')
      .select('order_id, is_paid, payment_status, email, user_id, created_at')
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('created_at', { ascending: false })
      .limit(10);

    logger.debug('📊 Method 4 Result - All Paid Orders:', { 
      data: allPaid, 
      error: allError,
      count: allPaid?.length || 0
    });

    // ✅ METHOD 5: Get specific order regardless of payment status
    logger.debug('🔍 Method 5: Order regardless of status...');
    const { data: anyStatus, error: statusError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', cleanOrderId);

    logger.debug('📊 Method 5 Result - Any Status:', { 
      data: anyStatus, 
      error: statusError,
      count: anyStatus?.length || 0
    });

    // ✅ METHOD 6: Check table structure
    logger.debug('🔍 Method 6: Table structure check...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_payments')
      .select('*')
      .limit(1);

    if (sampleData && sampleData.length > 0) {
      logger.debug('📊 Table Structure Sample:', {
        columns: Object.keys(sampleData[0]),
        sampleRecord: sampleData[0]
      });
    }

    // ✅ ANALYSIS
    const analysis = {
      orderExists: exactMatch && exactMatch.length > 0,
      caseIssue: caseInsensitive && caseInsensitive.length > 0 && (!exactMatch || exactMatch.length === 0),
      patternFound: patternMatch && patternMatch.length > 0,
      orderExistsAnyStatus: anyStatus && anyStatus.length > 0,
      statusIssue: anyStatus && anyStatus.length > 0 && (!exactMatch || exactMatch.length === 0)
    };

    logger.success('✅ Order Verification Analysis:', analysis);

    // ✅ DETAILED RECOMMENDATIONS
    if (analysis.orderExistsAnyStatus && !analysis.orderExists) {
      const order = anyStatus?.[0];
      logger.warn('⚠️ Order exists but not paid/settled:', {
        order_id: order?.order_id,
        is_paid: order?.is_paid,
        payment_status: order?.payment_status,
        email: order?.email,
        user_id: order?.user_id
      });
      
      // Check specific issues
      if (order?.is_paid !== true) {
        logger.error('❌ Issue: is_paid is not true:', order?.is_paid);
      }
      if (order?.payment_status !== 'settled') {
        logger.error('❌ Issue: payment_status is not "settled":', order?.payment_status);
      }
      
      return 'ORDER_EXISTS_BUT_NOT_PAID';
    }

    if (analysis.caseIssue) {
      logger.warn('⚠️ Case sensitivity issue detected');
      return 'CASE_SENSITIVITY_ISSUE';
    }

    if (analysis.patternFound && !analysis.orderExists) {
      logger.warn('⚠️ Pattern found but exact match failed');
      return 'PATTERN_MISMATCH';
    }

    if (analysis.orderExists) {
      logger.success('✅ Order verification successful');
      return 'ORDER_FOUND';
    }

    logger.error('❌ Order not found in any method');
    
    // ✅ Additional debugging info
    logger.debug('🔍 Additional Debug Info:', {
      cleanOrderIdBytes: Array.from(cleanOrderId).map(c => c.charCodeAt(0)),
      allPaidOrderIds: allPaid?.map(o => ({
        id: o.order_id,
        bytes: Array.from(o.order_id || '').map(c => c.charCodeAt(0))
      })) || []
    });
    
    return 'ORDER_NOT_FOUND';

  } catch (error) {
    logger.error('❌ Debug order verification failed:', error);
    return 'VERIFICATION_ERROR';
  }
};

// ✅ AUTO-DEBUG: Function that runs automatically
const autoDebugCheck = async () => {
  try {
    logger.info('🔍 Starting automatic debug check...');
    
    // ✅ STEP 1: Test database connection
    logger.debug('Step 1: Testing database connection...');
    const dbTest = await testDatabaseConnection();
    if (!dbTest) {
      logger.error('❌ Database connection failed - stopping auto debug');
      return;
    }
    
    // ✅ STEP 2: Check current session
    logger.debug('Step 2: Checking current session...');
    const session = await debugCurrentUser();
    if (!session) {
      logger.warn('⚠️ No active session - user might not be logged in yet');
      return;
    }
    
    // ✅ STEP 3: Test with known problematic order
    const testOrderId = '250813BFGHUYE'; // Your problematic order
    logger.info('Step 3: Testing problematic order:', testOrderId);
    
    const debugResult = await debugOrderVerification(testOrderId);
    logger.success('🎯 Auto-debug completed with result:', debugResult);
    
    // ✅ STEP 4: Also test the fixed version
    const fixedResult = await verifyOrderExistsFixed(testOrderId);
    logger.success('✅ Fixed verification result:', fixedResult);
    
  } catch (error) {
    logger.error('❌ Auto-debug check failed:', error);
  }
};

// ✅ IMPROVED: Fixed verifyOrderExists function
export const verifyOrderExistsFixed = async (orderId: string): Promise<boolean> => {
  try {
    const cleanOrderId = orderId.trim().toUpperCase();
    logger.api('/verify-order-exists', 'Verifying order exists (FIXED):', { 
      originalOrderId: orderId,
      cleanOrderId: cleanOrderId
    });
    
    // ✅ TRY METHOD 1: Exact match first
    const { data: exactData, error: exactError } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status, email, user_id')
      .eq('order_id', cleanOrderId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled');
    
    if (exactError) {
      logger.error('❌ Exact match query error:', exactError);
    } else if (exactData && exactData.length > 0) {
      logger.success('✅ Order found with exact match:', exactData[0]);
      return true;
    }
    
    // ✅ TRY METHOD 2: Case insensitive if exact fails
    logger.debug('🔍 Trying case insensitive match...');
    const { data: iLikeData, error: iLikeError } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status, email, user_id')
      .ilike('order_id', cleanOrderId)
      .eq('is_paid', true)
      .eq('payment_status', 'settled');
    
    if (iLikeError) {
      logger.error('❌ Case insensitive query error:', iLikeError);
    } else if (iLikeData && iLikeData.length > 0) {
      logger.success('✅ Order found with case insensitive match:', iLikeData[0]);
      return true;
    }

    // ✅ TRY METHOD 3: Check if order exists with any status
    logger.debug('🔍 Checking if order exists with any status...');
    const { data: anyStatusData, error: anyStatusError } = await supabase
      .from('user_payments')
      .select('id, order_id, is_paid, payment_status, email, user_id')
      .eq('order_id', cleanOrderId);
    
    if (anyStatusError) {
      logger.error('❌ Any status query error:', anyStatusError);
    } else if (anyStatusData && anyStatusData.length > 0) {
      const order = anyStatusData[0];
      logger.warn('⚠️ Order exists but not paid/settled:', {
        order_id: order.order_id,
        is_paid: order.is_paid,
        payment_status: order.payment_status,
        email: order.email
      });
      
      // Return false but log the reason
      return false;
    }
    
    logger.warn('⚠️ Order not found in database:', cleanOrderId);
    return false;
    
  } catch (error) {
    logger.error('❌ Error in verifyOrderExistsFixed:', error);
    return false;
  }
};

// ✅ Quick database connection test
export const testDatabaseConnection = async () => {
  try {
    logger.info('🔍 Testing database connection...');
    
    const { data, error, count } = await supabase
      .from('user_payments')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      logger.error('❌ Database connection error:', error);
      return false;
    }
    
    logger.success('✅ Database connection successful:', {
      hasData: data && data.length > 0,
      totalRecords: count,
      sampleRecord: data?.[0] ? Object.keys(data[0]) : 'No records'
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Database connection test failed:', error);
    return false;
  }
};

// ✅ Get user's current session for debugging
export const debugCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('❌ Session error:', error);
      return null;
    }
    
    if (!session) {
      logger.warn('⚠️ No active session');
      return null;
    }
    
    logger.success('✅ Current session:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    });
    
    return session;
  } catch (error) {
    logger.error('❌ Debug current user failed:', error);
    return null;
  }
};

// ✅ Global debug functions for browser console
if (typeof window !== 'undefined') {
  (window as any).debugOrder = debugOrderVerification;
  (window as any).testOrderFixed = verifyOrderExistsFixed;
  (window as any).testDbConnection = testDatabaseConnection;
  (window as any).debugCurrentUser = debugCurrentUser;
  
  // ✅ Quick test function
  (window as any).quickOrderTest = async (orderId: string) => {
    console.log('🚀 Quick Order Test Started');
    
    // Test 1: Database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) return;
    
    // Test 2: Current user
    const session = await debugCurrentUser();
    if (!session) return;
    
    // Test 3: Debug order
    const result = await debugOrderVerification(orderId);
    console.log('🎯 Final Result:', result);
    
    // Test 4: Try fixed verification
    const exists = await verifyOrderExistsFixed(orderId);
    console.log('✅ Fixed Verification Result:', exists);
  };
  
  console.log('🎯 Debug functions available:');
  console.log('  - window.debugOrder("ORDER_ID") - Full debug analysis');
  console.log('  - window.testOrderFixed("ORDER_ID") - Test fixed verification');
  console.log('  - window.testDbConnection() - Test database connection');
  console.log('  - window.debugCurrentUser() - Check current session');
  console.log('  - window.quickOrderTest("ORDER_ID") - Run all tests');
}