// ProfitMetrics.tsx - Metrics cards for profit analysis
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button aria-label="Info" className="inline-flex items-center justify-center rounded hover:text-gray-800">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{helpText}</p>
                </TooltipContent>
              </Tooltip>
              <span className="truncate">{helpText}</span>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProfitMetricsProps {
  businessMetrics: any; // expects { revenue, cogs, opex, netProfit, netMargin, purchaseSpending? }
}

const ProfitMetrics: React.FC<ProfitMetricsProps> = ({ businessMetrics }) => {
  if (!businessMetrics) return null;

  const revenue = businessMetrics?.revenue || 0;
  const cogs = businessMetrics?.cogs || 0;
  const opex = businessMetrics?.opex || 0;
  const netProfit = businessMetrics?.netProfit || 0;
  const purchaseSpending = businessMetrics?.purchaseSpending || 0;

  const ratio = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Omset Penjualan"
        value={revenue}
        icon={DollarSign}
        helpText="Total uang masuk dari jualan"
        status="good"
      />
      
      <MetricCard
        title="Untung Bersih"
        value={netProfit}
        subtitle={`${formatPercentage(businessMetrics?.netMargin || 0)} margin`}
        icon={TrendingUp}
        helpText="Untung yang bisa dibawa pulang"
        status={netProfit > 0 ? 'good' : 'danger'}
      />
      
      <MetricCard
        title="Modal Bahan"
        value={cogs}
        subtitle={`${formatPercentage(ratio(cogs, revenue))} dari omset`}
        icon={Package}
        helpText="Total biaya bahan baku"
        status={ratio(cogs, revenue) < 40 ? 'good' : 'warning'}
      />
      
      <MetricCard
        title="Belanja Bahan (Kas)"
        value={purchaseSpending}
        subtitle={`${formatPercentage(ratio(purchaseSpending, revenue))} dari omset`}
        icon={DollarSign}
        helpText="Total pembelian bahan pada periode"
      />

      <MetricCard
        title="Biaya Operasional"
        value={opex}
        subtitle={`${formatPercentage(ratio(opex, revenue))} dari omset`}
        icon={Calculator}
        helpText="Sewa, listrik, gaji, dll"
      />
    </div>
  );
};

export default ProfitMetrics;
