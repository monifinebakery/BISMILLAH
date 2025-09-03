// PWA Authentication Debug Script
// Untuk diagnosis masalah "loading memuat autentikasi lama" di PWA
// Run this in browser console while on the app

console.log('🔍 PWA Authentication Debug Script Starting...');

async function debugPWAAuth() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {},
    pwa: {},
    network: {},
    supabase: {},
    authContext: {},
    performance: {},
    recommendations: []
  };

  // ✅ Environment Detection
  console.log('🔍 1. Checking Environment...');
  results.environment = {
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    pathname: window.location.pathname,
    isLocalhost: window.location.hostname === 'localhost',
    isDev: window.location.hostname === 'localhost' || window.location.port === '5173',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    language: navigator.language
  };

  // ✅ PWA Detection
  console.log('🔍 2. Checking PWA Status...');
  results.pwa = {
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isIOSStandalone: (window.navigator as any).standalone === true,
    hasManifest: !!document.querySelector('link[rel="manifest"]'),
    hasServiceWorker: 'serviceWorker' in navigator,
    serviceWorkerStatus: 'unknown',
    installable: false,
    currentDisplayMode: 'unknown'
  };

  // Check display mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    results.pwa.currentDisplayMode = 'standalone';
  } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
    results.pwa.currentDisplayMode = 'fullscreen';
  } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    results.pwa.currentDisplayMode = 'minimal-ui';
  } else {
    results.pwa.currentDisplayMode = 'browser';
  }

  // Check service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      results.pwa.serviceWorkerStatus = registration ? 
        (registration.active ? 'active' : 'installing') : 'not_registered';
    } catch (e) {
      results.pwa.serviceWorkerStatus = 'error';
    }
  }

  // ✅ Network Detection  
  console.log('🔍 3. Checking Network...');
  results.network = {
    online: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 'unknown',
    rtt: 'unknown'
  };

  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    results.network.connectionType = conn.type || 'unknown';
    results.network.effectiveType = conn.effectiveType || 'unknown';
    results.network.downlink = conn.downlink || 'unknown';
    results.network.rtt = conn.rtt || 'unknown';
  }

  // ✅ Supabase Status
  console.log('🔍 4. Checking Supabase...');
  const startTime = performance.now();
  
  try {
    if (!window.supabase) {
      results.supabase = { status: 'not_found', error: 'Supabase client not found on window object' };
    } else {
      // Test basic connectivity
      const { data: { session }, error } = await Promise.race([
        window.supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      results.supabase = {
        status: 'connected',
        hasSession: !!session,
        sessionValid: !!(session?.user?.id && session.user.id !== 'null'),
        userEmail: session?.user?.email || 'none',
        userId: session?.user?.id || 'none',
        responseTime: `${duration}ms`,
        error: error?.message || null
      };

      if (duration > 5000) {
        results.recommendations.push(`⚠️ Supabase response time is slow (${duration}ms). Check network connection.`);
      }
      
      if (session?.user?.id === 'null') {
        results.recommendations.push('🚨 Invalid user ID detected (string "null"). This causes auth loops.');
      }
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    results.supabase = {
      status: 'error',
      error: error.message,
      responseTime: `${duration}ms (failed)`
    };
    
    if (error.message.includes('timeout')) {
      results.recommendations.push('🚨 Supabase connection timeout. This is likely the cause of slow loading.');
    }
  }

  // ✅ AuthContext Status (if available)
  console.log('🔍 5. Checking AuthContext...');
  if (window.__DEBUG_AUTH_USER__) {
    results.authContext = {
      hasUser: !!window.__DEBUG_AUTH_USER__,
      userEmail: window.__DEBUG_AUTH_USER__?.email || 'none',
      userId: window.__DEBUG_AUTH_USER__?.id || 'none',
      isReady: window.__DEBUG_AUTH_READY__ || false,
      isLoading: window.__DEBUG_AUTH_LOADING__ || false,
      hasSession: !!window.__DEBUG_AUTH_SESSION__,
      contextAvailable: true
    };
    
    if (window.__DEBUG_AUTH_LOADING__ && !window.__DEBUG_AUTH_READY__) {
      results.recommendations.push('⏳ AuthContext is still loading. This may indicate a timeout issue.');
    }
  } else {
    results.authContext = {
      contextAvailable: false,
      note: 'AuthContext debug values not found. Make sure you are in dev mode.'
    };
  }

  // ✅ Performance Metrics
  console.log('🔍 6. Checking Performance...');
  const perfEntries = performance.getEntriesByType('navigation')[0] as any;
  if (perfEntries) {
    results.performance = {
      domContentLoaded: Math.round(perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart),
      loadComplete: Math.round(perfEntries.loadEventEnd - perfEntries.loadEventStart),
      totalLoadTime: Math.round(perfEntries.loadEventEnd - perfEntries.fetchStart),
      dnsLookup: Math.round(perfEntries.domainLookupEnd - perfEntries.domainLookupStart),
      tcpConnect: Math.round(perfEntries.connectEnd - perfEntries.connectStart),
      serverResponse: Math.round(perfEntries.responseEnd - perfEntries.requestStart)
    };
    
    if (results.performance.totalLoadTime > 5000) {
      results.recommendations.push(`⚠️ Slow page load time (${results.performance.totalLoadTime}ms). This affects PWA startup.`);
    }
  }

  // ✅ Generate Recommendations
  console.log('🔍 7. Generating Recommendations...');
  
  // PWA-specific recommendations
  if (results.pwa.currentDisplayMode === 'standalone' || results.pwa.isIOSStandalone) {
    results.recommendations.push('✅ Running in PWA mode');
    
    if (results.supabase.responseTime && parseInt(results.supabase.responseTime) > 3000) {
      results.recommendations.push('🔧 PWA Fix: Add network timeout optimization for better UX');
    }
    
    if (results.network.effectiveType === '2g' || results.network.effectiveType === 'slow-2g') {
      results.recommendations.push('📱 PWA on slow network detected. Consider implementing better offline support.');
    }
  } else {
    results.recommendations.push('📱 Not running in PWA mode. Install the app for better performance.');
  }

  // Network recommendations
  if (!results.network.online) {
    results.recommendations.push('🚨 Device is offline. PWA should show offline message.');
  } else if (results.network.effectiveType === '2g') {
    results.recommendations.push('⚠️ Very slow network (2G). Consider reducing timeout values.');
  }

  // Auth-specific recommendations
  if (results.supabase.status === 'error') {
    results.recommendations.push('🔧 Fix: Check Supabase configuration and network connectivity');
  }
  
  if (results.authContext.isLoading && !results.authContext.isReady) {
    results.recommendations.push('🔧 Fix: AuthContext stuck in loading state - check timeout settings');
  }

  // Storage recommendations
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
  } catch (e) {
    results.recommendations.push('⚠️ localStorage not available. This may affect PWA auth persistence.');
  }

  return results;
}

// ✅ Quick Fix Functions
window.PWA_DEBUG_AUTH = {
  // Quick timeout test
  testSupabaseTimeout: async () => {
    console.log('🔧 Testing Supabase timeout...');
    const timeouts = [3000, 5000, 8000, 10000];
    
    for (const timeout of timeouts) {
      const start = performance.now();
      try {
        await Promise.race([
          window.supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
        ]);
        const duration = Math.round(performance.now() - start);
        console.log(`✅ ${timeout}ms timeout: SUCCESS (${duration}ms)`);
        return timeout;
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        console.log(`❌ ${timeout}ms timeout: FAILED (${duration}ms) - ${error.message}`);
      }
    }
    
    console.log('🚨 All timeouts failed. Network or Supabase issue.');
    return null;
  },

  // Force auth refresh
  refreshAuth: async () => {
    console.log('🔧 Force refreshing auth...');
    try {
      if (window.__DEBUG_AUTH_VALIDATE__) {
        const result = await window.__DEBUG_AUTH_VALIDATE__();
        console.log('✅ Auth validation result:', result);
        return result;
      } else {
        console.log('⚠️ Auth validation function not available');
        return false;
      }
    } catch (error) {
      console.error('❌ Auth refresh failed:', error);
      return false;
    }
  },

  // Clear auth cache
  clearAuthCache: () => {
    console.log('🔧 Clearing auth cache...');
    try {
      // Clear potential auth-related localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('session')
      );
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed: ${key}`);
      });
      
      // Clear sessionStorage too
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('session')
      );
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed session: ${key}`);
      });
      
      console.log('✅ Auth cache cleared. Reload the page to test.');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear auth cache:', error);
      return false;
    }
  },

  // Reload with debug
  reloadWithDebug: () => {
    console.log('🔄 Reloading with debug flags...');
    const url = new URL(window.location.href);
    url.searchParams.set('debug', 'auth');
    url.searchParams.set('pwa_debug', 'true');
    window.location.href = url.toString();
  }
};

