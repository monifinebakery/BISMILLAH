import React, { useState } from 'react';
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
// HELPER FUNCTIONS - PURE FUNCTIONS OUTSIDE COMPONENT
// ==============================================

// Fungsi validasi data sebelum forecast
const validateForecastData = (currentAnalysis) => {
  const revenue = currentAnalysis?.revenue_data?.total || 0;
  const cogs = currentAnalysis?.cogs_data?.total || 0;
  const opex = currentAnalysis?.opex_data?.total || 0;
  
  const issues = [];
  
  // Validasi basic
  if (revenue <= 0) issues.push("Revenue harus lebih besar dari 0");
  if (cogs < 0) issues.push("COGS tidak boleh negatif");
  if (opex < 0) issues.push("OPEX tidak boleh negatif");
  
  // Validasi rasio yang masuk akal
  if (cogs > revenue * 1.5) issues.push("COGS terlalu tinggi dibanding revenue");
  if (opex > revenue * 2) issues.push("OPEX terlalu tinggi dibanding revenue");
  
  // Hitung margin untuk validasi
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  // Peringatan untuk margin ekstrem
  if (netMargin < -100) issues.push("Margin negatif ekstrem terdeteksi");
  if (netMargin > 90) issues.push("Margin terlalu tinggi, periksa data");
  
  return {
    isValid: issues.length === 0,
    issues,
    sanitizedData: {
      revenue: Math.max(0, revenue),
      cogs: Math.max(0, Math.min(cogs, revenue * 0.95)), // COGS max 95% dari revenue
      opex: Math.max(0, Math.min(opex, revenue * 0.8))   // OPEX max 80% dari revenue
    },
    metrics: {
      grossProfit,
      netProfit,
      netMargin,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0
    }
  };
};

