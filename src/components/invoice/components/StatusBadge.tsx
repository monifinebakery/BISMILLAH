// src/components/invoice/components/StatusBadge.tsx
import React from 'react';
import type { InvoiceStatus } from '../types';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'LUNAS': 
        return 'bg-green-100 text-green-800 border-green-300';
      case 'JATUH TEMPO': 
        return 'bg-red-100 text-red-800 border-red-300';
      default: 
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <div className={`font-bold text-lg py-3 px-4 border-2 rounded text-center ${getStatusClasses()} ${className}`}>
      {status}
    </div>
  );
};