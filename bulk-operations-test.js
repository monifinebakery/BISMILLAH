// Browser Test Script - Bulk Operations Financial Sync Verification
// Run this in browser console on /pembelian page

console.log('🧪 Starting Bulk Operations Financial Sync Test');

// Step 1: Check if required functions are available
const testFunctionAvailability = () => {
  console.log('\n=== STEP 1: Function Availability Check ===');
  
  // Check React DevTools
  if (typeof React === 'undefined') {
    console.log('⚠️ React not available in global scope - this is normal in production');
  }
  
  // Check if we can find purchase context in React DevTools
  const purchaseContext = document.querySelector('[data-testid="purchase-table"]') || 
                         document.querySelector('.purchase-table') ||
                         document.querySelector('[class*="purchase"]');
                         
  if (purchaseContext) {
    console.log('✅ Purchase table element found');
  } else {
    console.log('❌ Purchase table element not found');
  }
};

// Step 2: Monitor console logs during bulk operations
const monitorConsoleLogs = () => {
  console.log('\n=== STEP 2: Console Log Monitoring ===');
  console.log('🔍 Monitoring for bulk operation logs...');
  console.log('📋 Look for these log patterns during bulk status change:');
  console.log('   - "📊 [BULK DEBUG] Using setStatus for purchase [ID]"');
  console.log('   - "💰 Adding financial transaction"');
  console.log('   - "💰 Creating financial transaction for completed purchase"');
  
  // Override console methods to capture bulk operation logs
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  const bulkOperationLogs = [];
  const financialSyncLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('[BULK DEBUG]') || message.includes('setStatus')) {
      bulkOperationLogs.push({ type: 'log', message, timestamp: new Date() });
    }
    if (message.includes('financial transaction') || message.includes('💰')) {
      financialSyncLogs.push({ type: 'log', message, timestamp: new Date() });
    }
    originalLog.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('[BULK DEBUG]') || message.includes('setStatus')) {
      bulkOperationLogs.push({ type: 'warn', message, timestamp: new Date() });
    }
    if (message.includes('financial transaction') || message.includes('💰')) {
      financialSyncLogs.push({ type: 'warn', message, timestamp: new Date() });
    }
    originalWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('[BULK DEBUG]') || message.includes('setStatus')) {
      bulkOperationLogs.push({ type: 'error', message, timestamp: new Date() });
    }
    if (message.includes('financial transaction') || message.includes('💰')) {
      financialSyncLogs.push({ type: 'error', message, timestamp: new Date() });
    }
    originalError.apply(console, args);
  };
  
  // Store references for later restoration
  window.testLogCapture = {
    bulkOperationLogs,
    financialSyncLogs,
    restore: () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  };
};

// Step 3: Check purchase data
const checkPurchaseData = async () => {
  console.log('\n=== STEP 3: Purchase Data Check ===');
  
  try {
    // Try to find purchase rows in DOM
    const purchaseRows = document.querySelectorAll('[data-testid="purchase-row"]') ||
                        document.querySelectorAll('tr[data-purchase-id]') ||
                        document.querySelectorAll('tbody tr');
    
    console.log(`📊 Found ${purchaseRows.length} purchase rows in DOM`);
    
    // Check for purchases with non-completed status
    let nonCompletedCount = 0;
    purchaseRows.forEach((row, index) => {
      const statusCell = row.querySelector('[data-testid="status"]') || 
                        row.querySelector('.status') ||
                        row.querySelector('td:nth-child(6)'); // Assuming status is 6th column
      
      if (statusCell && !statusCell.textContent.includes('Selesai')) {
        nonCompletedCount++;
      }
    });
    
    console.log(`📝 Found ${nonCompletedCount} purchases that can be changed to 'completed'`);
    
    if (nonCompletedCount === 0) {
      console.log('⚠️ No purchases available for status change test');
      console.log('💡 Create some purchases with "pending" or "confirmed" status first');
    }
    
  } catch (error) {
    console.error('❌ Error checking purchase data:', error);
  }
};

// Step 4: Simulate bulk operation (if possible)
const simulateBulkOperation = () => {
  console.log('\n=== STEP 4: Bulk Operation Simulation ===');
  console.log('📝 Manual Steps:');
  console.log('1. Select 2-3 purchases with non-completed status');
  console.log('2. Click "Edit Terpilih" or bulk edit button');
  console.log('3. Change status to "Selesai" (completed)');
  console.log('4. Submit the changes');
  console.log('5. Watch console for debug logs');
  console.log('6. Check financial reports for new transactions');
  console.log('\n🔍 Expected console logs:');
  console.log('   📊 [BULK DEBUG] Using setStatus for purchase [ID] with status: completed');
  console.log('   💰 Creating financial transaction for completed purchase');
  console.log('   ✅ Purchase status updated successfully');
};

// Step 5: Check results
const checkResults = () => {
  setTimeout(() => {
    console.log('\n=== STEP 5: Results Check ===');
    
    const { bulkOperationLogs, financialSyncLogs } = window.testLogCapture || { bulkOperationLogs: [], financialSyncLogs: [] };
    
    console.log(`📊 Bulk operation logs captured: ${bulkOperationLogs.length}`);
    bulkOperationLogs.forEach(log => {
      console.log(`  ${log.type.toUpperCase()}: ${log.message}`);
    });
    
    console.log(`💰 Financial sync logs captured: ${financialSyncLogs.length}`);
    financialSyncLogs.forEach(log => {
      console.log(`  ${log.type.toUpperCase()}: ${log.message}`);
    });
    
    // Analysis
    const usesSetStatus = bulkOperationLogs.some(log => 
      log.message.includes('Using setStatus') || log.message.includes('setStatus for purchase')
    );
    
    const createsFinancialTransaction = financialSyncLogs.some(log =>
      log.message.includes('Creating financial transaction') || log.message.includes('Adding financial transaction')
    );
    
    console.log('\n📈 ANALYSIS:');
    console.log(`✅ Uses setStatus in bulk operations: ${usesSetStatus ? 'YES' : 'NO'}`);
    console.log(`💰 Creates financial transactions: ${createsFinancialTransaction ? 'YES' : 'NO'}`);
    
    if (usesSetStatus && createsFinancialTransaction) {
      console.log('🎉 SUCCESS: Bulk operations are using setStatus and creating financial transactions!');
    } else if (usesSetStatus && !createsFinancialTransaction) {
      console.log('⚠️ PARTIAL: Bulk operations use setStatus but no financial transactions detected');
      console.log('💡 Check if purchases were already completed or if financial context is available');
    } else if (!usesSetStatus) {
      console.log('❌ ISSUE: Bulk operations are not using setStatus');
      console.log('💡 This means financial sync will not work in bulk operations');
    }
    
    // Restore original console methods
    if (window.testLogCapture && window.testLogCapture.restore) {
      window.testLogCapture.restore();
      delete window.testLogCapture;
    }
  }, 2000);
};

// Run all tests
const runAllTests = async () => {
  testFunctionAvailability();
  monitorConsoleLogs();
  await checkPurchaseData();
  simulateBulkOperation();
  checkResults();
  
  console.log('\n🧪 Test setup complete!');
  console.log('📝 Now perform the manual bulk status change and watch the results.');
};

// Auto-run
runAllTests();

// Export for manual testing
window.bulkOperationsTest = {
  testFunctionAvailability,
  monitorConsoleLogs,
  checkPurchaseData,
  simulateBulkOperation,
  checkResults,
  runAllTests
};

console.log('\n💡 Test functions available in window.bulkOperationsTest');
