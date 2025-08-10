// src/components/assets/components/AssetConditionBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AssetCondition } from '../types';
import { CONDITION_COLORS } from '../utils';

interface AssetConditionBadgeProps {
  condition: AssetCondition;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetConditionBadge: React.FC<AssetConditionBadgeProps> = ({
  condition,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge 
      className={`${CONDITION_COLORS[condition]} ${sizeClasses[size]} ${className}`}
      variant="secondary"
    >
      {condition}
    </Badge>
  );
};