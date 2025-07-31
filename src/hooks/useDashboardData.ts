// hooks/useDashboardData.ts
import { useMemo, useState, useEffect } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useOrder } from '@/components/orders/context/OrderContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { filterByDateRange, calculateGrossRevenue } from '@/components/financial/utils/financialUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { logger } from '@/utils/logger';

interface DateRange {
  from: string;
  to: string;
}

interface DashboardStats {
  revenue: number;
  orders: number;
  profit: number;
  mostUsedIngredient: {
    name: string;
    usageCount: number;
  };
}

interface ProductSale {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
}

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

  // 🔄 Filtered Data with Error Handling
  const filteredData = useMemo(() => {
    try {
      const filteredOrders = dateRange?.from && dateRange?.to 
        ? filterByDateRange(orders, dateRange, 'tanggal') 
        : [];
      
      const filteredActivities = dateRange?.from && dateRange?.to 
        ? filterByDateRange(activities, dateRange, 'timestamp') 
        : [];

      return { filteredOrders, filteredActivities };
    } catch (err) {
      logger.error('Dashboard - Data filtering error:', err);
      setError('Gagal memproses data dashboard');
      return { filteredOrders: [], filteredActivities: [] };
    }
  }, [orders, activities, dateRange]);

  // 🧑‍🍳 Most Used Ingredient Calculation
  const mostUsedIngredient = useMemo(() => {
    try {
      const { filteredOrders } = filteredData;
      const ingredientUsage: Record<string, number> = {};
      
      // Count ingredient usage from filtered orders
      filteredOrders.forEach(order => {
        order?.items?.forEach(item => {
          if (!item?.namaBarang) return;
          
          // Find recipe for this product
          const recipe = recipes.find(r => r?.namaResep === item.namaBarang);
          if (!recipe?.bahanBaku) return;
          
          const quantity = Number(item.quantity) || 0;
          
          // Count each ingredient usage based on order quantity
          recipe.bahanBaku.forEach(ingredient => {
            if (!ingredient?.namaBahan) return;
            
            if (!ingredientUsage[ingredient.namaBahan]) {
              ingredientUsage[ingredient.namaBahan] = 0;
            }
            ingredientUsage[ingredient.namaBahan] += quantity;
          });
        });
      });
      
      // Find most used ingredient
      const sortedIngredients = Object.entries(ingredientUsage)
        .sort(([,a], [,b]) => b - a);
      
      if (sortedIngredients.length === 0) {
        return { name: '', usageCount: 0 };
      }
      
      const [name, usageCount] = sortedIngredients[0];
      return { name, usageCount };
    } catch (err) {
      logger.error('Dashboard - Most used ingredient error:', err);
      return { name: '', usageCount: 0 };
    }
  }, [filteredData, recipes]);

  // 📊 Stats Calculation
  const stats: DashboardStats = useMemo(() => {
    try {
      const { filteredOrders } = filteredData;
      
      const revenue = calculateGrossRevenue(filteredOrders, 'totalPesanan');
      const ordersCount = filteredOrders.length;
      const profit = revenue * 0.3; // 30% profit estimate

      return {
        revenue,
        orders: ordersCount,
        profit,
        mostUsedIngredient
      };
    } catch (err) {
      logger.error('Dashboard - Stats calculation error:', err);
      return { 
        revenue: 0, 
        orders: 0, 
        profit: 0, 
        mostUsedIngredient: { name: '', usageCount: 0 } 
      };
    }
  }, [filteredData, mostUsedIngredient]);

  // 🏆 Best Selling Products
  const bestSellingProducts: ProductSale[] = useMemo(() => {
    try {
      const { filteredOrders } = filteredData;
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
          revenue: data.revenue
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 20);
    } catch (err) {
      logger.error('Dashboard - Best selling products error:', err);
      return [];
    }
  }, [filteredData]);

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
      const { filteredActivities } = filteredData;
      return filteredActivities.slice(0, 50); // Limit for performance
    } catch (err) {
      logger.error('Dashboard - Recent activities error:', err);
      return [];
    }
  }, [filteredData]);

  // 👋 Greeting Function
  const greeting = useMemo(() => {
    try {
      const jam = new Date().getHours();
      let sapaan = "datang";
      if (jam >= 4 && jam < 11) sapaan = "pagi";
      else if (jam >= 11 && jam < 15) sapaan = "siang";
      else if (jam >= 15 && jam < 19) sapaan = "sore";
      else sapaan = "malam";
      
      const ownerName = settings?.ownerName;
      return ownerName ? `Selamat ${sapaan}, Kak ${ownerName}` : `Selamat ${sapaan}`;
    } catch (err) {
      logger.error('Dashboard - Greeting error:', err);
      return "Selamat datang";
    }
  }, [settings?.ownerName]);

  return {
    // Data
    stats,
    bestSellingProducts,
    worstSellingProducts,
    criticalStock,
    recentActivities,
    greeting,
    
    // States
    isLoading,
    error,
    
    // Raw data (for components that need it)
    orders: filteredData.filteredOrders,
    activities: filteredData.filteredActivities,
    settings
  };
};