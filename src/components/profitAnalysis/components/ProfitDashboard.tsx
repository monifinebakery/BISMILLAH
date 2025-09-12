// src/components/profitAnalysis/components/ProfitDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { normalizeDateForDatabase } from '@/utils/dateNormalization'; // Keep for transition
import { useIsMobile } from '@/hooks/use-mobile';

// ✅ Import new UX components
import LoadingOverlay from './LoadingOverlay';
import ErrorDisplay from './ErrorDisplay';
import ModeIndicator from './ModeIndicator';
import WACStatusIndicator from './WACStatusIndicator';

import MobileProfitSummary from './MobileProfitSummary';
import { useLoadingStateManager, LOADING_MESSAGES } from '../utils/loadingStateManager';

// Import hooks dan utilities
import { useProfitAnalysis, useProfitData } from '../hooks';
import { getCurrentPeriod } from '../utils/profitTransformers';
// Removed unused calculateMargins import - using safeCalculateMargins for consistency
import { safeCalculateMargins } from '@/utils/profitValidation';

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

import ProfitAnalysisOnboarding from './ProfitAnalysisOnboarding';

// ==============================================
// TYPES
// ==============================================

export interface ProfitDashboardProps {
  className?: string;
  defaultPeriod?: string;
  showAdvancedMetrics?: boolean;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================



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

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [range, setRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  
  // ✅ NEW: Mobile detection and loading state management
  const isMobile = useIsMobile();
  const {
    loadingStates,
    setLoading,
    isAnyLoading,
    getLoadingMessage,
    getLoadingDescription,
  } = useLoadingStateManager();

  // Determine analysis mode based on date range selection
  const analysisMode = range ? 'daily' : 'monthly';

  // Handle mode change
  const handleModeChange = (newMode: 'daily' | 'monthly' | 'yearly') => {
    if (newMode === 'daily') {
      // Set default date range for daily mode (last 7 days)
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      setRange({ from: weekAgo, to: today });
    } else {
      // Clear date range for monthly/yearly mode
      setRange(undefined);
    }
  };

  const {
    currentAnalysis,
    profitHistory,
    loading,
    error,
    currentPeriod,
    setCurrentPeriod,
    refreshAnalysis,
    profitMetrics,
    labels,
    refreshWACData,
    // WAC Validation properties removed
  } = useProfitAnalysis({
    defaultPeriod: defaultPeriod || getCurrentPeriod(),
    autoCalculate: true,
    enableRealTime: true,
    enableWAC: true,
    mode: analysisMode,
    dateRange: range,
  });

  const { formatPeriodLabel, exportData } = useProfitData({
    history: profitHistory,
    currentAnalysis: currentAnalysis || undefined,
  });

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
  const hasRevenue = Boolean(currentAnalysis?.revenue_data?.total);
  const hasCogs = Boolean(currentAnalysis?.cogs_data?.total);
  const hasOpex = Boolean(currentAnalysis?.opex_data?.total);
  const hasAnyData = hasRevenue || hasCogs || hasOpex;
  const missing = [
    !hasRevenue && 'pemasukan',
    !hasCogs && 'HPP',
    !hasOpex && 'biaya operasional',
  ].filter(Boolean) as string[];

  // ✅ ENHANCED: Refresh with loading state management
  const handleRefresh = async () => {
    setLoading('refresh', true, { type: 'refresh', ...LOADING_MESSAGES.refresh });
    
    try {
      await Promise.all([
        refreshAnalysis(),
        refreshWACData(),
      ]);
      setLastCalculated(new Date());
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setLoading('refresh', false);
    }
  };
  
  // ✅ NEW: Individual data source refresh handlers
  const handleRefreshSource = async (sourceName: string) => {
    switch (sourceName) {
      case 'analysis':
          setLoading('calculations', true, { type: 'calculations', ...LOADING_MESSAGES.analysis });
        try {
          await refreshAnalysis();
        } finally {
          setLoading('analysis', false);
        }
        break;
      case 'wac':
        setLoading('wac', true, { type: 'wac', ...LOADING_MESSAGES.wac });
        try {
          await refreshWACData();
        } finally {
          setLoading('wac', false);
        }
        break;
      default:
        break;
    }
  };

  // Wire date range changes with loading state
  const handleDateRangeChange = (r: { from: Date; to: Date } | undefined) => {
    setLoading('dateRange', true, { type: 'dateRange', ...LOADING_MESSAGES.dateRange });
    
    setRange(r);
    
    // If date range is cleared, reset to current month period for monthly mode
    if (!r) {
      setCurrentPeriod(getCurrentPeriod());
    }
    
    // Clear loading after a short delay to show user feedback
    setTimeout(() => setLoading('dateRange', false), 1000);
  };
  
  // ✅ NEW: Prepare data sources for sync status
  const dataSources = [
    {
      name: 'analysis',
      label: 'Analisis Profit',
      lastUpdated: lastCalculated,
      isStale: isDataStale,
      isLoading: loadingStates.analysis,
      status: (loading ? 'loading' : error ? 'error' : 'connected') as 'connected' | 'stale' | 'error' | 'loading'
    },
    {
      name: 'wac',
      label: 'Harga Rata-rata (WAC)',
      lastUpdated: lastCalculated, // Would be better to track WAC-specific timestamp
      isStale: false, // WAC has its own refresh logic
      isLoading: loadingStates.wac,
      status: (loadingStates.wac ? 'loading' : 'connected') as 'connected' | 'stale' | 'error' | 'loading'
    },
    {
      name: 'financial',
      label: 'Data Keuangan',
      lastUpdated: lastCalculated,
      isStale: isDataStale,
      isLoading: loadingStates.analysis, // Financial data is part of analysis
      status: (loading ? 'loading' : error ? 'error' : 'connected') as 'connected' | 'stale' | 'error' | 'loading'
    }
  ];


  const safeRevenue = profitMetrics?.revenue ?? currentAnalysis?.revenue_data?.total ?? 0;
  const safeCogs = profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0;
  const safeOpex = currentAnalysis?.opex_data?.total ?? 0;
  // ✅ IMPROVED: Use centralized calculation for consistency
  const footerCalc = safeCalculateMargins(safeRevenue, safeCogs, safeOpex);

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
      {/* ✅ NEW: Unified loading overlay */}
      <LoadingOverlay
        isVisible={isAnyLoading}
        message={getLoadingMessage()}
        description={getLoadingDescription()}
        type={loadingStates.wac ? 'wac' : loadingStates.calculations ? 'calculation' : loadingStates.refresh ? 'refresh' : 'analysis'}
      />
      
      <DashboardHeaderSection
        hasValidData={hasAnyData}
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
        onStartOnboarding={() => setShowOnboarding(true)}
      />
      
      {/* ✅ NEW: Enhanced error display */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleRefresh}
          onDismiss={() => {/* Clear error if needed */}}
          variant="card"
          className="mb-6"
        />
      )}


      {/* ✅ NEW: Mode indicator for clarity */}
      <ModeIndicator
        mode={analysisMode as 'daily' | 'monthly' | 'yearly'}
        dateRange={range}
        isAggregated={analysisMode === 'daily' && range !== undefined}
        dataSource={analysisMode === 'daily' ? 'aggregated' : 'financial_transactions'}
        periodLabel={currentPeriod}
        onModeChange={handleModeChange}
      />
      
      {/* ✅ NEW: WAC status transparency */}
      {profitMetrics?.totalHPP > 0 && (
        <WACStatusIndicator
          isWACActive={true}
          effectiveCogs={profitMetrics?.cogs}
          totalHPP={profitMetrics?.totalHPP}
          lastWACUpdate={lastCalculated}
          isCalculating={loadingStates.wac}
          wacDataQuality={profitMetrics?.hppBreakdown?.length > 5 ? 'high' : profitMetrics?.hppBreakdown?.length > 2 ? 'medium' : 'low'}
          hppBreakdownCount={profitMetrics?.hppBreakdown?.length || 0}
          onRefreshWAC={() => handleRefreshSource('wac')}
        />
      )}
      
      <div className="hidden md:block">
        <ExecutiveSummarySection data={executiveSummary} isLoading={loading} showAdvancedMetrics={showAdvancedMetrics} />
      </div>
      
      {hasAnyData && (
        <>
          {/* ✅ NEW: Mobile-optimized vs Desktop layout */}
          {isMobile ? (
            <MobileProfitSummary
              currentAnalysis={currentAnalysis}
              previousAnalysis={previousAnalysis}
              effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
              isLoading={loading}
              onViewDetails={() => setActiveTab('breakdown')}
            />
          ) : (
            <ProfitSummaryCards
              currentAnalysis={currentAnalysis}
              previousAnalysis={previousAnalysis}
              isLoading={loading}
              effectiveCogs={profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0}
              labels={{
                hppLabel: labels?.hppLabel || 'Modal Bahan',
                hppHint: labels?.hppHint || 'Biaya rata-rata bahan baku'
              }}
            />
          )}
          

        </>
      )}

      {hasAnyData ? (
        missing.length > 0 && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Data berikut belum tersedia: {missing.join(', ')}
            </AlertDescription>
          </Alert>
        )
      ) : (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Periode ini belum memiliki pemasukan, HPP, maupun biaya operasional
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 gap-1 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
            <TabsTrigger 
              value="ikhtisar" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] sm:data-[state=active]:scale-105 data-[state=active]:border data-[state=active]:border-orange-200 hover:bg-white/60 group"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 group-data-[state=active]:text-orange-700 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-data-[state=active]:text-orange-700 text-center sm:text-left leading-tight">
                <span className="hidden sm:inline">📊 Ringkasan</span>
                <span className="sm:hidden">📊<br />Ringkasan</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="tren" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] sm:data-[state=active]:scale-105 data-[state=active]:border data-[state=active]:border-orange-200 hover:bg-white/60 group"
            >
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 group-data-[state=active]:text-orange-700 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-data-[state=active]:text-orange-700 text-center sm:text-left leading-tight">
                <span className="hidden sm:inline">📈 Grafik</span>
                <span className="sm:hidden">📈<br />Grafik</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="breakdown" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] sm:data-[state=active]:scale-105 data-[state=active]:border data-[state=active]:border-orange-200 hover:bg-white/60 group"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 group-data-[state=active]:text-orange-700 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-data-[state=active]:text-orange-700 text-center sm:text-left leading-tight">
                <span className="hidden sm:inline">📋 Detail</span>
                <span className="sm:hidden">📋<br />Detail</span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <IkhtisarTabContent
          currentAnalysis={currentAnalysis || undefined}
          profitHistory={profitHistory}
          isLoading={loading}
          selectedChartType={selectedChartType}
          effectiveCogs={profitMetrics?.cogs}
          labels={{
            hppLabel: labels?.hppLabel || 'Modal Bahan',
            hppHint: labels?.hppHint || 'Biaya rata-rata bahan baku'
          }}
        />

        <TrenTabContent
          profitHistory={profitHistory}
          isLoading={loading}
          effectiveCogs={profitMetrics?.cogs}
          labels={{
            hppLabel: labels?.hppLabel || 'Modal Bahan',
            hppHint: labels?.hppHint || 'Biaya rata-rata bahan baku'
          }}
        />

        <BreakdownTabContent
          currentAnalysis={currentAnalysis || undefined}
          isLoading={loading}
          effectiveCogs={profitMetrics?.cogs}
          hppBreakdown={profitMetrics?.hppBreakdown}
          labels={{
            hppLabel: labels?.hppLabel || 'Modal Bahan',
            hppHint: labels?.hppHint || 'Biaya rata-rata bahan baku'
          }}
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
        hasValidData={hasAnyData}
        isLoading={loading}
        hppLabel={labels?.hppLabel}
        hppHint={labels?.hppHint}
        />
    </div>
  );
};

export default ProfitDashboard;
