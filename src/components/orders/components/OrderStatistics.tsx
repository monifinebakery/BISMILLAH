import React, { useMemo } from 'react';
import { TrendingUp, Package, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import type { Order } from '../types';

interface OrderStatisticsProps {
  orders: Order[];
  loading?: boolean;
}

interface StatisticCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const OrderStatistics: React.FC<OrderStatisticsProps> = ({ orders, loading = false }) => {
  const statistics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        completionRate: 0
      };
    }

    const totalOrders = orders.length;
    // Sum only completed orders to represent realized revenue
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.status !== 'completed') return sum;
      const raw =
        (order as any).totalPesanan ??
        (order as any).total_pesanan ??
        (order as any).totalAmount ??
        (order as any).total_amount ??
        0;
      const val = typeof raw === 'number' ? raw : Number(raw) || 0;
      return sum + val;
    }, 0);
    
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedCount = orders.filter(order => order.status === 'completed').length;
    const processingOrders = orders.filter(order => 
      ['confirmed', 'preparing'].includes(order.status)
    ).length;
    
    const averageOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;
    const completionRate = totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders: completedCount,
      processingOrders,
      averageOrderValue,
      completionRate
    };
  }, [orders]);

  // Format currency for compact display
  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1).replace('.', ',')}M`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace('.', ',')}K`;
    }
    return formatCurrency(amount);
  };

  const statisticCards: StatisticCard[] = [
    {
      title: 'Total Pesanan',
      value: statistics.totalOrders,
      icon: <Package className="h-6 w-6" />,
      color: 'text-gray-600 bg-white border-gray-200'
    },
    {
      title: 'Total Pendapatan', 
      value: formatCompactCurrency(statistics.totalRevenue),
      icon: <DollarSign className="h-6 w-6" />,
      color: 'text-gray-600 bg-white border-gray-200'
    },
    {
      title: 'Pesanan Pending',
      value: statistics.pendingOrders,
      icon: <Clock className="h-6 w-6" />,
      color: 'text-gray-600 bg-white border-gray-200'
    },
    {
      title: 'Pesanan Selesai',
      value: statistics.completedOrders,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-gray-600 bg-white border-gray-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-gray-200 bg-white animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center ml-4">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {statisticCards.map((stat, index) => (
        <Card key={index} className={`border shadow-sm hover:shadow-md transition-shadow ${stat.color}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center ml-4 flex-shrink-0">
                <div className="text-orange-600">
                  {stat.icon}
                </div>
              </div>
            </div>
            {stat.trend && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 ${
                  stat.trend.isPositive ? '' : 'rotate-180'
                }`} />
                {stat.trend.value}% dari bulan lalu
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderStatistics;
