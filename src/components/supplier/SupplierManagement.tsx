// src/components/supplier/SupplierManagement.tsx
// Main container component - orchestrates all supplier operations

import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupplier } from '@/contexts/SupplierContext';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supplierQueryKeys } from '@/contexts/SupplierContext';
import { toast } from 'sonner';

import SupplierTable from './SupplierTable';
import SupplierDialog from './SupplierDialog';
import SupplierFilters from './SupplierFilters';
import BulkActions from './BulkActions';
import { useSupplierTable } from './hooks/useSupplierTable';
import type { Supplier } from '@/types/supplier';

// Import fetchSuppliersPaginated function
const fetchSuppliersPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // This will be imported from SupplierContext later
  const { supabase } = await import('@/integrations/supabase/client');
  const { transformSupplierFromDB } = await import('@/contexts/SupplierContext');
  
  // Get total count
  const { count, error: countError } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(countError.message);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Get paginated data
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .order('nama', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  // Transform data
  const transformSupplierFromDBLocal = (dbItem: any): Supplier => ({
    id: dbItem.id,
    nama: dbItem.nama,
    kontak: dbItem.kontak || '',
    email: dbItem.email || undefined,
    telepon: dbItem.telepon || undefined,
    alamat: dbItem.alamat || undefined,
    catatan: dbItem.catatan || undefined,
    userId: dbItem.user_id,
    createdAt: new Date(dbItem.created_at),
    updatedAt: new Date(dbItem.updated_at || dbItem.created_at),
  });

  return {
    data: (data || []).map(transformSupplierFromDBLocal),
    total,
    page,
    limit,
    totalPages,
  };
};

const SupplierManagement: React.FC = () => {
  const { user } = useAuth();
  const { suppliers, isLoading, deleteSupplier } = useSupplier();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // 🎯 NEW: Lazy loading state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [useLazyLoading] = useState(true);

  // 🎯 NEW: Paginated query for lazy loading
  const paginatedQuery = useQuery({
    queryKey: [...supplierQueryKeys.list(), 'paginated', currentPage, itemsPerPage],
    queryFn: () => fetchSuppliersPaginated(user!.id, currentPage, itemsPerPage),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use paginated data when lazy loading is enabled, otherwise use regular data
  const displaySuppliers = paginatedQuery.data?.data || [];
  const displayLoading = paginatedQuery.isLoading;
  const paginationInfo = paginatedQuery.data;

  const {
    searchTerm,
    setSearchTerm,
    itemsPerPage: tableItemsPerPage,
    setItemsPerPage: setTableItemsPerPage,
    currentPage: tablePage,
    setCurrentPage: setTablePage,
    selectedSupplierIds,
    setSelectedSupplierIds,
    isSelectionMode,
    setIsSelectionMode,
    filteredSuppliers,
    currentSuppliers,
    totalPages
  } = useSupplierTable(displaySuppliers);
  
  // Override pagination controls when lazy loading is enabled
  const finalItemsPerPage = itemsPerPage;
  const finalCurrentPage = currentPage;
  const finalTotalPages = paginationInfo?.totalPages || 1;
  const finalCurrentSuppliers = displaySuppliers;
  const finalFilteredSuppliers = displaySuppliers;

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setSelectedSupplierIds(prev => prev.filter(sId => sId !== id));
    await deleteSupplier(id);
    toast.success('Supplier berhasil dihapus.');
  };

  const handleBulkDelete = async (ids: string[]) => {
    setSelectedSupplierIds([]);
    const success = await Promise.all(ids.map(id => deleteSupplier(id)));
    if (success.every(s => s)) {
      setIsSelectionMode(false);
      toast.success('Supplier berhasil dihapus!');
    }
  };

  const openAddDialog = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (newSupplier?: Supplier) => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setSelectedSupplierIds(prev => prev.filter(id => id !== (editingSupplier?.id || '')));
  };

  return (
    <div className="w-full p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 border">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manajemen Supplier</h1>
            <p className="text-sm opacity-90 mt-1">
              Kelola semua informasi partner dan pemasok Anda dengan mudah.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            onClick={openAddDialog}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg border hover:bg-gray-400 transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            Tambah Supplier
          </Button>
        </div>
      </header>

      {/* Bulk Actions */}
      <BulkActions
        isVisible={isSelectionMode || selectedSupplierIds.length > 0}
        selectedCount={selectedSupplierIds.length}
        totalFilteredCount={finalFilteredSuppliers.length}
        onCancel={() => {
          setSelectedSupplierIds([]);
          setIsSelectionMode(false);
        }}
        onSelectAll={() => {
          const allIds = finalFilteredSuppliers.map(s => s.id);
          setSelectedSupplierIds(prev => prev.length === allIds.length ? [] : allIds);
        }}
        onBulkDelete={() => handleBulkDelete(selectedSupplierIds)}
        suppliers={finalCurrentSuppliers.filter(s => selectedSupplierIds.includes(s.id))}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-500/80 overflow-hidden">
        {/* Kontrol Paginasi */}
        <div className="p-4 border-b border-gray-500 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="itemsPerPage">Items per page:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-500 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {paginationInfo && (
                <span className="text-blue-600 font-medium">
                  Total: {paginationInfo.total} supplier
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <SupplierFilters
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            setCurrentPage(1);
          }}
          itemsPerPage={finalItemsPerPage}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count);
            setCurrentPage(1);
          }}
          isSelectionMode={isSelectionMode}
          onSelectionModeChange={setIsSelectionMode}
        />

        {/* Table */}
        <SupplierTable
          suppliers={finalCurrentSuppliers}
          isLoading={displayLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedIds={selectedSupplierIds}
          onSelectionChange={setSelectedSupplierIds}
          isSelectionMode={isSelectionMode}
          filteredCount={finalFilteredSuppliers.length}
          currentPage={finalCurrentPage}
          totalPages={finalTotalPages}
          itemsPerPage={finalItemsPerPage}
          onPageChange={setCurrentPage}
          onAddFirst={openAddDialog}
          searchTerm={searchTerm}
        />
      </div>

      {/* Dialog */}
      <SupplierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        supplier={editingSupplier}
        onSuccess={() => handleDialogClose()}
      />
    </div>
  );
};

export default SupplierManagement;