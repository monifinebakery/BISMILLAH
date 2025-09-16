// ProfitMetrics.tsx - Metrics cards for profit analysis
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, DollarSign, TrendingUp, Package, Calculator } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  trend?: number;
  helpText: string;
  status?: 'good' | 'warning' | 'danger';
}

// Format percentage for Indonesian locale (expects 0-100 value)
const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format((value || 0) / 100);
};

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  helpText, 
  status 
}) => {
  // Neutral card styling regardless of status
  const getStatusColor = () => 'border-gray-200 bg-white';

  // Format currency in Indonesian format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact'
    }).format(amount);
  };

  return (
    <Card className={`relative overflow-hidden ${getStatusColor()} border`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Icon className="h-8 w-8 text-gray-500" />
          {trend !== undefined && (
            <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            {helpText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProfitMetricsProps {
  businessMetrics: any;
}

const ProfitMetrics: React.FC<ProfitMetricsProps> = ({ businessMetrics }) => {
  if (!businessMetrics) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MetricCard
        title="Omset Penjualan"
        value={businessMetrics?.revenue || 0}
        icon={DollarSign}
        helpText="Total uang masuk dari jualan"
        status="good"
      />
      
      <MetricCard
        title="Untung Bersih"
        value={businessMetrics?.netProfit || 0}
        subtitle={`${formatPercentage(businessMetrics?.netMargin || 0)} margin`}
        icon={TrendingUp}
        helpText="Untung yang bisa dibawa pulang"
        status={businessMetrics?.netProfit > 0 ? 'good' : 'danger'}
      />
      
      <MetricCard
        title="Modal Bahan"
        value={businessMetrics?.cogs || 0}
        subtitle={`${formatPercentage((businessMetrics?.cogs / businessMetrics?.revenue) * 100 || 0)} dari omset`}
        icon={Package}
        helpText="Total biaya bahan baku"
        status={(businessMetrics?.cogs / businessMetrics?.revenue) * 100 < 40 ? 'good' : 'warning'}
      />
      
      <MetricCard
        title="Biaya Operasional"
        value={businessMetrics?.opex || 0}
        subtitle={`${formatPercentage((businessMetrics?.opex / businessMetrics?.revenue) * 100 || 0)} dari omset`}
        icon={Calculator}
        helpText="Sewa, listrik, gaji, dll"
      />
    </div>
  );
};

export default ProfitMetrics;
