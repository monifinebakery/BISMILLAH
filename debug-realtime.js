// Debug script untuk cek real-time subscription dan financial sync
// Jalankan di browser console pada halaman orders

console.log('🔍 Real-time & Financial Sync Debugger');

// Global debug state
window.debugState = {
  realtimeEvents: [],
  financialSyncAttempts: [],
  subscriptionStatus: 'unknown'
};

// Function untuk monitor real-time events
function monitorRealtimeEvents() {
  console.log('📡 Starting real-time event monitoring...');
  
  // Override console.log temporarily untuk capture logs
  const originalLog = console.log;
  const originalError = console.error;
  
  // Intercept logs yang berkaitan dengan real-time
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('realtime') || message.includes('subscription') || message.includes('channel')) {
      window.debugState.realtimeEvents.push({
        timestamp: new Date().toISOString(),
        type: 'log',
        message: message
      });
    }
    originalLog.apply(console, arguments);
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('realtime') || message.includes('subscription') || message.includes('channel')) {
      window.debugState.realtimeEvents.push({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: message
      });
    }
    originalError.apply(console, arguments);
  };
  
  // Restore after 10 seconds
  setTimeout(() => {
    console.log = originalLog;
    console.error = originalError;
    console.log('📡 Real-time monitoring completed');
  }, 10000);
}

// Function untuk test connection status
async function testConnectionStatus() {
  try {
    console.log('🔗 Testing Supabase connection...');
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ User not authenticated');
      return false;
    }
    
    console.log('✅ User authenticated:', user.user.id);
    
    // Test basic read
    const { data: testRead, error: readError } = await supabase
      .from('orders')
      .select('count(*)', { count: 'exact', head: true });
    
    if (readError) {
      console.error('❌ Read test failed:', readError);
      return false;
    }
    
    console.log('✅ Database read test passed');
    
    // Test real-time channel status
    const channels = supabase.getChannels();
    console.log('📡 Active channels:', channels.length);
    
    channels.forEach((channel, index) => {
      console.log(`Channel ${index + 1}:`, {
        topic: channel.topic,
        state: channel.state,
        joinRef: channel.joinRef
      });
    });
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Function untuk test financial table
async function testFinancialTable() {
  try {
    console.log('💰 Testing financial_transactions table...');
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;
    
    // Test table access
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Financial table test failed:', error);
      return false;
    }
    
    console.log('✅ Financial table accessible');
    
    // Check recent transactions
    const { data: recent } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('📊 Recent financial transactions:', recent?.length || 0);
    if (recent && recent.length > 0) {
      console.table(recent);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Financial table test failed:', error);
    return false;
  }
}

// Function untuk manually trigger status update dan monitor hasil
async function testStatusUpdateWithMonitoring() {
  try {
    console.log('🧪 Testing status update with full monitoring...');
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ User not authenticated');
      return;
    }
    
    // Get test order
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.user.id)
      .neq('status', 'completed')
      .limit(1);
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No non-completed orders found for testing');
      return;
    }
    
    const testOrder = orders[0];
    console.log('📦 Testing with order:', {
      id: testOrder.id,
      orderNumber: testOrder.nomor_pesanan,
      currentStatus: testOrder.status,
      amount: testOrder.total_pesanan
    });
    
    // Start monitoring
    window.debugState.realtimeEvents = [];
    window.debugState.financialSyncAttempts = [];
    
    console.log('⏳ Updating status to completed...');
    
    // Manual update (simulating what your app does)
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.id)
      .eq('user_id', user.user.id)
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Update failed:', error);
      return;
    }
    
    console.log('✅ Status updated in database');
    
    // Wait for real-time events
    console.log('⏳ Waiting for real-time events...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for financial transaction
    console.log('💰 Checking for financial transaction...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: financialTx } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('description', `Pesanan ${testOrder.nomor_pesanan}`)
      .limit(1);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log('Status Update:', updated ? '✅ Success' : '❌ Failed');
    console.log('Financial Sync:', financialTx && financialTx.length > 0 ? '✅ Success' : '❌ Failed');
    console.log('Real-time Events Captured:', window.debugState.realtimeEvents.length);
    
    if (window.debugState.realtimeEvents.length > 0) {
      console.log('📡 Real-time Events:');
      window.debugState.realtimeEvents.forEach(event => {
        console.log(`  ${event.type}: ${event.message}`);
      });
    }
    
    if (financialTx && financialTx.length > 0) {
      console.log('💰 Financial Transaction Created:', {
        id: financialTx[0].id,
        amount: financialTx[0].amount,
        description: financialTx[0].description,
        category: financialTx[0].category,
        date: financialTx[0].date
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Function untuk cek apakah financial sync function bisa diakses
async function checkFinancialSyncFunction() {
  try {
    console.log('🔧 Checking financial sync function access...');
    
    // Try to import the function
    const module = await import('/src/utils/orderFinancialSync.ts');
    console.log('✅ orderFinancialSync module loaded');
    
    if (module.syncOrderToFinancialTransaction) {
      console.log('✅ syncOrderToFinancialTransaction function available');
      return true;
    } else {
      console.error('❌ syncOrderToFinancialTransaction function not found in module');
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading financial sync module:', error);
    return false;
  }
}

// Main debug function
async function runFullDebug() {
  console.log('🚀 Starting Full Debug Session\n');
  
  // Test 1: Connection
  const connectionOk = await testConnectionStatus();
  if (!connectionOk) return;
  
  // Test 2: Financial table
  const financialOk = await testFinancialTable();
  if (!financialOk) return;
  
  // Test 3: Financial sync function
  const syncFunctionOk = await checkFinancialSyncFunction();
  
  // Test 4: Real-time monitoring
  monitorRealtimeEvents();
  
  // Test 5: Full status update test
  await testStatusUpdateWithMonitoring();
  
  console.log('\n🏁 Debug session completed!');
  console.log('\n🛠️ Available debug functions:');
  console.log('- testStatusUpdateWithMonitoring() - Test status update dengan monitoring');
  console.log('- testConnectionStatus() - Test koneksi Supabase');
  console.log('- testFinancialTable() - Test akses financial table');
  console.log('- window.debugState - Lihat captured events');
}

// Export functions to window for manual use
window.testStatusUpdateWithMonitoring = testStatusUpdateWithMonitoring;
window.testConnectionStatus = testConnectionStatus;
window.testFinancialTable = testFinancialTable;
window.checkFinancialSyncFunction = checkFinancialSyncFunction;

// Auto-run
runFullDebug().catch(console.error);
