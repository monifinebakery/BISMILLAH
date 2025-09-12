// Test stored procedure complete_order_and_deduct_stock
// Run this in browser console where supabase client is available

async function testStoredProcedure() {
  try {
    console.log('🔍 Testing stored procedure existence and functionality...');
    
    // Get supabase client from window (available in browser)
    const supabase = window.supabase || window.__supabase;
    if (!supabase) {
      console.error('❌ Supabase client not found in browser!');
      return;
    }
    
    // Test 1: Check if stored procedure exists by trying to call it with invalid ID
    console.log('\n1. Testing stored procedure existence...');
    const { data: testResult, error: testError } = await supabase
      .rpc('complete_order_and_deduct_stock', { 
        order_id: '00000000-0000-0000-0000-000000000000' 
      });
    
    if (testError && testError.message.includes('function complete_order_and_deduct_stock does not exist')) {
      console.error('❌ Stored procedure complete_order_and_deduct_stock NOT FOUND!');
      console.log('📝 You need to run the SQL migration file to create it.');
      return;
    }
    
    console.log('✅ Stored procedure exists!');
    
    // Test 2: Get a test order that's ready to be completed
    console.log('\n2. Finding a test order...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'ready')
      .limit(1);
    
    if (orderError) {
      console.error('❌ Error fetching orders:', orderError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders with status "ready" found for testing.');
      
      // Try to find any order that's not completed
      const { data: anyOrders } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'completed')
        .limit(1);
      
      if (!anyOrders || anyOrders.length === 0) {
        console.log('📝 No orders available for testing.');
        return;
      }
      
      console.log('📦 Using order with different status for testing:', {
        id: anyOrders[0].id,
        nomor_pesanan: anyOrders[0].nomor_pesanan,
        status: anyOrders[0].status
      });
      
      // Update it to ready first
      await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', anyOrders[0].id);
      
      orders[0] = { ...anyOrders[0], status: 'ready' };
    }
    
    const testOrder = orders[0];
    console.log('📦 Found test order:', {
      id: testOrder.id,
      nomor_pesanan: testOrder.nomor_pesanan,
      status: testOrder.status,
      total_pesanan: testOrder.total_pesanan
    });
    
    // Test 3: Check stock before completion
    console.log('\n3. Checking current stock levels...');
    const { data: stockBefore, error: stockError } = await supabase
      .from('bahan_baku')
      .select('nama, stok_saat_ini, satuan')
      .limit(5);
    
    if (stockError) {
      console.error('❌ Error fetching stock:', stockError);
    } else {
      console.log('📊 Current stock levels:');
      stockBefore?.forEach(item => {
        console.log(`   ${item.nama}: ${item.stok_saat_ini} ${item.satuan}`);
      });
    }
    
    // Test 4: Try to complete the order
    console.log('\n4. Testing order completion...');
    const { data: result, error: completionError } = await supabase
      .rpc('complete_order_and_deduct_stock', { 
        order_id: testOrder.id 
      });
    
    if (completionError) {
      console.error('❌ Error calling stored procedure:', completionError);
      console.log('📝 Error details:', {
        message: completionError.message,
        details: completionError.details,
        hint: completionError.hint,
        code: completionError.code
      });
      return;
    }
    
    console.log('📋 Stored procedure result:', result);
    
    // Parse result if it's a string
    let parsedResult;
    try {
      parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    } catch (e) {
      parsedResult = result;
    }
    
    if (parsedResult && parsedResult.success) {
      console.log('✅ Order completion SUCCESS!');
      console.log('📊 Results:', {
        orderNumber: parsedResult.order_number,
        totalAmount: parsedResult.total_amount,
        stockItemsUpdated: parsedResult.stock_items_updated
      });
      
      // Test 5: Check stock after completion
      console.log('\n5. Checking stock after completion...');
      const { data: stockAfter } = await supabase
        .from('bahan_baku')
        .select('nama, stok_saat_ini, satuan')
        .limit(5);
      
      console.log('📊 Stock levels after completion:');
      stockAfter?.forEach(item => {
        console.log(`   ${item.nama}: ${item.stok_saat_ini} ${item.satuan}`);
      });
      
    } else {
      console.log('❌ Order completion FAILED!');
      console.log('📋 Error:', parsedResult?.error || 'Unknown error');
      if (parsedResult?.details) {
        console.log('📋 Details:', parsedResult.details);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testStoredProcedure();
} else {
  console.log('📝 Copy and paste this function into browser console to run the test.');
}