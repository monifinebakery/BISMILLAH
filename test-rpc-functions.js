// Test RPC Functions - Jalankan di browser console pada halaman orders
// Paste script ini di browser console untuk test RPC functions

console.log('🧪 Testing RPC Functions...');

async function testRPCFunctions() {
  try {
    // Get current user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      console.error('❌ User authentication failed:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.user.id);
    
    // Get a test order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.user.id)
      .neq('status', 'completed')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found for testing');
      return;
    }
    
    const testOrder = orders[0];
    console.log('📦 Test order found:', {
      id: testOrder.id,
      orderNumber: testOrder.nomor_pesanan,
      status: testOrder.status,
      totalAmount: testOrder.total_pesanan
    });
    
    // Test 1: can_complete_order
    console.log('\n🔍 Testing can_complete_order...');
    const { data: canCompleteData, error: canCompleteError } = await supabase.rpc('can_complete_order', {
      order_id: testOrder.id
    });
    
    if (canCompleteError) {
      console.error('❌ can_complete_order error:', canCompleteError);
    } else {
      console.log('✅ can_complete_order result:', canCompleteData);
    }
    
    // Test 2: get_recipe_ingredients_for_order
    console.log('\n🔍 Testing get_recipe_ingredients_for_order...');
    const { data: ingredientsData, error: ingredientsError } = await supabase.rpc('get_recipe_ingredients_for_order', {
      order_id: testOrder.id
    });
    
    if (ingredientsError) {
      console.error('❌ get_recipe_ingredients_for_order error:', ingredientsError);
    } else {
      console.log('✅ get_recipe_ingredients_for_order result:', ingredientsData);
    }
    
    // Test 3: complete_order_and_deduct_stock (WARNING: This will actually complete the order!)
    console.log('\n⚠️  WARNING: complete_order_and_deduct_stock test will actually complete the order!');
    console.log('Uncomment the code below to test, but be aware it will change your data:');
    
    console.log(`
    // Uncomment to test:
    /*
    const { data: completeData, error: completeError } = await supabase.rpc('complete_order_and_deduct_stock', {
      order_id: '${testOrder.id}'
    });
    
    if (completeError) {
      console.error('❌ complete_order_and_deduct_stock error:', completeError);
    } else {
      console.log('✅ complete_order_and_deduct_stock result:', completeData);
    }
    */
    `);
    
    console.log('\n✅ All RPC function tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRPCFunctions();
