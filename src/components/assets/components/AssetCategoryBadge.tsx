// src/components/assets/components/AssetCategoryBadge.tsx

import React from 'react';
import { StatusBadge } from '@/components/ui';
import { AssetCategory } from '../types';

interface AssetCategoryBadgeProps {
  category: AssetCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Map asset categories to consistent variants
const getCategoryVariant = (category: AssetCategory) => {
  switch (category) {
    case 'Peralatan':
      return 'info';
    case 'Kendaraan':
      return 'success';
    case 'Bangunan':
      return 'active';
    case 'Mesin':
      return 'warning';
    case 'Lain-lain':
    default:
      return 'neutral';
  }
};

export const AssetCategoryBadge: React.FC<AssetCategoryBadgeProps> = ({
  category,
  size = 'md',
  className = '',
}) => {
  return (
    <StatusBadge
      status={category}
      variant={getCategoryVariant(category)}
      size={size}
      className={className}
      autoVariant={false} // Use manual variant mapping for consistency
    />
  );
};
