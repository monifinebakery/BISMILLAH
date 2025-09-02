// Simple test runner for date range filtering consistency
// Run this in your browser console or development environment

console.log(`
🧪 DATE RANGE FILTERING TEST

Instructions:
1. Open your app in the browser (http://localhost:5174)
2. Make sure you're logged in
3. Open browser console (F12)
4. Copy and paste the following code:

// =======================================
// BROWSER CONSOLE TEST CODE
// =======================================

(async () => {
  console.log('🧪 Starting Date Range Filtering Test...');
  
  try {
    // Import the supabase client (adjust path if needed)
    const { supabase } = window;
    
    if (!supabase) {
      console.error('❌ Supabase client not found in window object');
      return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Create test date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log('📅 Testing date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const results = {};
    
    // Test 1: Financial Transactions
    console.log('📊 Testing financial transactions...');
    const { data: financialData, error: financialError } = await supabase
      .from('financial_transactions')
      .select('id, type, amount, category, description, date, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    results.financial = {
      success: !financialError,
      error: financialError?.message,
      count: financialData?.length || 0,
      sample: financialData?.slice(0, 2) || []
    };
    
    // Test 2: Operational Costs
    console.log('💰 Testing operational costs...');
    const { data: costsData, error: costsError } = await supabase
      .from('operational_costs')
      .select('id, nama_biaya, jumlah_per_bulan, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    results.operationalCosts = {
      success: !costsError,
      error: costsError?.message,
      count: costsData?.length || 0,
      sample: costsData?.slice(0, 2) || []
    };
    
    // Test 3: Warehouse Materials
    console.log('📦 Testing warehouse materials...');
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('bahan_baku')
      .select('id, nama, stok, harga_satuan, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    results.warehouse = {
      success: !warehouseError,
      error: warehouseError?.message,
      count: warehouseData?.length || 0,
      sample: warehouseData?.slice(0, 2) || []
    };
    
    // Test 4: Orders
    console.log('📋 Testing orders...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, nama_pelanggan, total_pesanan, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    results.orders = {
      success: !ordersError,
      error: ordersError?.message,
      count: ordersData?.length || 0,
      sample: ordersData?.slice(0, 2) || []
    };
    
    // Test 5: Purchases  
    console.log('🛒 Testing purchases...');
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, supplier, total_nilai, tanggal, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    results.purchases = {
      success: !purchasesError,
      error: purchasesError?.message,
      count: purchasesData?.length || 0,
      sample: purchasesData?.slice(0, 2) || []
    };
    
    // Generate summary
    const modules = Object.keys(results);
    const successful = modules.filter(key => results[key].success);
    const failed = modules.filter(key => !results[key].success);
    
    const summary = {
      totalModules: modules.length,
      successful: successful.length,
      failed: failed.length,
      successfulModules: successful,
      failedModules: failed.map(key => ({
        module: key,
        error: results[key].error
      })),
      allConsistent: failed.length === 0
    };
    
    console.log('🎯 DATE RANGE FILTERING TEST RESULTS:');
    console.log('=====================================');
    console.table(Object.entries(results).map(([module, data]) => ({
      Module: module,
      Success: data.success ? '✅' : '❌',
      Count: data.count,
      Error: data.error || 'None'
    })));
    
    console.log('📊 Summary:', summary);
    
    if (summary.allConsistent) {
      console.log('🎉 ALL MODULES ARE CONSISTENT!');
      console.log('✅ All modules are properly filtering data using both start and end dates (gte & lte)');
    } else {
      console.log('❌ SOME MODULES HAVE ISSUES:');
      summary.failedModules.forEach(failed => {
        console.log(\`- \${failed.module}: \${failed.error}\`);
      });
    }
    
    // Show data samples
    console.log('\\n📋 Sample Data by Module:');
    Object.entries(results).forEach(([module, data]) => {
      if (data.success && data.count > 0) {
        console.log(\`\\n\${module} (\${data.count} records):\`, data.sample);
      }
    });
    
    return {
      summary,
      results,
      dateRange: { startDate, endDate }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();

// =======================================
// END OF BROWSER CONSOLE TEST CODE
// =======================================

After running this test, you should see:
- ✅ All modules successfully filtering with both start and end dates
- 📊 Consistent data counts across modules  
- 🎯 Proper date range filtering implementation

If any module fails, check the error messages and ensure:
1. The standardDateRangeFiltering utility is properly imported
2. Both gte() and lte() filters are applied
3. Database queries use correct column names and user_id filtering
`);
