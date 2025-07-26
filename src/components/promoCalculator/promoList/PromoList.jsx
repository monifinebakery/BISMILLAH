// 🎯 Main list component dengan table, filter, dan pagination

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Trash2 } from 'lucide-react';
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
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Daftar Promo</h2>
          <p className="text-gray-600">Kelola semua promo yang telah dibuat</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => window.location.hash = '#calculator'}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Promo</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama promo, tipe, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <PromoFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <BulkActions
          selectedCount={selectedItems.length}
          onDelete={handleBulkDelete}
          onDeselect={() => setSelectedItems([])}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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