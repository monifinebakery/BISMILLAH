// QuickInsights.tsx - Quick insights for profit analysis
import React, { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface QuickInsightsProps {
  analysis: any;
}

const QuickInsights: React.FC<QuickInsightsProps> = ({ analysis }) => {
  // Format currency in Indonesian format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact'
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const insights = useMemo(() => {
    const items = [];
    
    // Revenue insight
    if (analysis?.revenue_data?.total > 0) {
      items.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Penjualan Bagus!',
        description: `Omset ${formatCurrency(analysis.revenue_data.total)} bulan ini`,
      });
    }
    
    // COGS warning
    const cogsRatio = (analysis?.cogs_data?.total / analysis?.revenue_data?.total) * 100;
    if (cogsRatio > 50) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Modal Bahan Tinggi',
        description: `${formatPercentage(cogsRatio)} dari omset. Target ideal: <40%`,
        action: 'Cek harga supplier atau porsi menu',
      });
    }
    
    // Profit status
    const netProfit = (analysis?.revenue_data?.total || 0) - 
                     (analysis?.cogs_data?.total || 0) - 
                     (analysis?.opex_data?.total || 0);
    if (netProfit < 0) {
      items.push({
        type: 'danger',
        icon: TrendingDown,
        title: 'Rugi Bulan Ini',
        description: `Minus ${formatCurrency(Math.abs(netProfit))}`,
        action: 'Perlu evaluasi menyeluruh!',
      });
    }
    
    return items;
  }, [analysis]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2 text-lg">
        <span className="text-orange-500">💡</span>
        Quick Insights
      </h3>
      
      {insights.map((insight, index) => (
        <Alert 
          key={index}
          className={
            insight.type === 'success' ? 'border-green-200 bg-green-50' :
            insight.type === 'warning' ? 'border-orange-200 bg-orange-50' :
            'border-red-200 bg-red-50'
          }
        >
          <insight.icon className="h-4 w-4" />
          <AlertTitle>{insight.title}</AlertTitle>
          <AlertDescription>
            {insight.description}
            {insight.action && (
              <p className="mt-2 font-semibold">{insight.action}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default QuickInsights;