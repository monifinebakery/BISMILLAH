// src/components/financial/components/FinancialCharts.tsx
// Separated Chart Component for Code Splitting

import React, { useMemo } from 'react';
import { format, subDays, startOfMonth, endOfDay, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface FinancialChartsProps {
  filteredTransactions: any[];
  dateRange: { from: Date; to?: Date };
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-gray-300 rounded shadow-lg text-sm">
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

const FinancialCharts: React.FC<FinancialChartsProps> = ({ 
  filteredTransactions, 
  dateRange 
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
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default FinancialCharts;