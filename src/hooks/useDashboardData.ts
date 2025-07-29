// hooks/useDashboardData.ts
import { useMemo, useState, useEffect } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useOrder } from '@/components/orders/context/OrderContext';
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
  outstandingInvoices: number;
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

  // 📊 Stats Calculation
  const stats: DashboardStats = useMemo(() => {
    try {
      const { filteredOrders } = filteredData;
      
      const revenue = calculateGrossRevenue(filteredOrders);
      const ordersCount = filteredOrders.length;
      const profit = revenue * 0.3; // 30% profit estimate
      const outstandingInvoices = filteredOrders.filter(
        order => order?.status === 'BELUM LUNAS'
      ).length;

      return {
        revenue,
        orders: ordersCount,
        profit,
        outstandingInvoices
      };
    } catch (err) {
      logger.error('Dashboard - Stats calculation error:', err);
      return { revenue: 0, orders: 0, profit: 0, outstandingInvoices: 0 };
    }
  }, [filteredData]);

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