// DIRECT DATABASE TEST - untuk production tanpa window.supabase
// Copy paste ke console production

console.log('🔍 DIRECT DATABASE TEST...');

// Method 1: Test via fetch API langsung ke Supabase REST API
async function testDirectSupabase() {
  try {
    console.log('🧪 Testing direct Supabase REST API...');
    
    // Get Supabase URL from Network tab atau environment
    // User perlu ganti ini dengan URL Supabase project mereka
    const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Ganti ini
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Ganti ini
    
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.log('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY first');
      console.log('💡 Check Network tab for Supabase requests to get the URL');
      return;
    }
    
    // Test connection
    const response = await fetch(`${SUPABASE_URL}/rest/v1/purchases?select=count&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Direct Supabase connection works!');
      
      // Create manual Supabase-like client
      window.manualSupabase = {
        from: (table) => ({
          select: (columns = '*') => ({
            eq: (column, value) => ({
              async execute() {
                const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`;
                const res = await fetch(url, {
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                  }
                });
                return { data: await res.json(), error: null };
              }
            })
          })
        })
      };
      
      console.log('✅ Created window.manualSupabase for testing');
    } else {
      console.error('❌ Direct connection failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
  }
}

// Method 2: Detect Supabase from network requests
async function detectSupabaseFromNetwork() {
  console.log('🔍 Looking for Supabase in network requests...');
  
  // Monitor network requests
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (entry.name.includes('supabase') || entry.name.includes('rest/v1')) {
        console.log('🔍 Found Supabase request:', entry.name);
        
        // Extract base URL
        const url = new URL(entry.name);
        const baseUrl = `${url.protocol}//${url.host}`;
        console.log('📍 Supabase URL detected:', baseUrl);
        
        window.detectedSupabaseUrl = baseUrl;
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
  console.log('👂 Monitoring network requests for Supabase...');
  
  // Stop monitoring after 5 seconds
  setTimeout(() => {
    observer.disconnect();
    console.log('🛑 Network monitoring stopped');
  }, 5000);
}

// Method 3: Check localStorage/sessionStorage for auth tokens
function checkStorageForAuth() {
  console.log('🔍 Checking storage for auth tokens...');
  
  // Check localStorage
  const lsKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || 
    key.includes('auth') || 
    key.includes('token')
  );
  
  if (lsKeys.length > 0) {
    console.log('🔍 Found in localStorage:', lsKeys);
    lsKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value.includes('access_token')) {
        console.log('✅ Found auth token in:', key);
        try {
          const parsed = JSON.parse(value);
          console.log('👤 Token info:', {
            user: parsed.user?.email,
            expires: new Date(parsed.expires_at * 1000)
          });
          window.authToken = parsed.access_token;
        } catch (e) {
          console.log('❌ Failed to parse token');
        }
      }
    });
  } else {
    console.log('❌ No auth-related items in localStorage');
  }
  
  // Check sessionStorage
  const ssKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('supabase') || 
    key.includes('auth') || 
    key.includes('token')
  );
  
  if (ssKeys.length > 0) {
    console.log('🔍 Found in sessionStorage:', ssKeys);
  }
}

// Method 4: Simple WAC test if we can access data
async function simpleWacTest() {
  console.log('🧪 Simple WAC test...');
  
  if (window.authToken && window.detectedSupabaseUrl) {
    try {
      // Test getting purchases
      const purchasesRes = await fetch(`${window.detectedSupabaseUrl}/rest/v1/purchases?select=id,status&limit=5`, {
        headers: {
          'Authorization': `Bearer ${window.authToken}`,
          'apikey': window.authToken
        }
      });
      
      if (purchasesRes.ok) {
        const purchases = await purchasesRes.json();
        console.log('✅ Purchases data:', purchases);
        
        const completedCount = purchases.filter(p => p.status === 'completed').length;
        console.log(`📦 Completed purchases: ${completedCount}/${purchases.length}`);
      }
      
      // Test getting warehouse
      const warehouseRes = await fetch(`${window.detectedSupabaseUrl}/rest/v1/bahan_baku?select=id,nama,harga_rata_rata&limit=5`, {
        headers: {
          'Authorization': `Bearer ${window.authToken}`,
          'apikey': window.authToken
        }
      });
      
      if (warehouseRes.ok) {
        const warehouse = await warehouseRes.json();
        console.log('✅ Warehouse data:', warehouse);
        
        const zeroWacCount = warehouse.filter(w => !w.harga_rata_rata || w.harga_rata_rata === 0).length;
        console.log(`❌ Items with WAC = 0: ${zeroWacCount}/${warehouse.length}`);
      }
      
    } catch (error) {
      console.error('❌ Simple test failed:', error);
    }
  } else {
    console.log('❌ Missing auth token or Supabase URL');
    console.log('💡 Run detectSupabaseFromNetwork() and checkStorageForAuth() first');
  }
}

// Auto-run detection
console.log('🚀 Auto-running detection methods...');
checkStorageForAuth();
detectSupabaseFromNetwork();

console.log('\n💡 AVAILABLE FUNCTIONS:');
console.log('• testDirectSupabase() - Test direct API connection');
console.log('• detectSupabaseFromNetwork() - Monitor network for Supabase');
console.log('• checkStorageForAuth() - Check storage for auth tokens');
console.log('• simpleWacTest() - Test WAC data access');

console.log('\n📋 NEXT STEPS:');
console.log('1. Interact with the app (login, navigate) to generate requests');
console.log('2. Check if detectedSupabaseUrl and authToken are set');
console.log('3. Run simpleWacTest() to check WAC status');
