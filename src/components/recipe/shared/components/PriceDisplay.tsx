// src/components/recipe/shared/components/PriceDisplay.tsx

import React from 'react';
import { formatCurrency } from '../utils/recipeFormatters';

interface PriceDisplayProps {
  amount: number;
  className?: string;
  showPrefix?: boolean;
  prefix?: string;
  colorClass?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  amount, 
  className = '',
  showPrefix = false,
  prefix = '',
  colorClass = ''
}) => {
  const defaultColorClass = amount < 0 ? 'text-red-600' : 'text-green-600';
  const finalColorClass = colorClass || defaultColorClass;

  return (
    <span className={`font-medium ${finalColorClass} ${className}`}>
      {showPrefix && prefix && <span className="text-xs mr-1">{prefix}</span>}
      {formatCurrency(amount)}
    </span>
  );
};