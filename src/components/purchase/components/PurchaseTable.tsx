// src/components/purchase/components/PurchaseTable.tsx - Optimized Dependencies & Performance

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Calendar,
  User,
  Receipt,
  ChevronDown
} from 'lucide-react';

// ✅ CONSOLIDATED: Type imports
import { PurchaseTablePropsExtended, PurchaseStatus } from '../types/purchase.types';
import { usePurchaseTable } from '../context/PurchaseTableContext';

// ✅ CONSOLIDATED: Utility imports
import { formatCurrency } from '@/utils/formatUtils';
import { 
  getStatusColor, 
  getStatusDisplayText, 
  getFormattedTotalQuantities 
} from '../utils/purchaseHelpers';

// ✅ COMPONENTS: Direct imports
import EmptyState from './EmptyState';
import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';
import { logger } from '@/utils/logger';

// ✅ CONSTANTS: Moved to top level for better performance
const STATUS_OPTIONS: { value: PurchaseStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200' },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' }
];

// ✅ INTERFACES: Consolidated dialog state
interface DialogState {
  confirmation: {
    isOpen: boolean;
    purchase: any | null;
    newStatus: PurchaseStatus | null;
    validation: any | null;
  };
}

const initialDialogState: DialogState = {
  confirmation: {
    isOpen: false,
    purchase: null,
    newStatus: null,
    validation: null
  }
};

