// src/components/purchase/components/LoadingState.tsx

import React from 'react';
import { LoadingStates } from '@/components/ui';

interface LoadingStateProps {
  className?: string;
  variant?: 'page' | 'table' | 'card';
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  className = '',
  variant = 'table' 
}) => {
  switch (variant) {
    case 'page':
      return (
        <LoadingStates.Page 
          text="Memuat data pembelian..."
          className={className}
        />
      );
    case 'card':
      return (
        <LoadingStates.Card 
          text="Memuat pembelian..."
          className={className}
        />
      );
    default:
      return (
        <LoadingStates.Table 
          text="Memuat data pembelian..."
          className={className}
        />
      );
  }
};

export default LoadingState;