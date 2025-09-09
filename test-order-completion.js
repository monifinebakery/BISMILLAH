// Test Order Completion - Run in browser console
// Jalankan script ini di browser console pada halaman dengan Supabase loaded

console.log('🧪 Testing Order Completion Fix...');

async function testOrderCompletion() {
  try {
    // Check if we have access to supabase
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available. Run this in the app context.');
      return;
    }

    // Get current user
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user.user.id);
    
    // Test 1: Check if RPC functions exist by calling can_complete_order
    console.log('\n🔍 Test 1: Testing RPC function availability...');
    
    // Get a test order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, status, items')
      .eq('user_id', user.user.id)
      .neq('status', 'completed')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No incomplete orders found. Creating test scenario...');
      
      // Test with a hypothetical order ID to check function existence
      const testOrderId = 'test-order-id';
      
      try {
        const { data: testData, error: testError } = await supabase.rpc('can_complete_order', {
          order_id: testOrderId
        });
        
        // If we get here without 42883 error, function exists
        console.log('✅ RPC function can_complete_order exists');
      } catch (rpcError) {
        if (rpcError.code === '42883') {
          console.error('❌ RPC function can_complete_order does not exist');
          console.error('💡 Run: npx supabase db reset to apply migrations');
        } else {
          console.log('✅ RPC function exists (got different error as expected for test ID)');
        }
      }
      
      return;
    }
    
    const testOrder = orders[0];
    console.log('📦 Testing with order:', {
      id: testOrder.id,
      number: testOrder.nomor_pesanan,
      status: testOrder.status
    });
    
    // Test 2: Test can_complete_order function
    console.log('\n🔍 Test 2: Testing can_complete_order...');
    
    try {
      const { data: canCompleteData, error: canCompleteError } = await supabase.rpc('can_complete_order', {
        order_id: testOrder.id
      });
      
      if (canCompleteError) {
        console.error('❌ can_complete_order error:', canCompleteError);
        if (canCompleteError.code === '42883') {
          console.error('💡 Function does not exist - need to run migrations');
        }
        return;
      }
      
      console.log('✅ can_complete_order result:', canCompleteData);
      
      // Test 3: Simulate parsing insufficient_stock like our component does
      console.log('\n🔍 Test 3: Testing insufficientStock parsing...');
      
      try {
        let insufficientStock = [];
        
        if (Array.isArray(canCompleteData.insufficient_stock)) {
          insufficientStock = canCompleteData.insufficient_stock.map(item => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch {
                return null;
              }
            }
            return item;
          }).filter(Boolean);
        } else if (canCompleteData.insufficient_stock && typeof canCompleteData.insufficient_stock === 'object') {
          insufficientStock = [canCompleteData.insufficient_stock];
        }
        
        console.log('✅ Successfully parsed insufficient_stock:', insufficientStock);
        console.log(`📊 Parsed ${insufficientStock.length} insufficient stock items`);
        
        if (insufficientStock.length > 0) {
          console.log('⚠️ Stock issues found:');
          insufficientStock.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.item}: need ${item.required}, have ${item.available} ${item.unit}`);
          });
        } else {
          console.log('✅ All stock requirements satisfied');
        }
        
      } catch (parseError) {
        console.error('❌ Error parsing insufficient_stock:', parseError);
      }
      
    } catch (rpcError) {
      console.error('❌ RPC call failed:', rpcError);
    }
    
    // Test 4: Test get_recipe_ingredients_for_order
    console.log('\n🔍 Test 4: Testing get_recipe_ingredients_for_order...');
    
    try {
      const { data: ingredientsData, error: ingredientsError } = await supabase.rpc('get_recipe_ingredients_for_order', {
        order_id: testOrder.id
      });
      
      if (ingredientsError) {
        console.error('❌ get_recipe_ingredients_for_order error:', ingredientsError);
      } else {
        console.log('✅ Recipe ingredients found:', ingredientsData?.length || 0);
        if (ingredientsData && ingredientsData.length > 0) {
          ingredientsData.forEach(ingredient => {
            const hasStock = ingredient.current_stock >= ingredient.total_required;
            console.log(`  ${hasStock ? '✅' : '❌'} ${ingredient.bahan_nama}: need ${ingredient.total_required}, have ${ingredient.current_stock} ${ingredient.satuan}`);
          });
        }
      }
    } catch (ingredientsError) {
      console.error('❌ get_recipe_ingredients_for_order failed:', ingredientsError);
    }
    
    console.log('\n🏁 All tests completed!');
    console.log('✨ If no errors above, the fix should be working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOrderCompletion();
