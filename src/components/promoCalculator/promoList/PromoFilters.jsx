// src/pages/PromoList.jsx - Daftar Promo dengan useQuery dan PromoCard
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
  Download,
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import PromoCard from '@/components/promoCalculator/components/PromoCard';
import { promoService } from '@/components/promoCalculator/services/promoService';
import { logger } from '@/utils/logger'; // ✅ Import logger
import PromoEditDialog from '@/components/promoCalculator/dialogs/PromoEditDialog';
import LoadingState from '@/components/promoCalculator/components/shared/LoadingState';
import ErrorState from '@/components/promoCalculator/components/shared/ErrorState';
import EmptyState from '@/components/promoCalculator/components/shared/EmptyState';
import BulkActionsBar from '@/components/promoCalculator/components/shared/BulkActionsBar';

// Query Keys
const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
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

  // ✅ State untuk dialog edit
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
      logger.debug('🔍 Fetching promos with params:', queryParams); // ✅ Ganti console.log dengan logger.debug
      const promos = await promoService.getAll(queryParams);
      logger.debug('✅ Got promos:', promos?.length || 0); // ✅ Ganti console.log dengan logger.debug
      return promos || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      logger.error('Failed to fetch promos:', error); // ✅ Ganti console.error dengan logger.error
      toast.error('Gagal memuat data promo');
    }
  });

  // ✅ useMutation: Delete Promo
  const deletePromoMutation = useMutation({
    mutationFn: async (id) => {
      logger.debug('🗑️ Deleting promo:', id); // ✅ Ganti console.log dengan logger.debug
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
    },
    onError: (error) => {
      logger.error('Delete promo error:', error); // ✅ Ganti console.error dengan logger.error
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Bulk Delete Promos
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      logger.debug('📦 Bulk deleting promos:', ids.length); // ✅ Ganti console.log dengan logger.debug
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
      logger.error('Bulk delete error:', error); // ✅ Ganti console.error dengan logger.error
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Toggle Promo Status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      logger.debug('🔄 Toggling promo status:', id, newStatus); // ✅ Ganti console.log dengan logger.debug
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
      logger.error('Toggle status error:', error); // ✅ Ganti console.error dengan logger.error
      toast.error(error.message || 'Gagal mengubah status promo');
    },
  });

  // ✅ useMutation: Duplicate Promo
  const duplicatePromoMutation = useMutation({
    mutationFn: async (id) => {
      logger.debug('📋 Duplicating promo:', id); // ✅ Ganti console.log dengan logger.debug
      const newPromo = await promoService.duplicate(id);
      return newPromo;
    },
    onSuccess: (newPromo) => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success('Promo berhasil diduplikat');
      // ✅ Navigasi ke promo yang baru dibuat
      navigate(`/promo/${newPromo.id}`);
    },
    onError: (error) => {
      logger.error('Duplicate promo error:', error); // ✅ Ganti console.error dengan logger.error
      toast.error(error.message || 'Gagal menduplikat promo');
    },
  });

  // ✅ Get data from queries
  const promos = promosQuery.data || [];
  const isLoading = promosQuery.isLoading;
  const error = promosQuery.error;

  // ✅ Perbaiki deklarasi isProcessing untuk kompatibilitas
  const isProcessing = (
    (deletePromoMutation && deletePromoMutation.isPending) ||
    (bulkDeleteMutation && bulkDeleteMutation.isPending) ||
    (toggleStatusMutation && toggleStatusMutation.isPending) ||
    (duplicatePromoMutation && duplicatePromoMutation.isPending)
  ) || false;

  logger.debug('📊 Promo Query State:', { // ✅ Ganti console.log dengan logger.debug
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
    if (window.confirm(`Yakin ingin menghapus ${selectedItems.length} promo?`)) {
      await bulkDeleteMutation.mutateAsync(selectedItems);
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    await toggleStatusMutation.mutateAsync({ id, newStatus });
  };

  const handleDuplicate = async (id) => {
    await duplicatePromoMutation.mutateAsync(id);
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedPromo) => {
    try {
      await promoService.update(updatedPromo.id, updatedPromo);
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success('Promo berhasil diperbarui');
      setIsEditDialogOpen(false);
      setEditingPromo(null);
    } catch (error) {
      logger.error('Save edit error:', error); // ✅ Ganti console.error dengan logger.error
      toast.error(error.message || 'Gagal memperbarui promo');
    }
  };

  const handleRefresh = () => {
    logger.debug('🔄 Refreshing promo data...'); // ✅ Ganti console.log dengan logger.debug
    queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
    setSelectedItems([]);
    if (isEditDialogOpen) {
      setIsEditDialogOpen(false);
      setEditingPromo(null);
    }
  };

  const handleCreateNew = () => {
    if (isEditDialogOpen) {
      setIsEditDialogOpen(false);
      setEditingPromo(null);
    }
    // ✅ Navigasi ke halaman utama kalkulator untuk membuat baru
    navigate('/promo');
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto p-4 sm:p-6">
          <ErrorState 
            error={error}
            onRetry={promosQuery.refetch}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar Promo</h1>
            <p className="text-gray-600 mt-1">Kelola semua promo yang telah dibuat</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${promosQuery.isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleCreateNew}
              className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Promo Baru
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-0 sm:border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari promo..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedItems.length}
            onBulkDelete={handleBulkDelete}
            isProcessing={isProcessing}
          />
        )}

        {/* Promo List */}
        {promos.length === 0 ? (
          <EmptyState
            title="Belum ada promo"
            description="Buat promo pertama Anda untuk mulai menghitung penawaran menarik"
            action={{
              label: "Buat Promo Baru",
              onClick: handleCreateNew
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {promos.map((promo) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                isSelected={selectedItems.includes(promo.id)}
                onSelect={handleSelectItem}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onDuplicate={handleDuplicate}
                onEdit={handleEdit}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {isEditDialogOpen && editingPromo && (
          <PromoEditDialog
            promo={editingPromo}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleSaveEdit}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default PromoList;