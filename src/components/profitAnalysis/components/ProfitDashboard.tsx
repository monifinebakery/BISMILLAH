// src/components/profitAnalysis/components/ProfitDashboard.tsx

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Import hooks dan utilities
import { useProfitAnalysis } from '../hooks';
import { getCurrentPeriod } from '../utils/profitTransformers';
import { calculateMargins } from '../utils/profitCalculations';

// Import dashboard sections and tabs
import {
  DashboardHeaderSection,
  ExecutiveSummarySection,
  StatusFooter,
  ForecastSection
} from './sections';
import {
  IkhtisarTabContent,
  TrenTabContent,
  BreakdownTabContent
} from './tabs';

// Import helper functions
import {
  calculateAdvancedMetricsHelper,
  performBenchmarkHelper,
  generateExecutiveSummaryHelper,
  findPreviousAnalysis,
  generateForecastHelper
} from '../utils/dashboardHelpers';

// Import main components
import ProfitSummaryCards from './ProfitSummaryCards';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


// ==============================================
// TYPES
// ==============================================

export interface ProfitDashboardProps {
  className?: string;
  defaultPeriod?: string;
  showAdvancedMetrics?: boolean;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitDashboard: React.FC<ProfitDashboardProps> = ({
  className = '',
  defaultPeriod,
  showAdvancedMetrics = true,
}) => {
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('ikhtisar');
  const [selectedChartType, setSelectedChartType] = useState('bar');

  const [mode, setMode] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [range, setRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  const {
    currentAnalysis,
    profitHistory,
    loading,
    error,
    currentPeriod,
    refreshAnalysis,
    profitMetrics,
    labels,
    refreshWACData,
  } = useProfitAnalysis({
    defaultPeriod: defaultPeriod || getCurrentPeriod(),
    autoCalculate: true,
    enableRealTime: true,
    enableWAC: true,
    mode: 'daily',
    dateRange: range,
  });

  const { formatPeriodLabel, exportData } = useProfitData({
    history: profitHistory,
    currentAnalysis,
  });

  const periodOptions = generatePeriodOptions(
    2023,
    new Date().getFullYear(),
    mode === 'yearly' ? 'yearly' : 'monthly'
  );

  const advancedMetrics = showAdvancedMetrics
    ? calculateAdvancedMetricsHelper(profitHistory, currentAnalysis)
    : null;
  
  const benchmark = showAdvancedMetrics
    ? performBenchmarkHelper(advancedMetrics)
    : null;
  
  const executiveSummary = showAdvancedMetrics
    ? generateExecutiveSummaryHelper(currentAnalysis, advancedMetrics)
    : null;
  
  const forecast = showAdvancedMetrics
    ? generateForecastHelper(profitHistory, currentAnalysis)
    : null;

  const previousAnalysis = findPreviousAnalysis(currentPeriod, profitHistory);
  const hasValidData = Boolean(currentAnalysis?.revenue_data?.total);

  const handlePeriodChange = (period: string) => {
    // Clear any daily range when picking period
    setRange(undefined);
    setCurrentPeriod(period);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refreshAnalysis(),
        refreshWACData(),
      ]);
      setLastCalculated(new Date());
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  };

  // Wire mode toggle: atur rentang/period sesuai mode
  const handleModeChange = (m: 'daily' | 'monthly' | 'yearly') => {
    setMode(m);
    if (m === 'daily') {
      const now = new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setRange({ from: firstOfThisMonth, to: now });
    } else {
      setRange(undefined);
      setCurrentPeriod(getCurrentPeriod(m === 'yearly' ? 'yearly' : 'monthly'));
    }
  };

  // Wire date range changes: ensure we are in daily mode when user picks a preset

  const handleDateRangeChange = (r: { from: Date; to: Date }) => {
    setRange(r);
  };


  const safeRevenue = profitMetrics?.revenue ?? currentAnalysis?.revenue_data?.total ?? 0;
  const safeCogs = profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0;
  const safeOpex = currentAnalysis?.opex_data?.total ?? 0;
  const footerCalc = calculateMargins(safeRevenue, safeCogs, safeOpex);

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
      <DashboardHeaderSection
        hasValidData={hasValidData}
        isLoading={loading}
        quickStatus={{
          netProfit: footerCalc.netProfit,
          cogsPercentage: (safeCogs / Math.max(safeRevenue, 1)) * 100,
          revenue: safeRevenue
        }}
        statusIndicators={[
          ...(isDataStale ? [{ type: 'stale' as const, label: 'Data usang' }] : []),
          ...(lastCalculated ? [{ type: 'updated' as const, label: 'Diperbarui', timestamp: lastCalculated }] : []),
          ...(benchmark?.competitive?.position ? [{ type: 'benchmark' as const, label: benchmark.competitive.position, position: benchmark.competitive.position }] : [])
        ]}
        onRefresh={handleRefresh}
        dateRange={range}
        onDateRangeChange={handleDateRangeChange}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="hidden md:block">
        <ExecutiveSummarySection data={executiveSummary} isLoading={loading} showAdvancedMetrics={showAdvancedMetrics} />
      </div>
      
      {hasValidData && (
        <ProfitSummaryCards 
          currentAnalysis={currentAnalysis} 
          previousAnalysis={previousAnalysis} 
          isLoading={loading} 
          effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
          labels={labels}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto p-1 gap-1">
            <TabsTrigger value="ikhtisar">Ringkasan</TabsTrigger>
            <TabsTrigger value="tren">Grafik</TabsTrigger>
            <TabsTrigger value="breakdown">Detail</TabsTrigger>
          </TabsList>
        </div>

        <IkhtisarTabContent
          currentAnalysis={currentAnalysis}
          profitHistory={profitHistory}
          isLoading={loading}
          selectedChartType={selectedChartType}
          effectiveCogs={profitMetrics?.cogs}
          labels={labels}
        />

        <TrenTabContent
          profitHistory={profitHistory}
          isLoading={loading}
          effectiveCogs={profitMetrics?.cogs}
          labels={labels}
        />

        <BreakdownTabContent
          currentAnalysis={currentAnalysis}
          isLoading={loading}
          effectiveCogs={profitMetrics?.cogs}
          hppBreakdown={profitMetrics?.hppBreakdown}
          labels={labels}
        />
      </Tabs>

      <ForecastSection data={forecast} isLoading={loading} />

      <StatusFooter
        data={{
          dateRange: range,
          revenue: safeRevenue,
          netProfit: footerCalc.netProfit,
          netMargin: footerCalc.netMargin,
        }}
        hasValidData={hasValidData}
        isLoading={loading}
        hppLabel={labels?.hppLabel}
        hppHint={labels?.hppHint}
      />
    </div>
  );
};

export default ProfitDashboard;
