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
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const processingOrders = orders.filter(order => 
      ['confirmed', 'preparing'].includes(order.status)
    ).length;
    
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      processingOrders,
      averageOrderValue,
      completionRate
    };
  }, [orders]);

  const statisticCards: StatisticCard[] = [
    {
      title: 'Total Pesanan',
      value: statistics.totalOrders,
      icon: <Package className="h-5 w-5" />,
      color: 'text-gray-600 bg-white/80 border-gray-200'
    },
    {
      title: 'Total Pendapatan',
      value: formatCurrency(statistics.totalRevenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-gray-600 bg-white/80 border-gray-200'
    },
    {
      title: 'Pesanan Pending',
      value: statistics.pendingOrders,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-gray-600 bg-white/80 border-gray-200'
    },
    {
      title: 'Pesanan Selesai',
      value: statistics.completedOrders,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-gray-600 bg-white/80 border-gray-200'
    },
    {
      title: 'Rata-rata Nilai Pesanan',
      value: formatCurrency(statistics.averageOrderValue),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-gray-600 bg-white/80 border-gray-200'
    },
    {
      title: 'Tingkat Penyelesaian',
      value: `${statistics.completionRate.toFixed(1)}%`,
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'text-gray-600 bg-white/80 border-gray-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {statisticCards.map((stat, index) => (
        <Card key={index} className={`border transition-all duration-200 hover:shadow-md ${stat.color}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                {stat.value}
              </div>
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color}`}>
                <div className="h-4 w-4 sm:h-5 sm:w-5">
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
