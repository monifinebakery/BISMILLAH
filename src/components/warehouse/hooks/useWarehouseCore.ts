// src/components/warehouse/hooks/useWarehouseCore.ts
// ✅ FIXED: Complete useWarehouseCore with proper edit save handling and logging
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useSupplier } from '@/contexts/SupplierContext';
// Gunakan kategori yang sama dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';

// Types - Updated to use BahanBakuFrontend consistently
import type { BahanBakuFrontend, FilterState, SortConfig } from '../types';

interface WarehouseContextType {
  bahanBaku: BahanBakuFrontend[];
  loading: boolean;
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku?: (ids: string[]) => Promise<boolean>;
  refetch?: () => Promise<void>; // ✅ Added for data refresh
}

/**
 * ✅ FIXED: Core Warehouse Logic Hook
 * 
 * Combines all essential warehouse functionality:
 * - Selection management
 * - Filtering and sorting
 * - Pagination
 * - Dialog management
 * - Event handlers with proper logging
 * - Bulk operations (built-in, not lazy loaded to avoid hook violations)
 * 
 * FIXES:
 * - Enhanced handleEditSave with proper error handling
 * - Added comprehensive logging throughout
 * - Better state management for editingItem
 * - Improved return values for better debugging
 * 
 * Updated to use BahanBakuFrontend consistently
 * Total Size: ~10KB (comprehensive with logging)
 */
