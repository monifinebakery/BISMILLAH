// Test script untuk memverifikasi fix UI auto-update dan financial auto-sync
// Jalankan ini di browser console pada halaman orders

console.log('🧪 Testing Status Update Fixes');

async function testStatusUpdateAndSync() {
  try {
    console.log('🔍 Step 1: Getting current user and test order...');
    
    // Get current user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      console.error('❌ User authentication failed:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.user.id);
    
    // Get a test order (preferably one that's not completed)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.user.id)
      .neq('status', 'completed') // Get non-completed orders first
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No non-completed orders found. Trying any order...');
      
      // Fallback: get any order
      const { data: anyOrders, error: anyOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.user.id)
        .limit(1);
        
      if (anyOrdersError || !anyOrders || anyOrders.length === 0) {
        console.error('❌ No orders found for testing');
        return;
      }
      
      orders.push(...anyOrders);
    }
    
    const testOrder = orders[0];
    console.log('📦 Test order found:', {
      id: testOrder.id,
      orderNumber: testOrder.nomor_pesanan,
      currentStatus: testOrder.status,
      totalAmount: testOrder.total_pesanan
    });
    
    console.log('\\n🔄 Step 2: Testing status update to "completed"...');
    
    // Record current UI state (if available)
    const initialOrdersCount = document.querySelectorAll('[data-testid="order-row"], .order-item, tr[data-order-id]').length;
    console.log('📊 Current UI orders count:', initialOrdersCount);
    
    // Update status to completed
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.id)
      .eq('user_id', user.user.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
      return;
    }
    
    console.log('✅ Order status updated to completed:', updatedOrder.nomor_pesanan);
    
    console.log('\\n⏳ Step 3: Checking UI auto-update...');
    
    // Wait a bit for UI to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedOrdersCount = document.querySelectorAll('[data-testid="order-row"], .order-item, tr[data-order-id]').length;
    console.log('📊 Updated UI orders count:', updatedOrdersCount);
    
    // Check if status is visually updated in UI
    const statusElements = document.querySelectorAll('[data-order-id=\"' + testOrder.id + '\"] .status, [data-order-id=\"' + testOrder.id + '\"] [class*=\"status\"]');
    let uiStatusFound = false;
    statusElements.forEach(el => {
      if (el.textContent && el.textContent.toLowerCase().includes('completed')) {
        uiStatusFound = true;
        console.log('✅ UI status updated visually');
      }
    });
    
    if (!uiStatusFound) {
      console.log('⚠️ UI status may not have updated visually (check manually)');
    }
    
    console.log('\\n💰 Step 4: Checking financial auto-sync...');
    
    // Wait a bit more for financial sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if financial transaction was created
    const { data: financialTx, error: financialError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('type', 'income')
      .eq('description', `Pesanan ${testOrder.nomor_pesanan}`)
      .limit(1);
    
    if (financialError) {
      console.error('❌ Error checking financial transactions:', financialError);
      return;
    }
    
    if (financialTx && financialTx.length > 0) {
      console.log('✅ Financial transaction created successfully:', {
        id: financialTx[0].id,
        amount: financialTx[0].amount,
        description: financialTx[0].description,
        date: financialTx[0].date,
        category: financialTx[0].category
      });
    } else {
      console.log('❌ Financial transaction NOT created (auto-sync may have failed)');
      
      // Check if it already existed
      const { data: existingTx } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('description', `Pesanan ${testOrder.nomor_pesanan}`)
        .limit(1);
        
      if (existingTx && existingTx.length > 0) {
        console.log('ℹ️ Financial transaction already exists:', existingTx[0]);
      }
    }
    
    console.log('\\n📋 Step 5: Summary of test results...');
    console.log('------------------------------------------');
    console.log('✅ Order status update: SUCCESS');
    console.log(`${uiStatusFound ? '✅' : '⚠️'} UI auto-update: ${uiStatusFound ? 'SUCCESS' : 'NEEDS MANUAL CHECK'}`);
    console.log(`${financialTx && financialTx.length > 0 ? '✅' : '❌'} Financial auto-sync: ${financialTx && financialTx.length > 0 ? 'SUCCESS' : 'FAILED'}`);
    
    console.log('\\n🔧 Next steps:');
    console.log('1. Refresh the page and check if order status is visually updated');
    console.log('2. Go to financial reports and check if income entry exists');
    console.log('3. If financial sync failed, check browser console for error logs');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Manual financial sync test function
window.testManualFinancialSync = async function(orderNumber) {
  try {
    console.log('🧪 Testing manual financial sync for order:', orderNumber);
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ User not authenticated');
      return;
    }
    
    // Get the order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('nomor_pesanan', orderNumber)
      .single();
    
    if (!order) {
      console.error('❌ Order not found:', orderNumber);
      return;
    }
    
    // Create financial transaction manually
    const { data: financialTx, error } = await supabase
      .from('financial_transactions')
      .insert({
        user_id: user.user.id,
        type: 'income',
        category: 'Penjualan',
        amount: order.total_pesanan,
        description: `Pesanan ${order.nomor_pesanan}`,
        date: new Date(order.tanggal).toISOString().split('T')[0],
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating financial transaction:', error);
      return;
    }
    
    console.log('✅ Manual financial transaction created:', financialTx);
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
  }
};

// Check if financial_transactions table exists
async function checkFinancialTable() {
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.error('❌ financial_transactions table does not exist!');
      console.log('💡 You need to create the financial_transactions table first');
      return false;
    }
    
    console.log('✅ financial_transactions table exists');
    return true;
  } catch (error) {
    console.error('❌ Error checking financial table:', error);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting comprehensive status update tests\\n');
  
  const tableExists = await checkFinancialTable();
  if (!tableExists) return;
  
  await testStatusUpdateAndSync();
  
  console.log('\\n✨ All tests completed!');
  console.log('\\n🛠️ Available manual functions:');
  console.log('- testManualFinancialSync("ORD123456") - Test manual financial sync');
  console.log('- checkFinancialTable() - Check if financial table exists');
}

// Auto-run tests
runAllTests().catch(console.error);
