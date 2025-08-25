// src/hooks/useBulkOperations.ts
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * Generic interface untuk bulk operations config
 */
export interface BulkOperationsConfig<T = any> {
  updateItem: (id: string, updates: Partial<T>) => Promise<boolean>;
  bulkDeleteItems: (ids: string[]) => Promise<boolean>;
  selectedItems: string[];
  clearSelection: () => void;
  itemName?: string; // Nama item untuk pesan toast (default: "item")
}

/**
 * Generic interface untuk bulk edit data
 */
export interface BulkEditData {
  [key: string]: any;
}

/**
 * Generic interface untuk bulk operations result
 */
export interface BulkOperationsResult<T = BulkEditData> {
  isProcessing: boolean;
  bulkEditData: T;
  setBulkEditData: (data: T) => void;
  resetBulkEditData: () => void;
  validateBulkEditData: (data: T) => { isValid: boolean; errors: string[] };
  executeBulkEdit: (data: T, validationRules?: ValidationRule<T>[]) => Promise<boolean>;
  executeBulkDelete: () => Promise<boolean>;
}

/**
 * Interface untuk validation rules
 */
export interface ValidationRule<T = BulkEditData> {
  field: keyof T;
  validate: (value: any) => string | null; // Return error message or null if valid
}

/**
 * Generic Bulk Operations Hook
 * 
 * Hook yang dapat digunakan untuk semua jenis bulk operations:
 * - Bulk edit multiple items
 * - Bulk delete multiple items
 * - Progress tracking
 * - Error handling
 * - Validation
 * 
 * @param config - Konfigurasi untuk bulk operations
 * @returns Object dengan fungsi dan state untuk bulk operations
 */
export const useBulkOperations = <T extends BulkEditData = BulkEditData>(
  config: BulkOperationsConfig<T>
): BulkOperationsResult<T> => {
  const hookId = useRef(`useBulkOperations-${Date.now()}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<T>({} as T);

  const itemName = config.itemName || 'item';

  logger.debug(`[${hookId.current}] 📦 Bulk operations hook initialized for ${itemName}`);

  // Reset bulk edit data
  const resetBulkEditData = useCallback(() => {
    setBulkEditData({} as T);
  }, []);

  // Generic validation function
  const validateBulkEditData = useCallback(
    (data: T, validationRules: ValidationRule<T>[] = []): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Apply custom validation rules
      for (const rule of validationRules) {
        const value = data[rule.field];
        if (value !== undefined) {
          const error = rule.validate(value);
          if (error) {
            errors.push(error);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },
    []
  );

  // Execute bulk edit
  const executeBulkEdit = useCallback(
    async (data: T, validationRules: ValidationRule<T>[] = []): Promise<boolean> => {
      if (config.selectedItems.length === 0) {
        toast.error(`Tidak ada ${itemName} yang dipilih`);
        return false;
      }

      // Validate data
      const validation = validateBulkEditData(data, validationRules);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return false;
      }

      // Check if there's any data to update
      const hasUpdates = Object.values(data).some(value => 
        value !== undefined && value !== null && value !== ''
      );

      if (!hasUpdates) {
        toast.error('Tidak ada perubahan yang akan diterapkan');
        return false;
      }

      setIsProcessing(true);
      const operationId = `bulk-edit-${Date.now()}`;
      let successCount = 0;
      let errorCount = 0;

      try {
        const totalItems = config.selectedItems.length;
        const batchSize = 5; // Process in batches to avoid overwhelming the system

        logger.debug(`[${hookId.current}] 🚀 Starting bulk edit (${operationId}):`, {
          totalItems,
          data,
          selectedItems: config.selectedItems
        });

        // Clean data - remove undefined/null/empty values
        const cleanedData = Object.fromEntries(
          Object.entries(data).filter(([_, value]) => 
            value !== undefined && value !== null && value !== ''
          )
        ) as Partial<T>;

        // Process in batches
        for (let i = 0; i < totalItems; i += batchSize) {
          const batch = config.selectedItems.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (itemId) => {
            try {
              const success = await config.updateItem(itemId, cleanedData);
              if (success) {
                successCount++;
                logger.debug(`[${hookId.current}] ✅ Bulk edit success for ${itemName}: ${itemId}`);
              } else {
                errorCount++;
                logger.warn(`[${hookId.current}] ❌ Bulk edit failed for ${itemName}: ${itemId}`);
              }
              return success;
            } catch (error) {
              errorCount++;
              logger.error(`[${hookId.current}] ❌ Bulk edit error for ${itemName} ${itemId}:`, error);
              return false;
            }
          });

          await Promise.all(batchPromises);

          // Show progress for large operations
          if (totalItems > 10) {
            const processed = Math.min(i + batchSize, totalItems);
            toast.loading(`Memproses... ${processed}/${totalItems} ${itemName}`, {
              id: operationId
            });
          }
        }

        // Clear loading toast
        toast.dismiss(operationId);

        // Show results
        if (successCount > 0) {
          toast.success(`${successCount} ${itemName} berhasil diperbarui`);
          config.clearSelection();
          resetBulkEditData();
        }

        if (errorCount > 0) {
          toast.error(`${errorCount} ${itemName} gagal diperbarui`);
        }

        logger.debug(`[${hookId.current}] 📊 Bulk edit completed (${operationId}):`, {
          successCount,
          errorCount,
          totalItems
        });

        return successCount > 0;

      } catch (error) {
        logger.error(`[${hookId.current}] ❌ Bulk edit operation failed (${operationId}):`, error);
        toast.dismiss(operationId);
        toast.error(`Gagal memperbarui ${itemName}`);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [config, itemName, validateBulkEditData, resetBulkEditData]
  );

  // Execute bulk delete
  const executeBulkDelete = useCallback(async (): Promise<boolean> => {
    if (config.selectedItems.length === 0) {
      toast.error(`Tidak ada ${itemName} yang dipilih`);
      return false;
    }

    setIsProcessing(true);
    const operationId = `bulk-delete-${Date.now()}`;

    try {
      const totalItems = config.selectedItems.length;
      
      logger.debug(`[${hookId.current}] 🗑️ Starting bulk delete (${operationId}):`, {
        totalItems,
        selectedItems: config.selectedItems
      });

      // Show loading toast for operations with many items
      if (totalItems > 5) {
        toast.loading(`Menghapus ${totalItems} ${itemName}...`, {
          id: operationId
        });
      }

      const success = await config.bulkDeleteItems(config.selectedItems);

      // Clear loading toast
      toast.dismiss(operationId);

      if (success) {
        toast.success(`${totalItems} ${itemName} berhasil dihapus`);
        config.clearSelection();
        logger.debug(`[${hookId.current}] ✅ Bulk delete completed (${operationId})`);
      } else {
        toast.error(`Gagal menghapus ${itemName}`);
        logger.warn(`[${hookId.current}] ❌ Bulk delete failed (${operationId})`);
      }

      return success;

    } catch (error) {
      logger.error(`[${hookId.current}] ❌ Bulk delete operation failed (${operationId}):`, error);
      toast.dismiss(operationId);
      toast.error(`Gagal menghapus ${itemName}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [config, itemName]);

  return {
    isProcessing,
    bulkEditData,
    setBulkEditData,
    resetBulkEditData,
    validateBulkEditData,
    executeBulkEdit,
    executeBulkDelete
  };
};

export default useBulkOperations;