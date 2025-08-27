// src/components/purchase/components/PurchaseTable.tsx
// Simplified version using extracted components and custom hooks

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableHeader, TableHead, TableCell, TableRow } from '@/components/ui/table';
import { Search, Calendar, User, Package, Receipt, AlertTriangle, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/utils/formatUtils';
import { getStatusDisplayText, getFormattedTotalQuantities } from '../utils/purchaseHelpers';

// Type imports
import { PurchaseTablePropsExtended, Purchase, PurchaseStatus } from '../types/purchase.types';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import { usePurchaseTableDialogs } from '../hooks/usePurchaseTableDialogs';

// Component imports
import EmptyState from './EmptyState';
import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';
import {
  TableFilters,
  PurchaseTableRow,
  StatusDropdown,
  ActionButtons,
} from './table';
import BulkActions from './BulkActions';
import { BulkOperationsDialog } from './dialogs';

// Import the bulk operations hook
import { useBulkOperations } from '../hooks/useBulkOperations';


// Hook imports
import { usePurchaseTableState } from '../hooks/usePurchaseTableState';

// Utils
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// Context imports for bulk operations
import { usePurchase } from '../hooks/usePurchase';

// ✅ Main PurchaseTable component - Simplified version
const PurchaseTable: React.FC<PurchaseTablePropsExtended> = ({ 
  onEdit, 
  onStatusChange,
  onDelete,
  validateStatusChange
}) => {
  // ✅ Context
  const {
    filteredPurchases,
    suppliers,
  } = usePurchaseTable();

  // ✅ Purchase context for bulk operations
  const {
    updatePurchase,
    deletePurchase,
    getSupplierName: getSupplierNameFromContext
  } = usePurchase();

  // ✅ Custom hook for table state management
  const {
    // State
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    selectedItems,
    setSelectedItems,
    editingStatusId,
    setEditingStatusId,

    // Derived data
    processedPurchases,
    paginationData,

    // Handlers
    toggleSelectItem,
    toggleSelectAll,
    clearSelection,
    handleSort,
    resetFilters,
    getSupplierName
  } = usePurchaseTableState({ 
    initialPurchases: filteredPurchases, 
    suppliers: suppliers || [] 
  });

  // ✅ Dialog hooks
  const {
    dialogState,
    openDelete,
    setDeleteLoading,
    resetDelete,
    openBulkDelete,
    setBulkDeleteLoading,
    resetBulkDelete,
    openStatus,
    resetStatus,
  } = usePurchaseTableDialogs();

  // ✅ Bulk operations hook
  const {
    isBulkEditing,
    isBulkDeleting,
    bulkEditData,
    setBulkEditData,
    handleBulkEdit,
    handleBulkDelete,
    resetBulkEditData,
    validateBulkEditData,
  } = useBulkOperations({
    updatePurchase,
    deletePurchase,
    selectedItems,
    clearSelection,
  });

  // ✅ Action handlers
  const actionHandlers = {
    edit: onEdit,
    delete: openDelete,
    bulkDelete: selectedItems.length > 0 ? openBulkDelete : undefined,
    resetFilters: () => {
      resetFilters();
      setSearchQuery('');
      setStatusFilter('all');
    },
  };

  // ✅ Bulk operations handlers
  const handleBulkEditOpen = () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih pembelian yang ingin diedit terlebih dahulu');
      return;
    }
    // We'll trigger this via a dialog state
    setBulkEditDialogOpen(true);
  };

  const handleBulkDeleteOpen = () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih pembelian yang ingin dihapus terlebih dahulu');
      return;
    }
    openBulkDelete(selectedItems.length);
  };

  // Dialog state for bulk operations
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = React.useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isBulkModeActive, setIsBulkModeActive] = React.useState(false);

  // ✅ Check if all items on current page are selected
  const isAllSelected = paginationData.currentPurchases.length > 0 && 
    paginationData.currentPurchases.every(purchase => selectedItems.includes(purchase.id));

  // ✅ Select all items on current page
  const selectAll = () => {
    if (isAllSelected) {
      // Deselect all items on current page
      const currentPageItemIds = paginationData.currentPurchases.map(p => p.id);
      setSelectedItems(prev => prev.filter(id => !currentPageItemIds.includes(id)));
    } else {
      // Select all items on current page
      const currentPageItemIds = paginationData.currentPurchases.map(p => p.id);
      setSelectedItems(prev => [...new Set([...prev, ...currentPageItemIds])]);
    }
  };

  // ✅ Handle status change
  const handleStatusChange = useCallback(async (purchaseId: string, newStatus: string) => {
    const purchase = filteredPurchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    if (purchase.status === newStatus) {
      setEditingStatusId(null);
      return;
    }

    try {
      let validation: { canChange: boolean; warnings: string[]; errors: string[] } = { canChange: true, warnings: [], errors: [] };
      if (validateStatusChange) {
        validation = await validateStatusChange(purchaseId, newStatus);
      }

      if (validation.canChange && validation.warnings.length === 0) {
        if (onStatusChange) {
          await onStatusChange(purchaseId, newStatus as PurchaseStatus);
        }
        setEditingStatusId(null);
      } else {
        openStatus(purchase, newStatus as PurchaseStatus, validation);
      }
    } catch (error) {
      logger.error('Status change validation failed:', error);
      setEditingStatusId(null);
    }
  }, [filteredPurchases, validateStatusChange, onStatusChange, openStatus, setEditingStatusId]);

  // ✅ Sort icon helper function
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // ✅ Delete confirmation handler
  const handleDeleteConfirm = useCallback(async () => {
    const { purchase } = dialogState.deleteConfirmation;
    if (!purchase || !onDelete) return;

    try {
      setDeleteLoading(true);
      await onDelete(purchase.id);
      
      // Reset current page if we're on the last item of the last page
      const remainingItems = filteredPurchases.length - 1;
      const maxPage = Math.ceil(remainingItems / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
      
      resetDelete();
      toast.success('Pembelian berhasil dihapus');
    } catch (error) {
      logger.error('Delete failed:', error);
      toast.error('Gagal menghapus pembelian');
    } finally {
      setDeleteLoading(false);
    }
  }, [
    dialogState.deleteConfirmation, 
    onDelete, 
    setDeleteLoading, 
    resetDelete,
    filteredPurchases.length,
    itemsPerPage,
    currentPage,
    setCurrentPage
  ]);



  // ✅ Dialog handlers
  const dialogHandlers = {
    confirmStatusChange: async () => {
      const { purchase, newStatus } = dialogState.statusConfirmation;
      if (!purchase || !newStatus || !onStatusChange) return;

      try {
        await onStatusChange(purchase.id, newStatus);
        resetStatus();
        setEditingStatusId(null);
      } catch (error) {
        logger.error('Status change failed:', error);
      }
    },

    cancelStatusChange: () => {
      resetStatus();
      setEditingStatusId(null);
    },

    cancelDelete: resetDelete,
    cancelBulkDelete: resetBulkDelete
  };

  // ✅ Handler functions
  const handleNoOp = useCallback(() => {}, []);

  // ✅ Early return for empty state
  if (!paginationData.hasData && !searchQuery && statusFilter === 'all') {
    return (
      <EmptyState
        onAddPurchase={() => {/* Will be handled by parent */}}
        hasSuppliers={true}
      />
    );
  }

  // ✅ Bulk delete confirmation handler
  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      setBulkDeleteLoading(true);
      const success = await handleBulkDelete();
      if (success) {
        resetBulkDelete();
        setBulkDeleteDialogOpen(false);
      }
    } catch (error) {
      logger.error('Bulk delete failed:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [handleBulkDelete, setBulkDeleteLoading, resetBulkDelete]);

  // ✅ Bulk edit confirmation handler
  const handleBulkEditConfirm = useCallback(async (bulkEditData: any) => {
    try {
      const selectedItemsData = filteredPurchases.filter(p => selectedItems.includes(p.id));
      const success = await handleBulkEdit(selectedItemsData);
      if (success) {
        setBulkEditDialogOpen(false);
        resetBulkEditData();
      }
    } catch (error) {
      logger.error('Bulk edit failed:', error);
    }
  }, [handleBulkEdit, selectedItems, filteredPurchases, resetBulkEditData]);

  return (
    <div className="space-y-4">
      {/* ✅ Bulk Actions */}
      {(selectedItems.length > 0 || isBulkModeActive) && (
        <BulkActions
          selectedCount={selectedItems.length}
          onBulkEdit={handleBulkEditOpen}
          onBulkDelete={handleBulkDeleteOpen}
          onClearSelection={() => {
            clearSelection();
            setIsBulkModeActive(false);
          }}
          isProcessing={isBulkEditing || isBulkDeleting}
        />
      )}
      
      {/* Filters and Search */}
      <TableFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        filteredCount={processedPurchases.length}
        selectedItemsCount={selectedItems.length}
        onClearSelection={clearSelection}
        onBulkDelete={handleNoOp}
        onResetFilters={actionHandlers.resetFilters}
      />

      {/* ✅ Table */}
      <Card>
        {!paginationData.hasData ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil</h3>
              <p className="text-gray-500 mb-4">
                Tidak ditemukan pembelian yang sesuai dengan kriteria pencarian.
              </p>
              <button 
                onClick={actionHandlers.resetFilters}
                className="text-orange-600 hover:text-orange-800 font-medium"
              >
                Reset Filter
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={selectAll}
                      aria-label="Select all purchases"
                    />
                  </TableHead>

                  <TableHead>
                    <button
                      onClick={() => handleSort('tanggal')}
                      className="flex items-center h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Tanggal
                      {renderSortIcon('tanggal')}
                    </button>
                  </TableHead>

                  <TableHead>
                    <button
                      onClick={() => handleSort('supplier')}
                      className="flex items-center h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Supplier
                      {renderSortIcon('supplier')}
                    </button>
                  </TableHead>

                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items
                    </div>
                  </TableHead>

                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort('totalNilai')}
                      className="flex items-center h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Total Nilai
                      {renderSortIcon('totalNilai')}
                    </button>
                  </TableHead>

                  <TableHead>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Status
                      {renderSortIcon('status')}
                    </button>
                  </TableHead>

                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationData.currentPurchases.map((purchase) => (
                  <PurchaseTableRow
                    key={purchase.id}
                    purchase={purchase}
                    isSelected={selectedItems.includes(purchase.id)}
                    isEditingStatus={editingStatusId === purchase.id}
                    onToggleSelect={toggleSelectItem}
                    onEditStatus={(id) => setEditingStatusId(id)}
                    onStatusChange={handleStatusChange}
                    onEdit={onEdit}
                    onDelete={openDelete}
                    getSupplierName={getSupplierName}
                  />
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {paginationData.showPagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-700">
                  Menampilkan {paginationData.startIndex + 1} - {Math.min(paginationData.endIndex, processedPurchases.length)} dari {processedPurchases.length} data
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </button>
                  
                  <button
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                    disabled={currentPage === paginationData.totalPages}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ✅ Dialogs */}
      <StatusChangeConfirmationDialog
        isOpen={dialogState.statusConfirmation.isOpen}
        purchase={dialogState.statusConfirmation.purchase}
        newStatus={dialogState.statusConfirmation.newStatus!}
        validation={dialogState.statusConfirmation.validation}
        isUpdating={false}
        onConfirm={dialogHandlers.confirmStatusChange}
        onCancel={dialogHandlers.cancelStatusChange}
      />

      <AlertDialog open={dialogState.deleteConfirmation.isOpen} onOpenChange={(open: boolean) => !open && dialogHandlers.cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pembelian ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={dialogHandlers.cancelDelete}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Bulk Operations Dialog */}
      <BulkOperationsDialog
        type="delete"
        isOpen={dialogState.bulkDeleteConfirmation.isOpen}
        isLoading={isBulkDeleting}
        selectedCount={selectedItems.length}
        selectedItems={filteredPurchases.filter(p => selectedItems.includes(p.id))}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => {
          resetBulkDelete();
          setBulkDeleteDialogOpen(false);
        }}
      />

      <BulkOperationsDialog
        type="edit"
        isOpen={bulkEditDialogOpen}
        isLoading={isBulkEditing}
        selectedCount={selectedItems.length}
        selectedItems={filteredPurchases.filter(p => selectedItems.includes(p.id))}
        bulkEditData={bulkEditData}
        onBulkEditDataChange={setBulkEditData}
        onConfirm={handleBulkEditConfirm}
        onCancel={() => {
          setBulkEditDialogOpen(false);
          resetBulkEditData();
        }}
        suppliers={suppliers || []}
      />

    </div>
  );
};

export default PurchaseTable;