export const useWarehouseCore = (context: WarehouseContextType) => {
  const hookId = useRef(`useWarehouseCore-${Date.now()}`);

  // ✅ ENHANCED: Log hook initialization
  useEffect(() => {
    logger.info(`[${hookId.current}] 🚀 useWarehouseCore initialized`);
    logger.debug(`[${hookId.current}] Context provided:`, {
      bahanBakuCount: context.bahanBaku?.length || 0,
      loading: context.loading,
      hasUpdateFunction: !!context.updateBahanBaku,
      hasDeleteFunction: !!context.deleteBahanBaku,
      hasBulkDeleteFunction: !!context.bulkDeleteBahanBaku,
      hasRefetchFunction: !!context.refetch
    });
  }, []);

  // === SELECTION STATE ===
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // === FILTER STATE ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    supplier: '',
    stockLevel: 'all',
    expiry: 'all',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'nama', 
    direction: 'asc'
  });

  // === PAGINATION STATE ===
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // === DIALOG STATE ===
  const [dialogStates, setDialogStates] = useState<Record<string, boolean>>({
    addItem: false,
    editItem: false,
    bulkEdit: false,
    bulkDelete: false,
    import: false,
    export: false,
  });
  const [editingItem, setEditingItem] = useState<BahanBakuFrontend | null>(null);
  const { getSupplierById } = useSupplier();
  const resolveSupplierName = useCallback((supplierId?: string) => {
    if (!supplierId) return '';
    const supplier = getSupplierById(supplierId);
    return supplier?.nama || supplierId;
  }, [getSupplierById]);

  // ✅ ENHANCED: Log editing item changes
  useEffect(() => {
    if (editingItem) {
      logger.debug(`[${hookId.current}] 📝 Editing item set:`, {
        id: editingItem.id,
        nama: editingItem.nama
      });
    } else {
      logger.debug(`[${hookId.current}] 📝 Editing item cleared`);
    }
  }, [editingItem]);

  // === BULK OPERATIONS STATE ===
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // === COMPUTED VALUES ===
  
  // Available filter options
  const availableCategories = useMemo(() => {
    logger.debug(`[${hookId.current}] 📊 Using FNB categories`);
    return [...FNB_COGS_CATEGORIES];
  }, []);

  const availableSuppliers = useMemo(() => {
    const suppliers = new Set(
      context.bahanBaku.map(item => resolveSupplierName(item.supplier)).filter(Boolean)
    );
    const result = Array.from(suppliers);
    logger.debug(`[${hookId.current}] 📊 Available suppliers:`, result);
    return result;
  }, [context.bahanBaku, resolveSupplierName]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let items = [...context.bahanBaku];
    const initialCount = items.length;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.nama.toLowerCase().includes(term) ||
        item.kategori?.toLowerCase().includes(term) ||
        resolveSupplierName(item.supplier).toLowerCase().includes(term)
      );
      logger.debug(`[${hookId.current}] 🔍 Search "${searchTerm}" filtered: ${initialCount} -> ${items.length}`);
    }

    // Category filter
    if (filters.category) {
      const beforeCount = items.length;
      items = items.filter(item => item.kategori === filters.category);
      logger.debug(`[${hookId.current}] 📂 Category "${filters.category}" filtered: ${beforeCount} -> ${items.length}`);
    }

    // Supplier filter
    if (filters.supplier) {
      const beforeCount = items.length;
      items = items.filter(item => resolveSupplierName(item.supplier) === filters.supplier);
      logger.debug(`[${hookId.current}] 🏢 Supplier "${filters.supplier}" filtered: ${beforeCount} -> ${items.length}`);
    }

    // Stock level filter - Fixed with proper number conversion
    if (filters.stockLevel === 'low') {
      const beforeCount = items.length;
      items = items.filter(item => Number(item.stok) <= Number(item.minimum));
      logger.debug(`[${hookId.current}] 📉 Low stock filtered: ${beforeCount} -> ${items.length}`);
    } else if (filters.stockLevel === 'out') {
      const beforeCount = items.length;
      items = items.filter(item => Number(item.stok) === 0);
      logger.debug(`[${hookId.current}] 🚫 Out of stock filtered: ${beforeCount} -> ${items.length}`);
    }

    // Expiry filter
    if (filters.expiry === 'expiring') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 30);
      const beforeCount = items.length;
      items = items.filter(item => {
        if (!item.expiry) return false;
        const expiryDate = new Date(item.expiry);
        return expiryDate <= threshold && expiryDate > new Date();
      });
      logger.debug(`[${hookId.current}] ⏰ Expiring items filtered: ${beforeCount} -> ${items.length}`);
    } else if (filters.expiry === 'expired') {
      const beforeCount = items.length;
      items = items.filter(item => {
        if (!item.expiry) return false;
        return new Date(item.expiry) < new Date();
      });
      logger.debug(`[${hookId.current}] ❌ Expired items filtered: ${beforeCount} -> ${items.length}`);
    }

    // Sort items - Updated for BahanBakuFrontend
    items.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Convert to numbers for numeric fields
      if (sortConfig.key === 'stok' || sortConfig.key === 'minimum' || sortConfig.key === 'harga') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      
      if ((aValue ?? '') < (bValue ?? '')) return sortConfig.direction === 'asc' ? -1 : 1;
      if ((aValue ?? '') > (bValue ?? '')) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    logger.debug(`[${hookId.current}] 📊 Final filtered items: ${items.length}, sorted by ${sortConfig.key} ${sortConfig.direction}`);
    return items;
  }, [context.bahanBaku, searchTerm, filters, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.supplier) count++;  
    if (filters.stockLevel !== 'all') count++;
    if (filters.expiry !== 'all') count++;
    if (searchTerm) count++;
    logger.debug(`[${hookId.current}] 🎛️ Active filters count: ${count}`);
    return count;
  }, [filters, searchTerm]);

  // === SELECTION FUNCTIONS ===
  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      logger.debug(`[${hookId.current}] ✅ Selection toggled for ${id}: ${prev.length} -> ${newSelection.length} items`);
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    logger.debug(`[${hookId.current}] 🧹 Clearing selection: ${selectedItems.length} items`);
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, [selectedItems.length]);

  const selectPage = useCallback(() => {
    const pageIds = currentItems.map(item => item.id);
    setSelectedItems(prev => {
      const newSelected = new Set([...prev, ...pageIds]);
      const result = Array.from(newSelected);
      logger.debug(`[${hookId.current}] 📄 Page selected: ${prev.length} -> ${result.length} items`);
      return result;
    });
  }, [currentItems]);

  const isSelected = useCallback((id: string) => selectedItems.includes(id), [selectedItems]);

  const isPageSelected = useMemo(() => {
    const result = currentItems.length > 0 && currentItems.every(item => selectedItems.includes(item.id));
    return result;
  }, [currentItems, selectedItems]);

  const isPagePartiallySelected = useMemo(() => {
    const result = currentItems.some(item => selectedItems.includes(item.id)) && !isPageSelected;
    return result;
  }, [currentItems, selectedItems, isPageSelected]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      const newMode = !prev;
      logger.debug(`[${hookId.current}] 🔄 Selection mode toggled: ${prev} -> ${newMode}`);
      
      if (prev) { // If turning off selection mode
        clearSelection();
      }
      return newMode;
    });
  }, [clearSelection]);

  // === DIALOG FUNCTIONS ===
  const openDialog = useCallback((dialog: string) => {
    logger.info(`[${hookId.current}] 📱 Opening dialog: ${dialog}`);
    setDialogStates(prev => ({ ...prev, [dialog]: true }));
  }, []);

  const closeDialog = useCallback((dialog: string) => {
    logger.info(`[${hookId.current}] 📱 Closing dialog: ${dialog}`);
    setDialogStates(prev => ({ ...prev, [dialog]: false }));
    
    // Clear editing item when closing edit dialog
    if (dialog === 'editItem') {
      logger.debug(`[${hookId.current}] 🧹 Clearing editing item on dialog close`);
      setEditingItem(null);
    }
  }, []);

  // === EVENT HANDLERS ===
  const handleEdit = useCallback((item: BahanBakuFrontend) => {
    logger.info(`[${hookId.current}] ✏️ Edit triggered for: "${item.nama}" (ID: ${item.id})`);
    
    setEditingItem(item);
    openDialog('editItem');
  }, [openDialog]);

  // ✅ FIXED: Enhanced handleEditSave with comprehensive logging and error handling
  const handleEditSave = useCallback(async (updates: Partial<BahanBakuFrontend>) => {
    logger.info(`[${hookId.current}] 💾 handleEditSave called`);
    logger.debug(`[${hookId.current}] 📝 Updates received:`, updates);
    logger.debug(`[${hookId.current}] 📝 Current editing item:`, editingItem);
    
    if (!editingItem) {
      logger.error(`[${hookId.current}] ❌ No editing item available for save operation`);
      toast.error('Tidak ada item yang sedang diedit');
      return false;
    }
    
    if (!context.updateBahanBaku) {
      logger.error(`[${hookId.current}] ❌ updateBahanBaku function not available in context`);
      toast.error('Fungsi update tidak tersedia');
      return false;
    }

    try {
      logger.debug(`[${hookId.current}] 🔄 Calling context.updateBahanBaku with:`, {
        id: editingItem.id,
        updates: updates
      });
      
      // ✅ CRITICAL: Call the update function
      const success = await context.updateBahanBaku(editingItem.id, updates);
      
      logger.debug(`[${hookId.current}] 📊 Update result:`, success);
      
      if (success) {
        logger.info(`[${hookId.current}] ✅ Item "${editingItem.nama}" berhasil diperbarui`);
        toast.success('Item berhasil diperbarui!');
        
        // ✅ ENHANCED: Refresh data if available
        if (context.refetch) {
          logger.debug(`[${hookId.current}] 🔄 Refreshing data after successful update`);
          try {
            await context.refetch();
            logger.debug(`[${hookId.current}] ✅ Data refresh completed`);
          } catch (refreshError) {
            logger.warn(`[${hookId.current}] ⚠️ Data refresh failed:`, refreshError);
          }
        }
        
        // ✅ Close dialog and clear editing item
        closeDialog('editItem');
        setEditingItem(null);
        
        return true;
      } else {
        logger.error(`[${hookId.current}] ❌ Update returned false - operation failed`);
        toast.error('Gagal memperbarui item');
        return false;
      }
    } catch (error) {
      logger.error(`[${hookId.current}] ❌ Exception during edit save:`, error);
      toast.error(`Gagal memperbarui item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [editingItem, context.updateBahanBaku, context.refetch, closeDialog]);

  const handleDelete = useCallback(async (id: string, nama: string) => {
    logger.info(`[${hookId.current}] 🗑️ Delete triggered for: "${nama}" (ID: ${id})`);
    
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
      logger.debug(`[${hookId.current}] ✅ Delete confirmed by user`);
      
      try {
        const success = await context.deleteBahanBaku(id);
        
        if (success) {
          logger.info(`[${hookId.current}] ✅ Item "${nama}" berhasil dihapus`);
          toast.success(`"${nama}" berhasil dihapus.`);
          
          // Refresh data if available
          if (context.refetch) {
            logger.debug(`[${hookId.current}] 🔄 Refreshing data after delete`);
            await context.refetch();
          }
        } else {
          logger.error(`[${hookId.current}] ❌ Delete returned false`);
          toast.error('Gagal menghapus item');
        }
      } catch (error) {
        logger.error(`[${hookId.current}] ❌ Exception during delete:`, error);
        toast.error(`Gagal menghapus item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      logger.debug(`[${hookId.current}] ❌ Delete cancelled by user`);
    }
  }, [context.deleteBahanBaku, context.refetch]);

  const handleSort = useCallback((key: keyof BahanBakuFrontend) => {
    logger.debug(`[${hookId.current}] 🔄 Sort triggered for column: ${String(key)}`);
    
    setSortConfig(prev => {
      const newDirection = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      logger.debug(`[${hookId.current}] 📊 Sort config: ${String(key)} ${newDirection}`);
      
      return {
        key,
        direction: newDirection
      };
    });
  }, []);

  // === BULK OPERATIONS (Built-in to avoid hook violations) ===
  const handleBulkEdit = useCallback(async (updates: Partial<BahanBakuFrontend>) => {
    if (selectedItems.length === 0) {
      logger.warn(`[${hookId.current}] ⚠️ Bulk edit called with no selected items`);
      return false;
    }
    
    setIsBulkProcessing(true);
    logger.info(`[${hookId.current}] 🔄 Starting bulk edit for ${selectedItems.length} items`);
    logger.debug(`[${hookId.current}] 📝 Bulk updates:`, updates);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Process items one by one for now (can be optimized with actual bulk API)
      for (const id of selectedItems) {
        try {
          logger.debug(`[${hookId.current}] 🔄 Bulk editing item: ${id}`);
          const success = await context.updateBahanBaku(id, updates);
          if (success) {
            successCount++;
          } else {
            errorCount++;
            logger.warn(`[${hookId.current}] ❌ Bulk edit failed for item: ${id}`);
          }
        } catch (error) {
          logger.error(`[${hookId.current}] ❌ Exception during bulk edit for item ${id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        logger.info(`[${hookId.current}] ✅ Bulk edit completed: ${successCount} success`);
        toast.success(`${successCount} item berhasil diperbarui!`);
      }
      
      if (errorCount > 0) {
        logger.warn(`[${hookId.current}] ⚠️ Bulk edit errors: ${errorCount} failed`);
        toast.error(`${errorCount} item gagal diperbarui`);
      }
      
      // Clear selection after successful bulk operation
      if (successCount > 0) {
        clearSelection();
        
        // Refresh data if available
        if (context.refetch) {
          logger.debug(`[${hookId.current}] 🔄 Refreshing data after bulk edit`);
          await context.refetch();
        }
      }
      
      return successCount > 0;
      
    } catch (error) {
      logger.error(`[${hookId.current}] ❌ Bulk edit operation failed:`, error);
      toast.error('Operasi edit massal gagal');
      return false;
    } finally {
      setIsBulkProcessing(false);
    }
  }, [selectedItems, context.updateBahanBaku, context.refetch, clearSelection]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      logger.warn(`[${hookId.current}] ⚠️ Bulk delete called with no selected items`);
      return false;
    }
    
    setIsBulkProcessing(true);
    logger.info(`[${hookId.current}] 🗑️ Starting bulk delete for ${selectedItems.length} items`);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Use bulk delete if available, otherwise fall back to individual deletes
      if (context.bulkDeleteBahanBaku) {
        logger.debug(`[${hookId.current}] 🚀 Using bulk delete API`);
        const success = await context.bulkDeleteBahanBaku(selectedItems);
        if (success) {
          successCount = selectedItems.length;
          logger.info(`[${hookId.current}] ✅ Bulk delete API succeeded for all items`);
        } else {
          errorCount = selectedItems.length;
          logger.error(`[${hookId.current}] ❌ Bulk delete API failed for all items`);
        }
      } else {
        logger.debug(`[${hookId.current}] 🔄 Fallback to individual deletes`);
        // Fallback: Delete items one by one
        for (const id of selectedItems) {
          try {
            const success = await context.deleteBahanBaku(id);
            if (success) {
              successCount++;
            } else {
              errorCount++;
              logger.warn(`[${hookId.current}] ❌ Individual delete failed for item: ${id}`);
            }
          } catch (error) {
            logger.error(`[${hookId.current}] ❌ Exception during individual delete for item ${id}:`, error);
            errorCount++;
          }
        }
      }
      
      if (successCount > 0) {
        logger.info(`[${hookId.current}] ✅ Bulk delete completed: ${successCount} success`);
        toast.success(`${successCount} item berhasil dihapus!`);
      }
      
      if (errorCount > 0) {
        logger.warn(`[${hookId.current}] ⚠️ Bulk delete errors: ${errorCount} failed`);
        toast.error(`${errorCount} item gagal dihapus`);
      }
      
      // Clear selection after successful bulk operation
      if (successCount > 0) {
        clearSelection();
        
        // Refresh data if available
        if (context.refetch) {
          logger.debug(`[${hookId.current}] 🔄 Refreshing data after bulk delete`);
          await context.refetch();
        }
      }
      
      return successCount > 0;
      
    } catch (error) {
      logger.error(`[${hookId.current}] ❌ Bulk delete operation failed:`, error);
      toast.error('Operasi hapus massal gagal');
      return false;
    } finally {
      setIsBulkProcessing(false);
    }
  }, [selectedItems, context.deleteBahanBaku, context.bulkDeleteBahanBaku, context.refetch, clearSelection]);

  // === FILTER FUNCTIONS ===
  const resetFilters = useCallback(() => {
    logger.debug(`[${hookId.current}] 🧹 Resetting all filters`);
    setSearchTerm('');
    setFilters({
      category: '',
      supplier: '',
      stockLevel: 'all',
      expiry: 'all',
    });
    setPage(1);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    if (page !== 1) {
      logger.debug(`[${hookId.current}] 📄 Resetting to page 1 due to filter change`);
      setPage(1);
    }
  }, [filteredItems.length, searchTerm, filters]);

  // ✅ ENHANCED: Log critical state changes
  useEffect(() => {
    logger.debug(`[${hookId.current}] 📊 State summary:`, {
      totalItems: context.bahanBaku?.length || 0,
      filteredItems: filteredItems.length,
      currentPage: page,
      selectedItems: selectedItems.length,
      isSelectionMode,
      editingItem: editingItem?.id || null,
      activeDialogs: Object.entries(dialogStates).filter(([_, isOpen]) => isOpen).map(([name]) => name),
      isBulkProcessing
    });
  }, [context.bahanBaku?.length, filteredItems.length, page, selectedItems.length, isSelectionMode, editingItem?.id, dialogStates, isBulkProcessing]);

  // === RETURN OBJECT ===
  return {
    // Selection
    selection: {
      selectedItems,
      selectedCount: selectedItems.length,
      isSelectionMode,
      toggle: toggleSelection,
      clear: clearSelection,
      selectPage,
      isSelected,
      isPageSelected,
      isPagePartiallySelected,
      toggleSelectionMode,
      clearSelection, // ✅ Added for compatibility
    },

    // Filters
    filters: {
      searchTerm,
      setSearchTerm,
      activeFilters: filters,
      setFilters,
      sortConfig,
      setSortConfig,
      filteredItems,
      availableCategories,
      availableSuppliers,
      activeCount: activeFiltersCount,
      reset: resetFilters,
    },

    // Pagination
    pagination: {
      page,
      setPage,
      itemsPerPage,
      setItemsPerPage,
      totalPages,
      startIndex,
      endIndex,
      currentItems,
      resetToFirstPage: () => setPage(1),
    },

    // Dialogs
    dialogs: {
      states: dialogStates,
      open: openDialog,
      close: closeDialog,
      editingItem,
      setEditingItem,
    },

    // ✅ FIXED: Handlers with proper editSave
    handlers: {
      edit: handleEdit,
      editSave: handleEditSave, // ✅ This is what DialogManager looks for!
      delete: handleDelete,
      sort: handleSort,
    },

    // Bulk Operations (built-in)
    bulk: {
      isProcessing: isBulkProcessing,
      bulkEdit: handleBulkEdit,
      bulkDelete: handleBulkDelete,
    },
  };
};