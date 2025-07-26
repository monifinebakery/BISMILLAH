// 🎯 Filter component untuk promo - Mobile Responsive

import React from 'react';
import { Filter, X, Calendar, Tag, Activity } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const PromoFilters = ({ filters, onFilterChange }) => {
  const isMobile = useIsMobile(768);
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handleDateRangeChange = (key, value) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [key]: value
      }
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: '',
      type: '',
      dateRange: { start: '', end: '' }
    });
  };

  const hasActiveFilters = filters.status || filters.type || filters.dateRange.start || filters.dateRange.end;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Activity className="h-4 w-4" />
            <span>Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Non-aktif</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Tag className="h-4 w-4" />
            <span>Tipe Promo</span>
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="">Semua Tipe</option>
            <option value="bogo">BOGO</option>
            <option value="discount">Diskon</option>
            <option value="bundle">Bundle</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            <span>Rentang Tanggal</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dari</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sampai</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Filter Aktif</span>
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="h-3 w-3" />
                <span>Hapus Semua</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Status: {filters.status}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {filters.type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Tipe: {filters.type}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {(filters.dateRange.start || filters.dateRange.end) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Tanggal: {filters.dateRange.start || '...'} - {filters.dateRange.end || '...'}
                  <button
                    onClick={() => handleDateRangeChange('start', '') || handleDateRangeChange('end', '')}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Apply Button for Mobile */}
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {}} // This will be handled by parent component
              className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (Original)
  return (
    <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
      {/* Status Filter */}
      <div className="min-w-0 flex-shrink-0">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Non-aktif</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Type Filter */}
      <div className="min-w-0 flex-shrink-0">
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          <option value="">Semua Tipe</option>
          <option value="bogo">BOGO</option>
          <option value="discount">Diskon</option>
          <option value="bundle">Bundle</option>
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
        <input
          type="date"
          value={filters.dateRange.start}
          onChange={(e) => handleDateRangeChange('start', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent w-auto"
          placeholder="Dari tanggal"
        />
        <span className="text-gray-400 px-1">-</span>
        <input
          type="date"
          value={filters.dateRange.end}
          onChange={(e) => handleDateRangeChange('end', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent w-auto"
          placeholder="Sampai tanggal"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      )}

      {/* Filter Icon */}
      <div className="flex items-center text-gray-400 flex-shrink-0">
        <Filter className="h-4 w-4" />
      </div>

      {/* Active Filters Count (Desktop) */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 flex-shrink-0">
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
            {[filters.status, filters.type, filters.dateRange.start || filters.dateRange.end]
              .filter(Boolean).length} filter aktif
          </span>
        </div>
      )}
    </div>
  );
};

export default PromoFilters;