// QuickInsights.tsx - Quick insights for profit analysis
import React, { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useSharedFormatters } from '@/hooks/useSharedFormatters';

interface QuickInsightsProps {
  analysis: any;
}

const QuickInsights: React.FC<QuickInsightsProps> = ({ analysis }) => {
  const { formatCompactCurrency } = useSharedFormatters();
  
  // Format currency following user's currency settings
  const formatCurrency = (amount: number) => {
    return formatCompactCurrency(amount);
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
      <h3 className="font-semibold flex items-center gap-2 text-lg text-gray-900">
        <span className="text-gray-500">💡</span>
        Quick Insights
      </h3>
      
      {insights.map((insight, index) => (
        <Alert 
          key={index}
          className={'border border-gray-200 bg-white text-gray-900'}
        >
          <insight.icon className="h-4 w-4 text-gray-600" />
          <AlertTitle>{insight.title}</AlertTitle>
          <AlertDescription className="text-gray-700">
            {insight.description}
            {insight.action && (
              <p className="mt-2 font-semibold text-gray-800">{insight.action}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default QuickInsights;