// Run the main diagnostic
debugPWAAuth().then(results => {
  console.log('\n🎯 PWA Authentication Debug Results:');
  console.log('=' .repeat(50));
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Environment: ${results.environment.isDev ? 'Development' : 'Production'}`);
  console.log(`   PWA Mode: ${results.pwa.currentDisplayMode}`);
  console.log(`   Network: ${results.network.effectiveType} (${results.network.online ? 'Online' : 'Offline'})`);
  console.log(`   Supabase: ${results.supabase.status} (${results.supabase.responseTime || 'N/A'})`);
  console.log(`   Auth Ready: ${results.authContext.isReady ? 'Yes' : 'No'}`);
  
  // Recommendations
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    results.recommendations.forEach(rec => console.log(`   ${rec}`));
  }
  
  // Quick fixes
  console.log('\n🔧 Available Quick Fixes:');
  console.log('   PWA_DEBUG_AUTH.testSupabaseTimeout() - Test different timeout values');
  console.log('   PWA_DEBUG_AUTH.refreshAuth() - Force refresh authentication');
  console.log('   PWA_DEBUG_AUTH.clearAuthCache() - Clear auth cache and cookies');
  console.log('   PWA_DEBUG_AUTH.reloadWithDebug() - Reload with debug flags');
  
  // Store results globally for inspection
  window.PWA_AUTH_DEBUG_RESULTS = results;
  console.log('\n📋 Full results stored in: window.PWA_AUTH_DEBUG_RESULTS');
  
  // Auto-suggest fixes
  if (results.supabase.status === 'error' && results.supabase.error?.includes('timeout')) {
    console.log('\n🚨 DETECTED ISSUE: Supabase timeout');
    console.log('   This is likely causing your slow PWA loading!');
    console.log('   🔧 Quick Fix: Run PWA_DEBUG_AUTH.testSupabaseTimeout()');
  }
  
  if (results.authContext.isLoading && !results.authContext.isReady) {
    console.log('\n🚨 DETECTED ISSUE: AuthContext stuck in loading');
    console.log('   🔧 Quick Fix: Run PWA_DEBUG_AUTH.refreshAuth()');
  }
  
  if (results.pwa.currentDisplayMode !== 'standalone' && results.pwa.currentDisplayMode !== 'fullscreen') {
    console.log('\n💡 TIP: Install this as a PWA for better performance');
    console.log('   Look for the "Install App" button in your browser');
  }

}).catch(error => {
  console.error('❌ PWA Debug failed:', error);
  console.log('🔧 Try these manual checks:');
  console.log('   1. Check console for errors');
  console.log('   2. Check network tab for slow requests');
  console.log('   3. Try clearing browser cache');
  console.log('   4. Check if you are online');
});

console.log('⏳ PWA Auth Debug running... Results will appear above when complete.');
