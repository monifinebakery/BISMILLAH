// ImprovedProfitDashboard.tsx - Simplified profit analysis dashboard with code splitting
// ================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useProfitAnalysis } from '../hooks';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { id } from 'date-fns/locale';

// Lazy load components for better code splitting
const ProfitHeader = React.lazy(() => import('./ProfitHeader'));
const ProfitMetrics = React.lazy(() => import('./ProfitMetrics'));
const ProfitBreakdown = React.lazy(() => import('./ProfitBreakdown'));
const HealthScoreCard = React.lazy(() => import('./HealthScoreCard'));
const ProfitTips = React.lazy(() => import('./ProfitTips'));
const QuickInsights = React.lazy(() => import('./QuickInsights'));

// Loading fallback components
const LoadingSkeleton = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
      <p>Sedang menghitung profit...</p>
    </div>
  </div>
);

const ErrorFallback = ({ error }: { error: string }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

// ===== MAIN DASHBOARD COMPONENT =====
const ImprovedProfitDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [mode, setMode] = useState<'monthly' | 'daily'>('monthly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const {
    currentAnalysis,
    loading,
    error,
    refreshAnalysis,
    profitMetrics,
    currentPeriod: defaultPeriod,
  } = useProfitAnalysis({
    autoCalculate: true,
    enableWAC: true,
    mode: mode,
    dateRange: mode === 'daily' ? dateRange : undefined,
  });

  const currentPeriod = useMemo(() => {
    if (mode === 'daily' && dateRange?.from) {
      if (dateRange.to) {
        return `${dateRange.from.toLocaleDateString('id-ID')} - ${dateRange.to.toLocaleDateString('id-ID')}`;
      }
      return dateRange.from.toLocaleDateString('id-ID');
    }
    return defaultPeriod;
  }, [mode, dateRange, defaultPeriod]);

  const handleRefresh = async () => {
    try {
      await refreshAnalysis();
      toast.success('Data berhasil diperbarui! 🎉');
    } catch (error) {
      toast.error('Gagal memperbarui data 😞');
    }
  };

  // Calculate business metrics
  const businessMetrics = useMemo(() => {
    if (!currentAnalysis) return null;
    
    const revenue = currentAnalysis.revenue_data?.total || 0;
    const cogs = profitMetrics.cogs || currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    return {
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
    };
  }, [currentAnalysis, profitMetrics]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <div className="space-y-6">
      <React.Suspense fallback={<LoadingSkeleton />}>
        <ProfitHeader 
          period={currentPeriod}
          mode={mode}
          setMode={setMode}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onRefresh={handleRefresh}
          businessMetrics={businessMetrics}
        />
      </React.Suspense>

      {businessMetrics && (
        <React.Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}>
          <QuickInsights analysis={currentAnalysis} />
        </React.Suspense>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Cards */}
          <React.Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-40 bg-gray-100 rounded-lg animate-pulse" />}>
            <ProfitMetrics businessMetrics={businessMetrics} />
          </React.Suspense>

          {/* Detailed Breakdown */}
          <React.Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <ProfitBreakdown 
              revenueData={currentAnalysis?.revenue_data}
              cogsData={currentAnalysis?.cogs_data}
              opexData={currentAnalysis?.opex_data}
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              businessMetrics={businessMetrics}
            />
          </React.Suspense>
        </div>

        {/* Right Column - Health Score and Tips */}
        <div className="space-y-6">
          {businessMetrics && (
            <React.Suspense fallback={<div className="h-80 bg-gray-100 rounded-lg animate-pulse" />}>
              <HealthScoreCard metrics={businessMetrics} />
            </React.Suspense>
          )}
          
          <React.Suspense fallback={<div className="h-40 bg-gray-100 rounded-lg animate-pulse" />}>
            <ProfitTips />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default ImprovedProfitDashboard;
