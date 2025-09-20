// Test script untuk order completion dan stock deduction
// Jalankan dengan: node test-order-completion.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zkqpekjmjatpwvmzjnfi.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcXBla2ptamF0cHd2bXpqbmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwODIxOTYsImV4cCI6MjAzOTY1ODE5Nn0.nHcnL1t0YWnzLkqAG_m4iAGF2R2ZfLs-N02jGgBrR30';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testOrderCompletionFlow() {
  console.log('🧪 === TESTING ORDER COMPLETION FLOW ===');
  
  try {
    // 1. Check if stored procedures exist
    console.log('\n1. 🔍 Checking stored procedures...');
    
    const procedures = [
      'complete_order_and_deduct_stock',
      'can_complete_order', 
      'get_recipe_ingredients_for_order'
    ];
    
    for (const proc of procedures) {
      try {
        const { error } = await supabase.rpc(proc, { order_id: '00000000-0000-0000-0000-000000000000' });
        if (error && (error.message.includes('Order not found') || error.message.includes('not found'))) {
          console.log(`   ✅ ${proc}: EXISTS`);
        } else if (error) {
          console.log(`   ❌ ${proc}: ERROR - ${error.message}`);
        } else {
          console.log(`   ✅ ${proc}: EXISTS`);
        }
      } catch (err) {
        console.log(`   ❌ ${proc}: FAILED - ${err.message}`);
      }
    }
    
    // 2. Get pending orders
    console.log('\n2. 📋 Checking pending orders...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, status, nama_pelanggan, items, user_id')
      .neq('status', 'completed')
      .limit(5);
    
    if (orderError) {
      console.error('   ❌ Error fetching orders:', orderError.message);
      return;
    }
    
    console.log(`   📊 Found ${orders.length} pending orders`);
    orders.forEach(order => {
      console.log(`      - ${order.nomor_pesanan}: ${order.nama_pelanggan} (${order.status})`);
      console.log(`        Items: ${JSON.stringify(order.items).length} chars`);
    });
    
    if (orders.length === 0) {
      console.log('   ℹ️ No pending orders to test with.');
      return;
    }
    
    // 3. Test order completion validation for first order
    const testOrder = orders[0];
    console.log(`\n3. 🔍 Testing order completion for: ${testOrder.nomor_pesanan}`);
    
    // Check if order has recipe items
    let hasRecipeItems = false;
    try {
      const items = typeof testOrder.items === 'string' ? JSON.parse(testOrder.items) : testOrder.items;
      hasRecipeItems = items.some(item => item.isFromRecipe === true || item.recipeId);
      console.log(`   📦 Order has recipe items: ${hasRecipeItems}`);
      if (hasRecipeItems) {
        const recipeItems = items.filter(item => item.isFromRecipe === true || item.recipeId);
        console.log(`   📋 Recipe items:`, recipeItems.map(i => i.name || i.nama));
      }
    } catch (e) {
      console.log('   ⚠️ Could not parse order items:', e.message);
    }
    
    if (!hasRecipeItems) {
      console.log('   ⚠️ This order has no recipe items - stock will not be deducted');
      console.log('   💡 Only orders with recipe-based items will reduce stock');
    }
    
    // Test can_complete_order
    console.log('\n4. 🧪 Testing can_complete_order...');
    const { data: canCompleteResult, error: canCompleteError } = await supabase
      .rpc('can_complete_order', { order_id: testOrder.id });
    
    if (canCompleteError) {
      console.error('   ❌ Error in can_complete_order:', canCompleteError.message);
      return;
    }
    
    console.log('   📊 Can complete result:', canCompleteResult);
    
    if (canCompleteResult.can_complete) {
      console.log('   ✅ Order CAN be completed - stock is sufficient');
      console.log(`      - Total ingredients: ${canCompleteResult.total_ingredients}`);
      console.log(`      - Available: ${canCompleteResult.available_ingredients}`);
    } else {
      console.log('   ❌ Order CANNOT be completed - insufficient stock');
      console.log('      Insufficient items:', canCompleteResult.insufficient_stock);
    }
    
    // 5. Test get_recipe_ingredients_for_order
    console.log('\n5. 🧪 Testing get_recipe_ingredients_for_order...');
    const { data: ingredients, error: ingredError } = await supabase
      .rpc('get_recipe_ingredients_for_order', { order_id: testOrder.id });
    
    if (ingredError) {
      console.error('   ❌ Error getting recipe ingredients:', ingredError.message);
    } else {
      console.log(`   📊 Found ${ingredients.length} ingredient requirements:`);
      ingredients.forEach(ing => {
        const status = ing.current_stock >= ing.total_required ? '✅' : '❌';
        console.log(`      ${status} ${ing.bahan_nama}: need ${ing.total_required} ${ing.satuan}, have ${ing.current_stock}`);
      });
    }
    
    // 6. Check current stock levels
    console.log('\n6. 📦 Checking current stock levels...');
    const { data: stocks, error: stockError } = await supabase
      .from('bahan_baku')
      .select('id, nama, stok, satuan, minimum')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (stockError) {
      console.error('   ❌ Error fetching stock:', stockError.message);
    } else {
      console.log(`   📊 Current stock levels (top 10):`);
      stocks.forEach(stock => {
        const status = stock.stok > stock.minimum ? '✅' : '⚠️';
        console.log(`      ${status} ${stock.nama}: ${stock.stok} ${stock.satuan} (min: ${stock.minimum})`);
      });
    }
    
    console.log('\n🏁 === ORDER COMPLETION TEST COMPLETE ===');
    console.log('\n💡 Key Points:');
    console.log('   - Stock deduction only works for orders with recipe-based items');
    console.log('   - Order status must be changed to "completed" to trigger stock deduction');
    console.log('   - System will prevent completion if stock is insufficient');
    console.log('   - Check browser console for detailed error messages during actual usage');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test operational cost creation
async function testOperationalCostCreation() {
  console.log('\n🧪 === TESTING OPERATIONAL COST CREATION ===');
  
  try {
    // 1. Check table structure
    console.log('\n1. 🏗️ Testing table access...');
    const { data: existingCosts, error: fetchError } = await supabase
      .from('operational_costs')
      .select('id, nama_biaya, jumlah_per_bulan, jenis, status, group')
      .limit(1);
    
    if (fetchError) {
      console.error('   ❌ Cannot access operational_costs table:', fetchError.message);
      console.error('      Code:', fetchError.code);
      console.error('      Details:', fetchError.details);
      return;
    }
    
    console.log('   ✅ Table access OK');
    console.log(`   📊 Found ${existingCosts.length} existing costs in sample`);
    
    // 2. Test validation
    console.log('\n2. 🔍 Testing validation...');
    const invalidData = {
      nama_biaya: '', // Invalid: empty
      jumlah_per_bulan: 0, // Invalid: zero
      jenis: 'invalid', // Invalid: not tetap/variabel
      status: 'aktif',
      group: 'operasional'
    };
    
    const { error: validationError } = await supabase
      .from('operational_costs')
      .insert(invalidData)
      .select()
      .single();
    
    if (validationError) {
      console.log('   ✅ Validation working - rejected invalid data:', validationError.message);
    } else {
      console.log('   ⚠️ Validation might be too permissive');
    }
    
    // 3. Test successful creation
    console.log('\n3. 🧪 Testing successful creation...');
    const validData = {
      nama_biaya: `Test Biaya ${Date.now()}`,
      jumlah_per_bulan: 500000,
      jenis: 'tetap',
      status: 'aktif', 
      group: 'operasional'
    };
    
    console.log('   📤 Attempting to create:', validData);
    const { data: newCost, error: createError } = await supabase
      .from('operational_costs')
      .insert(validData)
      .select()
      .single();
    
    if (createError) {
      console.error('   ❌ Creation failed:', createError.message);
      console.error('      Code:', createError.code);
      console.error('      Details:', createError.details);
      console.error('      Hint:', createError.hint);
    } else {
      console.log('   ✅ Creation successful:', newCost);
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('operational_costs')
        .delete()
        .eq('id', newCost.id);
        
      if (deleteError) {
        console.log('   ⚠️ Cleanup failed:', deleteError.message);
      } else {
        console.log('   🗑️ Cleanup successful');
      }
    }
    
    console.log('\n🏁 === OPERATIONAL COST TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Main runner
async function runTests() {
  console.log('🚀 === RUNNING COMPREHENSIVE TESTS ===\n');
  
  try {
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('⚠️ Not authenticated - tests will run with anon access');
    } else {
      console.log('✅ Authenticated as:', user.email);
    }
    
    await testOrderCompletionFlow();
    await testOperationalCostCreation();
    
    console.log('\n🎉 === ALL TESTS COMPLETED ===');
    console.log('\nNext steps:');
    console.log('1. Have user test in browser with actual login');
    console.log('2. Check browser console for specific errors');
    console.log('3. Verify user workflow matches expected flow');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testOrderCompletionFlow, testOperationalCostCreation, runTests };