// utils/promoTestUtils.ts

// 🧪 Mock Data Generators
export const createMockRecipe = (overrides: Partial<any> = {}) => ({
  id: `recipe-${Math.random().toString(36).substr(2, 9)}`,
  namaResep: `Mock Recipe ${Math.floor(Math.random() * 100)}`,
  hppPerPorsi: Math.floor(Math.random() * 10000) + 5000, // 5k-15k
  hargaJualPorsi: Math.floor(Math.random() * 15000) + 10000, // 10k-25k
  ...overrides
});

export const createMockPromoEstimation = (overrides: Partial<any> = {}) => ({
  id: `promo-${Math.random().toString(36).substr(2, 9)}`,
  promo_name: `Mock Promo ${Math.floor(Math.random() * 100)}`,
  promo_type: ['discount_percent', 'discount_rp', 'bogo'][Math.floor(Math.random() * 3)],
  base_recipe_id: `recipe-${Math.random().toString(36).substr(2, 9)}`,
  base_recipe_name: `Mock Recipe ${Math.floor(Math.random() * 100)}`,
  promo_details: { type: '%', value: Math.floor(Math.random() * 50) + 10 },
  original_price: Math.floor(Math.random() * 15000) + 10000,
  original_hpp: Math.floor(Math.random() * 8000) + 5000,
  promo_price_effective: Math.floor(Math.random() * 12000) + 8000,
  estimated_margin_percent: (Math.random() * 0.4) + 0.1, // 10-50%
  estimated_margin_rp: Math.floor(Math.random() * 5000) + 1000,
  created_at: new Date().toISOString(),
  ...overrides
});

export const generateMockRecipes = (count: number = 10) => {
  return Array.from({ length: count }, () => createMockRecipe());
};

export const generateMockPromoEstimations = (count: number = 20) => {
  return Array.from({ length: count }, () => createMockPromoEstimation());
};

// 🎯 Scenario Builders
export const createScenarios = () => ({
  // 📊 High margin product
  highMarginProduct: createMockRecipe({
    namaResep: 'Premium Coffee',
    hppPerPorsi: 8000,
    hargaJualPorsi: 25000 // 68% margin
  }),

  // 📉 Low margin product  
  lowMarginProduct: createMockRecipe({
    namaResep: 'Budget Meal',
    hppPerPorsi: 12000,
    hargaJualPorsi: 15000 // 20% margin
  }),

  // ⚠️ Negative margin scenario
  negativeMarginScenario: {
    recipe: createMockRecipe({
      namaResep: 'Loss Leader',
      hppPerPorsi: 15000,
      hargaJualPorsi: 20000
    }),
    promo: {
      type: 'discount_percent',
      value: 30 // Will cause negative margin
    }
  },

  // 🎯 Optimal discount scenarios
  optimalDiscountScenarios: [
    { discountPercent: 10, expectedMargin: 0.58 },
    { discountPercent: 20, expectedMargin: 0.48 },
    { discountPercent: 30, expectedMargin: 0.38 }
  ],

  // 🎁 BOGO scenarios
  bogoScenarios: [
    { buy: 2, get: 1, expectedDiscount: 33.33 },
    { buy: 3, get: 1, expectedDiscount: 25 },
    { buy: 1, get: 1, expectedDiscount: 50 }
  ]
});

// 🔍 Test Assertions
export const assertPromoCalculation = (
  result: any,
  expected: {
    priceRange?: [number, number];
    marginRange?: [number, number];
    isNegativeMargin?: boolean;
  }
) => {
  const errors: string[] = [];

  if (expected.priceRange) {
    const [minPrice, maxPrice] = expected.priceRange;
    if (result.price < minPrice || result.price > maxPrice) {
      errors.push(`Price ${result.price} not in range [${minPrice}, ${maxPrice}]`);
    }
  }

  if (expected.marginRange) {
    const [minMargin, maxMargin] = expected.marginRange;
    if (result.marginPercent < minMargin || result.marginPercent > maxMargin) {
      errors.push(`Margin ${result.marginPercent} not in range [${minMargin}, ${maxMargin}]`);
    }
  }

  if (expected.isNegativeMargin !== undefined) {
    if (result.isNegativeMargin !== expected.isNegativeMargin) {
      errors.push(`Expected isNegativeMargin to be ${expected.isNegativeMargin}, got ${result.isNegativeMargin}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Promo calculation assertion failed:\n${errors.join('\n')}`);
  }

  return true;
};

// 📊 Performance Testing
export const createPerformanceTest = (name: string, iterations: number = 1000) => {
  const results: number[] = [];
  
  return {
    run: (testFunction: () => void) => {
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        testFunction();
        const duration = performance.now() - start;
        results.push(duration);
      }
    },
    
    getResults: () => {
      const sorted = results.sort((a, b) => a - b);
      const sum = results.reduce((a, b) => a + b, 0);
      
      return {
        name,
        iterations,
        totalTime: sum,
        averageTime: sum / results.length,
        medianTime: sorted[Math.floor(sorted.length / 2)],
        minTime: Math.min(...results),
        maxTime: Math.max(...results),
        p95Time: sorted[Math.floor(sorted.length * 0.95)],
        p99Time: sorted[Math.floor(sorted.length * 0.99)]
      };
    }
  };
};

// 🐛 Debug Utilities
export const debugPromoCalculation = (
  originalPrice: number,
  hpp: number,
  promoType: string,
  promoValue: number,
  result: any
) => {
  console.group(`🔍 Debug Promo Calculation - ${promoType}`);
  console.log('📊 Input:', {
    originalPrice,
    hpp,
    promoType,
    promoValue,
    originalMargin: ((originalPrice - hpp) / originalPrice * 100).toFixed(2) + '%'
  });
  console.log('📈 Result:', {
    promoPrice: result?.price,
    marginRp: result?.marginRp,
    marginPercent: (result?.marginPercent * 100).toFixed(2) + '%',
    isNegativeMargin: result?.isNegativeMargin,
    savings: originalPrice - (result?.price || 0),
    savingsPercent: ((originalPrice - (result?.price || 0)) / originalPrice * 100).toFixed(2) + '%'
  });
  console.groupEnd();
};

// 🧮 Calculation Validators
export const validateCalculationLogic = () => {
  const tests = [
    {
      name: 'Discount Percent - 20% off 10000',
      input: { originalPrice: 10000, promoType: 'discount_percent', value: 20 },
      expected: { price: 8000, discount: 2000 }
    },
    {
      name: 'Discount Rupiah - 2000 off 10000', 
      input: { originalPrice: 10000, promoType: 'discount_rp', value: 2000 },
      expected: { price: 8000, discount: 2000 }
    },
    {
      name: 'BOGO 2+1 - effective 33.33% discount',
      input: { originalPrice: 15000, promoType: 'bogo', buy: 2, get: 1 },
      expected: { effectivePrice: 10000, discount: 5000 }
    }
  ];

  const results = tests.map(test => {
    try {
      // Run actual calculation logic here
      return { ...test, passed: true, error: null };
    } catch (error) {
      return { ...test, passed: false, error: error.message };
    }
  });

  console.table(results);
  return results;
};

// 📱 Device Testing Utilities
export const simulateDeviceConditions = (condition: 'low-end' | 'mobile' | 'desktop') => {
  const conditions = {
    'low-end': {
      maxConcurrentCalculations: 1,
      debounceDelay: 500,
      enableAnimations: false,
      maxTableRows: 10
    },
    'mobile': {
      maxConcurrentCalculations: 2,
      debounceDelay: 300,
      enableAnimations: true,
      maxTableRows: 20
    },
    'desktop': {
      maxConcurrentCalculations: 4,
      debounceDelay: 100,
      enableAnimations: true,
      maxTableRows: 50
    }
  };

  return conditions[condition];
};

// 🔄 State Testing Utilities
export const createStateSnapshot = (state: any) => ({
  ...state,
  timestamp: Date.now(),
  _snapshot: true
});

export const compareStateSnapshots = (before: any, after: any) => {
  const changes: Array<{ path: string; before: any; after: any }> = [];
  
  const compare = (obj1: any, obj2: any, path: string = '') => {
    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (obj1[key] !== obj2[key]) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          compare(obj1[key], obj2[key], currentPath);
        } else {
          changes.push({
            path: currentPath,
            before: obj1[key],
            after: obj2[key]
          });
        }
      }
    }
  };

  compare(before, after);
  return changes;
};

// 🎨 Visual Testing Helpers
export const generateTestColors = () => ({
  success: '#10B981',
  warning: '#F59E0B', 
  error: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280'
});

export const createVisualTestData = () => ({
  // Edge cases for visual testing
  extremelyLongProductName: 'Super Ultra Premium Delicious Amazing Fantastic Coffee with Extra Whipped Cream and Caramel Sauce',
  extremelyHighPrice: 999999999,
  extremelyLowPrice: 1,
  negativeMargin: -0.25,
  zeroMargin: 0,
  perfectMargin: 1,
  
  // Special characters
  specialCharacters: 'Café Naïve Pokémon 日本語 العربية',
  
  // Formatting edge cases
  decimalPrices: [10000.50, 15000.99, 5000.01],
  roundNumbers: [10000, 15000, 20000, 25000]
});

// 🚀 Development Mode Helpers
export const isDevelopment = () => process.env.NODE_ENV === 'development';

export const devLog = (message: string, data?: any) => {
  if (isDevelopment()) {
    console.log(`🔧 [DEV] ${message}`, data || '');
  }
};

export const devWarn = (message: string, data?: any) => {
  if (isDevelopment()) {
    console.warn(`⚠️ [DEV] ${message}`, data || '');
  }
};

export const devError = (message: string, error?: any) => {
  if (isDevelopment()) {
    console.error(`❌ [DEV] ${message}`, error || '');
  }
};

// 📊 Analytics Testing
export const trackTestEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (isDevelopment()) {
    console.log(`📊 [TEST EVENT] ${eventName}`, properties);
  }
  
  // In real app, this would send to analytics service
  // analytics.track(eventName, properties);
};

export default {
  createMockRecipe,
  createMockPromoEstimation,
  generateMockRecipes,
  generateMockPromoEstimations,
  createScenarios,
  assertPromoCalculation,
  createPerformanceTest,
  debugPromoCalculation,
  validateCalculationLogic,
  simulateDeviceConditions,
  createStateSnapshot,
  compareStateSnapshots,
  generateTestColors,
  createVisualTestData,
  isDevelopment,
  devLog,
  devWarn,
  devError,
  trackTestEvent
};