// src/components/warehouse/hooks/useWarehouseBulk.ts
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { BahanBaku } from '../types';

interface BulkOperationsConfig {
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  selectedItems: string[];
  clearSelection: () => void;
}

interface BulkEditData {
  kategori?: string;
  supplier?: string;
  minimum?: number;
  harga?: number;
  expiry?: string;
}

/**
 * Warehouse Bulk Operations Hook
 * 
 * Lazy-loaded hook for bulk operations:
 * - Bulk edit multiple items
 * - Bulk delete multiple items
 * - Progress tracking
 * - Error handling
 * - Validation
 * 
 * Size: ~4KB (loaded only when needed)
 */
export const useWarehouseBulk = (config: BulkOperationsConfig) => {
  const hookId = useRef(`useWarehouseBulk-${Date.now()}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});

  logger.debug(`[${hookId.current}] 📦 Bulk operations hook initialized`);

  // Reset bulk edit data
  const resetBulkEditData = useCallback(() => {
    setBulkEditData({});
  }, []);

  // Validate bulk edit data
  const validateBulkEditData = useCallback((data: BulkEditData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate minimum stock
    if (data.minimum !== undefined && (data.minimum < 0 || !Number.isInteger(data.minimum))) {
      errors.push('Minimum stok harus berupa angka positif');
    }

    // Validate price
    if (data.harga !== undefined && data.harga < 0) {
      errors.push('Harga harus berupa angka positif');
    }

    // Validate expiry date
    if (data.expiry && data.expiry.trim()) {
      const expiryDate = new Date(data.expiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Format tanggal kadaluarsa tidak valid');
      } else if (expiryDate < new Date()) {
        errors.push('Tanggal kadaluarsa tidak boleh di masa lalu');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Bulk edit operation
  const bulkEdit = useCallback(async (editData: BulkEditData): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    
    logger.debug(`[${hookId.current}] ✏️ Starting bulk edit (${operationId}):`, {
      itemCount: config.selectedItems.length,
      editData
    });

    // Validation
    const validation = validateBulkEditData(editData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    // Filter out empty values
    const cleanedData = Object.entries(editData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        acc[key as keyof BulkEditData] = value;
      }
      return acc;
    }, {} as BulkEditData);

    if (Object.keys(cleanedData).length === 0) {
      toast.warning('Tidak ada perubahan yang akan diterapkan');
      return false;
    }

    setIsProcessing(true);

    try {
      let successCount = 0;
      let errorCount = 0;
      const totalItems = config.selectedItems.length;

      // Process items in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < config.selectedItems.length; i += batchSize) {
        const batch = config.selectedItems.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (itemId) => {
          try {
            const success = await config.updateBahanBaku(itemId, cleanedData);
            if (success) {
              successCount++;
              logger.debug(`[${hookId.current}] ✅ Bulk edit success for item: ${itemId}`);
            } else {
              errorCount++;
              logger.warn(`[${hookId.current}] ❌ Bulk edit failed for item: ${itemId}`);
            }
            return success;
          } catch (error) {
            errorCount++;
            logger.error(`[${hookId.current}] ❌ Bulk edit error for item ${itemId}:`, error);
            return false;
          }
        });

        await Promise.all(batchPromises);

        // Show progress for large operations
        if (totalItems > 10) {
          const processed = Math.min(i + batchSize, totalItems);
          toast.loading(`Memproses... ${processed}/${totalItems} item`, {
            id: `bulk-edit-${operationId}`
          });
        }
      }

      // Clear loading toast
      toast.dismiss(`bulk-edit-${operationId}`);

      // Show results
      if (successCount > 0) {
        toast.success(`${successCount} item berhasil diperbarui`);
        config.clearSelection();
        resetBulkEditData();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} item gagal diperbarui`);
      }

      logger.debug(`[${hookId.current}] 📊 Bulk edit completed (${operationId}):`, {
        successCount,
        errorCount,
        totalItems
      });

      return successCount > 0;

    } catch (error) {
      logger.error(`[${hookId.current}] ❌ Bulk edit operation failed (${operationId}):`, error);
      toast.error('Terjadi kesalahan saat melakukan bulk edit');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [config, validateBulkEditData, resetBulkEditData]);

  // Bulk delete operation
  const bulkDelete = useCallback(async (): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    
    logger.debug(`[${hookId.current}] 🗑️ Starting bulk delete (${operationId}):`, {
      itemCount: config.selectedItems.length
    });

    if (config.selectedItems.length === 0) {
      toast.warning('Tidak ada item yang dipilih');
      return false;
    }

    setIsProcessing(true);

    try {
      const success = await config.bulkDeleteBahanBaku(config.selectedItems);
      
      if (success) {
        toast.success(`${config.selectedItems.length} item berhasil dihapus`);
        config.clearSelection();
        
        logger.debug(`[${hookId.current}] ✅ Bulk delete completed (${operationId}):`, {
          itemCount: config.selectedItems.length
        });
      } else {
        toast.error('Gagal menghapus item');
        logger.warn(`[${hookId.current}] ❌ Bulk delete failed (${operationId})`);
      }

      return success;

    } catch (error) {
      logger.error(`[${hookId.current}] ❌ Bulk delete operation failed (${operationId}):`, error);
      toast.error('Terjadi kesalahan saat menghapus item');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [config]);

  // Bulk operations with confirmation
  const bulkEditWithConfirmation = useCallback(async (editData: BulkEditData): Promise<boolean> => {
    const changes = Object.entries(editData).filter(([_, value]) => 
      value !== undefined && value !== '' && value !== null
    );

    if (changes.length === 0) {
      toast.warning('Tidak ada perubahan yang akan diterapkan');
      return false;
    }

    const changeDescription = changes.map(([key, value]) => {
      const fieldNames: Record<string, string> = {
        kategori: 'Kategori',
        supplier: 'Supplier',
        minimum: 'Minimum Stok',
        harga: 'Harga',
        expiry: 'Tanggal Kadaluarsa'
      };
      return `${fieldNames[key] || key}: ${value}`;
    }).join(', ');

    const confirmMessage = `Apakah Anda yakin ingin mengubah ${config.selectedItems.length} item?\n\nPerubahan: ${changeDescription}`;
    
    if (confirm(confirmMessage)) {
      return await bulkEdit(editData);
    }

    return false;
  }, [bulkEdit, config.selectedItems.length]);

  const bulkDeleteWithConfirmation = useCallback(async (): Promise<boolean> => {
    if (config.selectedItems.length === 0) {
      toast.warning('Tidak ada item yang dipilih');
      return false;
    }

    const confirmMessage = `Apakah Anda yakin ingin menghapus ${config.selectedItems.length} item?\n\nTindakan ini tidak dapat dibatalkan.`;
    
    if (confirm(confirmMessage)) {
      return await bulkDelete();
    }

    return false;
  }, [bulkDelete, config.selectedItems.length]);

  return {
    // State
    isProcessing,
    bulkEditData,
    setBulkEditData,
    resetBulkEditData,

    // Operations
    bulkEdit: bulkEditWithConfirmation,
    bulkDelete: bulkDeleteWithConfirmation,

    // Utilities
    validateBulkEditData,
    
    // Direct operations (without confirmation)
    directBulkEdit: bulkEdit,
    directBulkDelete: bulkDelete,
  };
};