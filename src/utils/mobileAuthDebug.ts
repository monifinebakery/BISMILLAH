// Mobile Authentication Debugging Utilities (Universal)
import { logger } from './logger';

/**
 * 📱 MOBILE DEBUG: Comprehensive mobile auth debugging for all platforms
 */
export const debugMobileAuth = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
  const isTablet = /iPad|Android.*Tablet|Windows.*Touch/i.test(userAgent);
  
  if (!isMobile && !isTablet) {
    logger.debug('Not a mobile/tablet device, skipping mobile debug');
    return null;
  }
  
  // Detect platform details
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const androidVersion = userAgent.match(/Android (\d+(?:\.\d+)?)/)?.[1];
  const iosVersion = userAgent.match(/OS (\d+(?:[_.]\d+)?)/)?.[1]?.replace(/_/g, '.');
  const chromeVersion = userAgent.match(/Chrome\/(\d+)/)?.[1];
  const safariVersion = userAgent.match(/Version\/(\d+(?:\.\d+)?)/)?.[1];
  
  const debugInfo = {
    platform: isAndroid ? 'Android' : isIOS ? 'iOS' : 'Other Mobile',
    deviceType: isTablet ? 'Tablet' : 'Mobile',
    isMobile,
    isTablet,
    isAndroid,
    isIOS,
    androidVersion,
    iosVersion,
    chromeVersion,
    safariVersion,
    userAgent,
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    connection: getConnectionInfo(),
    storage: getStorageInfo(),
    performance: getPerformanceInfo(),
    timing: performance.now(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    webview: detectWebView(),
    issues: detectKnownIssues(userAgent, androidVersion, iosVersion, chromeVersion, safariVersion)
  };
  
  logger.info('📱 Mobile Auth Debug Info:', debugInfo);
  
  // Store for later analysis
  try {
    localStorage.setItem('mobile-auth-debug', JSON.stringify(debugInfo));
  } catch (e) {
    logger.warn('Could not store mobile debug info:', e);
  }
  
  return debugInfo;
};

/**
 * Get network connection information
 */
const getConnectionInfo = () => {
  if (!('connection' in navigator)) {
    return { type: 'unknown', effectiveType: 'unknown' };
  }
  
  const connection = (navigator as any).connection;
  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 'unknown',
    rtt: connection.rtt || 'unknown',
    saveData: connection.saveData || false
  };
};

/**
 * Get storage information
 */
const getStorageInfo = () => {
  const storage = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webSQL: false,
    quota: 'unknown'
  };
  
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    storage.localStorage = true;
  } catch (e) {
    logger.warn('localStorage not available:', e);
  }
  
  try {
    sessionStorage.setItem('__test__', 'test');
    sessionStorage.removeItem('__test__');
    storage.sessionStorage = true;
  } catch (e) {
    logger.warn('sessionStorage not available:', e);
  }
  
  storage.indexedDB = 'indexedDB' in window;
  storage.webSQL = 'openDatabase' in window;
  
  // Try to get storage quota
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      logger.debug('Storage quota estimate:', estimate);
    }).catch(e => {
      logger.warn('Could not get storage estimate:', e);
    });
  }
  
  return storage;
};

/**
 * Get performance information
 */
const getPerformanceInfo = () => {
  const perf = {
    now: performance.now(),
    timeOrigin: performance.timeOrigin || 'unknown',
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : 'unknown',
    navigation: performance.getEntriesByType ? 
      performance.getEntriesByType('navigation')[0] : 'unknown'
  };
  
  return perf;
};

/**
 * Detect if running in WebView
 */
const detectWebView = () => {
  const userAgent = navigator.userAgent;
  
  // Common WebView indicators for Android
  const webviewIndicators = [
    'wv', // Android WebView
    '; wv)',
    'Version/4.0',
    'Mobile Safari',
  ];
  
  const hasWebViewIndicator = webviewIndicators.some(indicator => 
    userAgent.includes(indicator)
  );
  
  // Check for absence of Chrome features that indicate native Chrome
  const lacksNativeChrome = !userAgent.includes('Chrome/') && 
                           userAgent.includes('Android');
  
  return {
    isWebView: hasWebViewIndicator || lacksNativeChrome,
    indicators: webviewIndicators.filter(indicator => userAgent.includes(indicator)),
    userAgent
  };
};

