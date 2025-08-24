// src/components/profitAnalysis/components/charts/types.ts

import { RealTimeProfitCalculation } from '../../types/profitAnalysis.types';
import { ForecastResult, StatisticalAnalysis, AnomalyDetectionResult } from '../../utils/advancedAnalytics';

// ==============================================
// CHART COMPONENT TYPES
// ==============================================

export interface ProfitTrendChartProps {
  profitHistory: RealTimeProfitCalculation[];
  isLoading: boolean;
  chartType?: 'line' | 'area' | 'candlestick' | 'heatmap';
  showMetrics?: ('revenue' | 'grossProfit' | 'netProfit' | 'margins')[];
  className?: string;
  /** ⬇️ WAC-aware COGS dari useProfitAnalysis */
  effectiveCogs?: number;
  /** ⬇️ Nilai stok WAC dari warehouse */
  wacStockValue?: number;
  /** ⬇️ label/tooltip WAC */
  labels?: { hppLabel: string; hppHint: string };
}

export interface TrendData {
  period: string;
  periodLabel: string;
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  stockValue?: number;
}

export interface MetricConfig {
  key: string;
  label: string;
  color: string;
}

export interface MetricConfigs {
  revenue: MetricConfig;
  grossProfit: MetricConfig;
  netProfit: MetricConfig;
  cogs: MetricConfig;
  opex: MetricConfig;
  grossMargin: MetricConfig;
  netMargin: MetricConfig;
  stockValue: MetricConfig;
}

// ==============================================
// ADVANCED ANALYTICS TYPES
// ==============================================

export interface AdvancedAnalytics {
  forecast: {
    linear: ForecastResult;
    exponential: ForecastResult;
  };
  statistics: {
    profit: StatisticalAnalysis;
    revenue: StatisticalAnalysis;
  };
  anomalies: AnomalyDetectionResult;
}

export interface PeriodComparison {
  data: (TrendData | null)[];
  changes?: {
    revenueChange: number;
    profitChange: number;
  };
}

// ==============================================
// COMPONENT PROP INTERFACES
// ==============================================

export interface BaseChartProps {
  trendData: TrendData[];
  selectedMetrics: string[];
  metricConfigs: MetricConfigs;
  hiddenMetrics: Set<string>;
  hoveredMetric: string | null;
  viewType: 'values' | 'margins';
}

export interface InteractiveLegendProps {
  metrics: string[];
  metricConfigs: MetricConfigs;
  hiddenMetrics: Set<string>;
  hoveredMetric: string | null;
  onToggleMetric: (metric: string) => void;
  onHoverMetric: (metric: string | null) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export interface ChartControlsProps {
  viewType: 'values' | 'margins';
  setViewType: (type: 'values' | 'margins') => void;
  showForecast: boolean;
  setShowForecast: (show: boolean) => void;
  showAnomalies: boolean;
  setShowAnomalies: (show: boolean) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  advancedAnalytics: AdvancedAnalytics | null;
  isMobile: boolean;
}

// ==============================================
// ANALYTICS TYPES
// ==============================================

export interface TrendAnalysis {
  revenueGrowth: number;
  profitGrowth: number;
  marginTrend: string;
  bestMonth: TrendData | null;
  worstMonth: TrendData | null;
}

// ==============================================
// CHART RENDERER TYPES
// ==============================================

export interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  viewType?: 'values' | 'margins';
}