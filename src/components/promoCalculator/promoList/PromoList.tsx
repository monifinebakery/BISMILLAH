// src/pages/PromoList.jsx - FIXED with Logger
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import PromoCard from '@/components/promoCalculator/components/PromoCard';
import PromoEditDialog from '@/components/promoCalculator/dialogs/PromoEditDialog';
import { LoadingState } from '@/components/recipe/components/shared/LoadingState';
import { promoService } from '@/components/promoCalculator/services/promoService';
import { logger } from '@/utils/logger';

// ✅ Query Keys
export const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
  detail: (id) => [...PROMO_QUERY_KEYS.all, 'detail', id],
};

const PromoList = () => {
  const navigate = useNavigate();
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
    pageSize: 100,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

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
      logger.api('promos', 'Fetching promos with params:', queryParams);
      const promos = await promoService.getAll(queryParams);
      logger.success('Got promos:', promos?.length || 0);
      return promos || [];
    },
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      logger.error('Failed to fetch promos:', error);
      toast.error('Gagal memuat data promo');
    }
  });

  // ✅ useMutation: Delete Promo
  const deletePromoMutation = useMutation({
    mutationFn: async (id) => {
      logger.info('Deleting promo:', id);
      await promoService.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter(promo => promo.id !== deletedId);
        }
      );
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success('Promo berhasil dihapus');
      setSelectedItems(prev => prev.filter(id => id !== deletedId));
    },
    onError: (error) => {
      logger.error('Delete promo error:', error);
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Bulk Delete Promos  
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      logger.info('Bulk deleting promos:', ids.length);
      await promoService.bulkDelete(ids);
      return ids;
    },
    onSuccess: (deletedIds) => {
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter(promo => !deletedIds.includes(promo.id));
        }
      );
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success(`${deletedIds.length} promo berhasil dihapus`);
      setSelectedItems([]);
    },
    onError: (error) => {
      logger.error('Bulk delete error:', error);
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Toggle Promo Status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      logger.info('Toggling promo status:', { id, newStatus });
      const updatedPromo = await promoService.toggleStatus({ id, newStatus });
      return updatedPromo;
    },
    onSuccess: (updatedPromo) => {
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
      logger.error('Toggle status error:', error);
      toast.error(error.message || 'Gagal mengubah status promo');
    },
  });

  // ✅ useMutation: Duplicate Promo
  const duplicatePromoMutation = useMutation({
    mutationFn: async (originalPromo) => {
      logger.info('Duplicating promo:', originalPromo.id);
      const newPromo = await promoService.duplicate(originalPromo);
      return newPromo;
    },
    onSuccess: (newPromo) => {
      queryClient.setQueryData(
        PROMO_QUERY_KEYS.list(queryParams),
        (oldData) => {
          if (!oldData) return [newPromo];
          return [newPromo, ...oldData];
        }
      );
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success('Promo berhasil diduplikat');
    },
    onError: (error) => {
      logger.error('Duplicate promo error:', error);
      toast.error(error.message || 'Gagal menduplikat promo');
    },
  });

  // ✅ Get data from queries
  const promos = promosQuery.data || [];
  const isLoading = promosQuery.isLoading;
  const error = promosQuery.error;

  // ✅ Check if any mutation is loading
  const isProcessing = (
    (deletePromoMutation && deletePromoMutation.isPending) ||
    (bulkDeleteMutation && bulkDeleteMutation.isPending) ||
    (toggleStatusMutation && toggleStatusMutation.isPending) ||
    (duplicatePromoMutation && duplicatePromoMutation.isPending)
  ) || false;

  logger.component('PromoList', 'Query State:', {
    promos: (promos && promos.length) || 0,
    isLoading,
    error: (error && error.message) || null,
    selectedItems: selectedItems.length
  });

  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
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

  // ✅ Handler untuk membuka dialog edit
  const handleEdit = (promo) => {
    logger.component('PromoList', 'Opening edit dialog for promo:', promo.id);
    setEditingPromo(promo);
    setIsEditDialogOpen(true);
  };

  // ✅ Handler setelah promo berhasil diedit
  const handleEditSuccess = (updatedPromo) => {
    logger.success('Promo updated successfully in list:', updatedPromo.id);
  };

  const handleView = (promo) => {
    logger.component('PromoList', 'View promo details:', promo.id);
    toast.info(`Melihat detail promo: ${promo.namaPromo}`);
  };

  const handleDuplicate = async (promo) => {
    logger.component('PromoList', 'Duplicate promo:', promo.id);
    await duplicatePromoMutation.mutateAsync(promo);
  };

  const handleRefresh = () => {
    logger.component('PromoList', 'Refreshing promo data...');
    queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
    setSelectedItems([]);
    if (isEditDialogOpen) {
        setIsEditDialogOpen(false);
        setEditingPromo(null);
    }
  };

  const handleCreateNew = () => {
    logger.component('PromoList', 'Navigating to PromoCalculator for new promo creation');
    
    if (isEditDialogOpen) {
        setIsEditDialogOpen(false);
        setEditingPromo(null);
    }
    
    toast.info('Membuka konfigurasi promo...', {
      description: 'Mengarahkan ke halaman pembuatan promo'
    });

    navigate('/promo/create');
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
        <Card className="max-w-md w-full">
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
              className="border-gray-500"
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
        <Card className="border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Filters & Search */}
            <div className="p-6 border-b border-gray-500">
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
                  className="border-gray-500"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
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

            {/* Promo Cards Grid */}
            {promos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {promos.map(promo => (
                  <PromoCard
                    key={promo.id}
                    promo={promo}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onDuplicate={handleDuplicate}
                    onToggleStatus={handleToggleStatus}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Promo</h3>
                <p className="text-gray-600 mb-4">Buat promo pertama Anda untuk melihat daftar di sini</p>
                <Button
                  onClick={handleCreateNew}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Promo Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Bar */}
        {isProcessing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border border-blue-600 border-t-transparent rounded-full"></div>
                <p className="text-blue-800 font-medium">
                  Memproses operasi...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ✅ Promo Edit Dialog */}
      <PromoEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          logger.component('PromoList', 'Closing edit dialog');
          setIsEditDialogOpen(false);
          setEditingPromo(null);
        }}
        promo={editingPromo}
        onEditSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default PromoList;