/**
 * Detect known mobile authentication issues (universal)
 */
const detectKnownIssues = (userAgent: string, androidVersion?: string, iosVersion?: string, chromeVersion?: string, safariVersion?: string) => {
  const issues: string[] = [];
  
  // Old mobile OS versions
  if (androidVersion) {
    const version = parseFloat(androidVersion);
    if (version < 6) {
      issues.push('Android version < 6.0 - known auth issues');
    }
    if (version < 8) {
      issues.push('Android version < 8.0 - possible WebView issues');
    }
  }
  
  if (iosVersion) {
    const version = parseFloat(iosVersion);
    if (version < 12) {
      issues.push('iOS version < 12.0 - known Safari auth issues');
    }
    if (version < 14) {
      issues.push('iOS version < 14.0 - possible WebView issues');
    }
  }
  
  // Old browser versions
  if (chromeVersion) {
    const version = parseInt(chromeVersion);
    if (version < 70) {
      issues.push('Chrome version < 70 - outdated security features');
    }
    if (version < 80) {
      issues.push('Chrome version < 80 - possible SameSite issues');
    }
  }
  
  if (safariVersion) {
    const version = parseFloat(safariVersion);
    if (version < 13) {
      issues.push('Safari version < 13.0 - possible auth timing issues');
    }
  }
  
  // WebView detection (universal)
  if (userAgent.includes('wv') || userAgent.includes('Version/4.0')) {
    issues.push('Running in WebView - auth may be slower');
  }
  
  // Alternative mobile browsers
  if (userAgent.includes('SamsungBrowser')) {
    issues.push('Samsung Internet - possible compatibility issues');
  }
  if (userAgent.includes('MiuiBrowser') || userAgent.includes('XiaoMi')) {
    issues.push('MIUI Browser - possible authentication delays');
  }
  if (userAgent.includes('HuaweiBrowser')) {
    issues.push('Huawei Browser - possible compatibility issues');
  }
  if (userAgent.includes('UCBrowser')) {
    issues.push('UC Browser - possible auth compatibility issues');
  }
  if (userAgent.includes('OPiOS') || userAgent.includes('Opera')) {
    issues.push('Opera Mobile - may need additional auth time');
  }
  
  return issues;
};

/**
 * Start monitoring mobile auth performance (universal)
 */
export const startMobileAuthMonitoring = () => {
  const startTime = performance.now();
  
  const monitor = {
    start: startTime,
    checkpoints: [] as { name: string; time: number; duration: number }[],
    
    checkpoint(name: string) {
      const time = performance.now();
      const duration = time - startTime;
      this.checkpoints.push({ name, time, duration });
      logger.debug(`📱 Mobile Auth Checkpoint [${name}]:`, {
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    },
    
    finish() {
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      logger.info('📱 Mobile Auth Monitoring Complete:', {
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        checkpoints: this.checkpoints,
        isSlowAuth: totalDuration > 5000,
        isVerySlowAuth: totalDuration > 10000
      });
      
      // Store performance data
      try {
        const perfData = {
          totalDuration,
          checkpoints: this.checkpoints,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        };
        localStorage.setItem('mobile-auth-perf', JSON.stringify(perfData));
      } catch (e) {
        logger.warn('Could not store mobile auth performance data:', e);
      }
      
      return totalDuration;
    }
  };
  
  return monitor;
};

/**
 * Get stored mobile debug information (universal)
 */
export const getMobileDebugHistory = () => {
  try {
    const debugInfo = localStorage.getItem('mobile-auth-debug');
    const perfInfo = localStorage.getItem('mobile-auth-perf');
    
    return {
      debug: debugInfo ? JSON.parse(debugInfo) : null,
      performance: perfInfo ? JSON.parse(perfInfo) : null
    };
  } catch (e) {
    logger.warn('Could not retrieve mobile debug history:', e);
    return { debug: null, performance: null };
  }
};

// Legacy support - keep Android function names for backward compatibility
export const debugAndroidAuth = debugMobileAuth;
export const startAndroidAuthMonitoring = startMobileAuthMonitoring;
export const getAndroidDebugHistory = getMobileDebugHistory;
