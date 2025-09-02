// ==============================================
// DEBUG SCRIPT: Financial Reports vs Profit Analysis Data Comparison
// ==============================================
// Run this in browser console on the profit analysis page to diagnose data discrepancies

// HELPER FUNCTIONS
// ==============================================

async function debugFinancialVsProfitAnalysis() {
  console.log('🔍 Starting Financial Reports vs Profit Analysis Debug...');
  console.log('='.repeat(80));
  
  try {
    // Get Supabase client (try multiple ways)
    let supabaseClient;
    if (window.supabase) {
      supabaseClient = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabaseClient = window.__SUPABASE_CLIENT__;
    } else {
      // Try to find it in React dev tools or global scope
      const reactFiber = document.querySelector('#root')?._reactInternals || document.querySelector('#root')?._reactInternalFiber;
      if (reactFiber) {
        console.log('🔍 Trying to find Supabase through React context...');
      }
      throw new Error('Supabase client not found on window object. Make sure you\'re on the application page.');
    }
    
    console.log('✅ Supabase client found:', !!supabaseClient);
    
    // Get current user from Supabase
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // TARGET DATE for debugging (September 1, 2025 - kemarin)
    const targetDate = '2025-09-01';
    const startDate = '2025-09-01';
    const endDate = '2025-09-01';
    
    console.log(`🎯 Analyzing data for date: ${targetDate}`);
    console.log('-'.repeat(60));
    
    // 1. FETCH ALL FINANCIAL TRANSACTIONS (Financial Reports approach)
    console.log('📊 STEP 1: Fetching ALL financial transactions...');
    
    const { data: allTransactions, error: allTrxError } = await window.supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    if (allTrxError) {
      console.error('❌ Error fetching all transactions:', allTrxError);
      return;
    }
    
    console.log('📈 All Financial Transactions Summary:');
    console.log(`   Total transactions: ${allTransactions.length}`);
    console.log(`   Date range: ${allTransactions[0]?.date} to ${allTransactions[allTransactions.length - 1]?.date}`);
    
    // Filter transactions for target date (Financial Reports style)
    const targetDateTransactions = allTransactions.filter(t => {
      if (!t.date) return false;
      const transactionDate = typeof t.date === 'string' ? t.date.split('T')[0] : t.date.toISOString().split('T')[0];
      return transactionDate === targetDate;
    });
    
    console.log(`📅 Transactions on ${targetDate}:`, targetDateTransactions.length);
    console.log('   Details:', targetDateTransactions.map(t => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description,
      date: t.date
    })));
    
    // 2. FETCH FINANCIAL TRANSACTIONS (Profit Analysis approach)
    console.log('\n📊 STEP 2: Fetching transactions with Profit Analysis filter...');
    
    const { data: profitTransactions, error: profitTrxError } = await window.supabase
      .from('financial_transactions')
      .select('id, user_id, type, category, amount, description, date')
      .eq('user_id', user.id)
      .gte('date', startDate)  // >= start date (inclusive)
      .lte('date', endDate)    // <= end date (inclusive)
      .order('date', { ascending: true });
    
    if (profitTrxError) {
      console.error('❌ Error fetching profit analysis transactions:', profitTrxError);
      return;
    }
    
    console.log('📈 Profit Analysis Query Results:');
    console.log(`   Total transactions: ${profitTransactions.length}`);
    console.log('   Details:', profitTransactions.map(t => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description,
      date: t.date
    })));
    
    // 3. INCOME TRANSACTIONS COMPARISON
    console.log('\n💰 STEP 3: Income transactions comparison...');
    
    const targetDateIncome = targetDateTransactions.filter(t => t.type === 'income');
    const profitIncome = profitTransactions.filter(t => t.type === 'income');
    
    console.log('💸 Financial Reports Income:');
    console.log(`   Count: ${targetDateIncome.length}`);
    console.log(`   Total: Rp ${targetDateIncome.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}`);
    console.log('   Details:', targetDateIncome);
    
    console.log('📈 Profit Analysis Income:');
    console.log(`   Count: ${profitIncome.length}`);
    console.log(`   Total: Rp ${profitIncome.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}`);
    console.log('   Details:', profitIncome);
    
    // 4. DATE FORMAT ANALYSIS
    console.log('\n📅 STEP 4: Date format analysis...');
    
    if (allTransactions.length > 0) {
      const sampleTransaction = allTransactions[0];
      console.log('📋 Sample transaction date analysis:');
      console.log(`   Original date: ${sampleTransaction.date}`);
      console.log(`   Date type: ${typeof sampleTransaction.date}`);
      console.log(`   Date constructor: ${sampleTransaction.date?.constructor.name}`);
      
      if (sampleTransaction.date) {
        const dateObj = new Date(sampleTransaction.date);
        console.log(`   As Date object: ${dateObj}`);
        console.log(`   ISO string: ${dateObj.toISOString()}`);
        console.log(`   Date part: ${dateObj.toISOString().split('T')[0]}`);
        console.log(`   Local date string: ${dateObj.toLocaleDateString()}`);
      }
    }
    
    // 5. TRANSACTION TYPE VALIDATION
    console.log('\n🏷️ STEP 5: Transaction type validation...');
    
    const uniqueTypes = [...new Set(allTransactions.map(t => t.type))];
    console.log('📊 All transaction types in database:', uniqueTypes);
    
    const typeDistribution = allTransactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});
    console.log('📈 Transaction type distribution:', typeDistribution);
    
    // Check for case sensitivity issues
    const incomeVariants = allTransactions
      .map(t => t.type)
      .filter(type => type && type.toLowerCase().includes('income'))
      .reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
    console.log('💰 Income type variants:', incomeVariants);
    
    // 6. CATEGORY ANALYSIS
    console.log('\n🏷️ STEP 6: Category analysis...');
    
    const categoriesForTargetDate = targetDateTransactions.map(t => t.category);
    const uniqueCategories = [...new Set(categoriesForTargetDate)];
    console.log(`📊 Categories on ${targetDate}:`, uniqueCategories);
    
    // 7. TIMEZONE ANALYSIS
    console.log('\n🌍 STEP 7: Timezone analysis...');
    
    console.log('🕐 Current timezone info:');
    console.log(`   Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`   Timezone offset: ${new Date().getTimezoneOffset()} minutes`);
    console.log(`   Current date: ${new Date()}`);
    console.log(`   Current date ISO: ${new Date().toISOString()}`);
    console.log(`   Target date as Date: ${new Date(targetDate + 'T00:00:00')}`);
    console.log(`   Target date as Date ISO: ${new Date(targetDate + 'T00:00:00').toISOString()}`);
    
    // 8. PROFIT ANALYSIS API TEST
    console.log('\n🔧 STEP 8: Testing Profit Analysis API directly...');
    
    try {
      // Import and test the profit analysis daily calculation
      if (window.profitAnalysisApi && window.profitAnalysisApi.calculateProfitAnalysisDaily) {
        const fromDate = new Date(targetDate + 'T00:00:00');
        const toDate = new Date(targetDate + 'T23:59:59');
        
        console.log(`🔄 Calling calculateProfitAnalysisDaily(${fromDate.toISOString()}, ${toDate.toISOString()})...`);
        
        const profitResult = await window.profitAnalysisApi.calculateProfitAnalysisDaily(fromDate, toDate);
        
        console.log('📊 Profit Analysis API Result:');
        console.log('   Success:', profitResult.success);
        console.log('   Error:', profitResult.error);
        console.log('   Data length:', profitResult.data?.length || 0);
        
        if (profitResult.data && profitResult.data.length > 0) {
          const targetDayData = profitResult.data.find(d => d.period === targetDate);
          if (targetDayData) {
            console.log(`📅 Data for ${targetDate}:`, {
              revenue: targetDayData.revenue_data.total,
              cogs: targetDayData.cogs_data.total,
              opex: targetDayData.opex_data.total
            });
          } else {
            console.log(`❌ No data found for ${targetDate} in profit analysis results`);
            console.log('   Available periods:', profitResult.data.map(d => d.period));
          }
        }
      } else {
        console.log('⚠️ Profit Analysis API not available on window object');
      }
    } catch (apiError) {
      console.error('❌ Error testing Profit Analysis API:', apiError);
    }
    
    // 9. SUMMARY AND RECOMMENDATIONS
    console.log('\n📋 STEP 9: Summary and recommendations...');
    console.log('='.repeat(60));
    
    const hasFinancialData = targetDateTransactions.length > 0;
    const hasIncomeData = targetDateIncome.length > 0;
    const hasProfitQueryData = profitTransactions.length > 0;
    
    console.log('📊 SUMMARY:');
    console.log(`   Financial transactions on ${targetDate}: ${hasFinancialData ? '✅ YES' : '❌ NO'}`);
    console.log(`   Income transactions on ${targetDate}: ${hasIncomeData ? '✅ YES' : '❌ NO'}`);
    console.log(`   Profit analysis query results: ${hasProfitQueryData ? '✅ YES' : '❌ NO'}`);
    
    if (hasFinancialData && !hasProfitQueryData) {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      console.log('   Financial reports show data, but profit analysis query returns empty');
      console.log('   Possible causes:');
      console.log('   1. Date format mismatch between systems');
      console.log('   2. Timezone conversion issues');
      console.log('   3. Different filtering logic');
      console.log('   4. Database query parameters');
    }
    
    if (!hasIncomeData && hasFinancialData) {
      console.log('\n💡 POSSIBLE CAUSE:');
      console.log('   Transactions exist but none are of type "income"');
      console.log('   Check transaction types and ensure income transactions are properly categorized');
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    if (!hasIncomeData) {
      console.log('   1. Verify income transactions have type="income" exactly');
      console.log('   2. Check for case sensitivity in transaction types');
    }
    if (hasFinancialData && !hasProfitQueryData) {
      console.log('   3. Review date normalization in profit analysis API');
      console.log('   4. Check timezone handling in database queries');
      console.log('   5. Verify inclusive date range filtering');
    }
    
    console.log('\n✅ Debug analysis completed!');
    
    return {
      allTransactionsCount: allTransactions.length,
      targetDateTransactionsCount: targetDateTransactions.length,
      targetDateIncomeCount: targetDateIncome.length,
      profitQueryResultCount: profitTransactions.length,
      hasDataMismatch: hasFinancialData && !hasProfitQueryData,
      recommendations: hasFinancialData && !hasProfitQueryData ? 'Date/timezone issue detected' : 'Data consistent'
    };
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
    throw error;
  }
}

// Quick function to check specific date
async function checkSpecificDate(dateString) {
  console.log(`🔍 Quick check for date: ${dateString}`);
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    // Financial approach
    const { data: allTrx } = await window.supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id);
    
    const targetTrx = allTrx.filter(t => {
      if (!t.date) return false;
      const trxDate = typeof t.date === 'string' ? t.date.split('T')[0] : t.date.toISOString().split('T')[0];
      return trxDate === dateString;
    });
    
    // Profit analysis approach
    const { data: profitTrx } = await window.supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dateString)
      .lte('date', dateString);
    
    console.log(`📊 Results for ${dateString}:`);
    console.log(`   Financial approach: ${targetTrx.length} transactions`);
    console.log(`   Profit analysis approach: ${(profitTrx || []).length} transactions`);
    console.log(`   Income (financial): ${targetTrx.filter(t => t.type === 'income').length}`);
    console.log(`   Income (profit): ${(profitTrx || []).filter(t => t.type === 'income').length}`);
    
    if (targetTrx.length > 0) {
      console.log('   Sample transaction:', {
        date: targetTrx[0].date,
        type: targetTrx[0].type,
        amount: targetTrx[0].amount,
        category: targetTrx[0].category
      });
    }
    
  } catch (error) {
    console.error('❌ Quick check error:', error);
  }
}

// Check multiple dates to find pattern
async function checkRecentDates() {
  console.log('🔍 Checking recent dates for data consistency...');
  
  const datesToCheck = [
    '2025-09-01', // kemarin
    '2025-09-02', // hari ini  
    '2025-08-31', // beberapa hari lalu
    '2025-08-30',
    '2025-08-29'
  ];
  
  for (const date of datesToCheck) {
    console.log(`\n--- Checking ${date} ---`);
    await checkSpecificDate(date);
  }
}

// Check transaction types distribution
async function checkTransactionTypes() {
  console.log('🏷️ Analyzing transaction types...');
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    const { data: allTrx } = await window.supabase
      .from('financial_transactions')
      .select('type, date, amount')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50); // Last 50 transactions
    
    console.log('📊 Last 50 transactions:');
    console.log(`   Total: ${allTrx.length}`);
    
    const typeStats = allTrx.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Type distribution:', typeStats);
    
    // Check income specifically
    const incomeCount = allTrx.filter(t => t.type === 'income').length;
    const expenseCount = allTrx.filter(t => t.type === 'expense').length;
    
    console.log('💰 Income vs Expense:');
    console.log(`   Income: ${incomeCount}`);
    console.log(`   Expense: ${expenseCount}`);
    
    if (incomeCount === 0) {
      console.log('\n🚨 ISSUE FOUND: No income transactions in recent data!');
      console.log('   This explains why profit analysis shows no data.');
      console.log('   Check if income transactions are being saved with correct type.');
    }
    
  } catch (error) {
    console.error('❌ Error checking transaction types:', error);
  }
}

// Export functions to global scope for console use
window.debugFinancialVsProfitAnalysis = debugFinancialVsProfitAnalysis;
window.checkSpecificDate = checkSpecificDate;
window.checkRecentDates = checkRecentDates;
window.checkTransactionTypes = checkTransactionTypes;

console.log('🔧 Debug functions loaded!');
console.log('📋 Available functions:');
console.log('   • debugFinancialVsProfitAnalysis() - Full comparison for Sept 1, 2025');
console.log('   • checkSpecificDate("2025-09-01") - Quick check for specific date');
console.log('   • checkRecentDates() - Check multiple recent dates');
console.log('   • checkTransactionTypes() - Analyze transaction type distribution');
console.log('');
console.log('🚀 Quick start: checkTransactionTypes()');
console.log('');
console.log('📋 One-liner diagnostic (copy & paste):');
console.log('checkTransactionTypes().then(() => checkSpecificDate("2025-09-01"))');

// One-liner for immediate diagnosis
window.quickDiagnose = async () => {
  console.log('🔍 QUICK DIAGNOSIS STARTING...');
  await checkTransactionTypes();
  await checkSpecificDate('2025-09-01');
  console.log('\n✅ Quick diagnosis completed!');
};

console.log('🎯 Super quick: quickDiagnose()');
