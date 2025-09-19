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
import { supabase } from '@/integrations/supabase/client';

// Lazy load components for better code splitting
const ProfitHeader = React.lazy(() => import('./ProfitHeader'));
const ProfitMetrics = React.lazy(() => import('./ProfitMetrics'));
const ProfitBreakdown = React.lazy(() => import('./ProfitBreakdown'));
const HealthScoreCard = React.lazy(() => import('./HealthScoreCard'));
const ProfitTips = React.lazy(() => import('./ProfitTips'));
const QuickInsights = React.lazy(() => import('./QuickInsights'));

// Loading fallback components
import { LoadingStates } from '@/components/ui/loading-spinner';
const SimpleLoading = () => (
  <LoadingStates.Card />
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

  // Belanja Bahan (Kas Keluar) - total pembelian completed pada periode
  const [purchaseSpending, setPurchaseSpending] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const fetchPurchases = async () => {
      try {
        // Derive date range (YYYY-MM-DD)
        let startYMD = '';
        let endYMD = '';
        if (mode === 'daily' && dateRange?.from) {
          const from = dateRange.from;
          const to = dateRange.to || dateRange.from;
          startYMD = from.toISOString().split('T')[0];
          endYMD = to.toISOString().split('T')[0];
        } else {
          // Monthly mode uses defaultPeriod (YYYY-MM)
          const [y, m] = (defaultPeriod || '').split('-').map(Number);
          if (y && m) {
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0);
            startYMD = start.toISOString().split('T')[0];
            endYMD = end.toISOString().split('T')[0];
          }
        }

        if (!startYMD || !endYMD) {
          if (!cancelled) setPurchaseSpending(0);
          return;
        }

        // Query by tanggal
        const { data, error } = await supabase
          .from('purchases')
          .select('total_nilai, status, tanggal')
          .eq('status', 'completed')
          .gte('tanggal', startYMD)
          .lte('tanggal', endYMD);

        if (error) throw error;

        const sumTotals = (rows: any[] | null | undefined) => {
          if (!Array.isArray(rows)) return 0;
          return rows.reduce((sum, row) => {
            const val = Number(row.total_nilai ?? 0);
            return sum + (isFinite(val) ? val : 0);
          }, 0);
        };

        let total = sumTotals(data);

        // Fallback: if no rows via 'tanggal', try 'purchase_date'
        if (total === 0) {
          const { data: data2, error: err2 } = await supabase
            .from('purchases')
            .select('total_nilai, status, purchase_date')
            .eq('status', 'completed')
            .gte('purchase_date', startYMD)
            .lte('purchase_date', endYMD);
          if (!err2) {
            total = sumTotals(data2);
          }
        }

        if (!cancelled) setPurchaseSpending(total || 0);
      } catch {
        if (!cancelled) setPurchaseSpending(0);
      }
    };

    fetchPurchases();
    return () => { cancelled = true; };
  }, [mode, dateRange?.from, dateRange?.to, defaultPeriod]);

  if (loading) {
    return <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>;
  }

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <div className="space-y-6">
      <React.Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
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
            <ProfitMetrics businessMetrics={{ ...businessMetrics, purchaseSpending }} />
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
