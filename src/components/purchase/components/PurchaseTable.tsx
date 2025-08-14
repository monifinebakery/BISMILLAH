// src/components/purchase/components/PurchaseTable.tsx - Enhanced with Delete & Edit

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Calendar,
  User,
  Receipt,
  AlertTriangle
} from 'lucide-react';

// ✅ Type imports
import { PurchaseTablePropsExtended, PurchaseStatus, Purchase } from '../types/purchase.types';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import { usePurchaseTableDialogs } from '../hooks/usePurchaseTableDialogs';

// ✅ Utility imports
import { formatCurrency } from '@/utils/formatUtils';
import {
  getStatusDisplayText,
  getFormattedTotalQuantities
} from '../utils/purchaseHelpers';

// ✅ Component imports
import EmptyState from './EmptyState';
import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';
import StatusDropdown from './StatusDropdown';
import { STATUS_OPTIONS } from '../constants/statusOptions';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' }
];


// ✅ Enhanced PurchaseTable with delete and edit functionality
const PurchaseTable: React.FC<PurchaseTablePropsExtended> = ({ 
  onEdit, 
  onStatusChange,
  onDelete,
  onBulkDelete,
  validateStatusChange
}) => {
  // ✅ Context
  const {
    filteredPurchases,
    selectedItems,
    setSelectedItems,
    selectAll,
    isAllSelected,
    toggleSelectItem,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    sortOrder,
    handleSort,
    getSupplierName,
  } = usePurchaseTable();

  // ✅ Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
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

  // ✅ Pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPurchases = filteredPurchases.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      currentPurchases,
      hasData: filteredPurchases.length > 0,
      showPagination: totalPages > 1
    };
  }, [filteredPurchases, currentPage, itemsPerPage]);

  // ✅ Action handlers
  const actionHandlers = useMemo(() => ({
    edit: (purchase: Purchase) => {
      logger.context('PurchaseTable', 'Edit clicked for:', purchase.id);
      if (onEdit) {
        onEdit(purchase);
      } else {
        toast.info('Fungsi edit belum tersedia');
      }
    },

    delete: (purchase: Purchase) => {
      logger.context('PurchaseTable', 'Delete clicked for:', purchase.id);
      openDelete(purchase);
    },

    bulkDelete: () => {
      logger.context('PurchaseTable', 'Bulk delete clicked for:', selectedItems.length, 'items');
      openBulkDelete(selectedItems.length);
    },

    resetFilters: () => {
      setSearchQuery('');
      setStatusFilter('all');
      setCurrentPage(1);
    }
  }), [onEdit, selectedItems.length, setSearchQuery, setStatusFilter, openDelete, openBulkDelete]);

  // ✅ Delete confirmation handler with proper refresh
  const handleDeleteConfirm = useCallback(async () => {
    const { purchase } = dialogState.deleteConfirmation;
    if (!purchase || !onDelete) return;

    setDeleteLoading(true);

    try {
      await onDelete(purchase.id);
      toast.success('Pembelian berhasil dihapus');
      
      // ✅ Force refresh data - remove from local state immediately
      // This should trigger parent component to refresh data
      
      // Close dialog
      resetDelete();

      // ✅ Reset current page if needed
      const remainingItems = filteredPurchases.length - 1;
      const maxPage = Math.ceil(remainingItems / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }

    } catch (error) {
      logger.error('Delete failed:', error);
      toast.error('Gagal menghapus pembelian: ' + (error.message || 'Unknown error'));
      
      setDeleteLoading(false);
    }
  }, [dialogState.deleteConfirmation, onDelete, filteredPurchases.length, itemsPerPage, currentPage, setDeleteLoading, resetDelete]);

  // ✅ Bulk delete confirmation handler with proper refresh
  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedItems.length === 0) return;

    setBulkDeleteLoading(true);

    try {
      if (onBulkDelete) {
        await onBulkDelete(selectedItems);
      } else if (onDelete) {
        await Promise.all(selectedItems.map((purchaseId) => onDelete(purchaseId)));
      }

      toast.success(`${selectedItems.length} pembelian berhasil dihapus`);
      setSelectedItems([]);
      
      // ✅ Reset to first page after bulk delete
      setCurrentPage(1);
      
      // Close dialog
      resetBulkDelete();

    } catch (error) {
      logger.error('Bulk delete failed:', error);
      toast.error('Gagal menghapus pembelian: ' + (error.message || 'Unknown error'));
      
      setBulkDeleteLoading(false);
    }
  }, [selectedItems, onBulkDelete, onDelete, setSelectedItems, setBulkDeleteLoading, resetBulkDelete, setCurrentPage]);

  // ✅ Status change handler
  const handleStatusChange = useCallback(async (purchaseId: string, newStatus: PurchaseStatus) => {
    const purchase = filteredPurchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    if (purchase.status === newStatus) {
      setEditingStatusId(null);
      return;
    }

    try {
      let validation = { canChange: true, warnings: [], errors: [] };
      if (validateStatusChange) {
        validation = await validateStatusChange(purchaseId, newStatus);
      }

      if (validation.canChange && validation.warnings.length === 0) {
        if (onStatusChange) {
          await onStatusChange(purchaseId, newStatus);
        }
        setEditingStatusId(null);
      } else {
        openStatus(purchase, newStatus, validation);
      }
    } catch (error) {
      logger.error('Status change validation failed:', error);
      setEditingStatusId(null);
    }
  }, [filteredPurchases, validateStatusChange, onStatusChange, openStatus]);

  // ✅ Dialog handlers
  const dialogHandlers = useMemo(() => ({
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

    cancelDelete: () => {
      resetDelete();
    },

    cancelBulkDelete: () => {
      resetBulkDelete();
    }
  }), [dialogState.statusConfirmation, onStatusChange, resetStatus, resetDelete, resetBulkDelete]);

  // ✅ Sort icon renderer
  const renderSortIcon = useCallback((field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  // ✅ Action buttons component - ENHANCED with only Edit and Delete
  const ActionButtons = React.memo<{ purchase: Purchase }>(({ purchase }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`Actions for purchase ${purchase.id}`}
            type="button"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-[140px] z-[9999] bg-white border border-gray-200 shadow-lg rounded-md"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          {/* ✅ Edit Menu Item */}
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              actionHandlers.edit(purchase);
            }}
            disabled={purchase.status === 'completed'}
            className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          
          {/* ✅ Delete Menu Item - Always Enabled */}
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              actionHandlers.delete(purchase);
            }}
            className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 px-3 py-2 text-sm"
            role="menuitem"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  });

  // ✅ Early return for empty state
  if (!paginationData.hasData && !searchQuery && statusFilter === 'all') {
    return (
      <EmptyState 
        onAddPurchase={() => {/* Will be handled by parent */}}
        hasSuppliers={true}
        hasBahanBaku={true}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari supplier, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value: PurchaseStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results info */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="mt-3 text-sm text-gray-600">
            Menampilkan {filteredPurchases.length} hasil
            {searchQuery && ` untuk "${searchQuery}"`}
            {statusFilter !== 'all' && ` dengan status "${getStatusDisplayText(statusFilter)}"`}
          </div>
        )}

        {/* ✅ ENHANCED: Bulk Actions with Delete */}
        {selectedItems.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item dipilih
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedItems([])}>
                  Batal Pilih
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={actionHandlers.bulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Terpilih
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ✅ Table */}
      <Card>
        {!paginationData.hasData ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil</h3>
              <p className="text-gray-500 mb-4">
                Tidak ditemukan pembelian yang sesuai dengan kriteria pencarian.
              </p>
              <Button variant="outline" onClick={actionHandlers.resetFilters}>
                Reset Filter
              </Button>
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
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('tanggal')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      type="button"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Tanggal
                      {renderSortIcon('tanggal')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('supplier')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      type="button"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Supplier
                      {renderSortIcon('supplier')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items
                    </div>
                  </TableHead>

                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('totalNilai')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      type="button"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Total Nilai
                      {renderSortIcon('totalNilai')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      type="button"
                    >
                      Status
                      {renderSortIcon('status')}
                    </Button>
                  </TableHead>

                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationData.currentPurchases.map((purchase) => (
                  <TableRow 
                    key={purchase.id} 
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(purchase.id)}
                        onCheckedChange={() => toggleSelectItem(purchase.id)}
                        aria-label={`Select purchase ${purchase.id}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(purchase.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(purchase.createdAt || purchase.tanggal).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {getSupplierName(purchase.supplier)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {purchase.metodePerhitungan}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium text-base text-gray-900">
                          {purchase.items && purchase.items.length === 1 ? (
                            purchase.items[0].nama
                          ) : purchase.items && purchase.items.length > 0 ? (
                            `${purchase.items[0].nama}${purchase.items.length > 1 ? ` +${purchase.items.length - 1} lainnya` : ''}`
                          ) : (
                            'Tidak ada item'
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-1">
                          {getFormattedTotalQuantities(purchase)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(purchase.totalNilai)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusDropdown
                        purchase={purchase}
                        isEditing={editingStatusId === purchase.id}
                        onStartEdit={() => setEditingStatusId(purchase.id)}
                        onChange={handleStatusChange}
                      />
                    </TableCell>

                    <TableCell>
                      <ActionButtons purchase={purchase} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {paginationData.showPagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-700">
                  Menampilkan {paginationData.startIndex + 1} - {Math.min(paginationData.endIndex, filteredPurchases.length)} dari {filteredPurchases.length} data
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    type="button"
                  >
                    Sebelumnya
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                          type="button"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {paginationData.totalPages > 5 && currentPage < paginationData.totalPages - 2 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(paginationData.totalPages)}
                          className="w-8 h-8 p-0"
                          type="button"
                        >
                          {paginationData.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                    disabled={currentPage === paginationData.totalPages}
                    type="button"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ✅ Status Change Confirmation Dialog */}
      <StatusChangeConfirmationDialog
        isOpen={dialogState.statusConfirmation.isOpen}
        purchase={dialogState.statusConfirmation.purchase}
        newStatus={dialogState.statusConfirmation.newStatus!}
        validation={dialogState.statusConfirmation.validation}
        isUpdating={false}
        onConfirm={dialogHandlers.confirmStatusChange}
        onCancel={dialogHandlers.cancelStatusChange}
      />

      {/* ✅ NEW: Delete Confirmation Dialog */}
      <AlertDialog 
        open={dialogState.deleteConfirmation.isOpen} 
        onOpenChange={dialogHandlers.cancelDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Konfirmasi Hapus Pembelian
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Apakah Anda yakin ingin menghapus pembelian ini?</p>
              {dialogState.deleteConfirmation.purchase && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="font-medium">
                    {getSupplierName(dialogState.deleteConfirmation.purchase.supplier)}
                  </div>
                  <div className="text-gray-600">
                    {new Date(dialogState.deleteConfirmation.purchase.tanggal).toLocaleDateString('id-ID')} • {' '}
                    {formatCurrency(dialogState.deleteConfirmation.purchase.totalNilai)} • {' '}
                    Status: <span className="font-medium">{getStatusDisplayText(dialogState.deleteConfirmation.purchase.status)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dialogState.deleteConfirmation.purchase.items?.length || 0} item
                  </div>
                </div>
              )}
              {dialogState.deleteConfirmation.purchase?.status === 'completed' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Perhatian</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Pembelian ini sudah selesai. Menghapus akan mempengaruhi laporan dan data stok yang sudah tercatat.
                  </p>
                </div>
              )}
              <p className="text-red-600 text-sm font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={dialogState.deleteConfirmation.isDeleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={dialogState.deleteConfirmation.isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {dialogState.deleteConfirmation.isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Pembelian
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ NEW: Bulk Delete Confirmation Dialog */}
      <AlertDialog 
        open={dialogState.bulkDeleteConfirmation.isOpen} 
        onOpenChange={dialogHandlers.cancelBulkDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Konfirmasi Hapus Massal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus <strong>{dialogState.bulkDeleteConfirmation.selectedCount}</strong> pembelian sekaligus?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Peringatan</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Semua data pembelian yang dipilih akan dihapus permanen. Jika ada pembelian dengan status "Selesai", 
                  hal ini dapat mempengaruhi laporan dan data stok yang sudah tercatat.
                </p>
              </div>
              <p className="text-red-600 text-sm font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={dialogState.bulkDeleteConfirmation.isDeleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={dialogState.bulkDeleteConfirmation.isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {dialogState.bulkDeleteConfirmation.isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus {dialogState.bulkDeleteConfirmation.selectedCount} Pembelian
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseTable;