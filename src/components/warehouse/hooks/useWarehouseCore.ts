// src/components/warehouse/hooks/useWarehouseCore.ts
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Types - Updated to use BahanBakuFrontend consistently
import type { BahanBakuFrontend, FilterState, SortConfig } from '../types';

interface WarehouseContextType {
  bahanBaku: BahanBakuFrontend[];  // ✅ Updated
  loading: boolean;
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>;  // ✅ Updated
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku?: (ids: string[]) => Promise<boolean>;
}

/**
 * Core Warehouse Logic Hook
 * 
 * Combines all essential warehouse functionality:
 * - Selection management
 * - Filtering and sorting
 * - Pagination
 * - Dialog management
 * - Event handlers
 * - Bulk operations (lazy loaded)
 * 
 * Updated to use BahanBakuFrontend consistently
 * Total Size: ~8KB (lightweight but comprehensive)
 */
export const useWarehouseCore = (context: WarehouseContextType) => {
  const hookId = useRef(`useWarehouseCore-${Date.now()}`);
  const [bulkModule, setBulkModule] = useState<any>(null);

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
  const [editingItem, setEditingItem] = useState<BahanBakuFrontend | null>(null);  // ✅ Updated

  // === LAZY LOAD BULK OPERATIONS ===
  useEffect(() => {
    if (selectedItems.length > 0 && !bulkModule) {
      logger.debug(`[${hookId.current}] 📦 Loading bulk operations...`);
      
      import('./useWarehouseBulk').then(module => {
        const bulk = module.useWarehouseBulk({
          updateBahanBaku: context.updateBahanBaku,
          bulkDeleteBahanBaku: context.bulkDeleteBahanBaku || (() => Promise.resolve(false)),
          selectedItems,
          clearSelection: () => setSelectedItems([]),
        });
        setBulkModule(bulk);
        logger.debug(`[${hookId.current}] ✅ Bulk operations loaded`);
      }).catch(err => {
        logger.error(`[${hookId.current}] ❌ Failed to load bulk operations:`, err);
      });
    }
  }, [selectedItems.length, bulkModule, context]);

  // === COMPUTED VALUES ===
  
  // Available filter options
  const availableCategories = useMemo(() => {
    const categories = new Set(context.bahanBaku.map(item => item.kategori).filter(Boolean));
    return Array.from(categories);
  }, [context.bahanBaku]);

  const availableSuppliers = useMemo(() => {
    const suppliers = new Set(context.bahanBaku.map(item => item.supplier).filter(Boolean));
    return Array.from(suppliers);
  }, [context.bahanBaku]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let items = [...context.bahanBaku];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.nama.toLowerCase().includes(term) ||
        item.kategori?.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filters.category) {
      items = items.filter(item => item.kategori === filters.category);
    }

    // Supplier filter
    if (filters.supplier) {
      items = items.filter(item => item.supplier === filters.supplier);
    }

    // Stock level filter - Fixed with proper number conversion
    if (filters.stockLevel === 'low') {
      items = items.filter(item => Number(item.stok) <= Number(item.minimum));
    } else if (filters.stockLevel === 'out') {
      items = items.filter(item => Number(item.stok) === 0);
    }

    // Expiry filter
    if (filters.expiry === 'expiring') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 30);
      items = items.filter(item => {
        if (!item.expiry) return false;
        const expiryDate = new Date(item.expiry);
        return expiryDate <= threshold && expiryDate > new Date();
      });
    } else if (filters.expiry === 'expired') {
      items = items.filter(item => {
        if (!item.expiry) return false;
        return new Date(item.expiry) < new Date();
      });
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
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

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
    return count;
  }, [filters, searchTerm]);

  // === SELECTION FUNCTIONS ===
  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, []);

  const selectPage = useCallback(() => {
    const pageIds = currentItems.map(item => item.id);
    setSelectedItems(prev => {
      const newSelected = new Set([...prev, ...pageIds]);
      return Array.from(newSelected);
    });
  }, [currentItems]);

  const isSelected = useCallback((id: string) => selectedItems.includes(id), [selectedItems]);

  const isPageSelected = useMemo(() => {
    return currentItems.length > 0 && currentItems.every(item => selectedItems.includes(item.id));
  }, [currentItems, selectedItems]);

  const isPagePartiallySelected = useMemo(() => {
    return currentItems.some(item => selectedItems.includes(item.id)) && !isPageSelected;
  }, [currentItems, selectedItems, isPageSelected]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      clearSelection();
    }
  }, [isSelectionMode, clearSelection]);

  // === DIALOG FUNCTIONS ===
  const openDialog = useCallback((dialog: string) => {
    logger.debug(`[${hookId.current}] 📱 Opening dialog: ${dialog}`);
    setDialogStates(prev => ({ ...prev, [dialog]: true }));
  }, []);

  const closeDialog = useCallback((dialog: string) => {
    logger.debug(`[${hookId.current}] 📱 Closing dialog: ${dialog}`);
    setDialogStates(prev => ({ ...prev, [dialog]: false }));
    
    // Clear editing item when closing edit dialog
    if (dialog === 'editItem') {
      setEditingItem(null);
    }
  }, []);

  // === EVENT HANDLERS ===
  const handleEdit = useCallback((item: BahanBakuFrontend) => {  // ✅ Updated
    logger.debug(`[${hookId.current}] ✏️ Edit triggered: ${item.nama}`);
    setEditingItem(item);
    openDialog('editItem');
  }, [openDialog]);

  const handleEditSave = useCallback(async (updates: Partial<BahanBakuFrontend>) => {  // ✅ Updated
    if (!editingItem) return;
    
    const success = await context.updateBahanBaku(editingItem.id, updates);
    if (success) {
      toast.success('Item berhasil diperbarui!');
      closeDialog('editItem');
    } else {
      toast.error('Gagal memperbarui item');
    }
  }, [editingItem, context.updateBahanBaku, closeDialog]);

  const handleDelete = useCallback(async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
      const success = await context.deleteBahanBaku(id);
      if (success) {
        toast.success(`"${nama}" berhasil dihapus.`);
      } else {
        toast.error('Gagal menghapus item');
      }
    }
  }, [context.deleteBahanBaku]);

  const handleSort = useCallback((key: keyof BahanBakuFrontend) => {  // ✅ Updated
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // === FILTER FUNCTIONS ===
  const resetFilters = useCallback(() => {
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
    setPage(1);
  }, [filteredItems.length, searchTerm, filters]);

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

    // Handlers
    handlers: {
      edit: handleEdit,
      editSave: handleEditSave,
      delete: handleDelete,
      sort: handleSort,
    },

    // Bulk Operations (lazy loaded)
    bulk: bulkModule || {
      isProcessing: false,
      bulkEdit: async () => false,
      bulkDelete: async () => false,
    },
  };
};