// src/components/warehouse/context/hooks/useInventoryAnalysis.ts
import { useCallback, useMemo } from 'react';
import { BahanBaku } from '../../types/warehouse';
import { isValidDate } from '@/utils/unifiedDateUtils';

export const useInventoryAnalysis = (bahanBaku: BahanBaku[]) => {
  const getDaysUntilExpiry = useCallback((expiryDate: Date | null): number => {
    if (!expiryDate || !isValidDate(expiryDate)) return Infinity;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const isExpiringSoon = useCallback((item: BahanBaku, days: number = 7): boolean => {
    if (!item.tanggalKadaluwarsa) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.tanggalKadaluwarsa);
    return daysUntilExpiry <= days && daysUntilExpiry > 0;
  }, [getDaysUntilExpiry]);

  const isExpired = useCallback((item: BahanBaku): boolean => {
    if (!item.tanggalKadaluwarsa) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.tanggalKadaluwarsa);
    return daysUntilExpiry <= 0;
  }, [getDaysUntilExpiry]);

  const isLowStock = useCallback((item: BahanBaku): boolean => {
    return item.stok > 0 && item.stok <= item.minimum;
  }, []);

  const isOutOfStock = useCallback((item: BahanBaku): boolean => {
    return item.stok === 0;
  }, []);

  // Memoized analysis results
  const analysis = useMemo(() => {
    const getLowStockItems = (items: BahanBaku[] = bahanBaku): BahanBaku[] => {
      return items.filter(isLowStock);
    };

    const getOutOfStockItems = (items: BahanBaku[] = bahanBaku): BahanBaku[] => {
      return items.filter(isOutOfStock);
    };

    const getExpiringItems = (days: number = 7, items: BahanBaku[] = bahanBaku): BahanBaku[] => {
      return items.filter(item => isExpiringSoon(item, days));
    };

    const getExpiredItems = (items: BahanBaku[] = bahanBaku): BahanBaku[] => {
      return items.filter(isExpired);
    };

    const getCriticalItems = (items: BahanBaku[] = bahanBaku): BahanBaku[] => {
      return items.filter(item => 
        isOutOfStock(item) || 
        isExpired(item) || 
        isExpiringSoon(item, 3)
      );
    };

    const getWarningItems = (items: BahanBaku[] = bahanBaku): BahanBaku[] => {
      return items.filter(item => 
        isLowStock(item) || 
        isExpiringSoon(item, 7)
      );
    };

    const getInventoryStats = (items: BahanBaku[] = bahanBaku) => {
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + (item.stok * item.hargaSatuan), 0);
      const lowStockCount = getLowStockItems(items).length;
      const outOfStockCount = getOutOfStockItems(items).length;
      const expiringCount = getExpiringItems(7, items).length;
      const expiredCount = getExpiredItems(items).length;
      
      // Category breakdown
      const categories = items.reduce((acc, item) => {
        acc[item.kategori] = (acc[item.kategori] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Stock levels
      const stockLevels = {
        safe: items.filter(item => item.stok > item.minimum * 1.5).length,
        low: lowStockCount,
        critical: outOfStockCount,
      };

      return {
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount,
        expiringCount,
        expiredCount,
        categories,
        stockLevels,
      };
    };

    return {
      getLowStockItems,
      getOutOfStockItems,
      getExpiringItems,
      getExpiredItems,
      getCriticalItems,
      getWarningItems,
      getInventoryStats,
    };
  }, [bahanBaku, isLowStock, isOutOfStock, isExpiringSoon, isExpired]);

  return {
    getDaysUntilExpiry,
    isExpiringSoon,
    isExpired,
    isLowStock,
    isOutOfStock,
    ...analysis,
  };
};