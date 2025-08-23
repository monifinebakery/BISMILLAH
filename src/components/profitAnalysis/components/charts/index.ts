// src/components/profitAnalysis/components/charts/index.ts
// ==============================================
// CHART COMPONENTS EXPORTS
// ==============================================

// Chart Renderers
export { 
  LineChartRenderer, 
  AreaChartRenderer, 
  CandlestickChartRenderer, 
  HeatmapChartRenderer 
} from './ChartRenderers';

// Interactive Components
export { 
  InteractiveLegend, 
  ChartControls, 
  MetricToggles 
} from './InteractiveComponents';

// Analytics Displays
export { 
  ForecastingDisplay, 
  AnomalyDisplay, 
  PeriodComparisonDisplay 
} from './AnalyticsDisplays';

// Tooltips
export { 
  CustomTooltip, 
  CandlestickTooltip, 
  HeatmapTooltip 
} from './Tooltips';

// Hooks
export { 
  useProfitTrendChart, 
  useAdvancedAnalytics, 
  usePeriodComparison, 
  useInteractiveLegend 
} from './hooks';

// Types
export type {
  ProfitTrendChartProps,
  TrendData,
  MetricConfig,
  MetricConfigs,
  AdvancedAnalytics,
  PeriodComparison,
  BaseChartProps,
  InteractiveLegendProps,
  ChartControlsProps,
  TooltipProps
} from './types';