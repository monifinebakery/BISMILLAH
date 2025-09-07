// Quick Data Check - Jalankan di console untuk cek data cepat
// Usage: quickDataCheck('2024-09-01') // sesuaikan tanggal

async function quickDataCheck(dateString = '2024-09-01') {
  console.log(`🔍 Quick check for date: ${dateString}`);
  
  if (!window.supabase) {
    console.log('❌ Supabase not available');
    return;
  }
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.log('❌ Not authenticated');
      return;
    }
    
    // 1. Check transactions di laporan keuangan
    console.log('\n📊 LAPORAN KEUANGAN:');
    const { data: allTrx } = await window.supabase
      .from('financial_transactions')
      .select('type, amount, description, date')
      .eq('user_id', user.id)
      .eq('date', dateString);
      
    if (allTrx && allTrx.length > 0) {
      console.log(`✅ Found ${allTrx.length} transactions:`);
      allTrx.forEach(t => {
        console.log(`   ${t.type}: Rp${Number(t.amount).toLocaleString('id-ID')} - ${t.description}`);
      });
      
      const income = allTrx.filter(t => t.type === 'income');
      const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
      console.log(`💰 Total Income: Rp${totalIncome.toLocaleString('id-ID')}`);
    } else {
      console.log('❌ No transactions found');
    }
    
    // 2. Test query yang sama seperti profit analysis
    console.log('\n📈 PROFIT ANALYSIS QUERY:');
    
    // Test dengan format yang sama seperti di profitAnalysisApi
    const { data: profitTrx } = await window.supabase
      .from('financial_transactions')
      .select('id, type, amount, date, description')
      .eq('user_id', user.id)
      .gte('date', dateString)  // >= start date
      .lte('date', dateString)  // <= end date
      .order('date', { ascending: true });
      
    if (profitTrx && profitTrx.length > 0) {
      console.log(`✅ Profit analysis sees ${profitTrx.length} transactions:`);
      const profitIncome = profitTrx.filter(t => t.type === 'income');
      const profitTotalIncome = profitIncome.reduce((sum, t) => sum + Number(t.amount), 0);
      console.log(`💰 Profit Income: Rp${profitTotalIncome.toLocaleString('id-ID')}`);
      
      // Show the exact same data
      if (profitIncome.length > 0) {
        console.log('Income details:');
        profitIncome.forEach(t => {
          console.log(`   ID: ${t.id}, Amount: ${t.amount}, Date: ${t.date}`);
        });
      }
    } else {
      console.log('❌ Profit analysis sees no transactions');
    }
    
    // 3. Cek masalah umum
    console.log('\n🔍 DIAGNOSIS:');
    
    if (allTrx && allTrx.length > 0 && (!profitTrx || profitTrx.length === 0)) {
      console.log('❌ PROBLEM: Laporan keuangan ada data, tapi profit analysis tidak');
      console.log('   Possible causes:');
      console.log('   • Date format issue in profit analysis query');
      console.log('   • Different user_id being used');
      console.log('   • Query filter problem');
    } else if (allTrx && profitTrx && allTrx.length === profitTrx.length) {
      console.log('✅ GOOD: Both queries return same count');
      
      const allIncome = allTrx.filter(t => t.type === 'income');
      const profitIncomeCount = profitTrx.filter(t => t.type === 'income').length;
      
      if (allIncome.length !== profitIncomeCount) {
        console.log('❌ PROBLEM: Different income transaction counts');
      } else if (allIncome.length === 0) {
        console.log('⚠️ INFO: No income transactions found (only expenses)');
        console.log('   Profit analysis only shows revenue from income transactions');
      } else {
        console.log('✅ PERFECT: Income data matches');
      }
    }
    
    // 4. Test format tanggal yang berbeda
    console.log('\n📅 DATE FORMAT TEST:');
    const formats = [
      dateString,
      dateString + 'T00:00:00',
      dateString + 'T00:00:00Z',
      new Date(dateString).toISOString().split('T')[0]
    ];
    
    for (const format of formats) {
      const { data: testData } = await window.supabase
        .from('financial_transactions')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', format);
        
      console.log(`   "${format}": ${testData?.[0]?.count || 0} records`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Make it available globally
window.quickDataCheck = quickDataCheck;

console.log('🛠️ Quick Data Check loaded!');
console.log('Usage: quickDataCheck("2024-09-01")  // change date as needed');
