// 🎯 Filter component untuk promo

import React from 'react';
import { Filter, X } from 'lucide-react';

const PromoFilters = ({ filters, onFilterChange }) => {
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

  return (
    <div className="flex items-center space-x-3">
      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        <option value="">Semua Status</option>
        <option value="aktif">Aktif</option>
        <option value="nonaktif">Non-aktif</option>
        <option value="draft">Draft</option>
      </select>

      {/* Type Filter */}
      <select
        value={filters.type}
        onChange={(e) => handleFilterChange('type', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        <option value="">Semua Tipe</option>
        <option value="bogo">BOGO</option>
        <option value="discount">Diskon</option>
        <option value="bundle">Bundle</option>
      </select>

      {/* Date Range Filter */}
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={filters.dateRange.start}
          onChange={(e) => handleDateRangeChange('start', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Dari tanggal"
        />
        <span className="text-gray-400">-</span>
        <input
          type="date"
          value={filters.dateRange.end}
          onChange={(e) => handleDateRangeChange('end', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Sampai tanggal"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Clear</span>
        </button>
      )}

      {/* Filter Icon */}
      <div className="flex items-center text-gray-400">
        <Filter className="h-4 w-4" />
      </div>
    </div>
  );
};

export default PromoFilters;