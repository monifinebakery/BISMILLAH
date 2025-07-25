// src/components/financial/components/CategoryCharts.tsx
// Separated Category Charts Component for Code Splitting

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '@/utils/formatUtils';

interface CategoryChartsProps {
  filteredTransactions: any[];
}

// Custom label component for pie chart
const renderCustomizedLabel = ({ 
  cx, cy, midAngle, innerRadius, outerRadius, percent 
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
  
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
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CategoryCharts: React.FC<CategoryChartsProps> = ({ filteredTransactions }) => {
  const categoryData = useMemo(() => {
    const result = {
      incomeData: [],
      expenseData: []
    };

    if (!filteredTransactions || filteredTransactions.length === 0) {
      return result;
    }

    const incomeByCategory = {};
    const expenseByCategory = {};

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
      value
    }));

    result.expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value
    }));

    return result;
  }, [filteredTransactions]);

  const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#dc2626', '#06b6d4'];

  const EmptyState: React.FC<{ title: string }> = ({ title }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Tidak ada data
        </div>
      </CardContent>
    </Card>
  );

  const CategoryPieChart: React.FC<{
    title: string;
    data: { name: string; value: number }[];
  }> = ({ title, data }) => {
    if (data.length === 0) {
      return <EmptyState title={title} />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
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
      />
      <CategoryPieChart 
        title="Distribusi Kategori Pengeluaran"
        data={categoryData.expenseData}
      />
    </div>
  );
};

export default CategoryCharts;