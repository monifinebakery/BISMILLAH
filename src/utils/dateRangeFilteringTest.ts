// src/utils/dateRangeFilteringTest.ts
// Test script to validate date range filtering consistency across all modules

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { createStandardDateRange, validateDateRange } from '@/utils/standardDateRangeFiltering';

// Import APIs from various modules
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';
import { getWarehouseDataByDateRange } from '@/components/warehouse/services/warehouseApi';
import orderApi from '@/components/orders/api/orderApi';
import { PurchaseApiService } from '@/components/purchase/services/purchaseApi';

/**
 * Test date range filtering consistency across all modules
 */
export const testDateRangeFilteringConsistency = async (userId: string) => {
  const results: any = {};
  
  try {
    // Create standard 30-day date range for testing
    const { startDate, endDate } = createStandardDateRange('last30days');
    
    console.log('🧪 Testing date range filtering consistency:', {
      userId,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
    
    // Validate date range
    const validation = validateDateRange(startDate, endDate);
    if (!validation.isValid) {
      throw new Error(`Invalid date range: ${validation.error}`);
    }
    
    results.dateRange = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      validation
    };
    
    // Test 1: Financial Transactions (baseline)
    console.log('📊 Testing financial transactions...');
    const { data: financialData, error: financialError } = await supabase
      .from('financial_transactions')
      .select('id, type, amount, category, description, date, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    results.financial = {
      success: !financialError,
      error: financialError?.message,
      count: financialData?.length || 0,
      data: financialData?.slice(0, 3) || []
    };
    
    // Test 2: Operational Costs (FIXED)
    console.log('💰 Testing operational costs...');
    const costResults = await operationalCostApi.getCostsByDateRange(startDate, endDate, userId);
    
    results.operationalCosts = {
      success: !costResults.error,
      error: costResults.error,
      count: costResults.data.length,
      data: costResults.data.slice(0, 3).map(c => ({
        nama: c.nama_biaya,
        jumlah: c.jumlah_per_bulan,
        created_at: c.created_at
      }))
    };
    
    // Test 3: Warehouse Materials (FIXED)
    console.log('📦 Testing warehouse materials...');
    try {
      const warehouseData = await getWarehouseDataByDateRange(userId, startDate, endDate);
      
      results.warehouse = {
        success: true,
        error: null,
        count: warehouseData.length,
        data: warehouseData.slice(0, 3).map(m => ({
          nama: m.nama,
          stok: m.stok,
          harga: m.harga,
          created_at: m.createdAt
        }))
      };
    } catch (warehouseError) {
      results.warehouse = {
        success: false,
        error: warehouseError instanceof Error ? warehouseError.message : 'Warehouse query failed',
        count: 0,
        data: []
      };
    }
    
    // Test 4: Orders
    console.log('📋 Testing orders...');
    try {
      const ordersData = await orderApi.searchOrders(userId, {
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString()
      });
      
      results.orders = {
        success: true,
        error: null,
        count: ordersData.length,
        data: ordersData.slice(0, 3).map(o => ({
          nomor: o.nomorPesanan,
          pelanggan: o.namaPelanggan,
          total: o.totalPesanan,
          created_at: o.createdAt
        }))
      };
    } catch (ordersError) {
      results.orders = {
        success: false,
        error: ordersError instanceof Error ? ordersError.message : 'Orders query failed',
        count: 0,
        data: []
      };
    }
    
    // Test 5: Purchases
    console.log('🛒 Testing purchases...');
    try {
      const purchaseResults = await PurchaseApiService.getPurchasesByDateRange(userId, startDate, endDate);
      
      results.purchases = {
        success: !purchaseResults.error,
        error: purchaseResults.error,
        count: purchaseResults.data?.length || 0,
        data: purchaseResults.data?.slice(0, 3).map(p => ({
          supplier: p.supplier,
          total: p.total_nilai,
          tanggal: p.tanggal,
          created_at: p.createdAt
        })) || []
      };
    } catch (purchaseError) {
      results.purchases = {
        success: false,
        error: purchaseError instanceof Error ? purchaseError.message : 'Purchases query failed',
        count: 0,
        data: []
      };
    }
    
    // Generate summary
    const successfulModules = Object.entries(results)
      .filter(([key, value]: [string, any]) => key !== 'dateRange' && value.success)
      .map(([key]) => key);
    
    const failedModules = Object.entries(results)
      .filter(([key, value]: [string, any]) => key !== 'dateRange' && !value.success)
      .map(([key, value]: [string, any]) => ({ module: key, error: value.error }));
    
    results.summary = {
      totalModules: 5,
      successfulModules: successfulModules.length,
      failedModules: failedModules.length,
      successful: successfulModules,
      failed: failedModules,
      allConsistent: failedModules.length === 0
    };
    
    console.log('🎯 Date Range Filtering Test Results:', {
      summary: results.summary,
      dateRange: results.dateRange
    });
    
    return results;
    
  } catch (error) {
    logger.error('❌ Date range filtering test failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Test failed',
      results
    };
  }
};

/**
 * Browser console helper for manual testing
 */
export const runDateRangeTest = () => {
  console.log(`
🧪 Date Range Filtering Test

Copy and paste this into your browser console to test:

// Test the date range filtering consistency
(async () => {
  const { testDateRangeFilteringConsistency } = await import('/src/utils/dateRangeFilteringTest.ts');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ User not authenticated');
    return;
  }
  
  console.log('🧪 Running date range filtering test for user:', user.id);
  const results = await testDateRangeFilteringConsistency(user.id);
  
  console.log('📊 Test Results:', results);
  
  if (results.summary?.allConsistent) {
    console.log('✅ ALL MODULES ARE CONSISTENT! 🎉');
  } else {
    console.log('❌ Some modules have inconsistencies:', results.summary?.failed);
  }
})();
  `);
};

/**
 * Quick test for specific date range
 */
export const quickDateRangeTest = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log('⚡ Quick date range test:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  
  const promises = [
    // Financial (baseline)
    supabase
      .from('financial_transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    
    // Operational costs
    operationalCostApi.getCostsByDateRange(startDate, endDate, userId),
    
    // Orders
    orderApi.searchOrders(userId, {
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString()
    }),
    
    // Purchases
    PurchaseApiService.getPurchasesByDateRange(userId, startDate, endDate)
  ];
  
  const [financial, costs, orders, purchases] = await Promise.allSettled(promises);
  
  const summary = {
    financial: financial.status === 'fulfilled' ? 
      { count: financial.value.data?.length || 0, success: !financial.value.error } :
      { count: 0, success: false, error: financial.reason },
    costs: costs.status === 'fulfilled' ? 
      { count: costs.value.data.length, success: !costs.value.error } :
      { count: 0, success: false, error: costs.reason },
    orders: orders.status === 'fulfilled' ? 
      { count: orders.value.length, success: true } :
      { count: 0, success: false, error: orders.reason },
    purchases: purchases.status === 'fulfilled' ? 
      { count: purchases.value.data?.length || 0, success: !purchases.value.error } :
      { count: 0, success: false, error: purchases.reason }
  };
  
  console.log('⚡ Quick test results:', summary);
  return summary;
};
