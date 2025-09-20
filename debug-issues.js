// Debug script untuk test masalah stok dan biaya operasional
// Jalankan di browser console saat login di app

console.log('🔧 Debug script loaded for testing stock and operational cost issues');

// 1. Test order completion and stock deduction
async function testOrderCompletion() {
  console.log('\n🧪 === TEST: Order Completion & Stock Deduction ===');
  
  try {
    // Check if we can access supabase
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available. Make sure you are on the app page.');
      return;
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log('✅ User authenticated:', user.id);

    // Check if complete_order_and_deduct_stock function exists
    console.log('\n🔍 Checking stored procedure...');
    try {
      const { data: funcCheck, error: funcError } = await supabase
        .rpc('complete_order_and_deduct_stock', { order_id: '00000000-0000-0000-0000-000000000000' });
      
      // This should fail with "Order not found" which means the function exists
      console.log('✅ Stored procedure complete_order_and_deduct_stock exists');
    } catch (error) {
      if (error.message.includes('Order not found')) {
        console.log('✅ Stored procedure complete_order_and_deduct_stock exists');
      } else {
        console.error('❌ Stored procedure issue:', error.message);
      }
    }

    // Get pending orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, status, nama_pelanggan, items')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .limit(3);

    if (orderError) {
      console.error('❌ Error fetching orders:', orderError);
      return;
    }

    if (orders.length === 0) {
      console.log('ℹ️ No pending orders found. Create an order first to test.');
      return;
    }

    console.log(`📋 Found ${orders.length} pending orders:`);
    orders.forEach(order => {
      console.log(`   - ${order.nomor_pesanan}: ${order.nama_pelanggan} (${order.status})`);
    });

    // Test can_complete_order for first order
    const testOrder = orders[0];
    console.log(`\n🔍 Testing order completion for: ${testOrder.nomor_pesanan}`);

    const { data: canComplete, error: canCompleteError } = await supabase
      .rpc('can_complete_order', { order_id: testOrder.id });

    if (canCompleteError) {
      console.error('❌ Error checking if order can be completed:', canCompleteError);
      return;
    }

    console.log('📊 Can complete order result:', canComplete);

    if (canComplete.can_complete) {
      console.log('✅ Order can be completed - stock is sufficient');
      console.log(`   - Total ingredients: ${canComplete.total_ingredients}`);
      console.log(`   - Available ingredients: ${canComplete.available_ingredients}`);
      
      // Ask user if they want to actually complete the order
      const shouldComplete = confirm(
        `Order ${testOrder.nomor_pesanan} can be completed. Do you want to complete it now? This will deduct stock.`
      );
      
      if (shouldComplete) {
        console.log(`🚀 Completing order: ${testOrder.nomor_pesanan}`);
        const { data: result, error: completeError } = await supabase
          .rpc('complete_order_and_deduct_stock', { order_id: testOrder.id });

        if (completeError) {
          console.error('❌ Error completing order:', completeError);
          return;
        }

        console.log('🎉 Order completion result:', result);
        if (result.success) {
          console.log('✅ Order completed successfully!');
          console.log(`   - Order number: ${result.order_number}`);
          console.log(`   - Total amount: ${result.total_amount}`);
          console.log(`   - Stock items updated: ${result.stock_items_updated}`);
        } else {
          console.log('❌ Order completion failed:', result.error);
        }
      }
    } else {
      console.log('⚠️ Order cannot be completed - insufficient stock');
      console.log('   Insufficient items:', canComplete.insufficient_stock);
    }

  } catch (error) {
    console.error('❌ Error in testOrderCompletion:', error);
  }
}

