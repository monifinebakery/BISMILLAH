// PWA Authentication Quick Debug - Jalankan di browser console
// Usage: Buka PWA > F12 > Console > Copy-paste script ini

console.log('🚀 PWA Quick Debug Starting...');

// Quick checks
const quickDebug = {
  // Environment
  isPWA: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true,
  pathname: window.location.pathname,
  userAgent: navigator.userAgent.includes('iPhone') ? 'iOS' : navigator.userAgent.includes('Android') ? 'Android' : 'Other',
  
  // Auth Context Debug Values
  authUser: window.__DEBUG_AUTH_USER__,
  authReady: window.__DEBUG_AUTH_READY__,
  authLoading: window.__DEBUG_AUTH_LOADING__,
  authSession: window.__DEBUG_AUTH_SESSION__,
  
  // Current state
  timestamp: new Date().toISOString()
};

console.log('📊 Quick Debug Results:');
console.table(quickDebug);

// Specific PWA issues checks
console.log('\n🔍 PWA Issue Analysis:');

if (!quickDebug.isPWA) {
  console.log('❌ Not running in PWA mode - install the app first');
} else {
  console.log('✅ Running in PWA mode');
}

if (quickDebug.authLoading && !quickDebug.authReady) {
  console.log('⚠️ AuthContext stuck in loading state - this is your issue!');
  console.log('💡 Fix: Check network connection or timeout settings');
} else if (!quickDebug.authLoading && quickDebug.authReady && quickDebug.authUser) {
  console.log('✅ Auth state is healthy');
} else {
  console.log('⚠️ Auth state unclear:', { 
    loading: quickDebug.authLoading, 
    ready: quickDebug.authReady, 
    hasUser: !!quickDebug.authUser 
  });
}

if (quickDebug.pathname === '/auth' && quickDebug.authUser) {
  console.log('🚨 User is authenticated but stuck on /auth page - redirect loop!');
  console.log('💡 Fix: Check AuthGuard redirect logic');
}

// Quick fixes
console.log('\n🔧 Available Quick Fixes:');
console.log('1. Force auth refresh: window.__DEBUG_AUTH_VALIDATE__?.()');
console.log('2. Clear auth data: localStorage.clear(); sessionStorage.clear();');
console.log('3. Force reload: window.location.reload()');
console.log('4. Go to main app: window.location.href = \'/\'');

// Auto-suggestions
if (quickDebug.authLoading && !quickDebug.authReady) {
  console.log('\n🚨 DETECTED: AuthContext loading timeout');
  console.log('🔧 SUGGESTED ACTION:');
  console.log('   Run: window.location.reload()');
  console.log('   If issue persists, check network connectivity');
}

if (quickDebug.pathname === '/auth' && quickDebug.authUser) {
  console.log('\n🚨 DETECTED: Authenticated user on auth page');
  console.log('🔧 SUGGESTED ACTION:');
  console.log('   Run: window.location.href = \'/\'');
}

// Store results globally
window.PWA_QUICK_DEBUG = quickDebug;
console.log('\n📋 Results stored in: window.PWA_QUICK_DEBUG');
