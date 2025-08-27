// src/components/profitAnalysis/components/ProfitTrendChart.tsx
// ==============================================
// REFACTORED PROFIT TREND CHART COMPONENT
// ==============================================

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, BarChart3, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Extracted components
import { LineChartRenderer, AreaChartRenderer, CandlestickChartRenderer, HeatmapChartRenderer } from './charts/ChartRenderers';
import { InteractiveLegend, ChartControls, MetricToggles } from './charts/InteractiveComponents';
import { ForecastingDisplay, AnomalyDisplay, PeriodComparisonDisplay } from './charts/AnalyticsDisplays';

// Hooks and utilities
import { useProfitTrendChart, useAdvancedAnalytics, usePeriodComparison, useInteractiveLegend } from './charts/hooks';
import { ProfitTrendChartProps, TrendData } from './charts/types';
import { formatCurrency, formatLargeNumber } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { calculateHistoricalCOGS } from '@/utils/cogsCalculation';
import { safeSortPeriods, formatPeriodForDisplay } from '@/utils/periodUtils';
import { safeCalculateMargins } from '@/utils/profitValidation';

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const processTrendData = (
  profitHistory: RealTimeProfitCalculation[], 
  effectiveCogs?: number,
  wacStockValue?: number
): TrendData[] => {
  if (!profitHistory || profitHistory.length === 0) return [];

  const periods = profitHistory.map(h => h.period);
  const sortedPeriods = safeSortPeriods(periods);
  
  const sortedHistory = sortedPeriods.map(period => 
    profitHistory.find(h => h.period === period)
  ).filter(Boolean) as RealTimeProfitCalculation[];
  
  const historicalCOGS = calculateHistoricalCOGS(
    sortedHistory, 
    effectiveCogs,
    { preferWAC: true, validateRange: true }
  );
  
  return sortedHistory.map((analysis, index) => {
    const revenue = analysis.revenue_data?.total || 0;
    const cogsResult = historicalCOGS.get(analysis.period) || { value: 0, source: 'fallback', isValid: false, warnings: [] };
    const opex = analysis.opex_data?.total || 0;
    const validationResult = safeCalculateMargins(revenue, cogsResult.value, opex);
    
    let periodStockValue = 0;
    if (analysis.wac_data?.total_wac_cogs) {
      periodStockValue = analysis.wac_data.total_wac_cogs;
    } else if (index === sortedHistory.length - 1 && wacStockValue) {
      periodStockValue = wacStockValue;
    }

    return {
      period: analysis.period,
      periodLabel: formatPeriodForDisplay(analysis.period),
      revenue,
      cogs: cogsResult.value,
      opex,
      grossProfit: validationResult.grossProfit,
      netProfit: validationResult.netProfit,
      grossMargin: validationResult.grossMargin,
      netMargin: validationResult.netMargin,
      stockValue: periodStockValue
    };
  });
};

