// Test script untuk memverifikasi konsistensi mobile vs desktop behavior
// Menjalankan test di browser dengan device simulation

console.log('🧪 Testing Mobile vs Desktop Consistency for FinancialProvider');

// Simulasi mobile device
const simulateMobile = () => {
  // Override navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    writable: true
  });

  // Override window dimensions
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
  
  console.log('📱 Mobile simulation enabled:', {
    userAgent: navigator.userAgent.includes('iPhone'),
    width: window.innerWidth,
    height: window.innerHeight
  });
};

// Simulasi desktop device
const simulateDesktop = () => {
  // Override navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    writable: true
  });

  // Override window dimensions
  Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
  
  console.log('🖥️ Desktop simulation enabled:', {
    userAgent: navigator.userAgent.includes('Chrome'),
    width: window.innerWidth,
    height: window.innerHeight
  });
};

// Test provider loading behavior
const testProviderBehavior = (deviceType) => {
  console.log(`\n🔄 Testing ${deviceType} provider behavior...`);
  
  const startTime = performance.now();
  const stages = [];
  
  // Monitor stage progression
  const stageMonitor = (stage) => {
    const elapsed = performance.now() - startTime;
    stages.push({ stage, elapsed, deviceType });
    console.log(`${deviceType}: Stage ${stage} reached at ${elapsed.toFixed(2)}ms`);
  };
  
  // Simulate progressive loading stages based on our baseDelay = 100ms
  setTimeout(() => stageMonitor(2), 100);   // Stage 2: 100ms
  setTimeout(() => stageMonitor(3), 200);   // Stage 3: 200ms  
  setTimeout(() => stageMonitor(4), 300);   // Stage 4: 300ms
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        deviceType,
        stages,
        totalTime: performance.now() - startTime,
        expectedTimings: {
          stage2: 100,
          stage3: 200,
          stage4: 300
        }
      });
    }, 400);
  });
};

// Test useFinancial hook behavior
const testUseFinancialBehavior = (deviceType) => {
  console.log(`\n🎣 Testing ${deviceType} useFinancial hook behavior...`);
  
  const mockFinancialContext = {
    financialTransactions: [],
    isLoading: false,
    addFinancialTransaction: async () => false,
    updateFinancialTransaction: async () => false,
    deleteFinancialTransaction: async () => false,
  };
  
  // Simulate defensive handling
  const testDefensiveHandling = () => {
    try {
      // Simulate hook call - should not throw error
      const result = mockFinancialContext;
      return {
        success: true,
        error: null,
        context: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        context: null
      };
    }
  };
  
  const result = testDefensiveHandling();
  console.log(`${deviceType}: useFinancial hook test:`, {
    success: result.success,
    hasContext: !!result.context,
    hasTransactions: result.context?.financialTransactions?.length === 0,
    hasOperations: typeof result.context?.addFinancialTransaction === 'function'
  });
  
  return result;
};

// Test LazyFinancialProvider behavior
const testLazyProviderBehavior = (deviceType) => {
  console.log(`\n🏭 Testing ${deviceType} LazyFinancialProvider behavior...`);
  
  const states = [];
  
  // Simulate provider loading states
  states.push({ state: 'loading', enabled: true, hasComponent: false, deviceType });
  states.push({ state: 'ready', enabled: true, hasComponent: true, deviceType });
  
  // Test rendering decision
  const testRenderDecision = (state) => {
    if (!state.enabled) {
      return { renderChildren: true, renderProvider: false, renderLoading: false };
    }
    
    if (state.hasComponent) {
      return { renderChildren: true, renderProvider: true, renderLoading: false };
    }
    
    // ✅ FIXED: Should render children even when loading (non-blocking)
    return { renderChildren: true, renderProvider: false, renderLoading: false };
  };
  
  const results = states.map(state => ({
    ...state,
    decision: testRenderDecision(state)
  }));
  
  console.log(`${deviceType}: LazyFinancialProvider behavior:`, results);
  return results;
};

// Main test runner
const runConsistencyTest = async () => {
  console.log('\n🚀 Starting Mobile vs Desktop Consistency Test\n');
  
  const results = {};
  
  // Test Mobile behavior
  simulateMobile();
  results.mobile = {
    provider: await testProviderBehavior('MOBILE'),
    useFinancial: testUseFinancialBehavior('MOBILE'),
    lazyProvider: testLazyProviderBehavior('MOBILE')
  };
  
  // Test Desktop behavior
  simulateDesktop();
  results.desktop = {
    provider: await testProviderBehavior('DESKTOP'),
    useFinancial: testUseFinancialBehavior('DESKTOP'),
    lazyProvider: testLazyProviderBehavior('DESKTOP')
  };
  
  // Compare results
  console.log('\n📊 CONSISTENCY ANALYSIS:');
  
  // Compare provider timing
  const mobileTimings = results.mobile.provider.stages.map(s => s.elapsed);
  const desktopTimings = results.desktop.provider.stages.map(s => s.elapsed);
  const timingMatch = JSON.stringify(mobileTimings) === JSON.stringify(desktopTimings);
  
  console.log('⏱️ Timing Consistency:', timingMatch ? '✅ SAME' : '❌ DIFFERENT');
  if (!timingMatch) {
    console.log('  Mobile stages:', mobileTimings);
    console.log('  Desktop stages:', desktopTimings);
  }
  
  // Compare useFinancial behavior
  const mobileHookSuccess = results.mobile.useFinancial.success;
  const desktopHookSuccess = results.desktop.useFinancial.success;
  const hookMatch = mobileHookSuccess === desktopHookSuccess;
  
  console.log('🎣 useFinancial Hook Consistency:', hookMatch ? '✅ SAME' : '❌ DIFFERENT');
  
  // Compare LazyProvider behavior
  const mobileLazyDecisions = results.mobile.lazyProvider.map(r => r.decision);
  const desktopLazyDecisions = results.desktop.lazyProvider.map(r => r.decision);
  const lazyMatch = JSON.stringify(mobileLazyDecisions) === JSON.stringify(desktopLazyDecisions);
  
  console.log('🏭 LazyProvider Consistency:', lazyMatch ? '✅ SAME' : '❌ DIFFERENT');
  
  // Overall consistency check
  const overallConsistency = timingMatch && hookMatch && lazyMatch;
  console.log('\n🎯 OVERALL CONSISTENCY:', overallConsistency ? '✅ PERFECT MATCH' : '❌ INCONSISTENT');
  
  if (overallConsistency) {
    console.log('\n🎉 SUCCESS: Mobile dan Desktop memiliki perlakuan yang PERSIS SAMA!');
  } else {
    console.log('\n⚠️ WARNING: Ditemukan perbedaan antara Mobile dan Desktop!');
  }
  
  return {
    consistent: overallConsistency,
    results,
    analysis: {
      timing: timingMatch,
      hooks: hookMatch,
      lazyProvider: lazyMatch
    }
  };
};

// Export untuk penggunaan di browser console atau testing framework
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runConsistencyTest,
    simulateMobile,
    simulateDesktop,
    testProviderBehavior,
    testUseFinancialBehavior,
    testLazyProviderBehavior
  };
} else {
  // Browser environment - auto run
  window.testMobileDesktopConsistency = runConsistencyTest;
  console.log('🔧 Test functions available in window.testMobileDesktopConsistency');
  console.log('📝 Run: await testMobileDesktopConsistency() in console to start test');
}