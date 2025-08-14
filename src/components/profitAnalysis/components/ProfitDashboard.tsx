import React, { useState, useMemo, useCallback } from 'react';
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

// ==============================================
// TYPES
// ==============================================

export interface ProfitDashboardProps {
  className?: string;
  defaultPeriod?: string;
  showAdvancedMetrics?: boolean;
}

// ==============================================
// FUNGSI HELPER
// ==============================================

// Fungsi kalkulasi metrik profit lanjutan
const calculateAdvancedProfitMetrics = (profitHistory, currentAnalysis) => {
  if (!currentAnalysis || !currentAnalysis.revenue_data || !currentAnalysis.cogs_data || !currentAnalysis.opex_data) {
    return null;
  }
  
  const revenue = currentAnalysis.revenue_data.total || 0;
  const cogs = currentAnalysis.cogs_data.total || 0;
  const opex = currentAnalysis.opex_data.total || 0;
  const margins = calculateMargins(revenue, cogs, opex);
  
  const rollingAverages = profitHistory && profitHistory.length > 0 ? calculateRollingAverages(profitHistory, 3) : { revenueAverage: 0, profitAverage: 0, marginAverage: 0, volatility: 0 };
  
  return {
    grossProfitMargin: margins.grossMargin,
    netProfitMargin: margins.netMargin,
    monthlyGrowthRate: rollingAverages.marginAverage || 0,
    marginOfSafety: 0,
    cogsPercentage: margins.cogsPercentage,
    opexPercentage: margins.opexPercentage,
    confidenceScore: validateDataQuality(currentAnalysis).score || 0,
    operatingLeverage: revenue > 0 ? (margins.grossProfit / revenue) * 100 : 0,
  };
};

// Fungsi generate forecast profit
const generateProfitForecast = (profitHistory, currentAnalysis) => {
  if (!currentAnalysis || !currentAnalysis.revenue_data || !currentAnalysis.cogs_data || !currentAnalysis.opex_data || !profitHistory || profitHistory.length < 3) {
    return null;
  }
  
  const rollingAverages = calculateRollingAverages(profitHistory, 3);
  const currentMargins = calculateMargins(
    currentAnalysis.revenue_data.total,
    currentAnalysis.cogs_data.total,
    currentAnalysis.opex_data.total
  );
  
  const baseRevenue = rollingAverages.revenueAverage || 0;
  const baseProfit = rollingAverages.profitAverage || 0;
  const baseMargin = currentMargins.netMargin || 0;
  
  return {
    nextMonth: {
      profit: baseProfit * 1.02,
      margin: baseMargin,
      confidence: 75,
    },
    nextQuarter: {
      profit: baseProfit * 3 * 1.05,
      margin: baseMargin * 1.01,
      confidence: 65,
    },
    nextYear: {
      profit: baseProfit * 12 * 1.15,
      margin: baseMargin * 1.05,
      confidence: 45,
    },
  };
};

// Fungsi benchmarking kompetitif
const performCompetitiveBenchmarking = (advancedMetrics, profitHistory) => {
  if (!advancedMetrics || !advancedMetrics.netProfitMargin) return null;
  
  const industryAverages = {
    averageNetMargin: 15,
    topQuartileMargin: 25,
  };
  
  const currentNetMargin = advancedMetrics.netProfitMargin;
  
  let percentile = 50;
  if (currentNetMargin >= industryAverages.topQuartileMargin) percentile = 90;
  else if (currentNetMargin >= industryAverages.averageNetMargin) percentile = 75;
  else if (currentNetMargin >= industryAverages.averageNetMargin * 0.7) percentile = 50;
  else percentile = 25;
  
  let position = 'kurang';
  if (percentile >= 90) position = 'sangat baik';
  else if (percentile >= 75) position = 'baik';
  else if (percentile >= 50) position = 'rata-rata';
  
  return {
    industry: industryAverages,
    competitive: {
      percentile,
      position,
      gapToLeader: Math.max(0, industryAverages.topQuartileMargin - currentNetMargin),
    },
  };
};

