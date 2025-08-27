// Debug Script untuk Purchase Delete Issue
// Run di browser console pada halaman /pembelian

console.log('🔍 Starting Purchase Delete Debug Investigation');

// Step 1: Setup monitoring untuk delete operations
const setupDeleteMonitoring = () => {
  console.log('\n=== 1. Setting Up Delete Operation Monitoring ===');
  
  // Override fetch untuk monitor API calls
  const originalFetch = window.fetch;
  const deleteOperations = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Monitor DELETE requests dan purchase-related calls
    if (typeof url === 'string' && (
      url.includes('purchase') || 
      options.method === 'DELETE' ||
      (options.body && options.body.includes('delete'))
    )) {
      const operation = {
        url,
        method: options.method || 'GET',
        timestamp: new Date(),
        body: options.body,
        headers: options.headers
      };
      
      console.log(`🌐 DELETE API Call: ${operation.method} ${url}`);
      deleteOperations.push(operation);
      
      // Monitor response
      return originalFetch.apply(this, args)
        .then(response => {
          console.log(`📊 DELETE Response: ${response.status} ${response.statusText}`);
          operation.response = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          };
          return response;
        })
        .catch(error => {
          console.error(`❌ DELETE Error:`, error);
          operation.error = error;
          throw error;
        });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Store references
  window.deleteDebug = {
    operations: deleteOperations,
    restore: () => {
      window.fetch = originalFetch;
      delete window.deleteDebug;
    }
  };
  
  console.log('📡 Delete operation monitoring active');
};

// Step 2: Monitor console logs for delete-related messages
const monitorDeleteLogs = () => {
  console.log('\n=== 2. Setting Up Console Log Monitoring ===');
  
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const deleteLogs = [];
  
  const logWrapper = (originalFn, type) => {
    return function(...args) {
      const message = args.join(' ');
      if (message.includes('delete') || message.includes('Delete') || 
          message.includes('DELETE') || message.includes('🗑️') || 
          message.includes('hapus') || message.includes('Hapus')) {
        deleteLogs.push({
          type,
          message,
          timestamp: new Date(),
          args: args
        });
      }
      originalFn.apply(console, args);
    };
  };
  
  console.log = logWrapper(originalLog, 'log');
  console.error = logWrapper(originalError, 'error');
  console.warn = logWrapper(originalWarn, 'warn');
  
  // Store references
  window.deleteLogMonitor = {
    logs: deleteLogs,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      delete window.deleteLogMonitor;
    }
  };
  
  console.log('📝 Console log monitoring for deletes active');
};

// Step 3: Check current purchase data
const checkCurrentPurchases = () => {
  console.log('\n=== 3. Checking Current Purchase Data ===');
  
  // Try to find purchase data in DOM
  const purchaseRows = document.querySelectorAll('tbody tr, [data-purchase-id]');
  console.log(`📊 Found ${purchaseRows.length} purchase rows in DOM`);
  
  // Try to extract purchase IDs from DOM
  const purchaseIds = [];
  purchaseRows.forEach((row, index) => {
    const id = row.getAttribute('data-purchase-id') || 
              row.id || 
              row.querySelector('[data-id]')?.getAttribute('data-id');
    
    if (id) {
      purchaseIds.push(id);
      console.log(`🔍 Purchase ${index + 1}: ID = ${id}`);
    }
  });
  
  if (purchaseIds.length === 0) {
    console.log('⚠️ No purchase IDs found in DOM - may need to inspect manually');
  }
  
  return purchaseIds;
};

// Step 4: Test delete functionality
const testDeleteFunctionality = () => {
  console.log('\n=== 4. Delete Functionality Test ===');
  
  console.log('🎯 Manual Test Steps:');
  console.log('1. Select a purchase to delete');
  console.log('2. Click delete button (🗑️)');
  console.log('3. Confirm deletion in modal');
  console.log('4. Watch console logs and network calls');
  console.log('5. Check if purchase disappears from UI');
  console.log('6. Verify in Supabase dashboard');
  
  console.log('\n🔍 Expected Behavior:');
  console.log('✅ DELETE API call to purchase endpoint');
  console.log('✅ Console log: "Purchase deleted successfully"');
  console.log('✅ Toast notification: "Pembelian berhasil dihapus"');
  console.log('✅ Purchase removed from UI table');
  console.log('✅ Purchase deleted from Supabase database');
  
  console.log('\n❌ Problem Indicators:');
  console.log('- UI shows success but no DELETE API call');
  console.log('- API call returns error but UI shows success');
  console.log('- Purchase disappears from UI but still in database');
  console.log('- Console errors related to mutation or optimistic updates');
};

