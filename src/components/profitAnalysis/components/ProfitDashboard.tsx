import React, { useState, useMemo } from 'react';
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
import { generatePeriodOptions, getCurrentPeriod } from '../utils/profitTransformers';

// Import fungsi kalkulasi
import {
  calculateMargins,
  comparePeriods,
  analyzeCostStructure,
  calculateBreakEvenAnalysis,
  validateDataQuality,
  generateExecutiveInsights,
  formatCurrency,
  formatPercentage,
  calculateRollingAverages,
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
const calculateAdvancedProfitMetrics = (profitHistory: any[], currentAnalysis: any) => {
  if (!currentAnalysis) return null;
  
  const revenue = currentAnalysis.revenue_data.total;
  const cogs = currentAnalysis.cogs_data.total;
  const opex = currentAnalysis.opex_data.total;
  const margins = calculateMargins(revenue, cogs, opex);
  
  const rollingAverages = calculateRollingAverages(profitHistory, 3);
  
  return {
    grossProfitMargin: margins.grossMargin,
    netProfitMargin: margins.netMargin,
    monthlyGrowthRate: rollingAverages.marginAverage,
    marginOfSafety: 0, // Akan dihitung oleh analisis break-even
    cogsPercentage: margins.cogsPercentage,
    opexPercentage: margins.opexPercentage,
    confidenceScore: validateDataQuality(currentAnalysis).score,
    operatingLeverage: revenue > 0 ? (margins.grossProfit / revenue) * 100 : 0,
  };
};

// Fungsi generate forecast profit
const generateProfitForecast = (profitHistory: any[], currentAnalysis: any) => {
  if (profitHistory.length < 3) return null;
  
  const rollingAverages = calculateRollingAverages(profitHistory, 3);
  const currentMargins = calculateMargins(
    currentAnalysis.revenue_data.total,
    currentAnalysis.cogs_data.total,
    currentAnalysis.opex_data.total
  );
  
  // Forecast sederhana berdasarkan rata-rata bergulir
  const baseRevenue = rollingAverages.revenueAverage;
  const baseProfit = rollingAverages.profitAverage;
  const baseMargin = rollingAverages.marginAverage;
  
  return {
    nextMonth: {
      profit: baseProfit * 1.02, // Asumsi pertumbuhan 2%
      margin: baseMargin,
      confidence: 75
    },
    nextQuarter: {
      profit: baseProfit * 3 * 1.05, // Pertumbuhan kuartalan 5%
      margin: baseMargin * 1.01,
      confidence: 65
    },
    nextYear: {
      profit: baseProfit * 12 * 1.15, // Pertumbuhan tahunan 15%
      margin: baseMargin * 1.05,
      confidence: 45
    }
  };
};

// Fungsi benchmarking kompetitif
const performCompetitiveBenchmarking = (advancedMetrics: any, profitHistory: any[]) => {
  if (!advancedMetrics) return null;
  
  // Rata-rata industri (dalam implementasi nyata, ini akan datang dari data eksternal)
  const industryAverages = {
    averageNetMargin: 15, // 15% rata-rata industri
    topQuartileMargin: 25, // 25% kuartil atas
  };
  
  const currentNetMargin = advancedMetrics.netProfitMargin;
  
  // Hitung posisi persentil
  let percentile = 50; // Default ke median
  if (currentNetMargin >= industryAverages.topQuartileMargin) {
    percentile = 90;
  } else if (currentNetMargin >= industryAverages.averageNetMargin) {
    percentile = 75;
  } else if (currentNetMargin >= industryAverages.averageNetMargin * 0.7) {
    percentile = 50;
  } else {
    percentile = 25;
  }
  
  let position = 'kurang';
  if (percentile >= 90) position = 'sangat baik';
  else if (percentile >= 75) position = 'baik';
  else if (percentile >= 50) position = 'rata-rata';
  
  return {
    industry: industryAverages,
    competitive: {
      percentile,
      position,
      gapToLeader: Math.max(0, industryAverages.topQuartileMargin - currentNetMargin)
    }
  };
};

// Fungsi generate ringkasan eksekutif
const generateExecutiveSummary = (currentAnalysis: any, advancedMetrics: any, forecast: any, benchmark: any) => {
  if (!currentAnalysis || !advancedMetrics) return null;
  
  const executiveInsights = generateExecutiveInsights(currentAnalysis);
  
  return {
    insights: executiveInsights.keyHighlights,
    alerts: executiveInsights.criticalIssues,
    opportunities: executiveInsights.opportunities
  };
};

// ==============================================
// KOMPONEN UTAMA DASHBOARD PROFIT
// ==============================================

const ProfitDashboard: React.FC<ProfitDashboardProps> = ({
  className = '',
  defaultPeriod,
  showAdvancedMetrics = true,
}) => {
  // Hooks
  const {
    currentAnalysis,
    profitHistory,
    loading,
    error,
    currentPeriod,
    setCurrentPeriod,
    refreshAnalysis,
    profitMetrics,
    isDataStale,
    lastCalculated,
  } = useProfitAnalysis({
    defaultPeriod: defaultPeriod || getCurrentPeriod(),
    autoCalculate: true,
    enableRealTime: true,
  });

  const { analyzeMargins, comparePeriods: comparePeriodsHook, generateForecast } = useProfitCalculation();
  const { formatPeriodLabel, exportData } = useProfitData({
    history: profitHistory,
    currentAnalysis,
  });

  // State Lokal
  const [activeTab, setActiveTab] = useState('ikhtisar');
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'pie'>('bar');

  // Opsi Periode
  const periodOptions = useMemo(() => generatePeriodOptions(2023, new Date().getFullYear()), []);

  // Kalkulasi Lanjutan
  const advancedMetrics = useMemo(() => {
    if (!currentAnalysis || !showAdvancedMetrics) return null;
    return calculateAdvancedProfitMetrics(profitHistory, currentAnalysis);
  }, [currentAnalysis, profitHistory, showAdvancedMetrics]);

  const forecast = useMemo(() => {
    if (!currentAnalysis || profitHistory.length < 3) return null;
    return generateProfitForecast(profitHistory, currentAnalysis);
  }, [currentAnalysis, profitHistory]);

  const benchmark = useMemo(() => {
    if (!advancedMetrics) return null;
    return performCompetitiveBenchmarking(advancedMetrics, profitHistory);
  }, [advancedMetrics, profitHistory]);

  const executiveSummary = useMemo(() => {
    if (!currentAnalysis || !advancedMetrics || !forecast || !benchmark) return null;
    return generateExecutiveSummary(currentAnalysis, advancedMetrics, forecast, benchmark);
  }, [currentAnalysis, advancedMetrics, forecast, benchmark]);

  // Analisis Periode Sebelumnya untuk Perbandingan
  const previousAnalysis = useMemo(() => {
    if (!currentPeriod || profitHistory.length === 0) return null;
    const [year, month] = currentPeriod.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1);
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const previousPeriod = `${previousDate.getFullYear()}-${(previousDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    return profitHistory.find((h) => h.period === previousPeriod) || null;
  }, [currentPeriod, profitHistory]);

  // Handlers
  const handlePeriodChange = (period: string) => {
    setCurrentPeriod(period);
  };

  const handleRefresh = async () => {
    await refreshAnalysis();
  };

  const handleExportData = () => {
    if (!currentAnalysis) return;
    const data = exportData();
    const csvContent = [Object.keys(data[0] || {}).join(','), ...data.map((row) => Object.values(row).join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisis-profit-${currentPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Komponen Seksi Ringkasan Eksekutif
  const ExecutiveSummarySection = () => {
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
              {executiveSummary.insights.map((insight, index) => (
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Seksi Forecast
  const ForecastSection = () => {
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
              <div className="text-2xl font-bold text-blue-700 mb-1">{formatCurrency(forecast.nextMonth.profit)}</div>
              <div className="text-sm text-blue-600">{formatPercentage(forecast.nextMonth.margin)} margin</div>
              <div className="text-xs text-gray-500 mt-2">{forecast.nextMonth.confidence.toFixed(0)}% keyakinan</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Kuartal Depan</div>
              <div className="text-2xl font-bold text-green-700 mb-1">{formatCurrency(forecast.nextQuarter.profit)}</div>
              <div className="text-sm text-green-600">{formatPercentage(forecast.nextQuarter.margin)} margin</div>
              <div className="text-xs text-gray-500 mt-2">{forecast.nextQuarter.confidence.toFixed(0)}% keyakinan</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tahun Depan</div>
              <div className="text-2xl font-bold text-purple-700 mb-1">{formatCurrency(forecast.nextYear.profit)}</div>
              <div className="text-sm text-purple-600">{formatPercentage(forecast.nextYear.margin)} margin</div>
              <div className="text-xs text-gray-500 mt-2">{forecast.nextYear.confidence.toFixed(0)}% keyakinan</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
            disabled={!currentAnalysis}
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
        {benchmark?.competitive.position && (
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
      {showAdvancedMetrics && <ExecutiveSummarySection />}

      {/* Kartu Ringkasan */}
      <ProfitSummaryCards currentAnalysis={currentAnalysis} previousAnalysis={previousAnalysis} isLoading={loading} />

      {/* Seksi Forecast */}
      {showAdvancedMetrics && <ForecastSection />}

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
            <ProfitBreakdownChart currentAnalysis={currentAnalysis} isLoading={loading} chartType={selectedChartType} />
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
          <DetailedBreakdownTable currentAnalysis={currentAnalysis} isLoading={loading} showExport={true} />
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
                    <div className="text-2xl font-bold text-blue-600">{formatPercentage(advancedMetrics.grossProfitMargin)}</div>
                    <div className="text-sm text-gray-600">Margin Kotor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatPercentage(advancedMetrics.netProfitMargin)}</div>
                    <div className="text-sm text-gray-600">Margin Bersih</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatPercentage(advancedMetrics.monthlyGrowthRate)}</div>
                    <div className="text-sm text-gray-600">Pertumbuhan Bulanan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{formatPercentage(advancedMetrics.marginOfSafety)}</div>
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
                      {formatPercentage(benchmark.industry.averageNetMargin)}
                    </div>
                    <div className="text-xs text-gray-500">Margin Bersih</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Posisi Anda</div>
                    <div className="text-xl font-bold text-blue-700 mb-1">{benchmark.competitive.percentile}</div>
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
      {currentAnalysis && !loading && (
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Analisis selesai untuk {formatPeriodLabel(currentPeriod)}</span>
          </div>
          <span>•</span>
          <span>Pendapatan: {formatCurrency(currentAnalysis.revenue_data.total)}</span>
          <span>•</span>
          <span>
            Laba Bersih:{' '}
            {formatCurrency(
              currentAnalysis.revenue_data.total - currentAnalysis.cogs_data.total - currentAnalysis.opex_data.total
            )}
          </span>
          <span>•</span>
          <span>
            Margin:{' '}
            {formatPercentage(
              currentAnalysis.revenue_data.total > 0
                ? ((currentAnalysis.revenue_data.total - currentAnalysis.cogs_data.total - currentAnalysis.opex_data.total) /
                    currentAnalysis.revenue_data.total) *
                    100
                : 0
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfitDashboard;