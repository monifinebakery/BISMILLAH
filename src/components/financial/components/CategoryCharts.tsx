// src/components/financial/components/CategoryCharts.tsx - Enhanced dengan useQuery support
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { RefreshCw } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';


// ✅ ENHANCED: Props untuk useQuery support dengan auto-refresh
interface CategoryChartsProps {
  filteredTransactions: any[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

// Custom label component for pie chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelRenderProps) => {
  if (
    cx === undefined ||
    cy === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    midAngle === undefined ||
    percent === undefined
  ) {
    return null;
  }

  const numericCx = typeof cx === 'number' ? cx : Number(cx);
  const numericCy = typeof cy === 'number' ? cy : Number(cy);
  const numericInnerRadius = typeof innerRadius === 'number' ? innerRadius : Number(innerRadius);
  const numericOuterRadius = typeof outerRadius === 'number' ? outerRadius : Number(outerRadius);
  const numericMidAngle = typeof midAngle === 'number' ? midAngle : Number(midAngle);
  const numericPercent = typeof percent === 'number' ? percent : Number(percent);

  if (
    !Number.isFinite(numericCx) ||
    !Number.isFinite(numericCy) ||
    !Number.isFinite(numericInnerRadius) ||
    !Number.isFinite(numericOuterRadius) ||
    !Number.isFinite(numericMidAngle) ||
    !Number.isFinite(numericPercent)
  ) {
    return null;
  }

  const radius = numericInnerRadius + (numericOuterRadius - numericInnerRadius) * 0.5;
  const x = numericCx + radius * Math.cos(-numericMidAngle * (Math.PI / 180));
  const y = numericCy + radius * Math.sin(-numericMidAngle * (Math.PI / 180));
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize={12} 
      fontWeight="bold"
    >
      {`${(numericPercent * 100).toFixed(0)}%`}
    </text>
  );
};

// ✅ IMPROVED: Simple loading spinner untuk category charts
import { LoadingSpinner } from '@/components/ui/loading-spinner';
const CategoryLoading = () => (
  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
    <LoadingSpinner size="md" />
  </div>
);

/**
 * ✅ ENHANCED: Category Charts Component dengan useQuery support
 * 
 * Features:
 * - Loading states untuk kategori data
 * - Enhanced empty states
 * - Real-time data updates
 * - Refresh functionality
 */
const CategoryCharts: React.FC<CategoryChartsProps> = ({
  filteredTransactions,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  lastUpdated,
}) => {
  const { formatCurrency } = useCurrency();

  const categoryData = useMemo(() => {
    const result: {
      incomeData: { name: string; value: number }[];
      expenseData: { name: string; value: number }[];
    } = {
      incomeData: [],
      expenseData: [],
    };

    if (!filteredTransactions || filteredTransactions.length === 0) {
      return result;
    }

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    // Process transactions by category
    filteredTransactions.forEach(t => {
      const categoryName = t.category || 'Lainnya';
      if (t.type === 'income') {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + (t.amount || 0);
      } else {
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + (t.amount || 0);
      }
    });

    // Transform to chart data format
    result.incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    result.expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    return result;
  }, [filteredTransactions]);

  const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#dc2626', '#06b6d4'];

  // ✅ ENHANCED: Empty state dengan better UX
  const EmptyState: React.FC<{ title: string; type: 'income' | 'expense' }> = ({ title, type }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              className={`h-6 w-6 p-0 transition-colors ${
                isRefreshing ? 'text-blue-600' : ''
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${
                (isLoading || isRefreshing) ? 'animate-spin' : ''
              }`} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">
              {type === 'income' ? '💰' : '💸'}
            </div>
            <p className="text-sm">Tidak ada data {type === 'income' ? 'pemasukan' : 'pengeluaran'}</p>
            <p className="text-xs text-gray-400 mt-1">Tambah transaksi untuk melihat distribusi kategori</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ✅ ENHANCED: Category pie chart dengan loading support
  const CategoryPieChart: React.FC<{
    title: string;
    data: { name: string; value: number }[];
    type: 'income' | 'expense';
  }> = ({ title, data, type }) => {
    if (data.length === 0) {
      return <EmptyState title={title} type={type} />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              {title}
              {/* ✅ TAMBAH: Data summary */}
              <p className="text-sm font-normal text-gray-500 mt-1">
                {data.length} kategori • Total: {formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}
              </p>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading || isRefreshing}
                className={`h-6 w-6 p-0 transition-colors ${
                  isRefreshing ? 'text-blue-600' : ''
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${
                  (isLoading || isRefreshing) ? 'animate-spin' : ''
                }`} />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={data}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) =>
                    formatCurrency(typeof value === 'number' ? value : Number(value))
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* ✅ TAMBAH: Category legend */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoryPieChart 
        title="Distribusi Kategori Pemasukan"
        data={categoryData.incomeData}
        type="income"
      />
      <CategoryPieChart 
        title="Distribusi Kategori Pengeluaran"
        data={categoryData.expenseData}
        type="expense"
      />
    </div>
  );
};

export default CategoryCharts;