// 2. Test operational cost creation
async function testOperationalCost() {
  console.log('\n🧪 === TEST: Operational Cost Creation ===');
  
  try {
    // Check if we can access supabase
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available. Make sure you are on the app page.');
      return;
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log('✅ User authenticated:', user.id);

    // Check existing operational costs
    console.log('\n🔍 Checking existing operational costs...');
    const { data: existingCosts, error: fetchError } = await supabase
      .from('operational_costs')
      .select('id, nama_biaya, jumlah_per_bulan, jenis, status, group')
      .eq('user_id', user.id)
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching existing costs:', fetchError);
      return;
    }

    console.log(`📋 Found ${existingCosts.length} existing operational costs:`);
    existingCosts.forEach(cost => {
      console.log(`   - ${cost.nama_biaya}: Rp ${cost.jumlah_per_bulan} (${cost.jenis}, ${cost.status})`);
    });

    // Test creating a new operational cost
    console.log('\n🔍 Testing operational cost creation...');
    
    const testCostData = {
      nama_biaya: `Test Biaya ${Date.now()}`,
      jumlah_per_bulan: 500000,
      jenis: 'tetap',
      status: 'aktif',
      group: 'operasional',
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📤 Attempting to create operational cost:', testCostData);

    const { data: newCost, error: createError } = await supabase
      .from('operational_costs')
      .insert(testCostData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating operational cost:', createError);
      console.error('   Code:', createError.code);
      console.error('   Message:', createError.message);
      console.error('   Details:', createError.details);
      console.error('   Hint:', createError.hint);
      return;
    }

    console.log('✅ Operational cost created successfully:', newCost);

    // Test updating the cost
    console.log('\n🔍 Testing operational cost update...');
    const { data: updatedCost, error: updateError } = await supabase
      .from('operational_costs')
      .update({ jumlah_per_bulan: 600000 })
      .eq('id', newCost.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating operational cost:', updateError);
      return;
    }

    console.log('✅ Operational cost updated successfully:', updatedCost);

    // Clean up - delete the test cost
    const shouldDelete = confirm('Test operational cost created successfully. Delete the test cost?');
    if (shouldDelete) {
      const { error: deleteError } = await supabase
        .from('operational_costs')
        .delete()
        .eq('id', newCost.id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Error deleting test cost:', deleteError);
      } else {
        console.log('🗑️ Test operational cost deleted successfully');
      }
    }

  } catch (error) {
    console.error('❌ Error in testOperationalCost:', error);
  }
}

// 3. Check database permissions and RLS policies
async function checkPermissions() {
  console.log('\n🔍 === CHECK: Database Permissions ===');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log('✅ Current user:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);

    // Test basic table access
    console.log('\n🔍 Testing table access...');
    
    const tables = ['orders', 'operational_costs', 'bahan_baku', 'financial_transactions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (error) {
          console.error(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Access OK (${data.length} rows)`);
        }
      } catch (err) {
        console.error(`❌ ${table}: ${err.message}`);
      }
    }

    // Test RPC functions
    console.log('\n🔍 Testing RPC functions...');
    const rpcFunctions = [
      'complete_order_and_deduct_stock',
      'can_complete_order',
      'get_recipe_ingredients_for_order'
    ];

    for (const func of rpcFunctions) {
      try {
        // Test with invalid ID to check if function exists
        const { error } = await supabase.rpc(func, { order_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error && error.message.includes('not found')) {
          console.log(`✅ ${func}: Function exists (returned expected error)`);
        } else if (error) {
          console.error(`❌ ${func}: ${error.message}`);
        } else {
          console.log(`✅ ${func}: Function exists`);
        }
      } catch (err) {
        console.error(`❌ ${func}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in checkPermissions:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 === RUNNING ALL DEBUG TESTS ===');
  
  await checkPermissions();
  await testOrderCompletion();
  await testOperationalCost();
  
  console.log('\n🏁 === ALL TESTS COMPLETED ===');
  console.log('\nIf you found any issues, please report them to the developer with the console output.');
}

// Expose functions globally
window.testOrderCompletion = testOrderCompletion;
window.testOperationalCost = testOperationalCost;
window.checkPermissions = checkPermissions;
window.runAllTests = runAllTests;

console.log(`
🔧 Debug functions available:
- runAllTests() - Run all tests
- testOrderCompletion() - Test order completion and stock deduction
- testOperationalCost() - Test operational cost creation
- checkPermissions() - Check database access permissions

Type runAllTests() to start testing both issues.
`);