const generateForecastHelper = (profitHistory, currentAnalysis) => {
  if (!currentAnalysis?.revenue_data?.total || !profitHistory?.length || profitHistory.length < 3) {
    return null;
  }
  
  try {
    // Validasi data terlebih dahulu
    const validation = validateForecastData(currentAnalysis);
    if (!validation.isValid) {
      console.warn('Data validation issues:', validation.issues);
      // Gunakan data yang sudah disanitasi
      currentAnalysis = {
        ...currentAnalysis,
        revenue_data: { total: validation.sanitizedData.revenue },
        cogs_data: { total: validation.sanitizedData.cogs },
        opex_data: { total: validation.sanitizedData.opex }
      };
    }
    
    const revenue = currentAnalysis.revenue_data.total || 0;
    const cogs = currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    
    // Hitung profit dan margin aktual
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    
    // Analisis tren dari history (ambil 3-6 periode terakhir)
    const recentHistory = profitHistory.slice(-6);
    let averageGrowthRate = 0;
    let averageMargin = netMargin;
    
    if (recentHistory.length >= 2) {
      const growthRates = [];
      const margins = [];
      
      for (let i = 1; i < recentHistory.length; i++) {
        const prevRevenue = recentHistory[i-1].revenue_data?.total || 0;
        const currRevenue = recentHistory[i].revenue_data?.total || 0;
        
        if (prevRevenue > 0 && currRevenue > 0) {
          const growthRate = ((currRevenue - prevRevenue) / prevRevenue) * 100;
          growthRates.push(growthRate);
          
          // Hitung margin untuk periode ini
          const periodCogs = recentHistory[i].cogs_data?.total || 0;
          const periodOpex = recentHistory[i].opex_data?.total || 0;
          const periodNetProfit = currRevenue - periodCogs - periodOpex;
          const periodMargin = (periodNetProfit / currRevenue) * 100;
          margins.push(periodMargin);
        }
      }
      
      // Rata-rata pertumbuhan dan margin
      if (growthRates.length > 0) {
        averageGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      }
      
      if (margins.length > 0) {
        averageMargin = margins.reduce((sum, margin) => sum + margin, 0) / margins.length;
      }
    }
    
    // Batasi pertumbuhan agar realistis (-20% hingga +50% per bulan)
    const monthlyGrowthRate = Math.max(-20, Math.min(50, averageGrowthRate)) / 100;
    
    // Prediksi revenue berdasarkan tren
    const nextMonthRevenue = revenue * (1 + monthlyGrowthRate);
    const nextQuarterRevenue = revenue * Math.pow(1 + monthlyGrowthRate, 3);
    const nextYearRevenue = revenue * Math.pow(1 + monthlyGrowthRate, 12);
    
    // Asumsi COGS dan OPEX sebagai persentase dari revenue (berdasarkan rata-rata historis)
    const cogsPercentage = revenue > 0 ? (cogs / revenue) : 0.6; // default 60%
    const opexPercentage = revenue > 0 ? (opex / revenue) : 0.25; // default 25%
    
    // Hitung prediksi profit
    const calculatePredictedProfit = (predictedRevenue) => {
      const predictedCogs = predictedRevenue * cogsPercentage;
      const predictedOpex = predictedRevenue * opexPercentage;
      const predictedNetProfit = predictedRevenue - predictedCogs - predictedOpex;
      const predictedMargin = predictedRevenue > 0 ? (predictedNetProfit / predictedRevenue) * 100 : 0;
      
      return {
        profit: predictedNetProfit,
        margin: predictedMargin
      };
    };
    
    const nextMonth = calculatePredictedProfit(nextMonthRevenue);
    const nextQuarter = calculatePredictedProfit(nextQuarterRevenue);
    const nextYear = calculatePredictedProfit(nextYearRevenue);
    
    // Hitung confidence berdasarkan konsistensi data historis
    const calculateConfidence = (periodsAhead) => {
      const baseConfidence = 90;
      const historyPenalty = Math.max(0, (6 - recentHistory.length) * 10);
      const timeDecay = periodsAhead * 5; // confidence menurun seiring waktu
      const volatilityPenalty = Math.abs(averageGrowthRate) > 10 ? 15 : 0;
      
      return Math.max(30, baseConfidence - historyPenalty - timeDecay - volatilityPenalty);
    };
    
    return {
      nextMonth: {
        profit: nextMonth.profit,
        margin: nextMonth.margin,
        confidence: calculateConfidence(1),
      },
      nextQuarter: {
        profit: nextQuarter.profit,
        margin: nextQuarter.margin,
        confidence: calculateConfidence(3),
      },
      nextYear: {
        profit: nextYear.profit,
        margin: nextYear.margin,
        confidence: calculateConfidence(12),
      },
      // Tambahan info untuk debugging
      metadata: {
        currentRevenue: revenue,
        currentNetProfit: netProfit,
        currentMargin: netMargin,
        averageGrowthRate: averageGrowthRate,
        cogsPercentage: cogsPercentage * 100,
        opexPercentage: opexPercentage * 100,
        historyLength: recentHistory.length,
        validationIssues: validation.issues
      }
    };
  } catch (error) {
    console.error('Error in generateForecastHelper:', error);
    return null;
  }
};

const calculateAdvancedMetricsHelper = (profitHistory, currentAnalysis) => {
  if (!currentAnalysis?.revenue_data?.total) return null;
  
  try {
    const revenue = currentAnalysis.revenue_data.total || 0;
    const cogs = currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    
    const margins = calculateMargins(revenue, cogs, opex);
    const rollingAverages = profitHistory?.length > 0 ? 
      calculateRollingAverages(profitHistory, 3) : 
      { revenueAverage: 0, profitAverage: 0, marginAverage: 0, volatility: 0 };
    
    return {
      grossProfitMargin: margins.grossMargin || 0,
      netProfitMargin: margins.netMargin || 0,
      monthlyGrowthRate: rollingAverages.marginAverage || 0,
      marginOfSafety: 0,
      cogsPercentage: margins.cogsPercentage || 0,
      opexPercentage: margins.opexPercentage || 0,
      confidenceScore: validateDataQuality(currentAnalysis)?.score || 0,
      operatingLeverage: revenue > 0 ? (margins.grossProfit / revenue) * 100 : 0,
    };
  } catch (error) {
    console.error('Error in calculateAdvancedMetricsHelper:', error);
    return null;
  }
};

const performBenchmarkHelper = (advancedMetrics) => {
  if (!advancedMetrics?.netProfitMargin) return null;
  
  try {
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
  } catch (error) {
    console.error('Error in performBenchmarkHelper:', error);
    return null;
  }
};

