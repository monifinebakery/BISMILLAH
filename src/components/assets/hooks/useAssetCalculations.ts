// src/components/assets/hooks/useAssetCalculations.ts

import { useMemo } from 'react';
import { Asset, AssetStatistics } from '../types';
import { calculateAssetStatistics, sortAssets, searchAssets, filterAssetsByValueRange } from '../utils';

interface UseAssetCalculationsProps {
  assets: Asset[];
  searchTerm?: string;
  sortBy?: 'nama' | 'nilaiAwal' | 'nilaiSaatIni' | 'tanggalPembelian' | 'kategori' | 'kondisi';
  sortDirection?: 'asc' | 'desc';
  minValue?: number;
  maxValue?: number;
  valueType?: 'nilaiAwal' | 'nilaiSaatIni';
}

interface UseAssetCalculationsReturn {
  statistics: AssetStatistics;
  filteredAssets: Asset[];
  totalValue: number;
  averageValue: number;
  depreciation: {
    total: number;
    percentage: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
    totalValue: number;
  }>;
  conditionDistribution: Array<{
    condition: string;
    count: number;
    percentage: number;
    totalValue: number;
  }>;
}

/**
 * Hook for asset calculations and statistics
 */
export const useAssetCalculations = ({
  assets,
  searchTerm = '',
  sortBy,
  sortDirection = 'asc',
  minValue,
  maxValue,
  valueType = 'nilaiSaatIni',
}: UseAssetCalculationsProps): UseAssetCalculationsReturn => {
  
  // Memoized filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let filtered = [...assets];
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = searchAssets(filtered, searchTerm);
    }
    
    // Apply value range filter
    if (minValue !== undefined && maxValue !== undefined) {
      filtered = filterAssetsByValueRange(filtered, minValue, maxValue, valueType);
    }
    
    // Apply sorting
    if (sortBy) {
      filtered = sortAssets(filtered, sortBy, sortDirection);
    }
    
    return filtered;
  }, [assets, searchTerm, minValue, maxValue, valueType, sortBy, sortDirection]);

  // Memoized statistics
  const statistics = useMemo(() => {
    return calculateAssetStatistics(assets);
  }, [assets]);

  // Memoized calculations
  const calculations = useMemo(() => {
    const totalCurrentValue = filteredAssets.reduce((sum, asset) => sum + asset.nilaiSaatIni, 0);
    const totalOriginalValue = filteredAssets.reduce((sum, asset) => sum + asset.nilaiAwal, 0);
    const averageCurrentValue = filteredAssets.length > 0 ? totalCurrentValue / filteredAssets.length : 0;
    
    const totalDepreciation = totalOriginalValue - totalCurrentValue;
    const depreciationPercentage = totalOriginalValue > 0 ? (totalDepreciation / totalOriginalValue) * 100 : 0;

    return {
      totalValue: totalCurrentValue,
      averageValue: averageCurrentValue,
      depreciation: {
        total: totalDepreciation,
        percentage: depreciationPercentage,
      },
    };
  }, [filteredAssets]);

  // Memoized category distribution
  const categoryDistribution = useMemo(() => {
    const totalAssets = filteredAssets.length;
    const categoryMap = new Map<string, { count: number; totalValue: number }>();

    filteredAssets.forEach(asset => {
      const existing = categoryMap.get(asset.kategori) || { count: 0, totalValue: 0 };
      categoryMap.set(asset.kategori, {
        count: existing.count + 1,
        totalValue: existing.totalValue + asset.nilaiSaatIni,
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      percentage: totalAssets > 0 ? (data.count / totalAssets) * 100 : 0,
      totalValue: data.totalValue,
    })).sort((a, b) => b.count - a.count);
  }, [filteredAssets]);

  // Memoized condition distribution
  const conditionDistribution = useMemo(() => {
    const totalAssets = filteredAssets.length;
    const conditionMap = new Map<string, { count: number; totalValue: number }>();

    filteredAssets.forEach(asset => {
      const existing = conditionMap.get(asset.kondisi) || { count: 0, totalValue: 0 };
      conditionMap.set(asset.kondisi, {
        count: existing.count + 1,
        totalValue: existing.totalValue + asset.nilaiSaatIni,
      });
    });

    return Array.from(conditionMap.entries()).map(([condition, data]) => ({
      condition,
      count: data.count,
      percentage: totalAssets > 0 ? (data.count / totalAssets) * 100 : 0,
      totalValue: data.totalValue,
    })).sort((a, b) => b.count - a.count);
  }, [filteredAssets]);

  return {
    statistics,
    filteredAssets,
    totalValue: calculations.totalValue,
    averageValue: calculations.averageValue,
    depreciation: calculations.depreciation,
    categoryDistribution,
    conditionDistribution,
  };
};