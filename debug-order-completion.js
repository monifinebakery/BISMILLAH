// Debug Order Completion Issues
// Jalankan di browser console pada halaman orders
console.log('🚀 Debug Order Completion - Starting...');

async function debugOrderCompletion() {
  try {
    // 1. Check authentication
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    console.log('✅ User authenticated:', user.user.id);

    // 2. Get test orders (non-completed ones)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.user.id)
      .neq('status', 'completed')
      .limit(3);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No incomplete orders found');
      return;
    }

    console.log(`📦 Found ${orders.length} incomplete orders`);
    
    for (let i = 0; i < Math.min(orders.length, 2); i++) {
      const order = orders[i];
      console.log(`\n📋 Testing order ${i+1}:`, {
        id: order.id,
        number: order.nomor_pesanan,
        status: order.status,
        total: order.total_pesanan
      });

      // 3. Test: Check if stored procedures exist
      console.log('🔍 Testing RPC function availability...');
      
      // Test can_complete_order
      try {
        const { data: canCompleteData, error: canCompleteError } = await supabase.rpc('can_complete_order', {
          order_id: order.id
        });

        if (canCompleteError) {
          console.error(`❌ can_complete_order RPC error:`, canCompleteError);
          if (canCompleteError.code === '42883') {
            console.error('💡 Function does not exist - need to run migrations');
          }
        } else {
          console.log('✅ can_complete_order result:', canCompleteData);
          
          if (!canCompleteData.can_complete) {
            console.warn('⚠️ Order cannot be completed due to insufficient stock:');
            canCompleteData.insufficient_stock.forEach(item => {
              console.warn(`  - ${JSON.parse(item).item}: need ${JSON.parse(item).required}, have ${JSON.parse(item).available} ${JSON.parse(item).unit}`);
            });
          }
        }
      } catch (rpcError) {
        console.error('❌ RPC call failed:', rpcError);
      }

      // Test get_recipe_ingredients_for_order
      try {
        const { data: ingredientsData, error: ingredientsError } = await supabase.rpc('get_recipe_ingredients_for_order', {
          order_id: order.id
        });

        if (ingredientsError) {
          console.error(`❌ get_recipe_ingredients_for_order error:`, ingredientsError);
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
    }

    // 4. Test database permissions
    console.log('\n🔐 Testing database permissions...');
    
    try {
      const { data: permTest, error: permError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.user.id)
        .limit(1);
      
      if (permError) {
        console.error('❌ Database permission error:', permError);
      } else {
        console.log('✅ Database permissions OK');
      }
    } catch (permError) {
      console.error('❌ Permission test failed:', permError);
    }

    // 5. Check for common migration issues
    console.log('\n🔧 Checking for common issues...');
    
    // Check if bahan_baku table is accessible
    try {
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('bahan_baku')
        .select('id, nama, stok')
        .eq('user_id', user.user.id)
        .limit(3);
      
      if (warehouseError) {
        console.error('❌ Warehouse access error:', warehouseError);
      } else {
        console.log(`✅ Warehouse accessible, ${warehouseData?.length || 0} items found`);
      }
    } catch (warehouseError) {
      console.error('❌ Warehouse test failed:', warehouseError);
    }

    console.log('\n🏁 Debug completed. Check the logs above for issues.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run debug
debugOrderCompletion();
