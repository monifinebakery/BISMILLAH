// Debug Script: Profit Analysis vs Financial Report Data Comparison
// Jalankan di browser console untuk debug masalah data yang tidak muncul

async function debugProfitAnalysisData() {
  console.log('🔍 DEBUG: Profit Analysis Data Comparison');
  console.log('=====================================');
  
  // Check if we have access to required APIs
  if (!window.supabase) {
    console.error('❌ Supabase not available. Make sure you are on the application page.');
    return;
  }
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Test date - September 1, 2024 (adjust as needed)
    const testDate = '2024-09-01';
    const testDateStart = testDate + 'T00:00:00.000Z';
    const testDateEnd = testDate + 'T23:59:59.999Z';
    
    console.log('\n📅 Testing date:', testDate);
    console.log('   Date range:', testDateStart, 'to', testDateEnd);
    
    // 1. Check Financial Transactions (what shows in laporan keuangan)
    console.log('\n1. 🔍 Checking Financial Transactions...');
    const { data: transactions, error: trxError } = await window.supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', testDate)
      .lte('date', testDate)
      .order('date');
      
    if (trxError) {
      console.error('❌ Error fetching transactions:', trxError);
    } else {
      console.log(`📊 Found ${transactions?.length || 0} transactions on ${testDate}:`);
      (transactions || []).forEach((trx, i) => {
        console.log(`   ${i + 1}. ${trx.type}: Rp${Number(trx.amount).toLocaleString('id-ID')} - ${trx.description} (${trx.date})`);
      });
      
      // Check income specifically
      const income = (transactions || []).filter(t => t.type === 'income');
      const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
      console.log(`💰 Total Income: Rp${totalIncome.toLocaleString('id-ID')} (${income.length} transactions)`);
    }
    
    // 2. Check what Profit Analysis API sees
    console.log('\n2. 🔍 Checking Profit Analysis Daily Calculation...');
    
    // Test the daily calculation function if available
    if (window.calculateProfitAnalysisDaily) {
      const fromDate = new Date(testDate + 'T00:00:00');
      const toDate = new Date(testDate + 'T23:59:59');
      
      try {
        const dailyResult = await window.calculateProfitAnalysisDaily(fromDate, toDate);
        console.log('📊 Daily profit analysis result:', dailyResult);
        
        if (dailyResult.success && dailyResult.data) {
          const dayData = dailyResult.data.find(d => d.period === testDate);
          if (dayData) {
            console.log(`✅ Found profit data for ${testDate}:`);
            console.log(`   Revenue: Rp${dayData.revenue_data.total.toLocaleString('id-ID')}`);
            console.log(`   COGS: Rp${dayData.cogs_data.total.toLocaleString('id-ID')}`);
            console.log(`   OpEx: Rp${dayData.opex_data.total.toLocaleString('id-ID')}`);
          } else {
            console.log(`❌ No profit data found for ${testDate}`);
            console.log('Available periods:', dailyResult.data.map(d => d.period));
          }
        }
      } catch (err) {
        console.log('⚠️ Daily calculation function not available or failed:', err.message);
      }
    }
    
    // 3. Test different date formats
    console.log('\n3. 🔍 Testing Different Date Formats...');
    const dateFormats = [
      testDate,                    // YYYY-MM-DD
      testDate + 'T00:00:00Z',    // ISO with Z
      testDate + 'T00:00:00',     // ISO without Z
      new Date(testDate).toISOString().split('T')[0], // Normalized
    ];
    
    for (const dateFormat of dateFormats) {
      const { data: testTrx } = await window.supabase
        .from('financial_transactions')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', dateFormat);
        
      console.log(`   Format "${dateFormat}": ${testTrx?.[0]?.count || 0} transactions`);
    }
    
    // 4. Check date ranges used by profit analysis
    console.log('\n4. 🔍 Testing Date Range Queries...');
    const dateRangeTests = [
      { start: testDate, end: testDate, label: 'Same date (YYYY-MM-DD)' },
      { start: testDateStart, end: testDateEnd, label: 'Full day range (ISO)' },
      { start: testDate + 'T00:00:00', end: testDate + 'T23:59:59', label: 'Day range (local time)' }
    ];
    
    for (const test of dateRangeTests) {
      const { data: rangeTrx } = await window.supabase
        .from('financial_transactions')
        .select('count')
        .eq('user_id', user.id)
        .gte('date', test.start)
        .lte('date', test.end);
        
      console.log(`   ${test.label}: ${rangeTrx?.[0]?.count || 0} transactions`);
    }
    
    // 5. Check COGS data (pemakaian bahan)
    console.log('\n5. 🔍 Checking COGS Data (Pemakaian Bahan)...');
    const { data: pemakaian, error: pemakaianError } = await window.supabase
      .from('pemakaian_bahan')
      .select('*')
      .eq('user_id', user.id)
      .gte('tanggal', testDate)
      .lte('tanggal', testDate);
      
    if (pemakaianError) {
      console.error('❌ Error fetching pemakaian:', pemakaianError);
    } else {
      console.log(`📊 Found ${pemakaian?.length || 0} pemakaian records on ${testDate}`);
      if (pemakaian && pemakaian.length > 0) {
        const totalCogs = pemakaian.reduce((sum, p) => {
          const value = Number(p.hpp_value) || (Number(p.qty_base) * Number(p.harga_efektif));
          return sum + value;
        }, 0);
        console.log(`💰 Total COGS: Rp${totalCogs.toLocaleString('id-ID')}`);
      }
    }
    
    // 6. Check materialized view (if exists)
    console.log('\n6. 🔍 Checking Materialized View...');
    try {
      const { data: mvData, error: mvError } = await window.supabase
        .from('pemakaian_bahan_daily_mv')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', testDate);
        
      if (mvError) {
        console.log('⚠️ Materialized view not available or error:', mvError.message);
      } else {
        console.log(`📊 Materialized view data for ${testDate}:`, mvData);
      }
    } catch (mvErr) {
      console.log('⚠️ Materialized view not accessible');
    }
    
    // 7. Check operational costs
    console.log('\n7. 🔍 Checking Operational Costs...');
    const { data: opCosts, error: opError } = await window.supabase
      .from('operational_costs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'aktif');
      
    if (opError) {
      console.error('❌ Error fetching operational costs:', opError);
    } else {
      const totalOpEx = (opCosts || []).reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
      console.log(`📊 Active operational costs: ${opCosts?.length || 0} items`);
      console.log(`💰 Total monthly OpEx: Rp${totalOpEx.toLocaleString('id-ID')}`);
      console.log(`💰 Daily OpEx (approx): Rp${Math.round(totalOpEx / 30).toLocaleString('id-ID')}`);
    }
    
    // 8. Summary and recommendations
    console.log('\n8. 📋 Summary & Recommendations...');
    
    const hasTransactions = transactions && transactions.length > 0;
    const hasIncome = income && income.length > 0;
    const hasCogs = pemakaian && pemakaian.length > 0;
    const hasOpCosts = opCosts && opCosts.length > 0;
    
    console.log('Data availability check:');
    console.log(`   Financial Transactions: ${hasTransactions ? '✅' : '❌'}`);
    console.log(`   Income Transactions: ${hasIncome ? '✅' : '❌'}`);
    console.log(`   COGS Data: ${hasCogs ? '✅' : '❌'}`);
    console.log(`   Operational Costs: ${hasOpCosts ? '✅' : '❌'}`);
    
    if (hasTransactions && !hasIncome) {
      console.log('\n⚠️ ISSUE: Transactions exist but no income found');
      console.log('   • Check if transactions are marked as "income" type');
      console.log('   • Profit analysis only shows income transactions as revenue');
    }
    
    if (hasIncome && totalIncome === 0) {
      console.log('\n⚠️ ISSUE: Income transactions exist but total is 0');
      console.log('   • Check if amount values are properly set');
    }
    
    if (hasIncome && totalIncome > 0) {
      console.log('\n✅ GOOD: Income data looks correct');
      console.log('   • If profit analysis still shows no data, check:');
      console.log('     - Date picker format consistency');
      console.log('     - Browser timezone vs database timezone');
      console.log('     - Profit analysis date normalization');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
  
  console.log('\n=====================================');
  console.log('🔍 DEBUG COMPLETE');
  console.log('=====================================');
}

// Auto-run if possible, otherwise provide instruction
console.log('🛠️ Profit Analysis Debug Tool Loaded');
console.log('Usage: debugProfitAnalysisData()');
console.log('');
console.log('Run this on the profit analysis page to debug data issues.');

// Make function globally available
window.debugProfitAnalysisData = debugProfitAnalysisData;
