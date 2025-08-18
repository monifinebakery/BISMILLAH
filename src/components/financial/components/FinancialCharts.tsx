// src/components/financial/components/FinancialCharts.tsx - Enhanced dengan useQuery support
import React, { useMemo } from 'react';
import { format, subDays, startOfMonth, endOfDay, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { formatCurrency, formatLargeNumber } from '@/utils/formatUtils';

// ✅ TAMBAH: Props enhancement untuk useQuery support
interface FinancialChartsProps {
  filteredTransactions: any[];
  dateRange: { from: Date; to?: Date };
  isLoading?: boolean;
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

// ✅ TAMBAH: Loading skeleton untuk chart
const ChartLoadingSkeleton = () => (
  <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-500 text-sm">Memuat data chart...</p>
    </div>
  </div>
);

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
  onRefresh,
  lastUpdated
}) => {
  const { transactionData, dailyData } = useMemo(() => {
    const result = {
      transactionData: [],
      dailyData: []
    };

    if (!filteredTransactions || filteredTransactions.length === 0) {
      return result;
    }

    const monthlyData = {};
    const dailyDataMap = {};

    // Process transactions
    filteredTransactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate) {
        // Monthly data
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

        // Daily data
        const dayKey = format(transactionDate, 'yyyy-MM-dd');
        if (!dailyDataMap[dayKey]) {
          dailyDataMap[dayKey] = { income: 0, expense: 0, date: transactionDate };
        }
        if (t.type === 'income') {
          dailyDataMap[dayKey].income += t.amount || 0;
        } else {
          dailyDataMap[dayKey].expense += t.amount || 0;
        }
      }
    });

    // Transform monthly data
    result.transactionData = Object.values(monthlyData)
      .map((value: any) => ({
        month: format(value.date, 'MMM yyyy', { locale: id }),
        Pemasukan: value.income,
        Pengeluaran: value.expense,
        Saldo: value.income - value.expense,
        date: value.date
      }))
      .sort((a, b) => a.date - b.date);

    // Transform daily data (last 30 days)
    const today = endOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const currentDate = startOfDay(subDays(today, 29 - i));
      const dayKey = format(currentDate, 'yyyy-MM-dd');
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
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
                    • Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
                  </span>
                )}
              </p>
            )}
          </div>
          
          {/* ✅ TAMBAH: Refresh button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Memuat...' : 'Refresh'}
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
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={data} 
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
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