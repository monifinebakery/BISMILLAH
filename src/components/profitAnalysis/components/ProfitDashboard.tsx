// src/components/profitAnalysis/components/ProfitDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { normalizeDateForDatabase } from '@/utils/dateNormalization';

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

// Import efficiency metrics
import { calculateEfficiencyMetrics, getBenchmarkForBusinessType } from '../utils/efficiencyMetrics';
import { BusinessType } from '../utils/config/profitConfig';

// Import main components
import ProfitSummaryCards from './ProfitSummaryCards';
import EfficiencyMetricsCard from './EfficiencyMetricsCard';
import IndustryBenchmarkCard from './IndustryBenchmarkCard';
import RecommendationSystemCard from './RecommendationSystemCard';
import CashFlowAnalysisCard from './CashFlowAnalysisCard';
import SeasonalAnalysisCard from './SeasonalAnalysisCard';
import CostOptimizationCard from './CostOptimizationCard';
import ProfitabilityAlertsCard from './ProfitabilityAlertsCard';
import { IngredientCost } from '../utils/costOptimization';
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

const generateSimulatedIngredients = (): IngredientCost[] => {
  return [
    {
      id: 'beef-1',
      name: 'Daging Sapi Premium',
      category: 'protein',
      unitCost: 150000,
      unitType: 'kg',
      monthlyUsage: 200,
      totalMonthlyCost: 30000000,
      wastePercentage: 8,
      supplierName: 'Supplier Daging Utama',
      lastUpdated: new Date()
    },
    {
      id: 'chicken-1',
      name: 'Ayam Fillet',
      category: 'protein',
      unitCost: 45000,
      unitType: 'kg',
      monthlyUsage: 500,
      totalMonthlyCost: 22500000,
      wastePercentage: 5,
      supplierName: 'Supplier Ayam Segar',
      lastUpdated: new Date()
    },
    {
      id: 'rice-1',
      name: 'Beras Premium',
      category: 'grains',
      unitCost: 15000,
      unitType: 'kg',
      monthlyUsage: 800,
      totalMonthlyCost: 12000000,
      wastePercentage: 2,
      supplierName: 'Supplier Beras Berkah',
      lastUpdated: new Date()
    },
    {
      id: 'vegetables-1',
      name: 'Sayuran Segar Mix',
      category: 'vegetables',
      unitCost: 8000,
      unitType: 'kg',
      monthlyUsage: 600,
      totalMonthlyCost: 4800000,
      wastePercentage: 15,
      supplierName: 'Supplier Sayur Hijau',
      lastUpdated: new Date()
    },
    {
      id: 'oil-1',
      name: 'Minyak Goreng',
      category: 'other',
      unitCost: 18000,
      unitType: 'liter',
      monthlyUsage: 300,
      totalMonthlyCost: 5400000,
      wastePercentage: 3,
      supplierName: 'Supplier Minyak Sehat',
      lastUpdated: new Date()
    },
    {
      id: 'spices-1',
      name: 'Bumbu Dapur',
      category: 'spices',
      unitCost: 25000,
      unitType: 'kg',
      monthlyUsage: 100,
      totalMonthlyCost: 2500000,
      wastePercentage: 10,
      supplierName: 'Supplier Bumbu Nusantara',
      lastUpdated: new Date()
    },
    {
      id: 'dairy-1',
      name: 'Susu dan Keju',
      category: 'dairy',
      unitCost: 35000,
      unitType: 'kg',
      monthlyUsage: 150,
      totalMonthlyCost: 5250000,
      wastePercentage: 12,
      supplierName: 'Supplier Dairy Fresh',
      lastUpdated: new Date()
    },
    {
      id: 'beverages-1',
      name: 'Minuman Base',
      category: 'beverages',
      unitCost: 12000,
      unitType: 'liter',
      monthlyUsage: 400,
      totalMonthlyCost: 4800000,
      wastePercentage: 7,
      supplierName: 'Supplier Minuman Segar',
      lastUpdated: new Date()
    },
    {
      id: 'packaging-1',
      name: 'Kemasan Takeaway',
      category: 'packaging',
      unitCost: 2500,
      unitType: 'piece',
      monthlyUsage: 2000,
      totalMonthlyCost: 5000000,
      wastePercentage: 5,
      supplierName: 'Supplier Kemasan Eco',
      lastUpdated: new Date()
    },
    {
      id: 'seafood-1',
      name: 'Ikan dan Seafood',
      category: 'protein',
      unitCost: 80000,
      unitType: 'kg',
      monthlyUsage: 180,
      totalMonthlyCost: 14400000,
      wastePercentage: 18,
      supplierName: 'Supplier Seafood Laut',
      lastUpdated: new Date()
    }
  ];
};

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

  // Determine analysis mode based on date range selection
  const analysisMode = range ? 'daily' : 'monthly';

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
    // ✅ ADD: WAC Validation properties
    wacValidation,
    dataQualityMetrics,
    validationScore,
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

  // Wire date range changes
  const handleDateRangeChange = (r: { from: Date; to: Date } | undefined) => {
    setRange(r);
    
    // If date range is cleared, reset to current month period for monthly mode
    if (!r) {
      setCurrentPeriod(getCurrentPeriod());
    }
  };


  const safeRevenue = profitMetrics?.revenue ?? currentAnalysis?.revenue_data?.total ?? 0;
  const safeCogs = profitMetrics?.cogs ?? currentAnalysis?.cogs_data?.total ?? 0;
  const safeOpex = currentAnalysis?.opex_data?.total ?? 0;
  // ✅ IMPROVED: Use centralized calculation for consistency
  const footerCalc = safeCalculateMargins(safeRevenue, safeCogs, safeOpex);

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
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
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ✅ ADD: WAC Validation Alert */}
      {wacValidation && !wacValidation.isValid && (
        <Alert variant={wacValidation.severity === 'high' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Deteksi Inkonsistensi Data WAC</p>
              <p className="text-sm">
                Variance: {wacValidation.variancePercentage.toFixed(1)}% 
                (WAC: Rp {wacValidation.wacValue.toLocaleString('id-ID')}, 
                API COGS: Rp {wacValidation.apiCogsValue.toLocaleString('id-ID')})
              </p>
              {wacValidation.issues.length > 0 && (
                <ul className="text-sm list-disc list-inside space-y-1">
                  {wacValidation.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ ADD: Data Quality Score */}
      {dataQualityMetrics && validationScore < 80 && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Kualitas Data: {validationScore.toFixed(0)}/100</p>
              <div className="text-sm space-y-1">
                <p>Konsistensi Data: {dataQualityMetrics?.dataConsistency && typeof dataQualityMetrics.dataConsistency === 'number' ? dataQualityMetrics.dataConsistency.toFixed(1) : dataQualityMetrics?.dataConsistency || 0}%</p>
                <p>Ketersediaan WAC: {dataQualityMetrics?.wacAvailability && typeof dataQualityMetrics.wacAvailability === 'number' ? dataQualityMetrics.wacAvailability.toFixed(1) : dataQualityMetrics?.wacAvailability || 0}%</p>
                <p>Ketersediaan API COGS: {dataQualityMetrics?.apiCogsAvailability && typeof dataQualityMetrics.apiCogsAvailability === 'number' ? dataQualityMetrics.apiCogsAvailability.toFixed(1) : dataQualityMetrics?.apiCogsAvailability || 0}%</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="hidden md:block">
        <ExecutiveSummarySection data={executiveSummary} isLoading={loading} showAdvancedMetrics={showAdvancedMetrics} />
      </div>
      
      {hasAnyData && (
        <>
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
          
          <EfficiencyMetricsCard
             metrics={currentAnalysis ? calculateEfficiencyMetrics(
               currentAnalysis,
               {
                 workingDaysPerMonth: 26,
                 averagePortionsPerDay: Math.max(1, Math.round((currentAnalysis.revenue_data?.total || 0) / 30000)),
                 totalCustomers: Math.max(1, Math.round((currentAnalysis.revenue_data?.total || 0) / 50000)),
                 inventoryValue: currentAnalysis.cogs_data?.total || 0,
                 laborCosts: (currentAnalysis.opex_data?.total || 0) * 0.4,
                 marketingCosts: (currentAnalysis.opex_data?.total || 0) * 0.1
               },
               BusinessType.FNB_RESTAURANT
             ) : null}
             businessType={BusinessType.FNB_RESTAURANT}
             isLoading={loading}
             className=""
           />
           
           <IndustryBenchmarkCard
             currentAnalysis={currentAnalysis}
             businessType={BusinessType.FNB_RESTAURANT}
             isLoading={loading}
             className=""
           />
           
           {currentAnalysis && (
             <RecommendationSystemCard
               analysis={currentAnalysis}
               businessType={BusinessType.FNB_RESTAURANT}
               className=""
             />
           )}

           {/* Cash Flow Analysis */}
           {currentAnalysis && (
             <CashFlowAnalysisCard 
               currentAnalysis={currentAnalysis}
               businessType={BusinessType.FNB_RESTAURANT}
               additionalData={{
                 currentCash: 50000000, // Simulasi data cash saat ini
                 accountsReceivable: 15000000, // Simulasi piutang
                 inventory: 25000000, // Simulasi inventory
                 accountsPayable: 20000000 // Simulasi hutang
               }}
             />
           )}

           {/* Seasonal Analysis */}
          <SeasonalAnalysisCard
            historicalData={profitHistory}
            businessType={BusinessType.FNB_RESTAURANT}
            currentMonth={new Date().getMonth() + 1}
          />

          {/* Cost Optimization */}
          <CostOptimizationCard
            ingredients={generateSimulatedIngredients()}
            businessType={BusinessType.FNB_RESTAURANT}
          />
          
          {currentAnalysis && (
            <ProfitabilityAlertsCard
              currentData={currentAnalysis}
              historicalData={profitHistory.slice(-6)} // Last 6 periods for historical analysis
              businessType={BusinessType.FNB_CAFE}
              onConfigChange={(config) => {
                console.log('Alert configuration updated:', config);
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
