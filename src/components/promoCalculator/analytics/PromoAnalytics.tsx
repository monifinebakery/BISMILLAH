// 🎯 Chart untuk analisis promo - Mobile Responsive

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Percent, Calendar, Filter, X, Gift, Award, AlertTriangle } from 'lucide-react';
import PromoPerformanceCard from './PromoPerformanceCard';
import { usePromoAnalytics } from '../hooks/usePromoAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency, formatCompactCurrency, CurrencyDisplay } from '@/lib/shared';
import { useCurrency } from '@/contexts/CurrencyContext';

const PromoAnalytics = () => {
  const isMobile = useIsMobile(768);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const { formatCurrency } = useCurrency();
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  const { analyticsData, isLoading, refreshAnalytics } = usePromoAnalytics();

  // Filters: channel and category
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const baseRows = useMemo(() =>
    analyticsData?.promoPerformanceRows || analyticsData?.promoPerformance || [],
  [analyticsData]);

  const getRowChannel = (row: any) => (row?.data_promo?.channel || row?.channel || 'lainnya');
  const getRowCategory = (row: any) => (row?.data_promo?.kategori || row?.category || 'lainnya');

  // Preset filters for better UX
  const presetChannels = ['WhatsApp', 'Instagram', 'Tokopedia', 'Shopee', 'Offline'];
  const presetCategories = ['Makanan', 'Minuman', 'Snack', 'Paket', 'Lainnya'];

  const channels = useMemo(() => {
     const dynamic = Array.from(new Set(baseRows.map(getRowChannel)));
    const merged = Array.from(new Set([...presetChannels, ...dynamic]));
    return ['all', ...merged];
  }, [baseRows]);

  const categories = useMemo(() => {
     const dynamic = Array.from(new Set(baseRows.map(getRowCategory)));
    const merged = Array.from(new Set([...presetCategories, ...dynamic]));
    return ['all', ...merged];
  }, [baseRows]);

  const filteredPromos = useMemo(() => {
     let rows = baseRows;
    if (selectedChannel !== 'all') {
      rows = rows.filter(r => getRowChannel(r) === selectedChannel);
    }
    if (selectedCategory !== 'all') {
      rows = rows.filter(r => getRowCategory(r) === selectedCategory);
    }
    return rows;
  }, [baseRows, selectedChannel, selectedCategory]);

  useEffect(() => {
    refreshAnalytics(dateRange);
  }, [dateRange, refreshAnalytics]);


  const handleDateRangeApply = () => {
     setShowDateFilter(false);
    refreshAnalytics(dateRange);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm sm:text-base">Memuat data analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Analytics Promo</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Analisis performa dan profitabilitas promo</p>
        </div>
        
        {/* Desktop Date Range */}
        <div className={isMobile ? 'hidden' : 'flex items-center space-x-3'}>
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

        {/* Mobile Date Filter Button */}
        <div className={isMobile ? 'block' : 'hidden'}>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <Calendar className="h-4 w-4" />
            <span>Filter Tanggal</span>
          </button>
        </div>
      </div>

      {/* Mobile Date Filter Panel */}
      {showDateFilter && isMobile && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Pilih Rentang Tanggal</h3>
            <button
              onClick={() => setShowDateFilter(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDateFilter(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDateRangeApply}
                className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Promo</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {analyticsData?.summary?.totalPromos || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Total Diskon Bulan Ini */}
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <Gift className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Diskon (Periode)</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">
                {isMobile 
                  ? formatCompactCurrency(analyticsData?.summary?.totalDiscountThisMonth || 0)
                  : formatCurrency(analyticsData?.summary?.totalDiscountThisMonth || 0)
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Promo Aktif</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {analyticsData?.summary?.activePromos || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Rata-rata HPP</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">
                {isMobile 
                  ? formatCompactCurrency(analyticsData?.summary?.averageHpp || 0)
                  : formatCurrency(analyticsData?.summary?.averageHpp || 0)
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Percent className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Rata-rata Margin</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {(analyticsData?.summary?.averageMargin || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights: Top & Need Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-green-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Promo Terbaik (Margin)</h3>
          </div>
          <div className="space-y-3">
            {(analyticsData?.topPromos || [])
              .map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.namaPromo}</p>
                    <p className="text-xs text-gray-500">{item.tipePromo?.toUpperCase()} • {(item.channel || 'lainnya')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{(item.margin || 0).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            {(!analyticsData?.topPromos || analyticsData.topPromos.length === 0) && (
              <p className="text-sm text-gray-500">Belum ada data promo</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Perlu Perbaikan (Profit)</h3>
          </div>
          <div className="space-y-3">
            {(analyticsData?.needsImprovementPromos || [])
              .map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.namaPromo}</p>
                    <p className="text-xs text-gray-500">{item.tipePromo?.toUpperCase()} • {(item.category || 'lainnya')}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${item.profit >= 0 ? 'text-gray-700' : 'text-red-600'}`}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.profit || 0)}</p>
                  </div>
                </div>
              ))}
            {(!analyticsData?.needsImprovementPromos || analyticsData.needsImprovementPromos.length === 0) && (
              <p className="text-sm text-gray-500">Belum ada data promo</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performa Per Promo</h3>
          <div className="flex gap-3">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {channels.map(ch => (
                <option key={ch} value={ch}>{ch === 'all' ? 'Semua Channel' : ch}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'Semua Kategori' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div>
        {/* Mobile: Show as list, Desktop: Show as grid */}
        <div className={isMobile 
          ? "space-y-4" 
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        }>
          {filteredPromos.map(promo => (
            <PromoPerformanceCard 
              key={promo.id} 
              promo={promo}
              isMobile={isMobile}
            />
          ))}
        </div>
        
        {(filteredPromos.length === 0) && (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm sm:text-base">Data tidak ditemukan untuk filter terpilih</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Ubah filter untuk melihat data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoAnalytics;