// Step 5: Check Supabase connection
const checkSupabaseConnection = async () => {
  console.log('\n=== 5. Checking Supabase Connection ===');
  
  try {
    // Try to access Supabase client if available
    if (window.supabase || window.__SUPABASE_CLIENT__) {
      const client = window.supabase || window.__SUPABASE_CLIENT__;
      console.log('📡 Supabase client found');
      
      // Test basic query
      try {
        const { data, error } = await client.from('purchases').select('id').limit(1);
        if (error) {
          console.error('❌ Supabase query error:', error);
        } else {
          console.log('✅ Supabase connection working, sample data:', data);
        }
      } catch (queryError) {
        console.error('❌ Error testing Supabase query:', queryError);
      }
    } else {
      console.log('⚠️ Supabase client not found in global scope');
    }
  } catch (error) {
    console.error('❌ Error checking Supabase connection:', error);
  }
};

// Step 6: Analyze delete results
const analyzeDeleteResults = () => {
  setTimeout(() => {
    console.log('\n=== 6. Analyzing Delete Results ===');
    
    const { operations } = window.deleteDebug || { operations: [] };
    const { logs } = window.deleteLogMonitor || { logs: [] };
    
    console.log(`📊 DELETE API calls captured: ${operations.length}`);
    operations.forEach((op, index) => {
      console.log(`  ${index + 1}. ${op.method} ${op.url}`);
      if (op.response) {
        console.log(`     Response: ${op.response.status} ${op.response.statusText}`);
      }
      if (op.error) {
        console.log(`     Error:`, op.error);
      }
    });
    
    console.log(`📝 Delete-related logs: ${logs.length}`);
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type.toUpperCase()}] ${log.message}`);
    });
    
    // Analysis
    const hasDeleteAPI = operations.some(op => 
      op.method === 'DELETE' || op.url.includes('delete')
    );
    
    const hasSuccessLogs = logs.some(log => 
      log.message.includes('berhasil') || log.message.includes('success')
    );
    
    const hasErrorLogs = logs.some(log => 
      log.type === 'error' && log.message.includes('delete')
    );
    
    console.log('\n📈 ANALYSIS RESULTS:');
    console.log(`🌐 DELETE API calls made: ${hasDeleteAPI ? 'YES' : 'NO'}`);
    console.log(`✅ Success logs found: ${hasSuccessLogs ? 'YES' : 'NO'}`);
    console.log(`❌ Error logs found: ${hasErrorLogs ? 'YES' : 'NO'}`);
    
    if (!hasDeleteAPI && hasSuccessLogs) {
      console.log('\n🚨 POTENTIAL ISSUE DETECTED:');
      console.log('UI shows success but no DELETE API calls were made.');
      console.log('This suggests optimistic updates without actual database deletion.');
      console.log('💡 Check: Mutation function, API service, or network connectivity');
    } else if (hasDeleteAPI && !hasSuccessLogs) {
      console.log('\n🚨 POTENTIAL ISSUE DETECTED:');
      console.log('DELETE API calls made but no success logs.');
      console.log('This suggests API calls are failing silently.');
      console.log('💡 Check: API responses, error handling, Supabase permissions');
    } else if (hasDeleteAPI && hasSuccessLogs) {
      console.log('\n✅ DELETE OPERATIONS APPEAR NORMAL:');
      console.log('Both API calls and success logs detected.');
      console.log('💡 Issue might be: Supabase RLS policies, user permissions, or data constraints');
    }
    
    // Cleanup
    if (window.deleteDebug && window.deleteDebug.restore) {
      window.deleteDebug.restore();
    }
    if (window.deleteLogMonitor && window.deleteLogMonitor.restore) {
      window.deleteLogMonitor.restore();
    }
    
  }, 3000); // Wait 3 seconds for operations to complete
};

// Main debug function
const runDeleteDebug = async () => {
  setupDeleteMonitoring();
  monitorDeleteLogs();
  const purchaseIds = checkCurrentPurchases();
  testDeleteFunctionality();
  await checkSupabaseConnection();
  analyzeDeleteResults();
  
  console.log('\n🧪 Debug setup complete!');
  console.log('📝 Now try to delete a purchase and watch the results.');
  console.log('⏱️ Analysis will be shown automatically after 3 seconds.');
  
  return { purchaseIds };
};

// Auto-run
runDeleteDebug();

// Export for manual testing
window.purchaseDeleteDebug = {
  setupDeleteMonitoring,
  monitorDeleteLogs,
  checkCurrentPurchases,
  testDeleteFunctionality,
  checkSupabaseConnection,
  analyzeDeleteResults,
  runDeleteDebug
};

console.log('\n💡 Debug functions available in window.purchaseDeleteDebug');
