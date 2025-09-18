// src/components/assets/components/AssetStatistics.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { AssetStatistics as AssetStatsType } from '../types';
import { formatCurrency } from '../utils';

interface AssetStatisticsProps {
  statistics: AssetStatsType;
  isLoading?: boolean;
  isMobile?: boolean;
}

export const AssetStatistics: React.FC<AssetStatisticsProps> = ({
  statistics,
  isLoading = false,
  isMobile = false,
}) => {
  const statsCards = [
    {
      title: 'Total Aset',
      value: statistics.totalAssets.toString(),
      icon: Package,
      color: 'orange',
    },
    {
      title: 'Nilai Awal',
      value: formatCurrency(statistics.totalNilaiAwal),
      icon: DollarSign,
      color: 'orange',
    },
    {
      title: 'Nilai Sekarang',
      value: formatCurrency(statistics.totalNilaiSaatIni),
      icon: TrendingUp,
      color: 'orange',
    },
    {
      title: 'Total Depresiasi',
      value: formatCurrency(statistics.totalDepresiasi),
      icon: Calendar,
      color: 'red',
    },
  ];

  if (isLoading) {
    return null;
  }

  return (
    <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const isRedCard = stat.color === 'red';
        
        return (
          <Card key={index} className="border-orange-200 bg-white hover:border-orange-300 transition-colors duration-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`${isRedCard ? 'bg-red-100' : 'bg-orange-100'} rounded-full p-2 mr-3`}>
                  <Icon className={`${isRedCard ? 'text-red-600' : 'text-orange-600'} h-5 w-5`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-600 text-sm">{stat.title}</p>
                  <p className={`font-bold text-gray-900 ${isMobile ? 'text-sm' : 'text-xl sm:text-2xl'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};