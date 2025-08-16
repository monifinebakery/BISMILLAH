// src/components/warehouse/components/ProfitDashboard.tsx
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
  Download,
  Target,
  Lightbulb,
  RotateCw,
} from 'lucide-react';

// Import komponen Analisis Profit
import ProfitSummaryCards from './ProfitSummaryCards';
import ProfitBreakdownChart from './ProfitBreakdownChart';
import ProfitTrendChart from './ProfitTrendChart';
import DetailedBreakdownTable from './DetailedBreakdownTable';
import FNBInsights from './FNBInsights';

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
const validateForecastData = (currentAnalysis: any) => {
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

const generateForecastHelper = (profitHistory: any[], currentAnalysis: any) => {
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
    const calculatePredictedProfit = (predictedRevenue: number) => {
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
    const calculateConfidence = (periodsAhead: number) => {
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

const calculateAdvancedMetricsHelper = (profitHistory: any[], currentAnalysis: any) => {
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

const performBenchmarkHelper = (advancedMetrics: any) => {
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

const generateExecutiveSummaryHelper = (currentAnalysis: any, advancedMetrics: any) => {
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

const findPreviousAnalysis = (currentPeriod: string, profitHistory: any[]) => {
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

const ProfitDashboard: React.FC<ProfitDashboardProps> = ({
  className = '',
  defaultPeriod,
  showAdvancedMetrics = true,
}) => {
  // ✅ SEMUA STATE HOOKS DI ATAS - SELALU DIPANGGIL DALAM URUTAN YANG SAMA
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('ikhtisar');
  const [selectedChartType, setSelectedChartType] = useState('bar');

  // ✅ UPDATE: Destructuring dari hook dengan WAC
  const {
    currentAnalysis,
    profitHistory,
    loading,
    error,
    currentPeriod,
    setCurrentPeriod,
    refreshAnalysis,
    // ⬇️ baru
    profitMetrics,
    labels,
    refreshWACData,
  } = useProfitAnalysis({
    defaultPeriod: defaultPeriod || getCurrentPeriod(),
    autoCalculate: true,
    enableRealTime: true,
    enableWAC: true, // disarankan aktif
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
  
  const benchmark = showAdvancedMetrics ? 
    performBenchmarkHelper(advancedMetrics) : null;
  
  const executiveSummary = showAdvancedMetrics ? 
    generateExecutiveSummaryHelper(currentAnalysis, advancedMetrics) : null;

  const previousAnalysis = findPreviousAnalysis(currentPeriod, profitHistory);

  // Check if we have valid data
  const hasValidData = Boolean(currentAnalysis?.revenue_data?.total);

  // ✅ UPDATE: Event handler dengan refresh WAC
  const handlePeriodChange = (period: string) => {
    setCurrentPeriod(period);
  };

  // ✅ UPDATE: Refresh juga data WAC
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refreshAnalysis(),
        refreshWACData(),   // ⬅️ refresh data WAC (bahanMap & pemakaian)
      ]);
      setLastCalculated(new Date());
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  };

  // ✅ 1) UPDATE: Pakai COGS efektif saat export CSV
  const handleExportData = () => {
    if (!currentAnalysis) return;
    
    try {
      const revenue = currentAnalysis.revenue_data?.total || 0;
      // ⬇️ pakai WAC (profitMetrics.cogs), fallback ke API kalau belum ada
      const cogs = profitMetrics?.cogs ?? (currentAnalysis.cogs_data?.total || 0);
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

  // ✅ 5) UPDATE: Angka aman untuk footer dan konsisten pakai util
  const safeRevenue = profitMetrics?.revenue ?? currentAnalysis?.revenue_data?.total ?? 0;
  const safeCogs    = profitMetrics?.cogs    ?? currentAnalysis?.cogs_data?.total    ?? 0;
  const safeOpex    =                            currentAnalysis?.opex_data?.total    ?? 0;

  // konsisten pakai util
  const footerCalc = calculateMargins(safeRevenue, safeCogs, safeOpex);

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
    return null; // Fitur prediksi dihapus
  };

  // ✅ MAIN RENDER - PASTIKAN TIDAK ADA CONDITIONAL HOOKS
  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">💰 Untung Rugi Warung</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Lihat untung-rugi bulan ini, modal bahan baku, dan perkiraan bulan depan - semua dalam bahasa yang mudah dimengerti</p>
          {/* 🍽️ Quick Status Summary */}
          {hasValidData && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-3 space-y-2 sm:space-y-0">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                footerCalc.netProfit >= 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {footerCalc.netProfit >= 0 ? '📈 Untung' : '📉 Rugi'} {formatCurrency(Math.abs(footerCalc.netProfit))}
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="text-gray-600 text-xs sm:text-sm">
                Modal bahan: <span className="font-medium text-orange-600">{formatPercentage((safeCogs / Math.max(safeRevenue, 1)) * 100)}</span> dari omset
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4 lg:mt-0">
          <Select value={currentPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-48">
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
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-1 flex-1 sm:flex-initial"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={!hasValidData}
              className="flex items-center space-x-1 flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex flex-wrap items-center gap-2">
        {isDataStale && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Data usang</span>
          </Badge>
        )}
        {lastCalculated && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs hidden sm:inline">Diperbarui: {lastCalculated.toLocaleTimeString('id-ID')}</span>
            <span className="text-xs sm:hidden">Update: {lastCalculated.toLocaleTimeString('id-ID', { timeStyle: 'short' })}</span>
          </Badge>
        )}
        {benchmark?.competitive?.position && (
          <Badge
            variant={benchmark.competitive.position === 'sangat baik' ? 'default' : 'secondary'}
            className="flex items-center space-x-1"
          >
            <Target className="w-3 h-3" />
            <span className="text-xs">{benchmark.competitive.position}</span>
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

      {/* Executive Summary - Hidden on mobile to save space */}
      <div className="hidden md:block">
        {renderExecutiveSummary()}
      </div>

      {/* Summary Cards - ✅ 1) UPDATE: Amanin semua akses profitMetrics */}
      {hasValidData && (
        <ProfitSummaryCards 
          currentAnalysis={currentAnalysis} 
          previousAnalysis={previousAnalysis} 
          isLoading={loading} 
          // ⬇️ props baru dengan fallback
          effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
          labels={labels}
        />
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
            <TabsTrigger value="ikhtisar" className="text-xs sm:text-sm px-2 py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 flex flex-col sm:flex-row items-center justify-center gap-1">
              <span className="text-base sm:text-sm">📊</span>
              <span className="text-xs sm:text-sm font-medium">Ringkasan</span>
            </TabsTrigger>
            <TabsTrigger value="tren" className="text-xs sm:text-sm px-2 py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 flex flex-col sm:flex-row items-center justify-center gap-1">
              <span className="text-base sm:text-sm">📈</span>
              <span className="text-xs sm:text-sm font-medium">Grafik</span>
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs sm:text-sm px-2 py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 flex flex-col sm:flex-row items-center justify-center gap-1">
              <span className="text-base sm:text-sm">🧾</span>
              <span className="text-xs sm:text-sm font-medium">Detail</span>
            </TabsTrigger>
            <TabsTrigger value="wawasan" className="text-xs sm:text-sm px-2 py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 flex flex-col sm:flex-row items-center justify-center gap-1">
              <span className="text-base sm:text-sm">💡</span>
              <span className="text-xs sm:text-sm font-medium">Tips</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ikhtisar" className="space-y-4 sm:space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* ✅ 1) UPDATE: Amanin semua akses profitMetrics */}
            <ProfitBreakdownChart 
              currentAnalysis={currentAnalysis} 
              isLoading={loading} 
              chartType={selectedChartType} 
              // ⬇️ supaya chart pakai angka WAC dengan fallback
              effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
              labels={labels}
            />
            <ProfitTrendChart
              profitHistory={profitHistory}
              isLoading={loading}
              chartType="line"
              showMetrics={['revenue', 'grossProfit', 'netProfit']}
              // ⬇️ tambahkan effectiveCogs dan labels dengan fallback
              effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
              labels={labels}
            />
          </div>
        </TabsContent>

        <TabsContent value="tren" className="space-y-4 sm:space-y-6 mt-6">
          <ProfitTrendChart
            profitHistory={profitHistory}
            isLoading={loading}
            chartType="area"
            showMetrics={['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex']}
            // ⬇️ tambahkan effectiveCogs dan labels dengan fallback
            effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4 sm:space-y-6 mt-6">
          {/* ✅ 1) UPDATE: Amanin semua akses profitMetrics */}
          <DetailedBreakdownTable 
            currentAnalysis={currentAnalysis} 
            isLoading={loading} 
            showExport={true} 
            // ⬇️ HPP total & breakdown WAC dengan fallback
            effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
            hppBreakdown={profitMetrics?.hppBreakdown ?? []}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="wawasan" className="space-y-4 sm:space-y-6 mt-6">
          {/* ✅ F&B INSIGHTS - Smart recommendations untuk warung */}
          <FNBInsights 
            currentAnalysis={currentAnalysis}
            previousAnalysis={previousAnalysis}
            effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
            hppBreakdown={profitMetrics?.hppBreakdown ?? []}
          />
          
          {/* Advanced Metrics - moved below F&B insights */}
          {advancedMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>📊 Metrik Lanjutan</CardTitle>
                <CardDescription>Data teknis untuk analisis mendalam</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">
                      {formatPercentage(advancedMetrics.grossProfitMargin)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">🎯 Margin Kotor</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {formatPercentage(advancedMetrics.netProfitMargin)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">💎 Margin Bersih</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {formatPercentage(advancedMetrics.monthlyGrowthRate)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">📈 Pertumbuhan</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-amber-600">
                      {formatPercentage(advancedMetrics.marginOfSafety)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">🛡️ Keamanan</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitive Benchmark */}
          {benchmark && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Benchmarking Kompetitif</CardTitle>
                <CardDescription className="text-sm">Bagaimana performa Anda dibandingkan dengan standar industri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Status Footer - ✅ 2) UPDATE: Rapihin label periode footer */}
      {/* ✅ 3) UPDATE: Angka footer selalu valid + margin pakai util yang sama */}
      {hasValidData && !loading && (
        <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="truncate">
                Analisis {(formatPeriodLabel ?? formatPeriodLabelTransformer)(currentPeriod)}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="flex items-center">
                💰 Omset: <span className="font-medium ml-1 text-orange-700">{formatCurrency(safeRevenue)}</span>
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center">
                💎 Untung: <span className={`font-medium ml-1 ${
                  footerCalc.netProfit >= 0 ? 'text-green-700' : 'text-red-600'
                }`}>{formatCurrency(footerCalc.netProfit)}</span>
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center">
                📊 Margin: <span className="font-medium ml-1 text-blue-700">{formatPercentage(footerCalc.netMargin)}</span>
              </span>
              
              {/* ✅ 5) UPDATE: Badge kecil "WAC aktif" di status bar */}
              {labels?.hppLabel && (
                <>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full" title={labels.hppHint}>
                    {labels.hppLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitDashboard;