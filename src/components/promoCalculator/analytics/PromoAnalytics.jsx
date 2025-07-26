import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Percent, Calendar } from 'lucide-react';
import HppAnalysisChart from './HppAnalysisChart';
import ProfitAnalysisChart from './ProfitAnalysisChart';
import PromoPerformanceCard from './PromoPerformanceCard';
import { usePromoAnalytics } from '../hooks/usePromoAnalytics';

const PromoAnalytics = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  const {
    analyticsData,
    isLoading,
    refreshAnalytics
  } = usePromoAnalytics();

  useEffect(() => {
    refreshAnalytics(dateRange);
  }, [dateRange, refreshAnalytics]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Promo</h2>
          <p className="text-gray-600">Analisis performa dan profitabilitas promo</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Promo</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.summary?.totalPromos || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promo Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.summary?.activePromos || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rata-rata HPP</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData?.summary?.averageHpp || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rata-rata Margin</p>
              <p className="text-2xl font-bold text-gray-900">
                {(analyticsData?.summary?.averageMargin || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HPP Analysis Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Analisis HPP vs Harga Jual
          </h3>
          <HppAnalysisChart data={analyticsData?.hppAnalysis || []} />
        </div>

        {/* Profit Analysis Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trend Profit Margin
          </h3>
          <ProfitAnalysisChart data={analyticsData?.profitTrend || []} />
        </div>
      </div>

      {/* Performance Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performa Per Promo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(analyticsData?.promoPerformance || []).map(promo => (
            <PromoPerformanceCard 
              key={promo.id} 
              promo={promo} 
            />
          ))}
        </div>
        
        {(!analyticsData?.promoPerformance || analyticsData.promoPerformance.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Belum ada data performa promo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoAnalytics;