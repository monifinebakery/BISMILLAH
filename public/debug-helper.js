// Debug Helper Script untuk production
// Inject ini ke console browser user kalau ada masalah
(function() {
  console.log('%c🔍 DEBUG HELPER ACTIVE', 'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px;');
  
  // Collect system info
  const systemInfo = {
    // Browser info
    browser: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints
    },
    
    // Screen info
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: screen.orientation?.type
    },
    
    // Window info
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    
    // Performance
    performance: {
      memory: performance.memory,
      timeOrigin: performance.timeOrigin,
      navigation: {
        type: performance.navigation?.type,
        redirectCount: performance.navigation?.redirectCount
      }
    },
    
    // Storage
    storage: {
      localStorage: {
        available: false,
        size: 0,
        keys: []
      },
      sessionStorage: {
        available: false,
        size: 0,
        keys: []
      },
      indexedDB: {
        available: 'indexedDB' in window
      },
      cookies: {
        enabled: navigator.cookieEnabled,
        count: document.cookie.split(';').filter(c => c.trim()).length
      }
    }
  };
  
  // Check localStorage
  try {
    systemInfo.storage.localStorage.available = true;
    systemInfo.storage.localStorage.keys = Object.keys(localStorage);
    systemInfo.storage.localStorage.size = new Blob(
      Object.values(localStorage)
    ).size;
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  
  // Check sessionStorage
  try {
    systemInfo.storage.sessionStorage.available = true;
    systemInfo.storage.sessionStorage.keys = Object.keys(sessionStorage);
    systemInfo.storage.sessionStorage.size = new Blob(
      Object.values(sessionStorage)
    ).size;
  } catch (e) {
    console.warn('sessionStorage not available:', e);
  }
  
  // Check Service Worker
  const checkServiceWorker = async () => {
    const swInfo = {
      supported: 'serviceWorker' in navigator,
      registrations: [],
      caches: []
    };
    
    if (swInfo.supported) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swInfo.registrations = registrations.map(reg => ({
          scope: reg.scope,
          active: reg.active?.state,
          waiting: reg.waiting?.state,
          installing: reg.installing?.state,
          updateFound: false
        }));
        
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          swInfo.caches = cacheNames;
        }
      } catch (e) {
        console.warn('Error checking SW:', e);
      }
    }
    
    return swInfo;
  };
  
  // Check for errors in localStorage
  const checkStoredErrors = () => {
    try {
      const errorLogs = localStorage.getItem('errorLogs');
      if (errorLogs) {
        return JSON.parse(errorLogs);
      }
    } catch (e) {
      console.warn('Could not parse error logs:', e);
    }
    return [];
  };
  
  // Network connectivity test
  const testConnectivity = async () => {
    const tests = {
      online: navigator.onLine,
      dns: false,
      supabase: false,
      latency: null
    };
    
    // Test DNS
    try {
      const start = performance.now();
      await fetch('https://dns.google/resolve?name=google.com', {
        mode: 'no-cors'
      });
      tests.dns = true;
      tests.latency = Math.round(performance.now() - start);
    } catch (e) {
      console.warn('DNS test failed:', e);
    }
    
    // Test Supabase
    try {
      const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
      if (supabaseUrl) {
        await fetch(supabaseUrl + '/rest/v1/', {
          mode: 'no-cors'
        });
        tests.supabase = true;
      }
    } catch (e) {
      console.warn('Supabase test failed:', e);
    }
    
    return tests;
  };
  
  // Console API overrides to catch errors
  const errorCatcher = {
    errors: [],
    warnings: [],
    originalError: console.error,
    originalWarn: console.warn
  };
  
  console.error = function(...args) {
    errorCatcher.errors.push({
      timestamp: new Date().toISOString(),
      message: args
    });
    errorCatcher.originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    errorCatcher.warnings.push({
      timestamp: new Date().toISOString(),
      message: args
    });
    errorCatcher.originalWarn.apply(console, args);
  };
  
  // Global error handler
  window.addEventListener('error', (event) => {
    errorCatcher.errors.push({
      timestamp: new Date().toISOString(),
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    errorCatcher.errors.push({
      timestamp: new Date().toISOString(),
      message: 'Unhandled Promise Rejection',
      reason: event.reason
    });
  });
  
  // Generate report
  window.generateDebugReport = async () => {
    console.log('%c⏳ Generating debug report...', 'color: blue; font-weight: bold;');
    
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      systemInfo,
      serviceWorker: await checkServiceWorker(),
      connectivity: await testConnectivity(),
      storedErrors: checkStoredErrors(),
      consoleErrors: errorCatcher.errors,
      consoleWarnings: errorCatcher.warnings,
      performance: {
        timing: performance.timing,
        navigation: performance.navigation,
        memory: performance.memory
      }
    };
    
    // Display report
    console.log('%c📊 DEBUG REPORT', 'background: #2196F3; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;');
    console.log(report);
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      console.log('%c✅ Report copied to clipboard!', 'color: green; font-weight: bold;');
    } catch (e) {
      console.log('%c⚠️ Could not copy to clipboard. Please copy manually from console.', 'color: orange;');
    }
    
    return report;
  };
  
  // Clear all caches and storage
  window.clearAllData = async () => {
    console.log('%c🧹 Clearing all data...', 'color: orange; font-weight: bold;');
    
    try {
      // Clear localStorage
      localStorage.clear();
      console.log('✅ localStorage cleared');
      
      // Clear sessionStorage
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      console.log('✅ Cookies cleared');
      
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Service Worker caches cleared');
      }
      
      // Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('✅ Service Workers unregistered');
      }
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(databases.map(db => indexedDB.deleteDatabase(db.name)));
        console.log('✅ IndexedDB cleared');
      }
      
      console.log('%c✅ All data cleared! Refreshing...', 'color: green; font-weight: bold;');
      setTimeout(() => window.location.reload(true), 1000);
      
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  };
  
  // Show instructions
  console.log('%c📝 Available Commands:', 'font-weight: bold; color: #673AB7;');
  console.log('  generateDebugReport() - Generate full debug report');
  console.log('  clearAllData() - Clear all caches and reload');
  console.log('');
  console.log('%c💡 Tips:', 'font-weight: bold; color: #FF9800;');
  console.log('  - Run generateDebugReport() to get system info');
  console.log('  - Run clearAllData() if experiencing cache issues');
  console.log('  - Check console for any red errors above');
  
})();
