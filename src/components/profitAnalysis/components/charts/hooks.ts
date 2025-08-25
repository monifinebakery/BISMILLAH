// src/components/profitAnalysis/components/charts/hooks.ts

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TrendData, AdvancedAnalytics, PeriodComparison, TrendAnalysis } from './types';
import { RealTimeProfitCalculation } from '../../types/profitAnalysis.types';
import { CHART_CONFIG } from '../../constants/profitConstants';
import { 
  linearRegressionForecast, 
  exponentialSmoothingForecast, 
  calculateStatistics, 
  detectAnomalies
} from '../../utils/advancedAnalytics';

// ==============================================
// MAIN CHART STATE HOOK
// ==============================================

export interface UseProfitTrendChartProps {
  profitHistory: RealTimeProfitCalculation[];
  effectiveCogs?: number;
  wacStockValue?: number;
  processTrendData: (history: RealTimeProfitCalculation[], cogs?: number, wac?: number) => TrendData[];
  analyzeTrend: (data: TrendData[]) => TrendAnalysis;
}

export function useProfitTrendChart({
  profitHistory,
  effectiveCogs,
  wacStockValue,
  processTrendData,
  analyzeTrend
}: UseProfitTrendChartProps) {
  // Basic state
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'grossProfit', 'netProfit']);
  const [viewType, setViewType] = useState<'values' | 'margins'>('values');
  
  // Performance optimization state
  const dataProcessingRef = useRef<{ cache: Map<string, TrendData[]>, isProcessing: boolean }>({
    cache: new Map(),
    isProcessing: false
  });
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  
  // Interactive state
  const [hiddenMetrics, setHiddenMetrics] = useState(new Set<string>());
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  
  // Advanced analytics state
  const [showForecast, setShowForecast] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Data processing with caching
  const trendData = useMemo(() => {
    const cacheKey = `${JSON.stringify(profitHistory.slice(0, 5))}_${effectiveCogs}_${wacStockValue}_${selectedMetrics.join(',')}`;
    
    if (dataProcessingRef.current.cache.has(cacheKey)) {
      setIsDataReady(true);
      return dataProcessingRef.current.cache.get(cacheKey);
    }
    
    const data = processTrendData(profitHistory, effectiveCogs, wacStockValue);
    dataProcessingRef.current.cache.set(cacheKey, data);
    setIsDataReady(true);
    
    return data;
  }, [profitHistory, effectiveCogs, wacStockValue, selectedMetrics, processTrendData]);

  // Trend analysis
  const trendAnalysis = useMemo(() => {
    if (!isDataReady || trendData.length === 0) return null;
    return analyzeTrend(trendData);
  }, [trendData, isDataReady, analyzeTrend]);

  // Metric configurations
  const metricConfigs = useMemo(() => ({
    revenue: { key: 'revenue', label: 'Omset', color: CHART_CONFIG.colors.revenue, axis: 'left' },
    // Profit metrics share the same skala dengan revenue sehingga ditempatkan di sumbu kiri
    grossProfit: { key: 'grossProfit', label: 'Untung Kotor', color: CHART_CONFIG.colors.primary, axis: 'left' },
    netProfit: { key: 'netProfit', label: 'Untung Bersih', color: '#dc2626', axis: 'left' },
    cogs: { key: 'cogs', label: 'Modal Bahan', color: CHART_CONFIG.colors.cogs, axis: 'left' },
    opex: { key: 'opex', label: 'Biaya Tetap', color: CHART_CONFIG.colors.opex, axis: 'left' },
    grossMargin: { key: 'grossMargin', label: 'Margin Kotor', color: CHART_CONFIG.colors.primary, axis: 'right', isPercentage: true },
    netMargin: { key: 'netMargin', label: 'Margin Bersih', color: '#dc2626', axis: 'right', isPercentage: true },
    stockValue: { key: 'stockValue', label: 'Nilai Stok (WAC)', color: CHART_CONFIG.colors.warning, axis: 'left' }
  }), []);

  // Auto-update selectedMetrics when viewType changes
  useEffect(() => {
    if (viewType === 'margins') {
      setSelectedMetrics(['grossMargin', 'netMargin']);
    } else {
      setSelectedMetrics(['revenue', 'grossProfit', 'netProfit']);
    }
  }, [viewType]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Swipe gestures for chart type switching (mobile only)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      // Could emit events for parent component to handle chart type changes
      console.log('Swipe detected:', deltaX > 0 ? 'right' : 'left');
    }
  }, [touchStart]);

  return {
    // State
    selectedMetrics,
    setSelectedMetrics,
    viewType,
    setViewType,
    isDataReady,
    isMobile,
    hiddenMetrics,
    setHiddenMetrics,
    hoveredMetric,
    setHoveredMetric,
    showForecast,
    setShowForecast,
    showAnomalies,
    setShowAnomalies,
    showComparison,
    setShowComparison,
    selectedPeriods,
    setSelectedPeriods,
    
    // Data
    trendData,
    trendAnalysis,
    metricConfigs,
    
    // Handlers
    handleTouchStart,
    handleTouchEnd
  };
}

