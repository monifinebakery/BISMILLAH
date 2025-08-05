// src/pages/PromoList.jsx - Daftar Promo dengan useQuery dan Edit Modal

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Components
import { LoadingState } from '@/components/recipe/components/shared/LoadingState';
import PromoEditModal from './PromoEditModal'; // Import modal

// ✅ Temporary PromoTable Component - Replace with correct import later
const PromoTable = ({ promos, isLoading, onEdit, onDelete, onToggleStatus }) => {
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama Promo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipe
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dibuat
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {promos.map(promo => (
            <tr key={promo.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {promo.namaPromo || promo.nama_promo}
                </div>
                <div className="text-sm text-gray-500">
                  {promo.deskripsi || 'Tidak ada deskripsi'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {promo.tipePromo || promo.tipe_promo || 'Umum'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  promo.status === 'aktif' ? 'bg-green-100 text-green-800' :
                  promo.status === 'nonaktif' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {promo.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(promo.createdAt || promo.created_at).toLocaleDateString('id-ID')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onToggleStatus(promo.id, promo.status === 'aktif' ? 'nonaktif' : 'aktif')}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  {promo.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => onEdit(promo)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(promo.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Services
import { promoService } from '@/components/promoCalculator/services/promoService';

// ✅ Query Keys - Same as PromoCalculator
export const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
  detail: (id) => [...PROMO_QUERY_KEYS.all, 'detail', id],
};

const PromoList = () => {
  const queryClient = useQueryClient();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
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

  // ✅ Modal state
  const [editModal, setEditModal] = useState({
    isOpen: false,
    promo: null
  });

  // Build query params
  const queryParams = {
    search: searchTerm,
    filters,
    pagination
  };

  // ✅ useQuery: Fetch Promos
  const promosQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.list(queryParams),
    queryFn: async () => {
      console.log('🔍 Fetching promos with params:', queryParams);
      const promos = await promoService.getAll(queryParams);
      console.log('✅ Got promos:', promos?.length || 0);
      return promos || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - promos change more frequently
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Failed to fetch promos:', error);
      toast.error('Gagal memuat data promo');
    }
  });

  // ✅ useMutation: Update Promo (for modal)
  const updatePromoMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log('📝 Updating promo:', id, data);
      
      // Validate data before sending
      if (!data.namaPromo?.trim()) {
        throw new Error('Nama promo tidak boleh kosong');
      }
      
      // Transform field names if needed for compatibility
      const transformedData = {
        ...data,
        // Ensure we're using the right field names for the service
        namaPromo: data.namaPromo || data.nama_promo,
        tanggalMulai: data.tanggalMulai || data.tanggal_mulai,
        tanggalSelesai: data.tanggalSelesai || data.tanggal_selesai
      };
      
      const updatedPromo = await promoService.update(id, transformedData);
      console.log('✅ Promo updated successfully:', updatedPromo);
      return updatedPromo;
    },
    onSuccess: (updatedPromo) => {
      console.log('🎉 Update mutation success, updating cache...');
      
      // Update cache optimistically
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) {
            console.warn('⚠️ No old data found in cache');
            return oldData;
          }
          
          const newData = oldData.map(promo => 
            promo.id === updatedPromo.id ? { ...promo, ...updatedPromo } : promo
          );
          
          console.log('📊 Cache updated:', {
            oldCount: oldData.length,
            newCount: newData.length,
            updatedId: updatedPromo.id
          });
          
          return newData;
        }
      );

      // Also invalidate to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      
      toast.success('Promo berhasil diperbarui');
      
      // Close modal
      setEditModal({ isOpen: false, promo: null });
    },
    onError: (error) => {
      console.error('❌ Update promo error:', error);
      toast.error(error.message || 'Gagal memperbarui promo');
    },
  });

  // ✅ useMutation: Delete Promo
  const deletePromoMutation = useMutation({
    mutationFn: async (id) => {
      console.log('🗑️ Deleting promo:', id);
      await promoService.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache optimistically
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter(promo => promo.id !== deletedId);
        }
      );

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      
      toast.success('Promo berhasil dihapus');
      
      // Clear selection if deleted item was selected
      setSelectedItems(prev => prev.filter(id => id !== deletedId));
    },
    onError: (error) => {
      console.error('Delete promo error:', error);
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Bulk Delete Promos
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      console.log('📦 Bulk deleting promos:', ids.length);
      await promoService.bulkDelete(ids);
      return ids;
    },
    onSuccess: (deletedIds) => {
      // Remove from cache optimistically
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter(promo => !deletedIds.includes(promo.id));
        }
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      
      toast.success(`${deletedIds.length} promo berhasil dihapus`);
      setSelectedItems([]);
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Toggle Promo Status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      console.log('🔄 Toggling promo status:', id, newStatus);
      const updatedPromo = await promoService.toggleStatus({ id, newStatus });
      return updatedPromo;
    },
    onSuccess: (updatedPromo) => {
      // Update cache optimistically
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(promo => 
            promo.id === updatedPromo.id ? updatedPromo : promo
          );
        }
      );

      toast.success(`Promo berhasil ${updatedPromo.status === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`);
    },
    onError: (error) => {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Gagal mengubah status promo');
    },
  });

  // ✅ Get data from queries
  const promos = promosQuery.data || [];
  const isLoading = promosQuery.isLoading;
  const error = promosQuery.error;

  // Check if any mutation is loading
  const isProcessing = deletePromoMutation.isPending || 
                      bulkDeleteMutation.isPending || 
                      toggleStatusMutation.isPending ||
                      updatePromoMutation.isPending;

  // ✅ Debug logging
  console.log('📊 Promo Query State:', {
    data: promos?.length || 0,
    isLoading,
    error: error?.message,
    selectedItems: selectedItems.length,
    editModal: editModal.isOpen
  });

  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSelectItem = (id, selected) => {
    if (selected) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedItems(promos.map(promo => promo.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus promo ini?')) {
      await deletePromoMutation.mutateAsync(id);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih promo yang ingin dihapus');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus ${selectedItems.length} promo yang dipilih?`)) {
      await bulkDeleteMutation.mutateAsync(selectedItems);
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    await toggleStatusMutation.mutateAsync({ id, newStatus });
  };

  // ✅ Modified: Open edit modal instead of navigating
  const handleEdit = (promo) => {
    console.log('✏️ Opening edit modal for promo:', promo.id);
    
    setEditModal({
      isOpen: true,
      promo: promo
    });
    
    toast.info('Membuka editor promo...', {
      description: 'Modal edit promo dibuka'
    });
  };

  // ✅ Modal handlers
  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, promo: null });
  };

  const handleSaveEditModal = async (formData) => {
    if (!editModal.promo) {
      console.error('❌ No promo selected for editing');
      return;
    }
    
    console.log('💾 Attempting to save promo:', {
      id: editModal.promo.id,
      formData
    });
    
    try {
      await updatePromoMutation.mutateAsync({
        id: editModal.promo.id,
        data: formData
      });
      
      console.log('✅ Promo saved successfully');
    } catch (error) {
      console.error('❌ Failed to save promo:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  const handlePaginationChange = (changes) => {
    setPagination(prev => ({ ...prev, ...changes }));
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing promo data...');
    queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
    setSelectedItems([]);
  };

  const handleCreateNew = () => {
    // Navigate to promo calculator - use correct route
    window.location.href = '/promo';
  };

  // Loading State
  if (isLoading && promos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto p-4 sm:p-6">
          <LoadingState />
        </div>
      </div>
    );
  }

  // Error State
  if (error && promos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gagal Memuat Promo
            </h2>
            
            <p className="text-gray-600 mb-4">
              {error.message || 'Terjadi kesalahan saat memuat data promo'}
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Refresh Halaman
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daftar Promo</h1>
            <p className="text-gray-600 mt-1">
              Kelola semua promo yang telah dibuat
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isProcessing}
              className="border-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleCreateNew}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isProcessing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Promo
            </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            
            {/* Filters & Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari nama promo, tipe, atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedItems.length} dipilih
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isProcessing}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  </div>
                )}

                {/* Filter Button */}
                <Button
                  variant="outline"
                  className="border-gray-300"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>

                {/* Export Button */}
                <Button
                  variant="outline"
                  className="border-gray-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{promos.length}</div>
                  <div className="text-sm text-blue-700">Total Promo</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {promos.filter(p => p.status === 'aktif').length}
                  </div>
                  <div className="text-sm text-green-700">Aktif</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {promos.filter(p => p.status === 'nonaktif').length}
                  </div>
                  <div className="text-sm text-red-700">Non-aktif</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-600">
                    {promos.filter(p => p.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-700">Draft</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <PromoTable
              promos={promos}
              isLoading={isLoading}
              selectedItems={selectedItems}
              pagination={pagination}
              totalCount={promos.length} // Note: This should come from API response
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onPaginationChange={handlePaginationChange}
            />
          </CardContent>
        </Card>

        {/* Status Bar */}
        {isProcessing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <p className="text-blue-800 font-medium">
                  Memproses operasi...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Edit Modal */}
        <PromoEditModal
          isOpen={editModal.isOpen}
          promo={editModal.promo}
          onClose={handleCloseEditModal}
          onSave={handleSaveEditModal}
        />
      </div>
    </div>
  );
};

export default PromoList;