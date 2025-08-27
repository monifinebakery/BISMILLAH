// src/components/assets/components/AssetCategoryBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AssetCategory } from '../types';

interface AssetCategoryBadgeProps {
  category: AssetCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetCategoryBadge: React.FC<AssetCategoryBadgeProps> = ({
  category,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const getCategoryColor = (cat: AssetCategory): string => {
    const colors = {
      'Peralatan': 'bg-blue-100 text-blue-800',
      'Kendaraan': 'bg-green-100 text-green-800',
      'Bangunan': 'bg-purple-100 text-purple-800',
      'Mesin': 'bg-yellow-100 text-yellow-800',
      'Lain-lain': 'bg-gray-200 text-gray-800',
    };
    return colors[cat] || colors['Lain-lain'];
  };

  return (
    <Badge 
      className={`${getCategoryColor(category)} ${sizeClasses[size]} ${className}`}
      variant="secondary"
    >
      {category}
    </Badge>
  );
};