// ==============================================
// ADVANCED ANALYTICS HOOK
// ==============================================

export function useAdvancedAnalytics(trendData: TrendData[], isDataReady: boolean): AdvancedAnalytics | null {
  return useMemo(() => {
    if (!isDataReady || trendData.length < 3) return null;
    
    const values = trendData.map((d: TrendData) => d.netProfit);
    const revenues = trendData.map((d: TrendData) => d.revenue);
    
    // Generate forecasts
    const linearForecast = linearRegressionForecast(values, 3);
    const expForecast = exponentialSmoothingForecast(values, 0.3, 3);
    
    // Calculate statistics
    const statistics = calculateStatistics(values);
    const revenueStats = calculateStatistics(revenues);
    
    // Detect anomalies
    const anomalies = detectAnomalies(values, 2);
    
    return {
      forecast: {
        linear: linearForecast,
        exponential: expForecast
      },
      statistics: {
        profit: statistics,
        revenue: revenueStats
      },
      anomalies
    };
  }, [trendData, isDataReady]);
}

// ==============================================
// PERIOD COMPARISON HOOK
// ==============================================

export function usePeriodComparison(selectedPeriods: string[], trendData: TrendData[]): PeriodComparison | null {
  return useMemo(() => {
    if (selectedPeriods.length < 2) return null;
    
    const data = selectedPeriods.map(period => 
      trendData.find(d => d.period === period) || null
    );
    
    if (data.filter(Boolean).length < 2) return null;
    
    // Calculate changes between first and last selected period
    const first = data.find(Boolean);
    const last = data.reverse().find(Boolean);
    
    if (!first || !last) return null;
    
    const revenueChange = first.revenue > 0 
      ? ((last.revenue - first.revenue) / first.revenue) * 100 
      : 0;
    
    const profitChange = first.netProfit > 0 
      ? ((last.netProfit - first.netProfit) / first.netProfit) * 100 
      : 0;
    
    return {
      data,
      changes: {
        revenueChange,
        profitChange
      }
    };
  }, [selectedPeriods, trendData]);
}

// ==============================================
// INTERACTIVE LEGEND HOOK
// ==============================================

export function useInteractiveLegend() {
  const toggleMetric = useCallback((metric: string, hiddenMetrics: Set<string>, setHiddenMetrics: (metrics: Set<string>) => void) => {
    const newHidden = new Set(hiddenMetrics);
    if (newHidden.has(metric)) {
      newHidden.delete(metric);
    } else {
      newHidden.add(metric);
    }
    setHiddenMetrics(newHidden);
  }, []);

  const showAllMetrics = useCallback((setHiddenMetrics: (metrics: Set<string>) => void) => {
    setHiddenMetrics(new Set());
  }, []);

  const hideAllMetrics = useCallback((metrics: string[], setHiddenMetrics: (metrics: Set<string>) => void) => {
    setHiddenMetrics(new Set(metrics));
  }, []);

  const togglePeriodSelection = useCallback((period: string, selectedPeriods: string[], setSelectedPeriods: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelectedPeriods((prev: string[]) => {
      if (prev.includes(period)) {
        return prev.filter((p: string) => p !== period);
      } else if (prev.length < 3) {
        return [...prev, period];
      }
      return prev;
    });
  }, []);

  const clearPeriodSelection = useCallback((setSelectedPeriods: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelectedPeriods([]);
  }, []);

  return {
    toggleMetric,
    showAllMetrics,
    hideAllMetrics,
    togglePeriodSelection,
    clearPeriodSelection
  };
}