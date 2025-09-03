// hooks/useDashboardData.ts - Enhanced with Profit Analysis Sync

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActivity } from '@/contexts/ActivityContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useOrder } from '@/components/orders/context/OrderContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { filterByDateRange, calculateGrossRevenue } from '@/components/financial/utils/financialCalculations';

import { formatCurrency } from '@/utils/formatUtils';
import { logger } from '@/utils/logger';

interface DateRange {
  from: string;
  to: string;
}

interface TrendData {
  type: 'up' | 'down' | 'flat';
  percentage: number;
  previousValue?: number;
  period?: string;
}

interface DashboardStats {
  revenue: number;
  orders: number;
  profit: number;
  mostUsedIngredient: {
    name: string;
    usageCount: number;
  };
  trends?: {
    revenue?: TrendData;
    orders?: TrendData;
    profit?: TrendData;
    mostUsedIngredient?: TrendData;
  };
  // ✅ ENHANCED: Add sync status to show if data is from profit analysis or estimates
  isFromProfitAnalysis?: boolean;
  profitAnalysisSync?: {
    currentPeriod: string;
    lastSynced: Date;
    grossMargin: number;
    netMargin: number;
    cogsSource: 'wac' | 'inventory' | 'estimated';
    isAccurate: boolean;
    dataQuality: 'high' | 'medium' | 'low';
  };
}

interface ProductSale {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
  profit?: number;
  marginPercent?: number;
}

// ✅ Helper to convert date range to period for profit analysis (timezone-safe)
const dateRangeToPeriod = (dateRange: DateRange): string => {
  const fromDate = new Date(dateRange.from);
  const year = fromDate.getFullYear();
  const month = String(fromDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// 📊 Helper function to calculate previous period
const getPreviousPeriod = (dateRange: DateRange): DateRange => {
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const diffTime = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const previousTo = new Date(fromDate);
  previousTo.setDate(previousTo.getDate() - 1);
  
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - diffDays + 1);

  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    from: format(previousFrom),
    to: format(previousTo)
  };
};

// 📈 Helper function to calculate trend
const calculateTrend = (current: number, previous: number, label: string = 'periode sebelumnya'): TrendData => {
  if (previous === 0) {
    return {
      type: current > 0 ? 'up' : 'flat',
      percentage: current > 0 ? 100 : 0,
      previousValue: previous,
      period: label
    };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  
  return {
    type: percentageChange > 1 ? 'up' : percentageChange < -1 ? 'down' : 'flat',
    percentage: Math.abs(percentageChange),
    previousValue: previous,
    period: label
  };
};

export const useDashboardData = (dateRange: DateRange) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔗 Context Hooks
  const { activities = [], loading: activitiesLoading } = useActivity() || {};
  const { bahanBaku = [] } = useBahanBaku() || {};
  const { orders = [] } = useOrder() || {};
  const { recipes = [] } = useRecipe() || {};
  const { settings = {} } = useUserSettings() || {};

  // Manual calculation without useProfitAnalysis to avoid duplicate WAC refresh
  const currentPeriod = dateRangeToPeriod(dateRange);
  const profitLoading = false;
  const profitError = null;

  // ⏳ Loading State Management
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setIsLoading(activitiesLoading);
    }, 500);

    return () => clearTimeout(loadingTimeout);
  }, [activitiesLoading]);

  // 📅 Previous Period Calculation
  const previousPeriod = useMemo(() => {
    return getPreviousPeriod(dateRange);
  }, [dateRange]);

  // 🔄 Current Period Data
  const currentData = useMemo(() => {
    try {
      const filteredOrders = dateRange?.from && dateRange?.to 
        ? filterByDateRange(orders, dateRange, 'tanggal') 
        : [];
      
      const filteredActivities = dateRange?.from && dateRange?.to 
        ? filterByDateRange(activities, dateRange, 'timestamp') 
        : [];

      return { filteredOrders, filteredActivities };
    } catch (err) {
      logger.error('Dashboard - Current data filtering error:', err);
      setError('Gagal memproses data dashboard');
      return { filteredOrders: [], filteredActivities: [] };
    }
  }, [orders, activities, dateRange]);

  // 📊 Previous Period Data
  const previousData = useMemo(() => {
    try {
      const previousOrders = filterByDateRange(orders, previousPeriod, 'tanggal');
      const previousActivities = filterByDateRange(activities, previousPeriod, 'timestamp');

      return { filteredOrders: previousOrders, filteredActivities: previousActivities };
    } catch (err) {
      logger.error('Dashboard - Previous data filtering error:', err);
      return { filteredOrders: [], filteredActivities: [] };
    }
  }, [orders, activities, previousPeriod]);

  // 🧑‍🍳 Most Used Ingredient Calculation (Current)
  const currentMostUsedIngredient = useMemo(() => {
    try {
      const { filteredOrders } = currentData;
      const ingredientUsage: Record<string, number> = {};
      
      filteredOrders.forEach(order => {
        order?.items?.forEach(item => {
          if (!item?.name) return;
          
          const recipe = recipes.find(r => r?.namaResep === item.name);
          if (!recipe?.bahanResep) return;
          
          const quantity = Number(item.quantity) || 0;
          
          recipe.bahanResep.forEach((ingredient: any) => {
            if (!ingredient?.nama) return;
            
            if (!ingredientUsage[ingredient.nama]) {
              ingredientUsage[ingredient.nama] = 0;
            }
            ingredientUsage[ingredient.nama] += quantity;
          });
        });
      });
      
      const sortedIngredients = Object.entries(ingredientUsage)
        .sort(([,a], [,b]) => b - a);
      
      if (sortedIngredients.length === 0) {
        return { name: '', usageCount: 0 };
      }
      
      const [name, usageCount] = sortedIngredients[0];
      return { name, usageCount };
    } catch (err) {
      logger.error('Dashboard - Current most used ingredient error:', err);
      return { name: '', usageCount: 0 };
    }
  }, [currentData, recipes]);

  // 🧑‍🍳 Most Used Ingredient Calculation (Previous)
  const previousMostUsedIngredient = useMemo(() => {
    try {
      const { filteredOrders } = previousData;
      const ingredientUsage: Record<string, number> = {};
      
      filteredOrders.forEach(order => {
        order?.items?.forEach(item => {
          if (!item?.name) return;
          
          const recipe = recipes.find(r => r?.namaResep === item.name);
          if (!recipe?.bahanResep) return;
          
          const quantity = Number(item.quantity) || 0;
          
          recipe.bahanResep.forEach((ingredient: any) => {
            if (!ingredient?.nama) return;
            
            if (!ingredientUsage[ingredient.nama]) {
              ingredientUsage[ingredient.nama] = 0;
            }
            ingredientUsage[ingredient.nama] += quantity;
          });
        });
      });
      
      const sortedIngredients = Object.entries(ingredientUsage)
        .sort(([,a], [,b]) => b - a);
      
      if (sortedIngredients.length === 0) {
        return { name: '', usageCount: 0 };
      }
      
      const [name, usageCount] = sortedIngredients[0];
      return { name, usageCount };
    } catch (err) {
      logger.error('Dashboard - Previous most used ingredient error:', err);
      return { name: '', usageCount: 0 };
    }
  }, [previousData, recipes]);

  // ✅ NEW: Enhanced Stats Calculation with Profit Analysis Sync
  const currentStats = useMemo(() => {
    try {
      const { filteredOrders } = currentData;
      const revenue = calculateGrossRevenue(filteredOrders, 'totalPesanan');
      const ordersCount = filteredOrders.length;
      
      // ✅ NEW: Use profit analysis data if available and current, otherwise fallback to estimate
      // Simple profit estimation (30% of revenue)
      const profit = revenue * 0.3;
      const isFromProfitAnalysis = false;
      const profitAnalysisSync = undefined;
      
      logger.info('📊 Dashboard using estimated profit (30%)', { revenue, profit });

      return {
        revenue,
        orders: ordersCount,
        profit,
        mostUsedIngredient: currentMostUsedIngredient,
        isFromProfitAnalysis,
        profitAnalysisSync
      };
    } catch (err) {
      logger.error('Dashboard - Current stats calculation error:', err);
      return { 
        revenue: 0, 
        orders: 0, 
        profit: 0, 
        mostUsedIngredient: { name: '', usageCount: 0 },
        isFromProfitAnalysis: false
      };
    }
  }, [currentData, currentMostUsedIngredient, currentPeriod]);

  // 📊 Previous Stats Calculation (using simple estimation for comparison)
  const previousStats = useMemo(() => {
    try {
      const { filteredOrders } = previousData;
      
      const revenue = calculateGrossRevenue(filteredOrders, 'totalPesanan');
      const ordersCount = filteredOrders.length;
      const profit = revenue * 0.3; // Use consistent estimation for trend comparison

      return {
        revenue,
        orders: ordersCount,
        profit,
        mostUsedIngredient: previousMostUsedIngredient
      };
    } catch (err) {
      logger.error('Dashboard - Previous stats calculation error:', err);
      return { 
        revenue: 0, 
        orders: 0, 
        profit: 0, 
        mostUsedIngredient: { name: '', usageCount: 0 } 
      };
    }
  }, [previousData, previousMostUsedIngredient]);

  // 📈 Calculate Trends
  const trends = useMemo(() => {
    try {
      const periodLabel = `periode sebelumnya`;
      
      return {
        revenue: calculateTrend(currentStats.revenue, previousStats.revenue, periodLabel),
        orders: calculateTrend(currentStats.orders, previousStats.orders, periodLabel),
        profit: calculateTrend(currentStats.profit, previousStats.profit, periodLabel),
        mostUsedIngredient: calculateTrend(
          currentMostUsedIngredient.usageCount, 
          previousMostUsedIngredient.usageCount, 
          periodLabel
        )
      };
    } catch (err) {
      logger.error('Dashboard - Trends calculation error:', err);
      return {};
    }
  }, [currentStats, previousStats, currentMostUsedIngredient, previousMostUsedIngredient]);

  // 📊 Final Stats with Trends
  const stats: DashboardStats = useMemo(() => {
    return {
      ...currentStats,
      trends
    };
  }, [currentStats, trends]);

  // ✅ NEW: Sync function to refresh profit analysis data
  const syncWithProfitAnalysis = useCallback(async () => {
    logger.info('🔄 Dashboard sync placeholder (profit analysis removed)');
  }, []);

  // 🏆 Best Selling Products
  const bestSellingProducts: ProductSale[] = useMemo(() => {
    try {
      const { filteredOrders } = currentData;
      const productSales: Record<string, { quantity: number; revenue: number; key: string }> = {};
      
      filteredOrders.forEach((order, orderIndex) => {
        order?.items?.forEach((item, itemIndex) => {
          if (!item?.name) return;
          
          const quantity = Number(item.quantity) || 0;
          const harga = Number(item.price) || 0;
          const key = `${item.name}_${orderIndex}_${itemIndex}`;
          
          if (!productSales[item.name]) {
            productSales[item.name] = { quantity: 0, revenue: 0, key };
          }
          
          productSales[item.name].quantity += quantity;
          productSales[item.name].revenue += (quantity * harga);
        });
      });
      
      return Object.entries(productSales)
        .map(([name, data]) => ({
          id: data.key,
          name,
          quantity: data.quantity,
          revenue: data.revenue,
          profit: data.revenue * 0.3, // Estimated profit
          marginPercent: 30 // Default margin
        }))
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue instead of quantity
        .slice(0, 20);
    } catch (err) {
      logger.error('Dashboard - Best selling products error:', err);
      return [];
    }
  }, [currentData]);

  // 📉 Worst Selling Products
  const worstSellingProducts: ProductSale[] = useMemo(() => {
    try {
      if (bestSellingProducts.length === 0) return [];
      
      return [...bestSellingProducts]
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5)
        .map(product => ({
          ...product,
          id: `worst_${product.id}`
        }));
    } catch (err) {
      logger.error('Dashboard - Worst selling products error:', err);
      return [];
    }
  }, [bestSellingProducts]);

  // ⚠️ Critical Stock Items
  const criticalStock = useMemo(() => {
    try {
      return bahanBaku
        .filter(item => {
          if (!item) return false;
          const currentStock = Number(item.stok) || 0;
          const minimumStock = Number(item.minimum) || 0;
          
          // Only show as critical if stock is below minimum OR
          // if stock is exactly at minimum and minimum > 0 (to avoid division by zero)
          // Add 20% buffer - only alert when stock is 20% below minimum threshold
          const alertThreshold = minimumStock > 0 ? minimumStock * 1.2 : minimumStock;
          
          return currentStock < alertThreshold;
        })
        .slice(0, 5);
    } catch (err) {
      logger.error('Dashboard - Critical stock error:', err);
      return [];
    }
  }, [bahanBaku]);

  // 📝 Recent Activities (Limited)
  const recentActivities = useMemo(() => {
    try {
      const { filteredActivities } = currentData;
      return filteredActivities.slice(0, 50);
    } catch (err) {
      logger.error('Dashboard - Recent activities error:', err);
      return [];
    }
  }, [currentData]);

  // ✅ Enhanced error handling with profit analysis errors
  const combinedError = error || profitError;

  return {
    // Data
    stats,
    bestSellingProducts,
    worstSellingProducts,
    criticalStock,
    recentActivities,
    
    // States
    isLoading,
    error: combinedError,
    
    // ✅ NEW: Profit analysis integration
    syncWithProfitAnalysis,
    
    // Raw data (for components that need it)
    orders: currentData.filteredOrders,
    activities: currentData.filteredActivities,
    settings
  };
};