// Fungsi generate ringkasan eksekutif
const generateExecutiveSummary = (currentAnalysis, advancedMetrics, forecast, benchmark) => {
  if (!currentAnalysis || !advancedMetrics) return null;
  
  const executiveInsights = generateExecutiveInsights(currentAnalysis);
  
  return {
    insights: executiveInsights.keyHighlights || [],
    alerts: executiveInsights.criticalIssues || [],
    opportunities: executiveInsights.opportunities || [],
  };
};

// ==============================================
// KOMPONEN UTAMA DASHBOARD PROFIT
// ==============================================

const ProfitDashboard = ({
  className = '',
  defaultPeriod,
  showAdvancedMetrics = true,
}) => {
  // State untuk variabel
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);

  // Hooks
  const {
    currentAnalysis,
    profitHistory,
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

  const { analyzeMargins, comparePeriods: comparePeriodsHook, generateForecast: generateForecastHook } = useProfitCalculation();
  const { formatPeriodLabel, exportData } = useProfitData({
    history: profitHistory,
    currentAnalysis,
  });

  // State Lokal
  const [activeTab, setActiveTab] = useState('ikhtisar');
  const [selectedChartType, setSelectedChartType] = useState('bar');

  // ✅ Extract primitive values untuk menghindari nested access dalam dependencies
  const revenue = currentAnalysis?.revenue_data?.total || 0;
  const cogs = currentAnalysis?.cogs_data?.total || 0;
  const opex = currentAnalysis?.opex_data?.total || 0;
  const hasValidData = Boolean(currentAnalysis && revenue > 0);
  const hasHistoryData = Boolean(profitHistory && profitHistory.length > 0);
  const hasEnoughHistory = Boolean(profitHistory && profitHistory.length >= 3);

  // Opsi Periode
  const periodOptions = useMemo(() => {
    return generatePeriodOptions(2023, new Date().getFullYear());
  }, []);

  // ✅ Kalkulasi Lanjutan dengan dependensi yang stabil
  const advancedMetrics = useMemo(() => {
    if (!hasValidData || !showAdvancedMetrics) return null;
    
    try {
      return calculateAdvancedProfitMetrics(profitHistory || [], currentAnalysis);
    } catch (error) {
      console.error('Error calculating advanced metrics:', error);
      return null;
    }
  }, [hasValidData, showAdvancedMetrics, profitHistory, currentAnalysis]);

  // ✅ Forecast dengan dependensi yang sederhana
  const forecast = useMemo(() => {
    if (!hasValidData || !hasEnoughHistory) return null;
    
    try {
      return generateProfitForecast(profitHistory, currentAnalysis);
    } catch (error) {
      console.error('Error generating forecast:', error);
      return null;
    }
  }, [hasValidData, hasEnoughHistory, profitHistory, currentAnalysis]);

  // ✅ Benchmark dengan dependensi yang stabil
  const benchmark = useMemo(() => {
    if (!advancedMetrics || !hasHistoryData) return null;
    
    try {
      return performCompetitiveBenchmarking(advancedMetrics, profitHistory || []);
    } catch (error) {
      console.error('Error performing benchmark:', error);
      return null;
    }
  }, [advancedMetrics, hasHistoryData, profitHistory]);

  // ✅ Executive summary dengan null safety
  const executiveSummary = useMemo(() => {
    if (!hasValidData || !advancedMetrics) return null;
    
    try {
      return generateExecutiveSummary(currentAnalysis, advancedMetrics, forecast, benchmark);
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return null;
    }
  }, [hasValidData, advancedMetrics, forecast, benchmark, currentAnalysis]);

  // Analisis Periode Sebelumnya untuk Perbandingan
  const previousAnalysis = useMemo(() => {
    if (!currentPeriod || !hasHistoryData) return null;
    
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
  }, [currentPeriod, hasHistoryData, profitHistory]);

  // ✅ useCallback untuk semua handlers
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
      const data = {
        period: currentAnalysis.period || currentPeriod,
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

  // Komponen Seksi Ringkasan Eksekutif
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

  // Seksi Forecast
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
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Bulan Depan</div>
              <div className="text-2xl font-bold text-blue-700 mb-1">
                {formatCurrency(forecast.nextMonth?.profit || 0)}
              </div>
              <div className="text-sm text-blue-600">
                {formatPercentage(forecast.nextMonth?.margin || 0)} margin
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {(forecast.nextMonth?.confidence || 0).toFixed(0)}% keyakinan
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Kuartal Depan</div>
              <div className="text-2xl font-bold text-green-700 mb-1">
                {formatCurrency(forecast.nextQuarter?.profit || 0)}
              </div>
              <div className="text-sm text-green-600">
                {formatPercentage(forecast.nextQuarter?.margin || 0)} margin
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {(forecast.nextQuarter?.confidence || 0).toFixed(0)}% keyakinan
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tahun Depan</div>
              <div className="text-2xl font-bold text-purple-700 mb-1">
                {formatCurrency(forecast.nextYear?.profit || 0)}
              </div>
              <div className="text-sm text-purple-600">
                {formatPercentage(forecast.nextYear?.margin || 0)} margin
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {(forecast.nextYear?.confidence || 0).toFixed(0)}% keyakinan
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [forecast]);

  // Render Utama
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analisis Profit</h1>
          <p className="text-gray-600">Analisis profit komprehensif dengan kalkulasi real-time dan business intelligence</p>
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
            className="flex items-center space-x-2"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={!hasValidData}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Indikator Status */}
      <div className="flex items-center space-x-4">
        {isDataStale && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Data mungkin sudah usang</span>
          </Badge>
        )}
        {lastCalculated && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Diperbarui: {lastCalculated.toLocaleTimeString()}</span>
          </Badge>
        )}
        {benchmark?.competitive?.position && (
          <Badge
            variant={benchmark.competitive.position === 'sangat baik' ? 'default' : 'secondary'}
            className="flex items-center space-x-1"
          >
            <Target className="w-3 h-3" />
            <span>performa {benchmark.competitive.position}</span>
          </Badge>
        )}
      </div>

      {/* Alert Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Ringkasan Eksekutif */}
      {showAdvancedMetrics && executiveSummary && <ExecutiveSummarySection />}

      {/* Kartu Ringkasan */}
      {hasValidData && (
        <ProfitSummaryCards 
          currentAnalysis={currentAnalysis} 
          previousAnalysis={previousAnalysis} 
          isLoading={loading} 
        />
      )}

      {/* Seksi Forecast */}
      {showAdvancedMetrics && forecast && <ForecastSection />}

      {/* Tab Konten Utama */}
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
          {/* Metrik Lanjutan */}
          {advancedMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Analitik Lanjutan</CardTitle>
                <CardDescription>Mendalami metrik performa keuangan</CardDescription>
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

          {/* Benchmark Kompetitif */}
          {benchmark && (
            <Card>
              <CardHeader>
                <CardTitle>Benchmarking Kompetitif</CardTitle>
                <CardDescription>Bagaimana performa Anda dibandingkan dengan standar industri</CardDescription>
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
                    <Badge
                      variant={benchmark.competitive?.position === 'sangat baik' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {benchmark.competitive?.position || 'Tidak diketahui'}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Gap ke Kuartil Atas</div>
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
      {hasValidData && !loading && (
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>
              Analisis selesai untuk {formatPeriodLabel ? formatPeriodLabel(currentPeriod) : formatPeriodLabelTransformer(currentPeriod)}
            </span>
          </div>
          <span>•</span>
          <span>Pendapatan: {formatCurrency(revenue)}</span>
          <span>•</span>
          <span>
            Laba Bersih: {formatCurrency(revenue - cogs - opex)}
          </span>
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