// Profit Analysis System Diagnostic Script
// Run this in browser console on the profit analysis page to check system health

async function diagnoseProfitAnalysisSystem() {
  console.log('🔍 PROFIT ANALYSIS SYSTEM DIAGNOSTIC');
  console.log('=====================================');
  
  const results = {
    navigation: false,
    authentication: false,
    dataAccess: false,
    apiHealth: false,
    componentState: false,
    calculations: false,
    overall: 'UNKNOWN'
  };

  try {
    // 1. Check Navigation
    console.log('\n1. 🧭 Checking Navigation...');
    const currentPath = window.location.pathname;
    const isOnProfitPage = currentPath.includes('analisis-profit');
    results.navigation = isOnProfitPage;
    console.log(`   Current path: ${currentPath}`);
    console.log(`   On profit page: ${isOnProfitPage ? '✅' : '❌'}`);

    // 2. Check Authentication
    console.log('\n2. 🔐 Checking Authentication...');
    const supabaseAuth = window.supabase?.auth;
    let user = null;
    if (supabaseAuth) {
      const { data: { user: authUser } } = await supabaseAuth.getUser();
      user = authUser;
      results.authentication = !!user;
      console.log(`   User authenticated: ${user ? '✅' : '❌'}`);
      console.log(`   User ID: ${user?.id || 'None'}`);
    } else {
      console.log('   Supabase not available: ❌');
    }

    // 3. Check Data Access
    console.log('\n3. 📊 Checking Data Access...');
    if (user && window.supabase) {
      try {
        // Check financial transactions
        const { data: transactions, error: transError } = await window.supabase
          .from('financial_transactions')
          .select('count')
          .eq('user_id', user.id);
        
        // Check materials
        const { data: materials, error: materialError } = await window.supabase
          .from('bahan_baku')
          .select('count')
          .eq('user_id', user.id);
        
        // Check operational costs
        const { data: costs, error: costError } = await window.supabase
          .from('operational_costs')
          .select('count')
          .eq('user_id', user.id);

        const hasTransactions = !transError && transactions?.[0]?.count > 0;
        const hasMaterials = !materialError && materials?.[0]?.count > 0;
        const hasCosts = !costError && costs?.[0]?.count > 0;

        results.dataAccess = hasTransactions && hasMaterials && hasCosts;

        console.log(`   Financial transactions: ${hasTransactions ? '✅' : '❌'} (${transactions?.[0]?.count || 0})`);
        console.log(`   Materials/ingredients: ${hasMaterials ? '✅' : '❌'} (${materials?.[0]?.count || 0})`);
        console.log(`   Operational costs: ${hasCosts ? '✅' : '❌'} (${costs?.[0]?.count || 0})`);

        if (transError) console.log(`   Transaction error: ${transError.message}`);
        if (materialError) console.log(`   Material error: ${materialError.message}`);
        if (costError) console.log(`   Cost error: ${costError.message}`);

      } catch (dataError) {
        console.log(`   Data access error: ❌ ${dataError.message}`);
      }
    }

    // 4. Check API Health
    console.log('\n4. 🌐 Checking API Health...');
    if (user && window.supabase) {
      try {
        // Test stored function
        const { data: profitData, error: profitError } = await window.supabase
          .rpc('calculate_realtime_profit', {
            p_user_id: user.id,
            p_period: '2024-08'
          });

        results.apiHealth = !profitError;
        console.log(`   Stored function call: ${!profitError ? '✅' : '❌'}`);
        if (profitError) {
          console.log(`   API error: ${profitError.message}`);
        } else {
          console.log(`   Revenue: Rp ${profitData?.revenue_data?.total?.toLocaleString('id-ID') || 0}`);
          console.log(`   COGS: Rp ${profitData?.cogs_data?.total?.toLocaleString('id-ID') || 0}`);
          console.log(`   OpEx: Rp ${profitData?.opex_data?.total?.toLocaleString('id-ID') || 0}`);
        }
      } catch (apiError) {
        console.log(`   API health check failed: ❌ ${apiError.message}`);
      }
    }

    // 5. Check Component State
    console.log('\n5. ⚛️ Checking React Component State...');
    try {
      // Try to find React components in the page
      const profitComponents = document.querySelectorAll('[data-testid*="profit"], [class*="profit"], [class*="Profit"]');
      const hasComponents = profitComponents.length > 0;
      results.componentState = hasComponents;
      
      console.log(`   React components found: ${hasComponents ? '✅' : '❌'} (${profitComponents.length})`);
      
      // Check for error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      if (errorElements.length > 0) {
        console.log(`   Error elements found: ⚠️ (${errorElements.length})`);
        errorElements.forEach((el, i) => {
          if (el.textContent) {
            console.log(`     Error ${i + 1}: ${el.textContent.substring(0, 100)}...`);
          }
        });
      }

      // Check for loading states
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], [class*="skeleton"]');
      if (loadingElements.length > 0) {
        console.log(`   Loading elements: 🔄 (${loadingElements.length})`);
      }

    } catch (componentError) {
      console.log(`   Component check failed: ❌ ${componentError.message}`);
    }

    // 6. Test Calculations
    console.log('\n6. 🧮 Testing Calculations...');
    try {
      // Test basic calculation logic
      const testRevenue = 1000000;
      const testCOGS = 300000;
      const testOpEx = 200000;
      
      const grossProfit = testRevenue - testCOGS;
      const netProfit = grossProfit - testOpEx;
      const grossMargin = (grossProfit / testRevenue) * 100;
      const netMargin = (netProfit / testRevenue) * 100;

      const calculationsOk = grossProfit > 0 && netProfit > 0 && grossMargin > 0 && netMargin > 0;
      results.calculations = calculationsOk;

      console.log(`   Calculation logic: ${calculationsOk ? '✅' : '❌'}`);
      console.log(`   Test case: Revenue Rp1,000,000 - COGS Rp300,000 - OpEx Rp200,000`);
      console.log(`   Gross profit: Rp${grossProfit.toLocaleString('id-ID')} (${grossMargin.toFixed(1)}%)`);
      console.log(`   Net profit: Rp${netProfit.toLocaleString('id-ID')} (${netMargin.toFixed(1)}%)`);

    } catch (calcError) {
      console.log(`   Calculation test failed: ❌ ${calcError.message}`);
    }

    // 7. Overall Assessment
    console.log('\n7. 📋 Overall Assessment...');
    const successCount = Object.values(results).filter(v => v === true).length;
    const totalChecks = Object.keys(results).length - 1; // Exclude 'overall'
    
    if (successCount === totalChecks) {
      results.overall = 'EXCELLENT';
    } else if (successCount >= totalChecks * 0.8) {
      results.overall = 'GOOD';
    } else if (successCount >= totalChecks * 0.6) {
      results.overall = 'FAIR';
    } else {
      results.overall = 'POOR';
    }

    console.log(`   Success rate: ${successCount}/${totalChecks} (${((successCount/totalChecks)*100).toFixed(1)}%)`);
    console.log(`   Overall status: ${results.overall}`);

    // 8. Recommendations
    console.log('\n8. 💡 Recommendations...');
    
    if (!results.navigation) {
      console.log('   ❌ Navigate to /analisis-profit page');
    }
    
    if (!results.authentication) {
      console.log('   ❌ Please log in to the application');
    }
    
    if (!results.dataAccess) {
      console.log('   ❌ Add sample data:');
      console.log('     • Go to Financial Reports → Add income transaction');
      console.log('     • Go to Warehouse → Add materials with costs');
      console.log('     • Go to Operational Costs → Add monthly expenses');
    }
    
    if (!results.apiHealth) {
      console.log('   ❌ Check database connection and stored functions');
    }
    
    if (!results.componentState) {
      console.log('   ❌ Check React component rendering and console for errors');
    }
    
    if (!results.calculations) {
      console.log('   ❌ Verify calculation logic and data types');
    }

    if (results.overall === 'EXCELLENT') {
      console.log('   ✅ System is healthy! Profit analysis should be working correctly.');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    results.overall = 'ERROR';
  }

  console.log('\n=====================================');
  console.log('🔍 DIAGNOSTIC COMPLETE');
  console.log('=====================================');
  
  return results;
}

// Auto-run diagnostic
console.log('🚀 Running Profit Analysis System Diagnostic...');
console.log('Copy and paste this script in browser console to run diagnostic.');
console.log('Usage: diagnoseProfitAnalysisSystem().then(results => console.log("Results:", results))');

// Export for manual running
window.diagnoseProfitAnalysisSystem = diagnoseProfitAnalysisSystem;