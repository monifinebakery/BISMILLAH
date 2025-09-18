// src/components/financial/components/FinancialCharts.tsx - Enhanced dengan useQuery support
import React, { useMemo } from 'react';
import { format, subDays, startOfMonth, endOfDay, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/shared';
// ✅ IMPROVED: Import UnifiedDateHandler for consistency
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { normalizeDateForDatabase } from '@/utils/dateNormalization'; // Keep for transition
import { logger } from '@/utils/logger';

// ✅ ENHANCED: Props enhancement untuk useQuery support dengan auto-refresh
interface FinancialChartsProps {
  filteredTransactions: any[];
  dateRange: { from: Date; to?: Date };
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-gray-300 rounded text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name} : ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ✅ IMPROVED: Safe loading skeleton untuk chart that won't break UI
import { LoadingSpinner } from '@/components/ui/loading-spinner';
const ChartLoadingSkeleton = () => {
  return (
    <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

/**
 * ✅ ENHANCED: Financial Charts Component dengan useQuery support
 * 
 * Features:
 * - Loading states untuk chart data
 * - Refresh functionality
 * - Real-time data updates
 * - Enhanced error handling
 * - Performance optimizations
 */
const FinancialCharts: React.FC<FinancialChartsProps> = ({ 
  filteredTransactions, 
  dateRange,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  lastUpdated
}) => {
  const { transactionData, dailyData } = useMemo(() => {
    const result = {
      transactionData: [] as Array<{
        month: string;
        Pemasukan: number;
        Pengeluaran: number;
        Saldo: number;
        date: Date;
      }>,
      dailyData: [] as Array<{
        date: string;
        Pemasukan: number;
        Pengeluaran: number;
        Saldo: number;
      }>
    };

    if (!filteredTransactions || filteredTransactions.length === 0) {
      return result;
    }

    const monthlyData: Record<string, { income: number; expense: number; date: Date }> = {};
    const dailyDataMap: Record<string, { income: number; expense: number; date: Date }> = {};

    // ✅ IMPROVED: Process transactions with consistent date handling
    filteredTransactions.forEach(t => {
      if (!t.date) return;
      
      const transactionDate = new Date(t.date);
      if (!transactionDate || !(transactionDate instanceof Date) || isNaN(transactionDate.getTime())) {
        logger.warn('Invalid transaction date in chart processing:', t.date);
        return;
      }
      
      // Monthly data with normalized date keys
      const monthStart = startOfMonth(transactionDate);
      const monthYearKey = format(monthStart, 'yyyy-MM');
      if (!monthlyData[monthYearKey]) {
        monthlyData[monthYearKey] = { income: 0, expense: 0, date: monthStart };
      }
      if (t.type === 'income') {
        monthlyData[monthYearKey].income += t.amount || 0;
      } else {
        monthlyData[monthYearKey].expense += t.amount || 0;
      }

      // Daily data with consistent date normalization using UnifiedDateHandler
      const dayKey = UnifiedDateHandler.toDatabaseString(transactionDate);
      if (!dailyDataMap[dayKey]) {
        dailyDataMap[dayKey] = { income: 0, expense: 0, date: transactionDate };
      }
      if (t.type === 'income') {
        dailyDataMap[dayKey].income += t.amount || 0;
      } else {
        dailyDataMap[dayKey].expense += t.amount || 0;
      }
    });

    // Transform monthly data with proper typing
    result.transactionData = Object.values(monthlyData)
      .map((value) => ({
        month: format(value.date, 'MMM yyyy', { locale: id }),
        Pemasukan: value.income,
        Pengeluaran: value.expense,
        Saldo: value.income - value.expense,
        date: value.date
      }))
      .sort((a, b) => {
        // Validasi objek Date sebelum memanggil getTime
        if (!(a.date instanceof Date) || isNaN(a.date.getTime())) {
          return 1; // a.date tidak valid, pindahkan ke belakang
        }
        if (!(b.date instanceof Date) || isNaN(b.date.getTime())) {
          return -1; // b.date tidak valid, pindahkan ke belakang
        }
        
        return a.date.getTime() - b.date.getTime();
      });

    // Transform daily data (last 30 days) with consistent date handling using UnifiedDateHandler
    const today = endOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const currentDate = startOfDay(subDays(today, 29 - i));
      const dayKey = UnifiedDateHandler.toDatabaseString(currentDate);
      const existingData = dailyDataMap[dayKey] || { income: 0, expense: 0 };
      result.dailyData.push({
        date: format(currentDate, 'd MMM', { locale: id }),
        Pemasukan: existingData.income,
        Pengeluaran: existingData.expense,
        Saldo: existingData.income - existingData.expense
      });
    }

    return result;
  }, [filteredTransactions]);

  // Determine which data to use
  const useDailyData = dateRange?.from && dateRange?.to && 
    dateRange.from instanceof Date && dateRange.to instanceof Date &&
    !isNaN(dateRange.from.getTime()) && !isNaN(dateRange.to.getTime()) &&
    (dateRange.to.getTime() - dateRange.from.getTime()) < 31 * 24 * 60 * 60 * 1000;
  
  const data = useDailyData ? dailyData : transactionData;
  const chartTitle = useDailyData ? 'Grafik Harian (30 Hari Terakhir)' : 'Grafik Pemasukan & Pengeluaran';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {chartTitle}
              {/* ✅ TAMBAH: Real-time indicator */}
              {!isLoading && filteredTransactions.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              )}
            </CardTitle>
            {/* ✅ TAMBAH: Data info */}
            {!isLoading && (
              <p className="text-sm text-gray-500 mt-1">
                {filteredTransactions.length} transaksi
                {lastUpdated && (
                  <span className="ml-2">
                    • Diperbarui: {format(lastUpdated, 'HH:mm', { locale: id })}
                  </span>
                )}
              </p>
            )}
          </div>
          
          {/* ✅ ENHANCED: Refresh button dengan isRefreshing support */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              className={`flex items-center gap-2 transition-colors ${
                isRefreshing ? 'text-blue-600' : ''
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${
                (isLoading || isRefreshing) ? 'animate-spin' : ''
              }`} />
              {isLoading ? '' : isRefreshing ? 'Refresh...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* ✅ TAMBAH: Loading state */}
        {isLoading ? (
          <ChartLoadingSkeleton />
        ) : data.length === 0 ? (
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
              <p className="text-sm text-gray-400 mt-1">Pilih rentang tanggal yang berbeda atau tambah transaksi</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 20, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey={useDailyData ? "date" : "month"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(tick) => formatLargeNumber(tick)} 
                  tick={{ fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="Saldo" 
                  fill="#2563eb40" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  name="Saldo" 
                />
                <Bar 
                  dataKey="Pemasukan" 
                  fill="#16a34a" 
                  name="Pemasukan" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="Pengeluaran" 
                  fill="#dc2626" 
                  name="Pengeluaran" 
                  radius={[4, 4, 0, 0]} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialCharts;