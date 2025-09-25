// ProfitMetrics.tsx - Metrics cards for profit analysis
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Package, Calculator } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

import { useSharedFormatters } from '@/hooks/useSharedFormatters';

interface MetricCardPropsWithContext extends MetricCardProps {
  formatCurrency: (amount: number) => string;
}

const MetricCard: React.FC<MetricCardPropsWithContext> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg,
  iconColor,
  formatCurrency
}) => {
  return (
    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === 'string' ? value : formatCurrency(value)}
              </p>
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center ml-4 flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProfitMetricsProps {
  businessMetrics: any; // expects { revenue, cogs, opex, netProfit, netMargin, purchaseSpending? }
}

const ProfitMetrics: React.FC<ProfitMetricsProps> = ({ businessMetrics }) => {
  const { formatCompactCurrency } = useSharedFormatters();
  
  // Use shared Indonesian formatter with 'rb', 'jt' instead of 'K', 'M'
  const formatCurrency = (amount: number) => {
    return formatCompactCurrency(amount);
  };
  if (!businessMetrics) {
    // Show placeholder cards when no data
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center ml-4">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const revenue = businessMetrics?.revenue || 0;
  const cogs = businessMetrics?.cogs || 0;
  const opex = businessMetrics?.opex || 0;
  const netProfit = businessMetrics?.netProfit || 0;
  const netMargin = businessMetrics?.netMargin || 0;

  const ratio = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const metrics = [
    {
      title: "Omset",
      value: revenue,
      subtitle: `Pendapatan bisnis`,
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Untung Bersih", 
      value: netProfit,
      subtitle: formatPercentage(netMargin) + " dari omset",
      icon: TrendingUp,
      iconBg: netProfit >= 0 ? "bg-green-100" : "bg-red-100", 
      iconColor: netProfit >= 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "Modal Bahan",
      value: cogs,
      subtitle: formatPercentage(ratio(cogs, revenue)) + " dari omset",
      icon: Package,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600" 
    },
    {
      title: "Biaya Operasional",
      value: opex, 
      subtitle: formatPercentage(ratio(opex, revenue)) + " dari omset",
      icon: Calculator,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          iconBg={metric.iconBg}
          iconColor={metric.iconColor}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
};

export default ProfitMetrics;
