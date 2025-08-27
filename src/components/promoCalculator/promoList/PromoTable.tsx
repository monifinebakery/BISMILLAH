// 🎯 Table component dengan pagination dan sorting

import React from 'react';
import { 
  ChevronUp, ChevronDown, Edit, Trash2, ToggleLeft, ToggleRight,
  Calendar, Gift, Percent, Package, ChevronLeft, ChevronRight
} from 'lucide-react';

const PromoTable = ({
  promos,
  isLoading,
  selectedItems,
  pagination,
  totalCount,
  onSelectItem,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleStatus,
  onPaginationChange
}: any) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPromoIcon = (type) => {
    switch (type) {
      case 'bogo': return <Gift className="h-4 w-4 text-green-600" />;
      case 'discount': return <Percent className="h-4 w-4 text-blue-600" />;
      case 'bundle': return <Package className="h-4 w-4 text-purple-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPromoTypeLabel = (type) => {
    switch (type) {
      case 'bogo': return 'BOGO';
      case 'discount': return 'Diskon';
      case 'bundle': return 'Bundle';
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      aktif: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
      nonaktif: { bg: 'bg-red-100', text: 'text-red-800', label: 'Non-aktif' },
      draft: { bg: 'bg-gray-200', text: 'text-gray-800', label: 'Draft' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleSort = (field) => {
    const newOrder = pagination.sortBy === field && pagination.sortOrder === 'asc' ? 'desc' : 'asc';
    onPaginationChange({
      sortBy: field,
      sortOrder: newOrder
    });
  };

  const getSortIcon = (field) => {
    if (pagination.sortBy !== field) return null;
    return pagination.sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, totalCount);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data promo...</p>
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Promo</h3>
        <p className="text-gray-600">Buat promo pertama Anda untuk melihat daftar di sini</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === promos.length && promos.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('nama_promo')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nama Promo</span>
                  {getSortIcon('nama_promo')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('tipe_promo')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tipe</span>
                  {getSortIcon('tipe_promo')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HPP/Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit Margin
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Dibuat</span>
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Terakhir Diperbarui</span>
                  {getSortIcon('updated_at')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-300">
            {promos.map(promo => (
              <tr key={promo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(promo.id)}
                    onChange={(e) => onSelectItem(promo.id, e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {getPromoIcon(promo.tipe_promo)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {promo.nama_promo}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {promo.deskripsi || 'Tidak ada deskripsi'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    {getPromoTypeLabel(promo.tipe_promo)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>
                    <div>HPP: {formatCurrency(promo.calculation_result?.promoHpp || 0)}</div>
                    <div className="text-gray-500">
                      Harga: {formatCurrency(promo.calculation_result?.promoPrice || 0)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className={`font-medium ${
                    (promo.calculation_result?.promoMargin || 0) > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(promo.calculation_result?.promoMargin || 0).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(promo.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(promo.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(promo.updated_at)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleStatus(promo.id, promo.status === 'aktif' ? 'nonaktif' : 'aktif')}
                      className="text-gray-400 hover:text-gray-600"
                      title={promo.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {promo.status === 'aktif' ? 
                        <ToggleRight className="h-4 w-4" /> : 
                        <ToggleLeft className="h-4 w-4" />
                      }
                    </button>
                    <button
                      onClick={() => onEdit(promo)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(promo.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-300 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Menampilkan {startItem} - {endItem} dari {totalCount} promo
            </span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPaginationChange({ 
                pageSize: parseInt(e.target.value), 
                page: 1 
              })}
              className="ml-2 text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPaginationChange({ page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPaginationChange({ page: pageNum })}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === pagination.page
                      ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPaginationChange({ page: pagination.page + 1 })}
              disabled={pagination.page >= totalPages}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoTable;