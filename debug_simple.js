// ==============================================
// SIMPLE DEBUG SCRIPT: Find Supabase and check transaction data
// ==============================================

// Function to find Supabase client in various ways
function findSupabaseClient() {
  // Method 1: Direct window object
  if (window.supabase) return window.supabase;
  if (window.__SUPABASE_CLIENT__) return window.__SUPABASE_CLIENT__;
  
  // Method 2: Look in React DevTools or global state
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('🔍 Trying React internals...');
  }
  
  // Method 3: Check if we can access it through imported modules
  const scripts = Array.from(document.getElementsByTagName('script'));
  const hasSupabaseScript = scripts.some(script => 
    script.src?.includes('supabase') || script.textContent?.includes('supabase')
  );
  
  console.log('📋 Debug info:');
  console.log('   window.supabase:', !!window.supabase);
  console.log('   window.__SUPABASE_CLIENT__:', !!window.__SUPABASE_CLIENT__);
  console.log('   Supabase scripts found:', hasSupabaseScript);
  console.log('   Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
  
  return null;
}

// Simple transaction checker using fetch API
async function checkTransactionsWithFetch() {
  console.log('🔍 Checking transactions using browser network inspection...');
  console.log('📋 Instructions:');
  console.log('1. Open Network tab in DevTools');
  console.log('2. Filter by "financial_transactions"');
  console.log('3. Look for recent API calls');
  console.log('4. Check the response data');
  console.log('');
  console.log('🔗 Look for URLs containing:');
  console.log('   - /rest/v1/financial_transactions');
  console.log('   - user_id parameter');
  console.log('   - date filters (gte, lte)');
}

// Check what's available in window global scope
function debugWindowScope() {
  console.log('🔍 Debugging window scope for Supabase access...');
  
  // Check all possible Supabase-related properties
  const allProps = Object.getOwnPropertyNames(window);
  const supabaseProps = allProps.filter(prop => 
    prop.toLowerCase().includes('supabase') || 
    prop.toLowerCase().includes('sb') ||
    prop.toLowerCase().includes('client')
  );
  
  console.log('📊 Potential Supabase properties:', supabaseProps);
  
  // Check for common database client patterns
  const dbProps = allProps.filter(prop => 
    prop.toLowerCase().includes('db') ||
    prop.toLowerCase().includes('database') ||
    prop.toLowerCase().includes('api')
  );
  
  console.log('📊 Potential DB properties:', dbProps);
  
  // Check React app state
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    const reactKeys = Object.getOwnPropertyNames(reactRoot);
    console.log('⚛️ React root properties:', reactKeys.filter(k => k.startsWith('_react')));
  }
  
  // Check if we can find any authentication state
  const authRelated = allProps.filter(prop =>
    prop.toLowerCase().includes('auth') ||
    prop.toLowerCase().includes('user') ||
    prop.toLowerCase().includes('token')
  );
  
  console.log('🔐 Auth-related properties:', authRelated);
}

// Alternative: Use browser's local storage to check if user data is stored
function checkLocalStorage() {
  console.log('🗄️ Checking local storage for clues...');
  
  // Check for Supabase auth tokens
  const supabaseKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
      supabaseKeys.push(key);
    }
  }
  
  console.log('🔑 Supabase-related localStorage keys:', supabaseKeys);
  
  // Try to get auth info if available
  supabaseKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.user) {
          console.log(`👤 Found user in ${key}:`, {
            id: parsed.user.id,
            email: parsed.user.email
          });
        }
      }
    } catch (e) {
      // Not JSON, skip
    }
  });
}

// Manual database query builder
function buildManualQuery(userId, date) {
  console.log('🔧 Manual query builder for debugging:');
  console.log(`
  -- Financial Reports Query (what shows data):
  SELECT * FROM financial_transactions 
  WHERE user_id = '${userId}' 
  ORDER BY date ASC;
  
  -- Then filter client-side for date: ${date}
  
  -- Profit Analysis Query (what shows empty):
  SELECT id, user_id, type, category, amount, description, date 
  FROM financial_transactions 
  WHERE user_id = '${userId}' 
    AND date >= '${date}' 
    AND date <= '${date}' 
    AND type = 'income'
  ORDER BY date ASC;
  `);
}

// Check network requests
function monitorNetworkRequests() {
  console.log('📡 Starting network request monitoring...');
  console.log('❗ This will monitor all fetch requests. Look for financial_transactions calls.');
  
  // Override fetch to log requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1];
    
    if (typeof url === 'string' && url.includes('financial_transactions')) {
      console.log('🔍 Financial transaction API call detected:');
      console.log('   URL:', url);
      console.log('   Method:', options?.method || 'GET');
      console.log('   Headers:', options?.headers);
      console.log('   Body:', options?.body);
      
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        console.log('📊 Response data:', data);
      } catch (e) {
        console.log('📊 Response (non-JSON):', await clonedResponse.text());
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Network monitoring active. Refresh the page or navigate to trigger API calls.');
}

// Main diagnostic function
async function diagnoseDataIssue() {
  console.log('🚀 STARTING DATA ISSUE DIAGNOSIS');
  console.log('='.repeat(50));
  
  // Step 1: Check window scope
  console.log('\n📋 STEP 1: Window scope analysis');
  debugWindowScope();
  
  // Step 2: Check local storage
  console.log('\n📋 STEP 2: Local storage analysis');
  checkLocalStorage();
  
  // Step 3: Try to find Supabase
  console.log('\n📋 STEP 3: Supabase client search');
  const supabaseClient = findSupabaseClient();
  
  if (!supabaseClient) {
    console.log('\n❌ Could not find Supabase client directly.');
    console.log('💡 Alternative debugging methods:');
    console.log('   1. Check network requests');
    console.log('   2. Use browser DevTools');
    console.log('   3. Manual query analysis');
    
    checkTransactionsWithFetch();
    monitorNetworkRequests();
    
    return;
  }
  
  console.log('\n✅ Found Supabase client, proceeding with data analysis...');
  
  // If we have Supabase client, continue with original debugging
  // ... rest of debugging logic here
}

// Export functions
window.diagnoseDataIssue = diagnoseDataIssue;
window.debugWindowScope = debugWindowScope;
window.checkLocalStorage = checkLocalStorage;
window.monitorNetworkRequests = monitorNetworkRequests;

console.log('🔧 Simple debug functions loaded!');
console.log('📋 Available functions:');
console.log('   • diagnoseDataIssue() - Main diagnostic');
console.log('   • debugWindowScope() - Check window properties');
console.log('   • checkLocalStorage() - Check stored auth data');
console.log('   • monitorNetworkRequests() - Monitor API calls');
console.log('');
console.log('🚀 Start with: diagnoseDataIssue()');