const analyzeTrend = (trendData: TrendData[]) => {
  if (trendData.length < 2) {
    return { revenueGrowth: 0, profitGrowth: 0, marginTrend: 'stabil', bestMonth: null, worstMonth: null };
  }

  const firstPeriod = trendData[0];
  const lastPeriod = trendData[trendData.length - 1];
  
  const revenueGrowth = firstPeriod.revenue > 0 
    ? ((lastPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) * 100 : 0;
  const profitGrowth = firstPeriod.netProfit > 0 
    ? ((lastPeriod.netProfit - firstPeriod.netProfit) / firstPeriod.netProfit) * 100 : 0;

  const marginTrend = lastPeriod.netMargin > firstPeriod.netMargin + 2 ? 'membaik' :
                     lastPeriod.netMargin < firstPeriod.netMargin - 2 ? 'menurun' : 'stabil';

  const bestMonth = trendData.reduce((best, current) => 
    current.netProfit > best.netProfit ? current : best
  );
  const worstMonth = trendData.reduce((worst, current) => 
    current.netProfit < worst.netProfit ? current : worst
  );

  return { revenueGrowth, profitGrowth, marginTrend, bestMonth, worstMonth };
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({
  profitHistory,
  isLoading,
  chartType = 'line',
  showMetrics = ['revenue', 'grossProfit', 'netProfit'],
  className = '',
  effectiveCogs,
  wacStockValue,
  labels
}) => {
  // Main chart state hook
  const {
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
    trendData,
    trendAnalysis,
    metricConfigs,
    handleTouchStart,
    handleTouchEnd
  } = useProfitTrendChart({
    profitHistory,
    effectiveCogs,
    wacStockValue,
    processTrendData,
    analyzeTrend
  });

  // Advanced analytics hook
  const advancedAnalytics = useAdvancedAnalytics(trendData, isDataReady);

  // Period comparison hook
  const periodComparison = usePeriodComparison(selectedPeriods, trendData);

  // Interactive legend hooks
  const {
    toggleMetric,
    showAllMetrics,
    hideAllMetrics,
    togglePeriodSelection,
    clearPeriodSelection
  } = useInteractiveLegend();

  // Event handlers
  const handleToggleMetric = (metric: string) => toggleMetric(metric, hiddenMetrics, setHiddenMetrics);
  const handleShowAll = () => showAllMetrics(setHiddenMetrics);
  const handleHideAll = () => hideAllMetrics(selectedMetrics, setHiddenMetrics);
  const handleTogglePeriodSelection = (period: string) => togglePeriodSelection(period, selectedPeriods, setSelectedPeriods);
  const handleClearPeriodSelection = () => clearPeriodSelection(setSelectedPeriods);

  // Render chart based on type
  const renderChart = () => {
    const chartProps = { trendData, selectedMetrics, metricConfigs, hiddenMetrics, hoveredMetric, viewType };

    switch (chartType) {
      case 'area': return <AreaChartRenderer {...chartProps} />;
      case 'candlestick': return <CandlestickChartRenderer {...chartProps} />;
      case 'heatmap': return <HeatmapChartRenderer {...chartProps} />;
      default: return <LineChartRenderer {...chartProps} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!trendData || trendData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📈 Trend Profit
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button"
                    className="p-1 -m-1 touch-manipulation"
                    aria-label="Info trend profit"
                  >
                    <HelpCircle className="w-4 h-4 text-orange-500 hover:text-orange-700 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>Grafik ini akan menampilkan perkembangan omset dan keuntungan dari bulan ke bulan setelah ada data transaksi.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Analisis perkembangan keuntungan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data untuk ditampilkan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              📈 Trend Profit
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info trend profit"
                    >
                      <HelpCircle className="w-4 h-4 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Grafik ini menampilkan perkembangan omset, keuntungan kotor, dan keuntungan bersih dari bulan ke bulan. Garis naik menunjukkan perbaikan, garis turun menunjukkan penurunan.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {trendAnalysis && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`text-sm px-2 py-1 rounded cursor-help ${
                        trendAnalysis.profitGrowth > 0 ? 'bg-green-100 text-green-700' :
                        trendAnalysis.profitGrowth < 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {trendAnalysis.profitGrowth > 0 ? (
                          <><TrendingUp className="w-3 h-3 inline mr-1" />+{trendAnalysis.profitGrowth.toFixed(1)}%</>
                        ) : trendAnalysis.profitGrowth < 0 ? (
                          <><TrendingDown className="w-3 h-3 inline mr-1" />{trendAnalysis.profitGrowth.toFixed(1)}%</>
                        ) : (
                          '→ Stabil'
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>
                        {trendAnalysis.profitGrowth > 0 
                          ? `Keuntungan naik ${trendAnalysis.profitGrowth.toFixed(1)}% dibanding periode awal. Bisnis berkembang baik!`
                          : trendAnalysis.profitGrowth < 0 
                          ? `Keuntungan turun ${Math.abs(trendAnalysis.profitGrowth).toFixed(1)}% dibanding periode awal. Perlu evaluasi strategi.`
                          : 'Keuntungan relatif stabil, tidak ada perubahan signifikan.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Analisis perkembangan keuntungan {trendData.length} periode terakhir
              {labels?.hppLabel && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded cursor-help">
                        {labels.hppLabel}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{labels.hppHint || 'Menggunakan harga rata-rata bahan baku untuk perhitungan yang lebih akurat'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardDescription>
          </div>
        </div>
        
        {/* Chart Controls */}
        <ChartControls
          viewType={viewType}
          setViewType={setViewType}
          showForecast={showForecast}
          setShowForecast={setShowForecast}
          showAnomalies={showAnomalies}
          setShowAnomalies={setShowAnomalies}
          showComparison={showComparison}
          setShowComparison={setShowComparison}
          advancedAnalytics={advancedAnalytics}
          isMobile={isMobile}
        />
        
        {/* Metric Toggles */}
        <MetricToggles
          viewType={viewType}
          metricConfigs={metricConfigs}
          selectedMetrics={selectedMetrics}
          onToggleMetric={(metric) => {
            if (selectedMetrics.includes(metric)) {
              setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
            } else {
              setSelectedMetrics([...selectedMetrics, metric]);
            }
          }}
          isMobile={isMobile}
        />
      </CardHeader>
      
      <CardContent>
        {/* Main Chart */}
        <div 
          className="w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {renderChart()}
        </div>
        
        {/* Interactive Legend */}
        <InteractiveLegend
          metrics={selectedMetrics}
          metricConfigs={metricConfigs}
          hiddenMetrics={hiddenMetrics}
          hoveredMetric={hoveredMetric}
          onToggleMetric={handleToggleMetric}
          onHoverMetric={setHoveredMetric}
          onShowAll={handleShowAll}
          onHideAll={handleHideAll}
        />
        
        {/* Advanced Analytics Displays */}
        {advancedAnalytics && (
          <>
            <ForecastingDisplay
              showForecast={showForecast}
              advancedAnalytics={advancedAnalytics}
            />
            
            <AnomalyDisplay
              showAnomalies={showAnomalies}
              advancedAnalytics={advancedAnalytics}
            />
            
            <PeriodComparisonDisplay
              showComparison={showComparison}
              selectedPeriods={selectedPeriods}
              trendData={trendData}
              periodComparison={periodComparison}
              onTogglePeriodSelection={handleTogglePeriodSelection}
              onClearPeriodSelection={handleClearPeriodSelection}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitTrendChart;
export type { ProfitTrendChartProps };