const PurchaseTable: React.FC<PurchaseTablePropsExtended> = ({ 
  onEdit, 
  onStatusChange,
  onDelete,
  onViewDetails,
  validateStatusChange
}) => {
  // ✅ CONTEXT: Purchase table operations
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

  // ✅ STATE: Consolidated local state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>(initialDialogState);

  // ✅ MEMOIZED: Pagination calculations
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

  // ✅ MEMOIZED: Action handlers
  const actionHandlers = useMemo(() => ({
    edit: (purchase: any) => {
      console.log('Edit clicked for:', purchase.id);
      onEdit(purchase);
    },

    delete: (purchaseId: string) => {
      console.log('Delete clicked for:', purchaseId);
      if (confirm('Yakin ingin menghapus pembelian ini?')) {
        if (onDelete) {
          onDelete(purchaseId);
        } else {
          // Fallback: use bulk delete with single item
          setSelectedItems([purchaseId]);
        }
      }
    },

    viewDetails: (purchase: any) => {
      console.log('View details clicked for:', purchase.id);
      if (onViewDetails) {
        onViewDetails(purchase);
      } else {
        console.log('View details:', purchase);
      }
    },

    resetFilters: () => {
      setSearchQuery('');
      setStatusFilter('all');
      setCurrentPage(1);
    }
  }), [onEdit, onDelete, onViewDetails, setSelectedItems, setSearchQuery, setStatusFilter]);

  // ✅ OPTIMIZED: Status change handler with validation
  const handleStatusChange = useCallback(async (purchaseId: string, newStatus: PurchaseStatus) => {
    const purchase = filteredPurchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    // Early return if status is the same
    if (purchase.status === newStatus) {
      setEditingStatusId(null);
      return;
    }

    try {
      // Validate status change if validation function is provided
      let validation = { canChange: true, warnings: [], errors: [] };
      if (validateStatusChange) {
        validation = await validateStatusChange(purchaseId, newStatus);
      }

      // Direct update if validation passes and no warnings
      if (validation.canChange && validation.warnings.length === 0) {
        if (onStatusChange) {
          await onStatusChange(purchaseId, newStatus);
        }
        setEditingStatusId(null);
      } else {
        // Show confirmation dialog with warnings/errors
        setDialogState({
          confirmation: {
            isOpen: true,
            purchase,
            newStatus,
            validation
          }
        });
      }
    } catch (error) {
      console.error('Status change validation failed:', error);
      setEditingStatusId(null);
    }
  }, [filteredPurchases, validateStatusChange, onStatusChange]);

  // ✅ OPTIMIZED: Dialog handlers
  const dialogHandlers = useMemo(() => ({
    confirmStatusChange: async () => {
      const { purchase, newStatus } = dialogState.confirmation;
      if (!purchase || !newStatus || !onStatusChange) return;

      try {
        await onStatusChange(purchase.id, newStatus);
        setDialogState({ confirmation: initialDialogState.confirmation });
        setEditingStatusId(null);
      } catch (error) {
        console.error('Status change failed:', error);
      }
    },

    cancelStatusChange: () => {
      setDialogState({ confirmation: initialDialogState.confirmation });
      setEditingStatusId(null);
    }
  }), [dialogState.confirmation, onStatusChange]);

  // ✅ OPTIMIZED: Sort icon renderer
  const renderSortIcon = useCallback((field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  // ✅ COMPONENT: Status dropdown - memoized for performance
  const StatusDropdown = React.memo<{ 
    purchase: any; 
    isEditing: boolean; 
    onStartEdit: () => void;
    onCancelEdit: () => void;
  }>(({ purchase, isEditing, onStartEdit, onCancelEdit }) => {
    if (!isEditing) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartEdit}
          className="h-auto p-1 justify-start hover:bg-gray-50"
        >
          <Badge 
            variant="outline" 
            className={`${getStatusColor(purchase.status)} cursor-pointer hover:opacity-80`}
          >
            {getStatusDisplayText(purchase.status)}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Badge>
        </Button>
      );
    }

    return (
      <Select
        value={purchase.status}
        onValueChange={(value: PurchaseStatus) => handleStatusChange(purchase.id, value)}
        onOpenChange={(open) => {
          if (!open) {
          logger.debug('Edit clicked for purchase:', purchase.id);
          }
        }}
        defaultOpen={true}
      >
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
    );
  });

  // ✅ COMPONENT: Action buttons - memoized for performance
  const ActionButtons = React.memo<{ purchase: any }>(({ purchase }) => {
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
          className="w-[160px] z-[9999] bg-white border border-gray-200 shadow-lg rounded-md"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              actionHandlers.viewDetails(purchase);
            }}
            className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm"
            role="menuitem"
          >
            <Eye className="h-4 w-4 mr-2" />
            Lihat Detail
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (purchase.status !== 'completed') {
                actionHandlers.edit(purchase);
              }
            }}
            disabled={purchase.status === 'completed'}
            className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (purchase.status !== 'completed') {
                actionHandlers.delete(purchase.id);
              }
            }}
            disabled={purchase.status === 'completed'}
            className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  });

  // ✅ EARLY RETURN: Empty state for no data at all
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
      {/* ✅ OPTIMIZED: Filters and Search */}
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
            {/* Status Filter */}
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

            {/* Items per page */}
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

        {/* ✅ OPTIMIZED: Bulk Actions */}
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
                <Button size="sm" variant="destructive">
                  Hapus Terpilih
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ✅ OPTIMIZED: Table */}
      <Card>
        {!paginationData.hasData ? (
          // No results state
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
                  {/* Select All Checkbox */}
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={selectAll}
                      aria-label="Select all purchases"
                    />
                  </TableHead>

                  {/* ✅ OPTIMIZED: Sortable columns */}
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
                    onClick={(e) => {
                      // Prevent row click when clicking action buttons
                      if (e.target.closest('button, [role="menuitem"]')) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {/* Select Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(purchase.id)}
                        onCheckedChange={() => toggleSelectItem(purchase.id)}
                        aria-label={`Select purchase ${purchase.id}`}
                      />
                    </TableCell>

                    {/* Date */}
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

                    {/* Supplier */}
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

                    {/* ✅ OPTIMIZED: Items Summary */}
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

                    {/* Total Value */}
                    <TableCell className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(purchase.totalNilai)}
                      </div>
                    </TableCell>

                    {/* Status with Dropdown */}
                    <TableCell>
                      <StatusDropdown
                        purchase={purchase}
                        isEditing={editingStatusId === purchase.id}
                        onStartEdit={() => setEditingStatusId(purchase.id)}
                        onCancelEdit={() => setEditingStatusId(null)}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <ActionButtons purchase={purchase} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* ✅ OPTIMIZED: Pagination */}
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

      {/* ✅ OPTIMIZED: Status Change Confirmation Dialog */}
      <StatusChangeConfirmationDialog
        isOpen={dialogState.confirmation.isOpen}
        purchase={dialogState.confirmation.purchase}
        newStatus={dialogState.confirmation.newStatus!}
        validation={dialogState.confirmation.validation}
        isUpdating={false}
        onConfirm={dialogHandlers.confirmStatusChange}
        onCancel={dialogHandlers.cancelStatusChange}
      />
    </div>
  );
};

export default PurchaseTable;