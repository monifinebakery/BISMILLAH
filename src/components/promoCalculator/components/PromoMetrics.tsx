import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatters, helpers } from '../utils';

const PromoMetrics = ({ calculationResult, className = '' }: any) => {
  if (!calculationResult) return null;

  const marginSafetyLevel = helpers.getMarginSafetyLevel(calculationResult.promoMargin);
  const marginSafetyColor = helpers.getMarginSafetyColor(calculationResult.promoMargin);

  const metrics = [
    {
      label: 'HPP Promo',
      value: formatters.currency(calculationResult.promoHpp),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Harga Promo',
      value: formatters.currency(calculationResult.promoPrice),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Margin Promo',
      value: formatters.percentage(calculationResult.promoMargin),
      icon: Percent,
      color: marginSafetyColor,
      bgColor: marginSafetyLevel === 'danger' ? 'bg-red-50' : 
               marginSafetyLevel === 'warning' ? 'bg-yellow-50' : 'bg-green-50'
    },
    {
      label: 'Dampak Margin',
      value: formatters.marginDiff(calculationResult.promoMargin, calculationResult.normalMargin),
      icon: calculationResult.marginImpact >= 0 ? TrendingUp : TrendingDown,
      color: calculationResult.marginImpact >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: calculationResult.marginImpact >= 0 ? 'bg-green-50' : 'bg-red-50'
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className={`${metric.bgColor} rounded-lg p-4 border border-gray-500`}>
            <div className="flex items-center space-x-2 mb-1">
              <Icon className={`h-4 w-4 ${metric.color}`} />
              <span className="text-xs font-medium text-gray-700">{metric.label}</span>
            </div>
            <div className={`text-lg font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromoMetrics;