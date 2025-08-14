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

// Import Profit Analysis components
import ProfitSummaryCards from './ProfitSummaryCards';
import ProfitBreakdownChart from './ProfitBreakdownChart';
import ProfitTrendChart from './ProfitTrendChart';
import DetailedBreakdownTable from './DetailedBreakdownTable';

// Import hooks and utilities
import { useProfitAnalysis, useProfitCalculation, useProfitData } from '../hooks';
import { formatCurrency, formatPercentage, generatePeriodOptions, getCurrentPeriod } from '../utils/profitTransformers';
import {
  calculateAdvancedProfitMetrics,
  generateProfitForecast,
  generateCostOptimizationRecommendations,
  performCompetitiveBenchmarking,
  generateExecutiveSummary,
} from '../utils/enhancedProfitCalculations';

// Types
interface ProfitDashboardProps {
  className?: string;
  defaultPeriod?: string;
  showAdvancedMetrics?: boolean;
}

// Main Profit Dashboard Component
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

  const { analyzeMargins, comparePeriods, generateForecast } = useProfitCalculation();
  const { formatPeriodLabel, exportData } = useProfitData({
    history: profitHistory,
    currentAnalysis,
  });

  // Local State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'pie'>('bar');

  // Period Options
  const periodOptions = useMemo(() => generatePeriodOptions(2023, new Date().getFullYear()), []);

  // Advanced Calculations
  const advancedMetrics = useMemo(() => {
    if (!currentAnalysis || !showAdvancedMetrics) return null;
    return calculateAdvancedProfitMetrics(profitHistory, currentAnalysis, 0, 0);
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

  const costRecommendations = useMemo(() => {
    if (!currentAnalysis || !advancedMetrics) return null;
    return generateCostOptimizationRecommendations(currentAnalysis, advancedMetrics, profitHistory);
  }, [currentAnalysis, advancedMetrics, profitHistory]);

  // Previous Period for Comparison
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
    link.download = `profit-analysis-${currentPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Executive Summary Component
  const ExecutiveSummarySection = () => {
    if (!executiveSummary) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Key Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              Key Insights
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

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              Action Items
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
                <div className="text-sm text-gray-500 italic">No critical issues detected</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
              Opportunities
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

  // Forecast Section
  const ForecastSection = () => {
    if (!forecast) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profit Forecast</CardTitle>
          <CardDescription>AI-powered predictions based on historical trends and market analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Next Month</div>
              <div className="text-2xl font-bold text-blue-700 mb-1">{formatCurrency(forecast.nextMonth.profit)}</div>
              <div className="text-sm text-blue-600">{formatPercentage(forecast.nextMonth.margin)} margin</div>
              <div className="text-xs text-gray-500 mt-2">{forecast.nextMonth.confidence.toFixed(0)}% confidence</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Next Quarter</div>
              <div className="text-2xl font-bold text-green-700 mb-1">{formatCurrency(forecast.nextQuarter.profit)}</div>
              <div className="text-sm text-green-600">{formatPercentage(forecast.nextQuarter.margin)} margin</div>
              <div className="text-xs text-gray-500 mt-2">{forecast.nextQuarter.confidence.toFixed(0)}% confidence</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Next Year</div>
              <div className="text-2xl font-bold text-purple-700 mb-1">{formatCurrency(forecast.nextYear.profit)}</div>
              <div className="text-sm text-purple-600">{formatPercentage(forecast.nextYear.margin)} margin</div>
              <div className="text-xs text-gray-500 mt-2">{forecast.nextYear.confidence.toFixed(0)}% confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Main Render
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit Analysis</h1>
          <p className="text-gray-600">Comprehensive profit analysis with real-time calculations and business intelligence</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <Select value={currentPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
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

      {/* Status Indicators */}
      <div className="flex items-center space-x-4">
        {isDataStale && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Data may be outdated</span>
          </Badge>
        )}
        {lastCalculated && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Updated: {lastCalculated.toLocaleTimeString()}</span>
          </Badge>
        )}
        {benchmark?.competitive.position && (
          <Badge
            variant={benchmark.competitive.position === 'excellent' ? 'default' : 'secondary'}
            className="flex items-center space-x-1"
          >
            <Target className="w-3 h-3" />
            <span>{benchmark.competitive.position} performance</span>
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
      {showAdvancedMetrics && <ExecutiveSummarySection />}

      {/* Summary Cards */}
      <ProfitSummaryCards currentAnalysis={currentAnalysis} previousAnalysis={previousAnalysis} isLoading={loading} />

      {/* Forecast Section */}
      {showAdvancedMetrics && <ForecastSection />}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

        <TabsContent value="trends" className="space-y-6">
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

        <TabsContent value="insights" className="space-y-6">
          {/* Cost Recommendations */}
          {costRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Recommendations</CardTitle>
                <CardDescription>AI-generated suggestions to improve profitability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Immediate Actions */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      Immediate Actions (1-3 months)
                    </h4>
                    <div className="space-y-3">
                      {costRecommendations.immediate.map((rec, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{rec.action}</h5>
                            <Badge
                              variant={rec.effort === 'low' ? 'default' : rec.effort === 'medium' ? 'secondary' : 'destructive'}
                            >
                              {rec.effort} effort
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Potential Impact:</span> {formatCurrency(rec.impact)}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Timeline:</span> {rec.timeframe} •{' '}
                            <span className="font-medium">Category:</span> {rec.category.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medium Term Actions */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                      Medium Term Actions (3-12 months)
                    </h4>
                    <div className="space-y-3">
                      {costRecommendations.mediumTerm.map((rec, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{rec.action}</h5>
                            <Badge
                              variant={rec.effort === 'low' ? 'default' : rec.effort === 'medium' ? 'secondary' : 'destructive'}
                            >
                              {rec.effort} effort
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Potential Impact:</span> {formatCurrency(rec.impact)}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Timeline:</span> {rec.timeframe} •{' '}
                            <span className="font-medium">Category:</span> {rec.category.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Long Term Actions */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      Long Term Actions (12+ months)
                    </h4>
                    <div className="space-y-3">
                      {costRecommendations.longTerm.map((rec, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{rec.action}</h5>
                            <Badge
                              variant={rec.effort === 'low' ? 'default' : rec.effort === 'medium' ? 'secondary' : 'destructive'}
                            >
                              {rec.effort} effort
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Potential Impact:</span> {formatCurrency(rec.impact)}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Timeline:</span> {rec.timeframe} •{' '}
                            <span className="font-medium">Category:</span> {rec.category.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitive Benchmark */}
          {benchmark && (
            <Card>
              <CardHeader>
                <CardTitle>Competitive Benchmarking</CardTitle>
                <CardDescription>How your performance compares to industry standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Industry Average</div>
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {formatPercentage(benchmark.industry.averageNetMargin)}
                    </div>
                    <div className="text-xs text-gray-500">Net Margin</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Your Position</div>
                    <div className="text-xl font-bold text-blue-700 mb-1">{benchmark.competitive.percentile}th</div>
                    <div className="text-xs text-gray-500">Percentile</div>
                    <Badge
                      variant={benchmark.competitive.position === 'excellent' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {benchmark.competitive.position}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Gap to Top Quartile</div>
                    <div className="text-xl font-bold text-amber-700 mb-1">
                      {formatPercentage(benchmark.competitive.gapToLeader)}
                    </div>
                    <div className="text-xs text-gray-500">Margin Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Metrics */}
          {advancedMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Deep dive into financial performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatPercentage(advancedMetrics.grossProfitMargin)}</div>
                    <div className="text-sm text-gray-600">Gross Margin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatPercentage(advancedMetrics.netProfitMargin)}</div>
                    <div className="text-sm text-gray-600">Net Margin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatPercentage(advancedMetrics.monthlyGrowthRate)}</div>
                    <div className="text-sm text-gray-600">Monthly Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{formatPercentage(advancedMetrics.marginOfSafety)}</div>
                    <div className="text-sm text-gray-600">Margin of Safety</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{formatPercentage(advancedMetrics.cogsPercentage)}</div>
                    <div className="text-sm text-gray-600">COGS %</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{formatPercentage(advancedMetrics.opexPercentage)}</div>
                    <div className="text-sm text-gray-600">OpEx %</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">{formatPercentage(advancedMetrics.confidenceScore)}</div>
                    <div className="text-sm text-gray-600">Data Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{advancedMetrics.operatingLeverage.toFixed(2)}x</div>
                    <div className="text-sm text-gray-600">Operating Leverage</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Status */}
      {currentAnalysis && !loading && (
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Analysis completed for {formatPeriodLabel(currentPeriod)}</span>
          </div>
          <span>•</span>
          <span>Revenue: {formatCurrency(currentAnalysis.revenue_data.total)}</span>
          <span>•</span>
          <span>
            Net Profit:{' '}
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