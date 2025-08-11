// hooks/useDashboardData.ts - Enhanced with Trend Calculation

import { useMemo, useState, useEffect } from 'react';
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
}

interface ProductSale {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
  profit?: number;
  marginPercent?: number;
}

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

  return {
    from: previousFrom.toISOString().split('T')[0],
    to: previousTo.toISOString().split('T')[0]
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
          if (!item?.namaBarang) return;
          
          const recipe = recipes.find(r => r?.namaResep === item.namaBarang);
          if (!recipe?.bahanBaku) return;
          
          const quantity = Number(item.quantity) || 0;
          
          recipe.bahanBaku.forEach(ingredient => {
            if (!ingredient?.namaBahan) return;
            
            if (!ingredientUsage[ingredient.namaBahan]) {
              ingredientUsage[ingredient.namaBahan] = 0;
            }
            ingredientUsage[ingredient.namaBahan] += quantity;
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
          if (!item?.namaBarang) return;
          
          const recipe = recipes.find(r => r?.namaResep === item.namaBarang);
          if (!recipe?.bahanBaku) return;
          
          const quantity = Number(item.quantity) || 0;
          
          recipe.bahanBaku.forEach(ingredient => {
            if (!ingredient?.namaBahan) return;
            
            if (!ingredientUsage[ingredient.namaBahan]) {
              ingredientUsage[ingredient.namaBahan] = 0;
            }
            ingredientUsage[ingredient.namaBahan] += quantity;
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

  // 📊 Current Stats Calculation
  const currentStats = useMemo(() => {
    try {
      const { filteredOrders } = currentData;
      
      const revenue = calculateGrossRevenue(filteredOrders, 'totalPesanan');
      const ordersCount = filteredOrders.length;
      const profit = revenue * 0.3;

      return {
        revenue,
        orders: ordersCount,
        profit,
        mostUsedIngredient: currentMostUsedIngredient
      };
    } catch (err) {
      logger.error('Dashboard - Current stats calculation error:', err);
      return { 
        revenue: 0, 
        orders: 0, 
        profit: 0, 
        mostUsedIngredient: { name: '', usageCount: 0 } 
      };
    }
  }, [currentData, currentMostUsedIngredient]);

  // 📊 Previous Stats Calculation
  const previousStats = useMemo(() => {
    try {
      const { filteredOrders } = previousData;
      
      const revenue = calculateGrossRevenue(filteredOrders, 'totalPesanan');
      const ordersCount = filteredOrders.length;
      const profit = revenue * 0.3;

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

  // 🏆 Best Selling Products
  const bestSellingProducts: ProductSale[] = useMemo(() => {
    try {
      const { filteredOrders } = currentData;
      const productSales: Record<string, { quantity: number; revenue: number; key: string }> = {};
      
      filteredOrders.forEach((order, orderIndex) => {
        order?.items?.forEach((item, itemIndex) => {
          if (!item?.namaBarang) return;
          
          const quantity = Number(item.quantity) || 0;
          const harga = Number(item.hargaSatuan) || 0;
          const key = `${item.namaBarang}_${orderIndex}_${itemIndex}`;
          
          if (!productSales[item.namaBarang]) {
            productSales[item.namaBarang] = { quantity: 0, revenue: 0, key };
          }
          
          productSales[item.namaBarang].quantity += quantity;
          productSales[item.namaBarang].revenue += (quantity * harga);
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
        .filter(item => item && Number(item.stok) <= Number(item.minimum))
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

  return {
    // Data
    stats,
    bestSellingProducts,
    worstSellingProducts,
    criticalStock,
    recentActivities,
    
    // States
    isLoading,
    error,
    
    // Raw data (for components that need it)
    orders: currentData.filteredOrders,
    activities: currentData.filteredActivities,
    settings
  };
};