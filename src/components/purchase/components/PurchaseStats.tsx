import React from 'react';
import { Card } from '@/components/ui/card';

import { PurchaseStatsProps } from '../types/purchase.types';

const PurchaseStats: React.FC<PurchaseStatsProps> = ({ stats, className = '' }) => {
  const { formatCurrency } = useCurrency();  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
      <Card className="p-4">
        <div className="text-sm text-gray-500">Total Pembelian</div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-500">Total Nilai</div>
        <div className="text-2xl font-bold">{formatCurrency((stats as any).totalNilai ?? stats.total_nilai)}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-500">Pending</div>
        <div className="text-2xl font-bold">{stats.byStatus.pending}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-500">Selesai</div>
        <div className="text-2xl font-bold">{stats.byStatus.completed}</div>
      </Card>
    </div>
  );
};

export default PurchaseStats;
