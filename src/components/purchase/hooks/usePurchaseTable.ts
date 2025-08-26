// src/components/purchase/hooks/usePurchaseTable.ts

import { useState, useCallback, useMemo } from 'react';
import { Purchase, PurchaseStatus } from '../types/purchase.types';
import { 
  searchPurchases, 
  filterPurchasesByStatus, 
  sortPurchases 
} from '../utils/purchaseHelpers';
import { usePurchase } from './usePurchase';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UsePurchaseTableProps {
  purchases: Purchase[];
  suppliers?: Array<{ id: string; nama: string }>;
}

interface UsePurchaseTableReturn {
  // Filtered and processed data
  filteredPurchases: Purchase[];
  suppliers: Array<{ id: string; nama: string }>;
  
  // Selection state
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  toggleSelectItem: (id: string) => void;
  
  // Filter and search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PurchaseStatus | 'all';
  setStatusFilter: (status: PurchaseStatus | 'all') => void;
  
  // Sorting state
  sortField: 'tanggal' | 'totalNilai' | 'supplier' | 'status';
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'tanggal' | 'totalNilai' | 'supplier' | 'status') => void;
  
  // Bulk operations
  bulkDelete: () => Promise<void>;
  bulkUpdateStatus: (status: PurchaseStatus) => Promise<void>;
  bulkUpdatePurchases: (ids: string[], data: Partial<Purchase>) => Promise<void>;
  bulkArchive: () => Promise<void>;
  isBulkDeleting: boolean;
  isBulkArchiving: boolean;
  
  // Modal state
  showBulkDeleteDialog: boolean;
  setShowBulkDeleteDialog: (show: boolean) => void;
  
  // Helper functions
  getSupplierName: (supplierId: string) => string;
}

export const usePurchaseTable = ({
  purchases,
  suppliers = []
}: UsePurchaseTableProps): UsePurchaseTableReturn => {
  // Get delete function from purchase context
  const { deletePurchase, updatePurchase } = usePurchase();

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<'tanggal' | 'totalNilai' | 'supplier' | 'status'>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Bulk operations state
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Filtered and sorted purchases
  const filteredPurchases = useMemo(() => {
    let result = purchases;
    
    // Apply search filter
    if (searchQuery.trim()) {
      result = searchPurchases(result, searchQuery);
    }
    
    // Apply status filter
    result = filterPurchasesByStatus(result, statusFilter);
    
    // Apply sorting
    result = sortPurchases(result, sortField, sortOrder);
    
    return result;
  }, [purchases, searchQuery, statusFilter, sortField, sortOrder]);

  // Selection helpers
  const isAllSelected = useMemo(() => {
    return filteredPurchases.length > 0 && selectedItems.length === filteredPurchases.length;
  }, [filteredPurchases.length, selectedItems.length]);

  const selectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPurchases.map(p => p.id));
    }
  }, [isAllSelected, filteredPurchases]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(current => {
      if (current.includes(id)) {
        return current.filter(item => item !== id);
      } else {
        return [...current, id];
      }
    });
  }, []);

  // Sorting handler
  const handleSort = useCallback((field: typeof sortField) => {
    if (field === sortField) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);

  // Bulk operations
  const bulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang akan dihapus');
      return;
    }

    setIsBulkDeleting(true);
    
    try {
      const deletePromises = selectedItems.map(id => deletePurchase(id));
      const results = await Promise.allSettled(deletePromises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast.success(`${successful} pembelian berhasil dihapus`);
        setSelectedItems([]);
        setShowBulkDeleteDialog(false);
      }
      
      if (failed > 0) {
        toast.error(`${failed} pembelian gagal dihapus`);
      }
    } catch (error) {
      logger.error('Bulk delete error:', error);
      toast.error('Terjadi kesalahan saat menghapus pembelian');
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedItems, deletePurchase]);

  const bulkUpdateStatus = useCallback(async (newStatus: PurchaseStatus) => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang akan diubah statusnya');
      return;
    }

    try {
      const updatePromises = selectedItems.map(id => 
        updatePurchase(id, { status: newStatus })
      );
      
      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`${successful} pembelian berhasil diubah statusnya`);
        setSelectedItems([]);
      }
      
      if (failed > 0) {
        toast.error(`${failed} pembelian gagal diubah statusnya`);
      }
    } catch (error) {
      logger.error('Bulk status update error:', error);
      toast.error('Terjadi kesalahan saat mengubah status');
    }
  }, [selectedItems, updatePurchase]);

  const bulkUpdatePurchases = useCallback(async (ids: string[], data: Partial<Purchase>) => {
    if (ids.length === 0) {
      toast.warning('Pilih item yang akan diubah');
      return;
    }

    try {
      const updatePromises = ids.map(id => 
        updatePurchase(id, data)
      );
      
      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`${successful} pembelian berhasil diubah`);
        setSelectedItems([]);
      }
      
      if (failed > 0) {
        toast.error(`${failed} pembelian gagal diubah`);
      }
    } catch (error) {
      logger.error('Bulk update error:', error);
      toast.error('Terjadi kesalahan saat mengubah pembelian');
    }
  }, [updatePurchase]);

  const bulkArchive = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang akan diarsipkan');
      return;
    }

    setIsBulkArchiving(true);

    try {
      const archivePromises = selectedItems.map(id =>
        updatePurchase(id, { isArchived: true })
      );

      const results = await Promise.allSettled(archivePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`${successful} pembelian berhasil diarsipkan`);
        setSelectedItems([]);
      }

      if (failed > 0) {
        toast.error(`${failed} pembelian gagal diarsipkan`);
      }
    } catch (error) {
      logger.error('Bulk archive error:', error);
      toast.error('Terjadi kesalahan saat mengarsipkan pembelian');
    } finally {
      setIsBulkArchiving(false);
    }
  }, [selectedItems, updatePurchase]);

  // Helper function to get supplier name
  const getSupplierName = useCallback((supplierId: string): string => {
    const supplier = suppliers.find(
      s => s.id === supplierId || s.nama === supplierId
    );
    return supplier?.nama || supplierId;
  }, [suppliers]);

  return {
    // Filtered data
    filteredPurchases,
    suppliers,
    
    // Selection state
    selectedItems,
    setSelectedItems,
    selectAll,
    clearSelection,
    isAllSelected,
    toggleSelectItem,
    
    // Filter and search state
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    
    // Sorting state
    sortField,
    sortOrder,
    handleSort,
    
    // Bulk operations
    bulkDelete,
    bulkUpdateStatus,
    bulkUpdatePurchases,
    bulkArchive,
    isBulkDeleting,
    isBulkArchiving,
    
    // Modal state
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    
    // Helper functions
    getSupplierName,
  };
};