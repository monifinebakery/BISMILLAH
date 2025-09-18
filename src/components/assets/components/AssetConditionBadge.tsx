// src/components/assets/components/AssetConditionBadge.tsx

import React from 'react';
import { StatusBadge } from '@/components/ui';
import { AssetCondition } from '../types';

interface AssetConditionBadgeProps {
  condition: AssetCondition;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Map asset conditions to status variants for consistent coloring
const getConditionVariant = (condition: AssetCondition) => {
  switch (condition.toLowerCase()) {
    case 'baik':
    case 'excellent':
    case 'good':
      return 'success';
    case 'rusak':
    case 'broken':
    case 'damaged':
      return 'error';
    case 'perlu perbaikan':
    case 'needs repair':
      return 'warning';
    default:
      return 'neutral';
  }
};

export const AssetConditionBadge: React.FC<AssetConditionBadgeProps> = ({
  condition,
  size = 'md',
  className = '',
}) => {
  return (
    <StatusBadge
      status={condition}
      variant={getConditionVariant(condition)}
      size={size}
      className={className}
      autoVariant={false} // Use manual variant mapping
    />
  );
};
