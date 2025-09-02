// DEBUG SUPABASE IN PRODUCTION - Copy paste ke console
console.log('🔍 DEBUGGING SUPABASE IN PRODUCTION...');

// Check all possible Supabase locations
console.log('🔍 Checking window objects...');
console.log('window.supabase:', typeof window.supabase);
console.log('window.Supabase:', typeof window.Supabase);
console.log('window._supabase:', typeof window._supabase);

// Check if it's in a different global variable
const possibleNames = ['supabase', 'Supabase', '_supabase', 'supabaseClient', 'client'];
possibleNames.forEach(name => {
  if (window[name]) {
    console.log(`✅ Found: window.${name}`, typeof window[name]);
    if (window[name].auth) {
      console.log(`✅ window.${name}.auth exists`);
      window.foundSupabase = window[name];
    }
  }
});

// Check if it's inside any framework context (React, Next.js, etc)
console.log('\n🔍 Checking framework contexts...');
console.log('window.__NEXT_DATA__:', typeof window.__NEXT_DATA__);
console.log('window.React:', typeof window.React);
console.log('window.__reactInternalInstance:', typeof window.__reactInternalInstance);

// Check if Supabase is loaded via modules
console.log('\n🔍 Checking module loading...');
if (window.require) {
  console.log('✅ CommonJS require available');
  try {
    const supabase = window.require('@supabase/supabase-js');
    console.log('✅ Supabase module found via require');
  } catch (e) {
    console.log('❌ Supabase not found via require');
  }
}

// List all window properties that might contain 'supabase'
console.log('\n🔍 Searching for supabase in window properties...');
Object.keys(window).filter(key => 
  key.toLowerCase().includes('supabase') || 
  key.toLowerCase().includes('client') ||
  key.toLowerCase().includes('db')
).forEach(key => {
  console.log(`🔍 Found property: window.${key}`, typeof window[key]);
});

// Check if we can find it in any React component or context
console.log('\n🔍 Checking React components/contexts...');
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('🔍 React internals available - checking for Supabase context');
}

// Manual test function to try different approaches
window.testSupabaseAccess = function() {
  console.log('\n🧪 TESTING DIFFERENT ACCESS METHODS...');
  
  // Method 1: Direct window access
  const methods = [
    () => window.supabase,
    () => window.Supabase,
    () => window._supabase,
    () => window.supabaseClient,
    () => window.client,
    () => window.foundSupabase
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      const client = methods[i]();
      if (client && client.auth) {
        console.log(`✅ Method ${i + 1} works! Testing auth...`);
        
        client.auth.getUser().then(result => {
          console.log(`✅ Auth test successful:`, result.data.user?.email || 'Not logged in');
          window.workingSupabase = client;
          console.log('✅ Saved as window.workingSupabase');
        }).catch(err => {
          console.log(`❌ Auth test failed:`, err);
        });
        
        return client;
      }
    } catch (e) {
      console.log(`❌ Method ${i + 1} failed:`, e.message);
    }
  }
  
  console.log('❌ No working Supabase client found');
};

// Try to access Supabase via DOM elements (sometimes embedded in script tags)
console.log('\n🔍 Checking script tags for Supabase config...');
const scripts = document.querySelectorAll('script');
let foundConfig = false;

scripts.forEach((script, index) => {
  if (script.textContent && (
    script.textContent.includes('supabase') || 
    script.textContent.includes('NEXT_PUBLIC_SUPABASE') ||
    script.textContent.includes('createClient')
  )) {
    console.log(`🔍 Script ${index} contains Supabase references`);
    foundConfig = true;
  }
});

if (!foundConfig) {
  console.log('❌ No Supabase config found in script tags');
}

// Check environment variables (if accessible)
console.log('\n🔍 Checking for environment variables...');
if (window.process && window.process.env) {
  console.log('✅ Process.env available');
  const envKeys = Object.keys(window.process.env).filter(key => 
    key.includes('SUPABASE') || key.includes('DATABASE')
  );
  console.log('Supabase-related env vars:', envKeys);
} else {
  console.log('❌ Process.env not available');
}

console.log('\n💡 NEXT STEPS:');
console.log('1. Run: testSupabaseAccess()');
console.log('2. If found, use: window.workingSupabase instead of window.supabase');
console.log('3. Check Network tab for any Supabase API calls');
console.log('4. Look for login/auth related network requests');

// Auto-run the test
testSupabaseAccess();
