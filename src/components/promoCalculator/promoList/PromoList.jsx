// 🎯 Main list component dengan table, filter, dan pagination - Mobile Responsive

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Trash2, Menu, X } from 'lucide-react';
import PromoTable from './PromoTable';
import PromoFilters from './PromoFilters';
import BulkActions from './BulkActions';
import PromoEditModal from './PromoEditModal';
import { usePromoList } from '../hooks/usePromoList';
import { toast } from 'sonner';

const PromoList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateRange: { start: '', end: '' }
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [editModal, setEditModal] = useState({ isOpen: false, promo: null });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const {
    promos,
    totalCount,
    isLoading,
    refreshPromos,
    deletePromo,
    bulkDelete,
    toggleStatus
  } = usePromoList();

  // Load promos when filters or pagination change
  useEffect(() => {
    refreshPromos({
      search: searchTerm,
      filters,
      pagination
    });
  }, [searchTerm, filters, pagination, refreshPromos]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilters(false); // Close mobile filter panel
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  };

  const handleSelectItem = (id, selected) => {
    if (selected) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedItems(promos.map(promo => promo.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleEdit = (promo) => {
    setEditModal({ isOpen: true, promo });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus promo ini?')) {
      try {
        await deletePromo(id);
        toast.success('Promo berhasil dihapus');
        refreshPromos();
      } catch (error) {
        toast.error(`Gagal menghapus promo: ${error.message}`);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih promo yang ingin dihapus');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus ${selectedItems.length} promo?`)) {
      try {
        await bulkDelete(selectedItems);
        toast.success(`${selectedItems.length} promo berhasil dihapus`);
        setSelectedItems([]);
        refreshPromos();
      } catch (error) {
        toast.error(`Gagal menghapus promo: ${error.message}`);
      }
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await toggleStatus(id, newStatus);
      toast.success('Status promo berhasil diubah');
      refreshPromos();
    } catch (error) {
      toast.error(`Gagal mengubah status: ${error.message}`);
    }
  };

  const handleExport = () => {
    // Implement export functionality
    toast.info('Fitur export akan segera tersedia');
    setShowMobileActions(false);
  };

  const handleCreatePromo = () => {
    window.location.hash = '#calculator';
    setShowMobileActions(false);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Daftar Promo</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola semua promo yang telah dibuat</p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={handleCreatePromo}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Promo</span>
          </button>
        </div>

        {/* Mobile Actions Button */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowMobileActions(!showMobileActions)}
            className="flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-lg"
          >
            {showMobileActions ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Actions Menu */}
      {showMobileActions && (
        <div className="sm:hidden bg-white border border-gray-200 rounded-lg p-4 space-y-2 shadow-lg">
          <button
            onClick={handleCreatePromo}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Buat Promo Baru</span>
          </button>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Export Data</span>
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama promo, tipe, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <Filter className="h-4 w-4" />
            <span>Filter & Urutkan</span>
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:block">
          <PromoFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="sm:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Filter & Urutkan</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PromoFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              isMobile={true}
            />
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="px-2 sm:px-0">
          <BulkActions
            selectedCount={selectedItems.length}
            onDelete={handleBulkDelete}
            onDeselect={() => setSelectedItems([])}
          />
        </div>
      )}

      {/* Stats Summary - Mobile */}
      <div className="sm:hidden bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold text-gray-900">{totalCount || 0}</div>
            <div className="text-sm text-gray-600">Total Promo</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-orange-600">{selectedItems.length}</div>
            <div className="text-sm text-gray-600">Terpilih</div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile: Show loading state */}
        {isLoading && (
          <div className="sm:hidden p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        )}

        {/* Mobile: Show empty state */}
        {!isLoading && promos.length === 0 && (
          <div className="sm:hidden p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">Tidak ada promo ditemukan</p>
            <button
              onClick={handleCreatePromo}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Buat Promo Pertama
            </button>
          </div>
        )}

        {/* Table */}
        {(!isLoading || promos.length > 0) && (
          <PromoTable
            promos={promos}
            isLoading={isLoading}
            selectedItems={selectedItems}
            pagination={pagination}
            totalCount={totalCount}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onPaginationChange={handlePaginationChange}
          />
        )}
      </div>

      {/* Edit Modal */}
      <PromoEditModal
        isOpen={editModal.isOpen}
        promo={editModal.promo}
        onClose={() => setEditModal({ isOpen: false, promo: null })}
        onSave={() => {
          refreshPromos();
          setEditModal({ isOpen: false, promo: null });
        }}
      />
    </div>
  );
};

export default PromoList;