// ==============================================
// PERBAIKAN UNTUK REACT ERROR #310
// ==============================================

// MASALAH UTAMA: Dependencies yang tidak stabil dan circular references
// SOLUSI: Gunakan primitive values dan stabilkan object references

// ==============================================
// 1. FIXED ProfitDashboard.tsx
// ==============================================

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Settings,
  Info,
  Target,
  Lightbulb,
} from 'lucide-react';

// Import komponen Analisis Profit
import ProfitSummaryCards from './ProfitSummaryCards';
import ProfitBreakdownChart from './ProfitBreakdownChart';
import ProfitTrendChart from './ProfitTrendChart';
import DetailedBreakdownTable from './DetailedBreakdownTable';

// Import hooks dan utilities
import { useProfitAnalysis, useProfitCalculation, useProfitData } from '../hooks';

// Import dari profitTransformers
import { 
  generatePeriodOptions, 
  getCurrentPeriod,
  calculateRollingAverages,
  formatPeriodLabel as formatPeriodLabelTransformer
} from '../utils/profitTransformers';

// Import dari profitCalculations
import {
  calculateMargins,
  comparePeriods,
  analyzeCostStructure,
  calculateBreakEvenAnalysis,
  validateDataQuality,
  generateExecutiveInsights,
  formatCurrency,
  formatPercentage,
  getMarginRating,
} from '../utils/profitCalculations';

// Import fungsi helper
import {
  calculateAdvancedProfitMetrics,
  generateProfitForecast,
  performCompetitiveBenchmarking,
  generateExecutiveSummary
} from '../utils/profitHelpers';

const ProfitDashboard = ({
  className = '',
  defaultPeriod,
  showAdvancedMetrics = true,
}) => {
  
  // ✅ FIX: Gunakan ref untuk mencegah re-creation object
  const stableCurrentAnalysis = useRef(null);
  const stableProfitHistory = useRef([]);

  // State lokal
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);
  const [activeTab, setActiveTab] = useState('ikhtisar');
  const [selectedChartType, setSelectedChartType] = useState('bar');

  // Hooks
  const {
    currentAnalysis: rawCurrentAnalysis,
    profitHistory: rawProfitHistory,
    loading,
    error,
    currentPeriod,
    setCurrentPeriod,
    refreshAnalysis,
  } = useProfitAnalysis({
    defaultPeriod: defaultPeriod || getCurrentPeriod(),
    autoCalculate: true,
    enableRealTime: true,
  });

  // ✅ FIX: Update refs only when data actually changes
  if (rawCurrentAnalysis !== stableCurrentAnalysis.current) {
    stableCurrentAnalysis.current = rawCurrentAnalysis;
  }
  if (rawProfitHistory !== stableProfitHistory.current) {
    stableProfitHistory.current = rawProfitHistory;
  }

  // ✅ FIX: Extract ALL primitive values to avoid nested access
  const currentAnalysis = stableCurrentAnalysis.current;
  const profitHistory = stableProfitHistory.current;
  
  // Extract primitive values safely
  const revenue = currentAnalysis?.revenue_data?.total || 0;
  const cogs = currentAnalysis?.cogs_data?.total || 0;
  const opex = currentAnalysis?.opex_data?.total || 0;
  const hasCurrentData = Boolean(currentAnalysis && revenue > 0);
  const hasProfitHistory = Boolean(profitHistory && profitHistory.length > 0);
  const hasEnoughHistory = Boolean(profitHistory && profitHistory.length >= 3);

  // ✅ FIX: Stable period options
  const periodOptions = useMemo(() => {
    return generatePeriodOptions(2023, new Date().getFullYear());
  }, []); // Empty deps - only changes when component mounts

  // ✅ FIX: Advanced metrics with stable dependencies
  const advancedMetrics = useMemo(() => {
    if (!hasCurrentData || !showAdvancedMetrics) return null;
    
    try {
      return calculateAdvancedProfitMetrics(profitHistory || [], currentAnalysis);
    } catch (error) {
      console.error('Error calculating advanced metrics:', error);
      return null;
    }
  }, [hasCurrentData, showAdvancedMetrics, profitHistory, currentAnalysis]);

  // ✅ FIX: Forecast with stable dependencies
  const forecast = useMemo(() => {
    if (!hasCurrentData || !hasEnoughHistory) return null;
    
    try {
      return generateProfitForecast(profitHistory, currentAnalysis);
    } catch (error) {
      console.error('Error generating forecast:', error);
      return null;
    }
  }, [hasCurrentData, hasEnoughHistory, profitHistory, currentAnalysis]);

  // ✅ FIX: Benchmark with stable dependencies
  const benchmark = useMemo(() => {
    if (!advancedMetrics || !hasProfitHistory) return null;
    
    try {
      return performCompetitiveBenchmarking(advancedMetrics, profitHistory || []);
    } catch (error) {
      console.error('Error performing benchmark:', error);
      return null;
    }
  }, [advancedMetrics, hasProfitHistory, profitHistory]);

  // ✅ FIX: Executive summary with null checks
  const executiveSummary = useMemo(() => {
    if (!hasCurrentData || !advancedMetrics) return null;
    
    try {
      return generateExecutiveSummary(currentAnalysis, advancedMetrics, forecast, benchmark);
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return null;
    }
  }, [hasCurrentData, advancedMetrics, forecast, benchmark, currentAnalysis]);

  // ✅ FIX: Previous analysis with stable dependencies
  const previousAnalysis = useMemo(() => {
    if (!currentPeriod || !hasProfitHistory) return null;
    
    try {
      const [year, month] = currentPeriod.split('-');
      const currentDate = new Date(parseInt(year), parseInt(month) - 1);
      const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const previousPeriod = `${previousDate.getFullYear()}-${(previousDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      return profitHistory.find((h) => h.period === previousPeriod) || null;
    } catch (error) {
      console.error('Error finding previous analysis:', error);
      return null;
    }
  }, [currentPeriod, hasProfitHistory, profitHistory]);

  // ✅ FIX: useCallback untuk semua handlers
  const handlePeriodChange = useCallback((period) => {
    setCurrentPeriod(period);
  }, [setCurrentPeriod]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshAnalysis();
      setLastCalculated(new Date());
    } catch (error) {
      console.error('Error refreshing analysis:', error);
    }
  }, [refreshAnalysis]);

  const handleExportData = useCallback(() => {
    if (!currentAnalysis) return;
    
    try {
      // Safer export logic
      const data = {
        period: currentAnalysis.period,
        revenue: revenue,
        cogs: cogs,
        opex: opex,
        grossProfit: revenue - cogs,
        netProfit: revenue - cogs - opex
      };
      
      const csvContent = `Period,Revenue,COGS,OPEX,Gross Profit,Net Profit\n${Object.values(data).join(',')}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analisis-profit-${currentPeriod}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }, [currentAnalysis, currentPeriod, revenue, cogs, opex]);

  // ✅ FIX: Stable component references
  const ExecutiveSummarySection = useCallback(() => {
    if (!executiveSummary) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Insight Utama */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              Insight Utama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(executiveSummary.insights || []).map((insight, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0" />
                  {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peringatan */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              Item Tindakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(executiveSummary.alerts || []).length > 0 ? (
                executiveSummary.alerts.map((alert, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0" />
                    {alert}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">Tidak ada masalah kritis yang terdeteksi</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Peluang */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
              Peluang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(executiveSummary.opportunities || []).map((opportunity, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                  {opportunity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [executiveSummary]);

  const ForecastSection = useCallback(() => {
    if (!forecast) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Prediksi Profit</CardTitle>
          <CardDescription>Prediksi bertenaga AI berdasarkan tren historis dan analisis pasar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { key: 'nextMonth', label: 'Bulan Depan', color: 'blue' },
              { key: 'nextQuarter', label: 'Kuartal Depan', color: 'green' },
              { key: 'nextYear', label: 'Tahun Depan', color: 'purple' }
            ].map(({ key, label, color }) => {
              const data = forecast[key];
              if (!data) return null;
              
              return (
                <div key={key} className={`text-center p-4 bg-${color}-50 rounded-lg`}>
                  <div className="text-sm text-gray-600 mb-1">{label}</div>
                  <div className={`text-2xl font-bold text-${color}-700 mb-1`}>
                    {formatCurrency(data.profit || 0)}
                  </div>
                  <div className={`text-sm text-${color}-600`}>
                    {formatPercentage(data.margin || 0)} margin
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {(data.confidence || 0).toFixed(0)}% keyakinan
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }, [forecast]);

  // ✅ RENDER UTAMA dengan error boundaries
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analisis Profit</h1>
          <p className="text-gray-600">Analisis profit komprehensif dengan kalkulasi real-time</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <Select value={currentPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={!hasCurrentData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conditional Rendering dengan Guards */}
      {showAdvancedMetrics && executiveSummary && <ExecutiveSummarySection />}

      {/* Summary Cards */}
      {hasCurrentData && (
        <ProfitSummaryCards 
          currentAnalysis={currentAnalysis} 
          previousAnalysis={previousAnalysis} 
          isLoading={loading} 
        />
      )}

      {/* Forecast Section */}
      {showAdvancedMetrics && forecast && <ForecastSection />}

      {/* Tabs with Loading States */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ikhtisar">Ikhtisar</TabsTrigger>
          <TabsTrigger value="tren">Tren</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="wawasan">Wawasan</TabsTrigger>
        </TabsList>

        <TabsContent value="ikhtisar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitBreakdownChart 
              currentAnalysis={currentAnalysis} 
              isLoading={loading} 
              chartType={selectedChartType} 
            />
            <ProfitTrendChart
              profitHistory={profitHistory}
              isLoading={loading}
              chartType="line"
              showMetrics={['revenue', 'grossProfit', 'netProfit']}
            />
          </div>
        </TabsContent>

        <TabsContent value="tren" className="space-y-6">
          <ProfitTrendChart
            profitHistory={profitHistory}
            isLoading={loading}
            chartType="area"
            showMetrics={['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex']}
          />
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <DetailedBreakdownTable 
            currentAnalysis={currentAnalysis} 
            isLoading={loading} 
            showExport={true} 
          />
        </TabsContent>

        <TabsContent value="wawasan" className="space-y-6">
          {/* Advanced Metrics */}
          {advancedMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Analitik Lanjutan</CardTitle>
                <CardDescription>Metrik performa keuangan detail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPercentage(advancedMetrics.grossProfitMargin || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Margin Kotor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(advancedMetrics.netProfitMargin || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Margin Bersih</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPercentage(advancedMetrics.monthlyGrowthRate || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pertumbuhan Bulanan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatPercentage(advancedMetrics.marginOfSafety || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Margin Keamanan</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitive Benchmark */}
          {benchmark && (
            <Card>
              <CardHeader>
                <CardTitle>Benchmarking Kompetitif</CardTitle>
                <CardDescription>Performa vs standar industri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Rata-rata Industri</div>
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {formatPercentage(benchmark.industry?.averageNetMargin || 0)}
                    </div>
                    <div className="text-xs text-gray-500">Margin Bersih</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Posisi Anda</div>
                    <div className="text-xl font-bold text-blue-700 mb-1">
                      {benchmark.competitive?.percentile || 0}
                    </div>
                    <div className="text-xs text-gray-500">Persentil</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Gap ke Leader</div>
                    <div className="text-xl font-bold text-amber-700 mb-1">
                      {formatPercentage(benchmark.competitive?.gapToLeader || 0)}
                    </div>
                    <div className="text-xs text-gray-500">Poin Margin</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      {hasCurrentData && !loading && (
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Analisis selesai untuk {currentPeriod}</span>
          </div>
          <span>•</span>
          <span>Pendapatan: {formatCurrency(revenue)}</span>
          <span>•</span>
          <span>Laba Bersih: {formatCurrency(revenue - cogs - opex)}</span>
          <span>•</span>
          <span>
            Margin: {formatPercentage(revenue > 0 ? ((revenue - cogs - opex) / revenue) * 100 : 0)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfitDashboard;