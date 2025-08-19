// src/components/supplier/SupplierManagement.tsx
// Main container component - orchestrates all supplier operations

import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupplier } from '@/contexts/SupplierContext';
import { toast } from 'sonner';

import SupplierTable from './SupplierTable';
import SupplierDialog from './SupplierDialog';
import SupplierFilters from './SupplierFilters';
import BulkActions from './BulkActions';
import { useSupplierTable } from './hooks/useSupplierTable';
import type { Supplier } from '@/types/supplier';

const SupplierManagement: React.FC = () => {
  const { suppliers, isLoading, deleteSupplier } = useSupplier();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    selectedSupplierIds,
    setSelectedSupplierIds,
    isSelectionMode,
    setIsSelectionMode,
    filteredSuppliers,
    currentSuppliers,
    totalPages
  } = useSupplierTable(suppliers);

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

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setSelectedSupplierIds(prev => prev.filter(id => id !== (editingSupplier?.id || '')));
  };

  return (
    <div className="container mx-auto p-4 sm:p-8">
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg border hover:bg-gray-100 transition-all duration-200"
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
        totalFilteredCount={filteredSuppliers.length}
        onCancel={() => {
          setSelectedSupplierIds([]);
          setIsSelectionMode(false);
        }}
        onSelectAll={() => {
          const allIds = filteredSuppliers.map(s => s.id);
          setSelectedSupplierIds(prev => prev.length === allIds.length ? [] : allIds);
        }}
        onBulkDelete={() => handleBulkDelete(selectedSupplierIds)}
        suppliers={currentSuppliers.filter(s => selectedSupplierIds.includes(s.id))}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        {/* Filters */}
        <SupplierFilters
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            setCurrentPage(1);
          }}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count);
            setCurrentPage(1);
          }}
          isSelectionMode={isSelectionMode}
          onSelectionModeChange={setIsSelectionMode}
        />

        {/* Table */}
        <SupplierTable
          suppliers={currentSuppliers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedIds={selectedSupplierIds}
          onSelectionChange={setSelectedSupplierIds}
          isSelectionMode={isSelectionMode}
          filteredCount={filteredSuppliers.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
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