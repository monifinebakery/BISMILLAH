// PromoList.jsx - Updated with PromoCard view option
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Trash2, Menu, X, Grid, List as ListIcon } from 'lucide-react';
import PromoTable from './PromoTable';
import PromoFilters from './PromoFilters';
import BulkActions from './BulkActions';
import PromoEditModal from './PromoEditModal';
import PromoCard from '../components/PromoCard'; // ✅ Import PromoCard
import { usePromoList } from '../hooks/usePromoList';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const PromoList = () => {
  const isMobile = useIsMobile(768);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(isMobile ? 'cards' : 'table'); // ✅ Cards default for mobile
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
    setShowFilters(false);
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
    toast.info('Fitur export akan segera tersedia');
    setShowMobileActions(false);
  };

  const handleCreatePromo = () => {
    window.location.hash = '#calculator';
    setShowMobileActions(false);
  };

  // ✅ PromoCard specific handlers
  const handleViewPromo = (promo) => {
    setEditModal({ isOpen: true, promo });
  };

  const handleDuplicatePromo = (promo) => {
    const duplicatedPromo = {
      ...promo,
      id: Date.now().toString(),
      namaPromo: `${promo.namaPromo} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    toast.success('Promo berhasil diduplikasi');
    console.log('Duplicated promo:', duplicatedPromo);
    // TODO: Implement actual duplication logic
  };

  // ✅ Cards View Component
  const CardsView = () => (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className={isMobile 
        ? "space-y-4" 
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      }>
        {promos.map((promo) => (
          <div
            key={promo.id}
            className={`${selectedItems.includes(promo.id) ? 'ring-2 ring-orange-500 ring-opacity-50' : ''}`}
          >
            <PromoCard
              promo={promo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleViewPromo}
              onDuplicate={handleDuplicatePromo}
              showActions={true}
            />
          </div>
        ))}
      </div>

      {/* Desktop Pagination for Cards */}
      {!isMobile && totalCount > pagination.pageSize && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Menampilkan {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, totalCount)} dari {totalCount} promo
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePaginationChange({ page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePaginationChange({ page: pagination.page + 1 })}
              disabled={pagination.page >= Math.ceil(totalCount / pagination.pageSize)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Mobile Load More Button */}
      {isMobile && totalCount > promos.length && (
        <div className="text-center pt-4">
          <button
            onClick={() => handlePaginationChange({ pageSize: pagination.pageSize + 10 })}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Muat Lebih Banyak ({totalCount - promos.length} lagi)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Daftar Promo</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola semua promo yang telah dibuat</p>
        </div>
        
        {/* Desktop Actions */}
        <div className={isMobile ? 'hidden' : 'flex items-center space-x-3'}>
          {/* ✅ View Mode Toggle - Desktop */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
              } rounded-l-lg transition-colors`}
              title="Table View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 ${viewMode === 'cards' 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
              } rounded-r-lg transition-colors`}
              title="Cards View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

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
        <div className={isMobile ? 'block' : 'hidden'}>
          <button
            onClick={() => setShowMobileActions(!showMobileActions)}
            className="flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-lg"
          >
            {showMobileActions ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Actions Menu */}
      {showMobileActions && isMobile && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-lg">
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

          {/* ✅ Mobile View Mode Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setViewMode('table');
                setShowMobileActions(false);
              }}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ListIcon className="h-4 w-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => {
                setViewMode('cards');
                setShowMobileActions(false);
              }}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
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

        <div className={isMobile ? 'block' : 'hidden'}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <Filter className="h-4 w-4" />
            <span>Filter & Urutkan</span>
          </button>
        </div>

        <div className={isMobile ? 'hidden' : 'block'}>
          <PromoFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {showFilters && isMobile && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
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

      {/* Stats Summary */}
      {isMobile && (
        <div className="bg-gray-50 rounded-lg p-4">
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
      )}

      {/* Content Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && promos.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">Tidak ada promo ditemukan</p>
          </div>
        )}

        {/* ✅ Content - Table or Cards based on viewMode */}
        {!isLoading && promos.length > 0 && (
          <>
            {viewMode === 'table' ? (
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
            ) : (
              <div className="p-4 sm:p-6">
                <CardsView />
              </div>
            )}
          </>
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