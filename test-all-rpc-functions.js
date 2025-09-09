// Test All RPC Functions - Comprehensive audit
// Paste script ini di browser console untuk test semua RPC functions

console.log('🔍 Testing All RPC Functions...');

async function testAllRPCFunctions() {
  const results = {
    success: [],
    failed: [],
    user: null
  };

  try {
    // Get current user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      console.error('❌ User authentication failed:', userError);
      return results;
    }
    
    results.user = user.user.id;
    console.log('✅ User authenticated:', user.user.id);

    // List of RPC functions to test
    const rpcFunctions = [
      // Order Management
      {
        name: 'create_new_order',
        params: { order_data: { user_id: user.user.id, nama_pelanggan: 'Test', items: '[]' } },
        description: 'Order creation function',
        category: 'Order Management'
      },
      {
        name: 'can_complete_order',
        params: { order_id: '00000000-0000-0000-0000-000000000000' }, // Dummy UUID
        description: 'Check if order can be completed',
        category: 'Order Management',
        expectError: true // This will likely fail with dummy ID, but function should exist
      },
      {
        name: 'complete_order_and_deduct_stock',
        params: { order_id: '00000000-0000-0000-0000-000000000000' },
        description: 'Complete order with stock deduction',
        category: 'Order Management',
        expectError: true
      },
      {
        name: 'reverse_order_completion',
        params: { order_id: '00000000-0000-0000-0000-000000000000' },
        description: 'Reverse order completion',
        category: 'Order Management',
        expectError: true
      },
      {
        name: 'get_order_statistics',
        params: { user_id: user.user.id },
        description: 'Get order statistics',
        category: 'Order Management'
      },

      // Financial Management
      {
        name: 'refresh_dashboard_views',
        params: {},
        description: 'Refresh materialized views',
        category: 'Financial Management'
      },

      // Profit Analysis
      {
        name: 'calculate_realtime_profit',
        params: { p_user_id: user.user.id, p_period: '2024-09' },
        description: 'Calculate real-time profit analysis',
        category: 'Profit Analysis'
      },

      // Operational Costs
      {
        name: 'get_total_costs',
        params: { p_user_id: user.user.id },
        description: 'Get total operational costs',
        category: 'Operational Costs'
      },
      {
        name: 'calculate_overhead',
        params: { p_material_cost: 1000, p_user_id: user.user.id },
        description: 'Calculate overhead allocation',
        category: 'Operational Costs'
      }
    ];

    // Test each function
    for (const func of rpcFunctions) {
      console.log(`\n🧪 Testing ${func.name} (${func.category})...`);
      
      try {
        const { data, error } = await supabase.rpc(func.name, func.params);
        
        if (error) {
          // Check if it's just a data error vs function not existing
          if (error.code === '42883' || error.message?.includes('function') && error.message?.includes('does not exist')) {
            results.failed.push({
              ...func,
              error: 'Function does not exist',
              errorCode: error.code,
              errorMessage: error.message
            });
            console.error(`❌ ${func.name}: Function does not exist`);
          } else if (func.expectError) {
            // Expected error due to dummy data
            results.success.push({
              ...func,
              note: 'Function exists but failed with expected dummy data error',
              error: error.message
            });
            console.log(`⚠️ ${func.name}: Function exists (expected error with dummy data)`);
          } else {
            results.failed.push({
              ...func,
              error: error.message,
              errorCode: error.code
            });
            console.error(`❌ ${func.name}: ${error.message}`);
          }
        } else {
          results.success.push({
            ...func,
            result: data
          });
          console.log(`✅ ${func.name}: Success`);
        }
      } catch (err) {
        results.failed.push({
          ...func,
          error: err.message || 'Unknown error'
        });
        console.error(`❌ ${func.name}: ${err.message}`);
      }
    }

    // Summary
    console.log('\n📊 RPC Functions Test Summary:');
    console.log(`✅ Working: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n🚨 Missing/Failed RPC Functions:');
      results.failed.forEach(f => {
        console.log(`- ${f.name} (${f.category}): ${f.error}`);
      });
    }

    console.log('\n🎯 Full Results:', results);
    return results;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return results;
  }
}

// Run the comprehensive test
testAllRPCFunctions();