const generateExecutiveSummaryHelper = (currentAnalysis, advancedMetrics) => {
  if (!currentAnalysis || !advancedMetrics) return null;
  
  try {
    const executiveInsights = generateExecutiveInsights(currentAnalysis);
    return {
      insights: executiveInsights?.keyHighlights || [],
      alerts: executiveInsights?.criticalIssues || [],
      opportunities: executiveInsights?.opportunities || [],
    };
  } catch (error) {
    console.error('Error in generateExecutiveSummaryHelper:', error);
    return {
      insights: [],
      alerts: [],
      opportunities: [],
    };
  }
};

const findPreviousAnalysis = (currentPeriod, profitHistory) => {
  if (!currentPeriod || !profitHistory?.length) return null;
  
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
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitDashboard = ({
  className = '',
  defaultPeriod,
  showAdvancedMetrics = true,
}) => {
  // ✅ SEMUA STATE HOOKS DI ATAS - SELALU DIPANGGIL DALAM URUTAN YANG SAMA
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);
  const [activeTab, setActiveTab] = useState('ikhtisar');
  const [selectedChartType, setSelectedChartType] = useState('bar');

  // ✅ SEMUA CUSTOM HOOKS DI SINI - SELALU DIPANGGIL DALAM URUTAN YANG SAMA
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

  // ✅ SEMUA CALCULATIONS SETELAH HOOKS - TANPA CONDITIONAL HOOKS
  const periodOptions = generatePeriodOptions(2023, new Date().getFullYear());
  
  // Calculate derived data
  const advancedMetrics = showAdvancedMetrics ? 
    calculateAdvancedMetricsHelper(profitHistory, currentAnalysis) : null;
  
  const forecast = showAdvancedMetrics ? 
    generateForecastHelper(profitHistory, currentAnalysis) : null;
  
  const benchmark = showAdvancedMetrics ? 
    performBenchmarkHelper(advancedMetrics) : null;
  
  const executiveSummary = showAdvancedMetrics ? 
    generateExecutiveSummaryHelper(currentAnalysis, advancedMetrics) : null;

  const previousAnalysis = findPreviousAnalysis(currentPeriod, profitHistory);

  // Check if we have valid data
  const hasValidData = Boolean(currentAnalysis?.revenue_data?.total);

  // ✅ EVENT HANDLERS - TIDAK MENGGUNAKAN useCallback UNTUK MENGHINDARI HOOK ISSUES
  const handlePeriodChange = (period) => {
    setCurrentPeriod(period);
  };

  const handleRefresh = async () => {
    try {
      await refreshAnalysis();
      setLastCalculated(new Date());
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  };

  const handleExportData = () => {
    if (!currentAnalysis) return;
    
    try {
      const revenue = currentAnalysis.revenue_data?.total || 0;
      const cogs = currentAnalysis.cogs_data?.total || 0;
      const opex = currentAnalysis.opex_data?.total || 0;
      
      const csvContent = `Period,Revenue,COGS,OPEX,Gross Profit,Net Profit
${currentPeriod},${revenue},${cogs},${opex},${revenue - cogs},${revenue - cogs - opex}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analisis-profit-${currentPeriod}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  // ✅ RENDER FUNCTIONS - SIMPLE FUNCTIONS TANPA HOOKS
  const renderExecutiveSummary = () => {
    if (!executiveSummary || !showAdvancedMetrics) return null;

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
              {executiveSummary.insights.map((insight, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0" />
                  {insight}
                </div>
              ))}
              {executiveSummary.insights.length === 0 && (
                <div className="text-sm text-gray-500 italic">Tidak ada insight tersedia</div>
              )}
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
              {executiveSummary.alerts.length > 0 ? (
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
              {executiveSummary.opportunities.map((opportunity, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                  {opportunity}
                </div>
              ))}
              {executiveSummary.opportunities.length === 0 && (
                <div className="text-sm text-gray-500 italic">Tidak ada peluang teridentifikasi</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderForecast = () => {
    if (!forecast) {
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prediksi Profit</CardTitle>
            <CardDescription>Data tidak cukup untuk membuat prediksi yang akurat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">Minimal 3 periode data historis diperlukan untuk prediksi AI</p>
              <p className="text-sm">Saat ini tersedia: {profitHistory?.length || 0} periode</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Prediksi Profit</CardTitle>
          <CardDescription>Prediksi bertenaga AI berdasarkan tren historis dan analisis pasar</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Peringatan jika ada masalah validasi */}
          {forecast.metadata?.validationIssues?.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Peringatan Data:</div>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {forecast.metadata.validationIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-gray-600">
                  Data telah disesuaikan untuk prediksi yang lebih akurat.
                </div>
              </AlertDescription>
            </Alert>
          )}

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
          
          {/* Metodologi dan Info Debug */}
          {forecast.metadata && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Metodologi Prediksi</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Pertumbuhan Rata-rata</div>
                    <div className="font-medium">{forecast.metadata.averageGrowthRate.toFixed(1)}%/bulan</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rasio COGS</div>
                    <div className="font-medium">{forecast.metadata.cogsPercentage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rasio OPEX</div>
                    <div className="font-medium">{forecast.metadata.opexPercentage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Data Historis</div>
                    <div className="font-medium">{forecast.metadata.historyLength} periode</div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Catatan:</strong> Prediksi ini menggunakan analisis tren historis dengan 
                pembatasan pertumbuhan realistis (-20% hingga +50% per bulan). Tingkat keyakinan 
                menurun seiring bertambahnya jangka waktu prediksi.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ✅ MAIN RENDER - PASTIKAN TIDAK ADA CONDITIONAL HOOKS
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

      {/* Status Indicators */}
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Executive Summary */}
      {renderExecutiveSummary()}

      {/* Summary Cards */}
      {hasValidData && (
        <ProfitSummaryCards 
          currentAnalysis={currentAnalysis} 
          previousAnalysis={previousAnalysis} 
          isLoading={loading} 
        />
      )}

      {/* Forecast */}
      {showAdvancedMetrics && renderForecast()}

      {/* Main Tabs */}
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
                <CardDescription>Mendalami metrik performa keuangan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPercentage(advancedMetrics.grossProfitMargin)}
                    </div>
                    <div className="text-sm text-gray-600">Margin Kotor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(advancedMetrics.netProfitMargin)}
                    </div>
                    <div className="text-sm text-gray-600">Margin Bersih</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPercentage(advancedMetrics.monthlyGrowthRate)}
                    </div>
                    <div className="text-sm text-gray-600">Pertumbuhan Bulanan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatPercentage(advancedMetrics.marginOfSafety)}
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
                <CardDescription>Bagaimana performa Anda dibandingkan dengan standar industri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Rata-rata Industri</div>
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {formatPercentage(benchmark.industry.averageNetMargin)}
                    </div>
                    <div className="text-xs text-gray-500">Margin Bersih</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Posisi Anda</div>
                    <div className="text-xl font-bold text-blue-700 mb-1">
                      {benchmark.competitive.percentile}
                    </div>
                    <div className="text-xs text-gray-500">Persentil</div>
                    <Badge
                      variant={benchmark.competitive.position === 'sangat baik' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {benchmark.competitive.position}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Gap ke Kuartil Atas</div>
                    <div className="text-xl font-bold text-amber-700 mb-1">
                      {formatPercentage(benchmark.competitive.gapToLeader)}
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
          <span>Pendapatan: {formatCurrency(currentAnalysis.revenue_data?.total || 0)}</span>
          <span>•</span>
          <span>
            Laba Bersih: {formatCurrency(
              (currentAnalysis.revenue_data?.total || 0) - 
              (currentAnalysis.cogs_data?.total || 0) - 
              (currentAnalysis.opex_data?.total || 0)
            )}
          </span>
          <span>•</span>
          <span>
            Margin: {formatPercentage(
              (currentAnalysis.revenue_data?.total || 0) > 0
                ? (((currentAnalysis.revenue_data?.total || 0) - 
                    (currentAnalysis.cogs_data?.total || 0) - 
                    (currentAnalysis.opex_data?.total || 0)) / 
                   (currentAnalysis.revenue_data?.total || 0)) * 100
                : 0
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfitDashboard;