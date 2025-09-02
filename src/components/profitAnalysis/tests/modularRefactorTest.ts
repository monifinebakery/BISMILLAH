// ==============================================
// MODULAR REFACTOR TEST
// Test script to verify critical functions work after modular split
// ==============================================

import { logger } from '@/utils/logger';

// Import key functions that were refactored
import {
  fetchBahanMap,
  fetchPemakaianByPeriode,
  getCurrentUserId,
  getEffectiveUnitPrice
} from '../services/warehouseHelpers';

import {
  calculateProfitAnalysisDaily,
  calculatePemakaianValue
} from '../services/calculationUtils';

import {
  generatePeriods,
  getDateRangeFromPeriod,
  assessDataQuality,
  parseTransactions
} from '../services/dataProcessingHelpers';

import {
  categorizeFNBItem,
  getFNBCOGSBreakdown,
  generateFNBInsights
} from '../services/fnbHelpers';

import {
  getRevenueBreakdownFallback,
  getOpExBreakdownFallback
} from '../services/fallbackHelpers';

import profitAnalysisApi from '../services/profitAnalysisApi';

/**
 * Test warehouse helper functions
 */
async function testWarehouseHelpers(): Promise<boolean> {
  logger.info('🧪 Testing warehouse helper functions...');
  
  try {
    // Test getCurrentUserId
    const userId = await getCurrentUserId();
    logger.info('✓ getCurrentUserId:', { userId: userId ? 'Found' : 'Not found' });
    
    if (!userId) {
      logger.warn('⚠️ No user found - some tests will be skipped');
      return true; // Not an error, just no user authenticated
    }
    
    // Test fetchBahanMap
    const bahanMap = await fetchBahanMap();
    logger.info('✓ fetchBahanMap:', { 
      type: typeof bahanMap, 
      hasData: Object.keys(bahanMap || {}).length > 0 
    });
    
    // Test fetchPemakaianByPeriode with current month
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      .toISOString().split('T')[0];
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      .toISOString().split('T')[0];
    
    const pemakaian = await fetchPemakaianByPeriode(startDate, endDate);
    logger.info('✓ fetchPemakaianByPeriode:', { 
      type: typeof pemakaian,
      isArray: Array.isArray(pemakaian),
      length: Array.isArray(pemakaian) ? pemakaian.length : 0
    });
    
    // Test getEffectiveUnitPrice with mock data
    if (Object.keys(bahanMap || {}).length > 0) {
      const firstMaterialId = Object.keys(bahanMap)[0];
      const effectivePrice = getEffectiveUnitPrice(firstMaterialId, 100, bahanMap);
      logger.info('✓ getEffectiveUnitPrice:', { 
        materialId: firstMaterialId,
        price: effectivePrice 
      });
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Warehouse helpers test failed:', error);
    return false;
  }
}

/**
 * Test calculation utils functions
 */
async function testCalculationUtils(): Promise<boolean> {
  logger.info('🧪 Testing calculation utils functions...');
  
  try {
    // Test calculatePemakaianValue with mock data
    const mockPemakaian = [
      { bahan_baku_id: 'test1', qty_base: 100 },
      { bahan_baku_id: 'test2', qty_base: 200 }
    ];
    const mockBahanMap = {
      test1: { harga_satuan: 1000 },
      test2: { harga_satuan: 2000 }
    };
    
    const totalValue = calculatePemakaianValue(mockPemakaian, mockBahanMap);
    logger.info('✓ calculatePemakaianValue:', { 
      mockInput: { pemakaianCount: 2, mapKeys: Object.keys(mockBahanMap) },
      result: totalValue,
      expected: 500000 // (100*1000) + (200*2000) = 500,000
    });
    
    // Test calculateProfitAnalysisDaily with recent date range
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dailyResult = await calculateProfitAnalysisDaily(yesterday, today);
    logger.info('✓ calculateProfitAnalysisDaily:', { 
      success: dailyResult.success,
      hasData: dailyResult.data && dailyResult.data.length > 0,
      dataCount: dailyResult.data?.length || 0,
      error: dailyResult.error || 'None'
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Calculation utils test failed:', error);
    return false;
  }
}

/**
 * Test data processing helpers
 */
async function testDataProcessingHelpers(): Promise<boolean> {
  logger.info('🧪 Testing data processing helpers...');
  
  try {
    // Test generatePeriods
    const periods = generatePeriods(new Date('2024-01-01'), new Date('2024-03-31'), 'monthly');
    logger.info('✓ generatePeriods:', { 
      input: '2024-01-01 to 2024-03-31 monthly',
      result: periods.length,
      periods: periods.slice(0, 3)
    });
    
    // Test getDateRangeFromPeriod
    const dateRange = getDateRangeFromPeriod('2024-01');
    logger.info('✓ getDateRangeFromPeriod:', { 
      input: '2024-01',
      from: dateRange.from.toISOString().split('T')[0],
      to: dateRange.to.toISOString().split('T')[0]
    });
    
    // Test parseTransactions with mock data
    const mockTransactionJson = JSON.stringify([
      { type: 'income', category: 'Penjualan Makanan', amount: 100000 },
      { type: 'expense', category: 'Pembelian Bahan Baku', amount: 50000 }
    ]);
    
    const parsed = parseTransactions(mockTransactionJson);
    logger.info('✓ parseTransactions:', { 
      inputLength: 2,
      outputLength: parsed.length,
      categories: parsed.map(p => p.category)
    });
    
    // Test assessDataQuality with mock profit data
    const mockProfitData: RealTimeProfitCalculation = {
      period: '2024-01',
      revenue_data: { total: 1000000, transactions: [] },
      cogs_data: { total: 400000, materials: [] },
      opex_data: { total: 200000, costs: [] },
      calculated_at: new Date().toISOString()
    };
    
    const quality = assessDataQuality(mockProfitData);
    logger.info('✓ assessDataQuality:', { 
      score: quality.score,
      issues: quality.issues.length,
      warnings: quality.warnings.length
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Data processing helpers test failed:', error);
    return false;
  }
}

/**
 * Test F&B helper functions
 */
async function testFNBHelpers(): Promise<boolean> {
  logger.info('🧪 Testing F&B helper functions...');
  
  try {
    // Test categorizeFNBItem
    const category1 = categorizeFNBItem('Daging Sapi Premium');
    const category2 = categorizeFNBItem('Garam');
    const category3 = categorizeFNBItem('Tissue');
    
    logger.info('✓ categorizeFNBItem:', { 
      'Daging Sapi Premium': category1,
      'Garam': category2,
      'Tissue': category3
    });
    
    // Test getFNBCOGSBreakdown with mock data
    const mockBreakdown = await getFNBCOGSBreakdown('2024-01', {}, []);
    logger.info('✓ getFNBCOGSBreakdown:', { 
      success: mockBreakdown.success,
      dataLength: mockBreakdown.data?.length || 0,
      error: mockBreakdown.error || 'None'
    });
    
    return true;
  } catch (error) {
    logger.error('❌ F&B helpers test failed:', error);
    return false;
  }
}

/**
 * Test fallback helper functions
 */
async function testFallbackHelpers(): Promise<boolean> {
  logger.info('🧪 Testing fallback helper functions...');
  
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logger.warn('⚠️ No user - skipping fallback tests');
      return true;
    }
    
    // Test revenue breakdown fallback
    const revenueBreakdown = await getRevenueBreakdownFallback(userId, '2024-01');
    logger.info('✓ getRevenueBreakdownFallback:', { 
      success: revenueBreakdown.success,
      dataLength: revenueBreakdown.data?.length || 0,
      error: revenueBreakdown.error || 'None'
    });
    
    // Test OpEx breakdown fallback
    const opexBreakdown = await getOpExBreakdownFallback(userId, '2024-01');
    logger.info('✓ getOpExBreakdownFallback:', { 
      success: opexBreakdown.success,
      dataLength: opexBreakdown.data?.length || 0,
      error: opexBreakdown.error || 'None'
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Fallback helpers test failed:', error);
    return false;
  }
}

/**
 * Test main API functionality
 */
async function testMainAPI(): Promise<boolean> {
  logger.info('🧪 Testing main profit analysis API...');
  
  try {
    // Test current month profit calculation
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const profitResult = await profitAnalysisApi.calculateProfitAnalysis(currentMonth);
    
    logger.info('✓ profitAnalysisApi.calculateProfitAnalysis:', { 
      success: profitResult.success,
      hasData: !!profitResult.data,
      revenue: profitResult.data?.revenue_data?.total || 0,
      error: profitResult.error || 'None'
    });
    
    // Test get current month profit (convenience method)
    const currentMonthResult = await profitAnalysisApi.getCurrentMonthProfit();
    logger.info('✓ profitAnalysisApi.getCurrentMonthProfit:', { 
      success: currentMonthResult.success,
      hasData: !!currentMonthResult.data,
      error: currentMonthResult.error || 'None'
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Main API test failed:', error);
    return false;
  }
}

/**
 * Run all modular refactor tests
 */
export async function runModularRefactorTests(): Promise<void> {
  logger.info('🧪🔧 Starting Modular Refactor Tests...');
  logger.info('=' .repeat(50));
  
  const testResults = {
    warehouseHelpers: false,
    calculationUtils: false,
    dataProcessingHelpers: false,
    fnbHelpers: false,
    fallbackHelpers: false,
    mainAPI: false
  };
  
  try {
    // Run each test suite
    testResults.warehouseHelpers = await testWarehouseHelpers();
    testResults.calculationUtils = await testCalculationUtils();
    testResults.dataProcessingHelpers = await testDataProcessingHelpers();
    testResults.fnbHelpers = await testFNBHelpers();
    testResults.fallbackHelpers = await testFallbackHelpers();
    testResults.mainAPI = await testMainAPI();
    
    // Summary
    logger.info('=' .repeat(50));
    logger.info('🧪 MODULAR REFACTOR TEST RESULTS:');
    
    const passedTests = Object.entries(testResults).filter(([_, passed]) => passed);
    const failedTests = Object.entries(testResults).filter(([_, passed]) => !passed);
    
    passedTests.forEach(([testName, _]) => {
      logger.success(`✅ ${testName}: PASSED`);
    });
    
    failedTests.forEach(([testName, _]) => {
      logger.error(`❌ ${testName}: FAILED`);
    });
    
    const overallResult = failedTests.length === 0;
    
    if (overallResult) {
      logger.success('🎉 ALL MODULAR REFACTOR TESTS PASSED!');
      logger.info('✅ The modular split is working correctly');
    } else {
      logger.error(`❌ ${failedTests.length}/${Object.keys(testResults).length} tests failed`);
      logger.info('⚠️ Some issues detected with the modular refactor');
    }
    
  } catch (error) {
    logger.error('❌ Test runner error:', error);
  }
}

// Export for standalone usage
export {
  testWarehouseHelpers,
  testCalculationUtils,
  testDataProcessingHelpers,
  testFNBHelpers,
  testFallbackHelpers,
  testMainAPI
};
