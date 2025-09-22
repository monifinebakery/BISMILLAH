// src/components/operational-costs/components/CostList.tsx

import React, { useState } from 'react';
import {
  Edit,
  Trash2, // ✅ Import Trash2 (correct)
  Eye,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Funnel,
  Pencil,
} from 'lucide-react';
import { OperationalCost, CostFilters } from '../types';
import { 
  formatCurrency, 
  getJenisLabel, 
  getStatusLabel, 
  getStatusColor, 
  getJenisColor,
  formatRelativeTime 
} from '../utils/costHelpers';
import { JENIS_BIAYA_OPTIONS, STATUS_BIAYA_OPTIONS } from '../constants/costCategories';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface CostListProps {
  costs: OperationalCost[];
  loading?: boolean;
  onEdit?: (cost: OperationalCost) => void;
  onDelete?: (cost: OperationalCost) => void;
  onView?: (cost: OperationalCost) => void;
  filters?: CostFilters;
  onFiltersChange?: (filters: CostFilters) => void;
  className?: string;
}

type SortField =
  | 'nama_biaya'
  | 'jumlah_per_bulan'
  | 'jenis'
  | 'status'
  | 'created_at'
  | 'updated_at';
type SortOrder = 'asc' | 'desc';

const CostList: React.FC<CostListProps> = ({
  costs,
  loading = false,
  onEdit,
  onDelete,
  onView,
  filters = {},
  onFiltersChange,
  className = '',
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort costs
  const sortedCosts = [...costs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'nama_biaya':
        comparison = a.nama_biaya.localeCompare(b.nama_biaya);
        break;
      case 'jumlah_per_bulan':
        comparison = Number(a.jumlah_per_bulan) - Number(b.jumlah_per_bulan);
        break;
      case 'jenis':
        comparison = a.jenis.localeCompare(b.jenis);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof CostFilters, value: any) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        [key]: value === '' ? undefined : value,
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Loading state
  if (loading) {
    return <LoadingState type="table" rows={5} className={className} />;
  }

  // Empty state
  if (costs.length === 0 && !hasActiveFilters) {
    return (
      <EmptyState
        type="no-costs"
        className={className}
      />
    );
  }

  // No results state
  if (sortedCosts.length === 0 && hasActiveFilters) {
    return (
      <EmptyState
        type="no-results"
        actionLabel="Reset Filter"
        onAction={clearFilters}
        className={className}
      />
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header with search and filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama biaya..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Funnel className="h-4 w-4 mr-2" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jenis filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Biaya
                </label>
                <select
                  value={filters.jenis || ''}
                  onChange={(e) => handleFilterChange('jenis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Jenis</option>
                  {JENIS_BIAYA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Status</option>
                  {STATUS_BIAYA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('nama_biaya')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Nama Biaya</span>
                  {renderSortIcon('nama_biaya')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('jumlah_per_bulan')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Jumlah/Bulan</span>
                  {renderSortIcon('jumlah_per_bulan')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('jenis')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Jenis</span>
                  {renderSortIcon('jenis')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Status</span>
                  {renderSortIcon('status')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('updated_at')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Terakhir Diperbarui</span>
                  {renderSortIcon('updated_at')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Dibuat</span>
                  {renderSortIcon('created_at')}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCosts.map((cost) => (
              <tr key={cost.id} className="hover:bg-white">
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {cost.nama_biaya}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(cost.jumlah_per_bulan)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getJenisColor(cost.jenis) === 'blue'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {getJenisLabel(cost.jenis)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(cost.status) === 'green'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusLabel(cost.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-500">
                    {formatRelativeTime(cost.updated_at)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-500">
                    {formatRelativeTime(cost.created_at)}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {onView && (
                      <button
                        onClick={() => onView(cost)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Lihat detail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(cost)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit biaya"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(cost)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus biaya"
                      >
                        <Trash2 className="h-4 w-4" /> {/* ✅ FIXED: Use Trash2 (imported) instead of Trash */}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
        Menampilkan {sortedCosts.length} dari {costs.length} biaya operasional
      </div>
    </div>
  );
};

export default CostList;