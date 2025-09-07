// DEBUG: Revenue Inconsistency Between Profit Analysis & Financial Reports
// Copy dan paste ke browser console untuk debug masalah revenue

console.log('🔍 DEBUGGING REVENUE INCONSISTENCY...');
console.log('Expected: Rp 1.907.600 (Financial Reports)');
console.log('Actual: Rp 1.619.600 (Profit Analysis)');
console.log('Difference: Rp 288.000');

async function debugRevenueInconsistency() {
  try {
    // Get user
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    console.log('✅ User:', user.id);
    
    // Test date range: 1 Agt 2025 - 31 Agt 2025
    const startDate = '2025-08-01';
    const endDate = '2025-08-31';
    
    console.log('\n📅 Testing date range:', { startDate, endDate });
    
    // METHOD 1: Financial Reports approach (exact query)
    console.log('\n💰 METHOD 1: Financial Reports Query...');
    const { data: financialData } = await window.supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('type', 'income')
      .order('date', { ascending: false });
    
    const financialTotal = financialData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    console.log('📊 Financial Reports Results:');
    console.log(`   Total: Rp ${financialTotal.toLocaleString()}`);
    console.log(`   Count: ${financialData?.length || 0} transactions`);
    console.log('   Details:', financialData?.map(t => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      type: t.type
    })));
    
    // METHOD 2: Profit Analysis approach (with date normalization)
    console.log('\n📈 METHOD 2: Profit Analysis Query...');
    
    // Test various date formats that profit analysis might use
    const dateFormats = [
      { start: startDate, end: endDate, label: 'YYYY-MM-DD' },
      { start: startDate + 'T00:00:00', end: endDate + 'T23:59:59', label: 'ISO with time' },
      { start: startDate + 'T00:00:00.000Z', end: endDate + 'T23:59:59.999Z', label: 'ISO UTC' }
    ];
    
    for (const format of dateFormats) {
      console.log(`\n   Testing format: ${format.label}`);
      console.log(`   Range: ${format.start} to ${format.end}`);
      
      const { data: profitData } = await window.supabase
        .from('financial_transactions')
        .select('id, user_id, type, category, amount, description, date')
        .eq('user_id', user.id)
        .gte('date', format.start)
        .lte('date', format.end)
        .order('date', { ascending: true });
      
      const profitIncome = profitData?.filter(t => t.type === 'income') || [];
      const profitTotal = profitIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      console.log(`   Total: Rp ${profitTotal.toLocaleString()}`);
      console.log(`   Count: ${profitIncome.length} income transactions`);
      console.log(`   Match Financial: ${profitTotal === financialTotal ? '✅ YES' : '❌ NO'}`);
      
      if (profitTotal === 1619600) {
        console.log('   🎯 THIS IS THE FORMAT PROFIT ANALYSIS USES!');
        
        // Show difference details
        const missingAmount = financialTotal - profitTotal;
        console.log(`   Missing amount: Rp ${missingAmount.toLocaleString()}`);
        
        // Find missing transactions
        const profitIds = new Set(profitIncome.map(t => t.id));
        const missingTrx = financialData?.filter(t => !profitIds.has(t.id)) || [];
        
        console.log('   Missing transactions:', missingTrx.map(t => ({
          id: t.id,
          date: t.date,
          amount: t.amount,
          description: t.description
        })));
      }
    }
    
    // METHOD 3: Check for transaction type issues
    console.log('\n🏷️ METHOD 3: Transaction Type Analysis...');
    const { data: allTransactions } = await window.supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    const typeGroups = allTransactions?.reduce((groups, t) => {
      const type = t.type || 'null';
      if (!groups[type]) groups[type] = [];
      groups[type].push(t);
      return groups;
    }, {}) || {};
    
    console.log('📊 All transactions by type:');
    Object.entries(typeGroups).forEach(([type, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      console.log(`   ${type}: ${transactions.length} transactions, Rp ${total.toLocaleString()}`);
      
      if (type === 'income') {
        console.log('   Sample income:', transactions.slice(0, 3).map(t => ({
          date: t.date,
          amount: t.amount,
          description: t.description
        })));
      }
    });
    
    // METHOD 4: Date parsing test
    console.log('\n📅 METHOD 4: Date Parsing Test...');
    if (financialData && financialData.length > 0) {
      const sampleTrx = financialData[0];
      console.log('Sample transaction date analysis:');
      console.log(`   Raw date: ${sampleTrx.date}`);
      console.log(`   Type: ${typeof sampleTrx.date}`);
      
      if (sampleTrx.date) {
        const dateObj = new Date(sampleTrx.date);
        console.log(`   As Date: ${dateObj}`);
        console.log(`   ISO: ${dateObj.toISOString()}`);
        console.log(`   Date part: ${dateObj.toISOString().split('T')[0]}`);
        
        // Test if date falls within range
        const dateStr = dateObj.toISOString().split('T')[0];
        console.log(`   In range ${startDate} - ${endDate}: ${dateStr >= startDate && dateStr <= endDate}`);
      }
    }
    
    // SUMMARY
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    if (financialTotal === 1907600) {
      console.log('✅ Financial Reports query is correct: Rp 1.907.600');
    }
    
    if (financialTotal !== 1619600) {
      console.log('❌ Found the revenue inconsistency!');
      console.log('💡 RECOMMENDATIONS:');
      console.log('   1. Check date normalization in profit analysis');
      console.log('   2. Verify transaction filtering logic');
      console.log('   3. Check for timezone conversion issues');
      console.log('   4. Ensure both systems use same date range format');
    }
    
    return {
      financialTotal,
      expectedProfitTotal: 1619600,
      actualProfitTotal: financialTotal,
      difference: financialTotal - 1619600,
      isConsistent: financialTotal === 1619600
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugRevenueInconsistency();

// Export untuk akses mudah
window.debugRevenueInconsistency = debugRevenueInconsistency;
