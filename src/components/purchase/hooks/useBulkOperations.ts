// src/components/purchase/hooks/useBulkOperations.ts
// Bulk operations hook for purchase table - compatible with Purchase types
import { useState, useCallback } from 'react';
import type { Purchase, PurchaseStatus } from '../types/purchase.types';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Updated interface to match PurchaseContextType methods
interface UseBulkOperationsProps {
  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
  setStatus: (id: string, newStatus: PurchaseStatus) => Promise<boolean>; // ✅ NEW: For proper financial sync
  bulkDeletePurchases?: (ids: string[]) => Promise<boolean>; // Optional bulk method
  selectedItems: string[];
  clearSelection: () => void;
}

// BulkEditData interface matching Purchase field names
interface BulkEditData {
  supplier?: string;
  tanggal?: Date;
  metode_perhitungan?: 'AVERAGE';
}

interface UseBulkOperationsReturn {
  isBulkEditing: boolean;
  isBulkDeleting: boolean;
  bulkEditData: BulkEditData;
  setBulkEditData: (data: Partial<BulkEditData>) => void;
  handleBulkEdit: (selectedItemsData: Purchase[]) => Promise<boolean>;
  handleBulkDelete: () => Promise<boolean>;
  resetBulkEditData: () => void;
  validateBulkEditData: () => { isValid: boolean; errors: string[] };
}

const defaultBulkEditData: BulkEditData = {
  supplier: undefined,
  tanggal: undefined,
  metode_perhitungan: undefined,
};

/**
 * Bulk Operations Hook for Purchase Table
 * 
 * Compatible with Purchase types and PurchaseContextType methods
 * Provides bulk edit and bulk delete functionality
 */
export const useBulkOperations = ({
  updatePurchase,
  deletePurchase,
  setStatus,
  bulkDeletePurchases,
  selectedItems,
  clearSelection,
}: UseBulkOperationsProps): UseBulkOperationsReturn => {
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkEditData, setBulkEditDataState] = useState<BulkEditData>(defaultBulkEditData);

  const setBulkEditData = useCallback((data: Partial<BulkEditData>) => {
    setBulkEditDataState(prev => ({ ...prev, ...data }));
  }, []);

  const resetBulkEditData = useCallback(() => {
    setBulkEditDataState(defaultBulkEditData);
  }, []);

  const validateBulkEditData = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if at least one field is being updated
    const hasChanges = Object.values(bulkEditData).some(value => 
      value !== undefined && value !== null && value !== ''
    );

    if (!hasChanges) {
      errors.push('Pilih minimal satu field untuk diubah');
    }

    // Validate tanggal
    if (bulkEditData.tanggal !== undefined) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const purchaseDate = new Date(bulkEditData.tanggal);
      
      if (purchaseDate > today) {
        errors.push('Tanggal pembelian tidak boleh di masa depan');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [bulkEditData]);

  const handleBulkEdit = useCallback(async (selectedItemsData: Purchase[]): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih pembelian yang ingin diedit terlebih dahulu');
      return false;
    }

    const validation = validateBulkEditData();
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    setIsBulkEditing(true);
    logger.info(`🔄 Starting bulk edit for ${selectedItems.length} purchases`);

    try {
      // Prepare updates object with correct field names
      const updates: Partial<Purchase> = {};
      
      if (bulkEditData.supplier !== undefined && bulkEditData.supplier !== '') {
        updates.supplier = bulkEditData.supplier;
      }
      
      if (bulkEditData.tanggal !== undefined) {
        updates.tanggal = bulkEditData.tanggal;
      }

      if (bulkEditData.metode_perhitungan !== undefined) {
        updates.metode_perhitungan = bulkEditData.metode_perhitungan;
      }

      logger.debug('📝 Bulk edit updates:', updates);

      // ✅ ENHANCED: Handle status changes specially to trigger financial sync
      console.log('📝 [BULK DEBUG] Prepared updates:', updates);
      console.log('📝 [BULK DEBUG] Selected items:', selectedItems);
      console.log('📝 [BULK DEBUG] Update keys:', Object.keys(updates));
      
      let successful = 0;
      let failed = 0;
      const results = [];
      
      // ✅ SIMPLE: Use parallel processing for non-status updates only
      console.log('🔄 [BULK DEBUG] Processing bulk updates in parallel...');
      
      const updatePromises = selectedItems.map(id => {
        console.log(`🔄 [BULK DEBUG] Using updatePurchase for purchase ${id}`);
        return updatePurchase(id, updates);
      });
      
      const parallelResults = await Promise.allSettled(updatePromises);
      results.push(...parallelResults);
      
      // Count successful and failed updates
      successful = parallelResults.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;
      failed = parallelResults.length - successful;

      logger.info(`📊 Bulk edit results: ${successful} success, ${failed} failed`);

      if (successful > 0) {
        toast.success(`${successful} pembelian berhasil diperbarui${failed > 0 ? `, ${failed} gagal` : ''}`);
        clearSelection();
        resetBulkEditData();
        
        if (failed === 0) {
          return true;
        }
      }

      if (failed > 0) {
        toast.error(`${failed} pembelian gagal diperbarui`);
        // Log failed items for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            logger.error(`❌ Failed to update purchase ${selectedItems[index]}:`, result.reason);
          }
        });
      }

      return successful > 0;
    } catch (error) {
      logger.error('❌ Bulk edit error:', error);
      toast.error('Terjadi kesalahan saat melakukan bulk edit');
      return false;
    } finally {
      setIsBulkEditing(false);
    }
  }, [selectedItems, bulkEditData, validateBulkEditData, updatePurchase, setStatus, clearSelection, resetBulkEditData]);

  // Enhanced handleBulkDelete with fallback logic
  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih pembelian yang ingin dihapus terlebih dahulu');
      return false;
    }

    setIsBulkDeleting(true);
    logger.info(`🗑️ Starting bulk delete for ${selectedItems.length} purchases`);

    try {
      let success = false;

      // Try bulk delete first if available
      if (bulkDeletePurchases) {
        logger.debug('🚀 Using bulk delete API');
        success = await bulkDeletePurchases(selectedItems);
        logger.debug(`📊 Bulk delete API result: ${success}`);
      } else {
        // Fallback to individual deletes
        logger.debug('🔄 Fallback to individual deletes');
        
        let successCount = 0;
        for (const id of selectedItems) {
          try {
            logger.debug(`🗑️ Deleting individual purchase: ${id}`);
            const itemSuccess = await deletePurchase(id);
            if (itemSuccess) {
              successCount++;
            } else {
              logger.warn(`❌ Failed to delete purchase: ${id}`);
            }
          } catch (error) {
            logger.error(`❌ Exception during individual delete for purchase ${id}:`, error);
          }
        }
        
        success = successCount > 0;
        logger.info(`📊 Individual deletes: ${successCount}/${selectedItems.length} successful`);
        
        if (successCount < selectedItems.length) {
          const failedCount = selectedItems.length - successCount;
          toast.error(`${failedCount} pembelian gagal dihapus`);
        }
      }
      
      if (success) {
        toast.success(`${selectedItems.length} pembelian berhasil dihapus`);
        clearSelection();
        return true;
      } else {
        toast.error('Gagal menghapus pembelian');
        return false;
      }
    } catch (error) {
      logger.error('❌ Bulk delete error:', error);
      toast.error('Terjadi kesalahan saat menghapus pembelian');
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedItems, bulkDeletePurchases, deletePurchase, clearSelection]);

  return {
    isBulkEditing,
    isBulkDeleting,
    bulkEditData,
    setBulkEditData,
    handleBulkEdit,
    handleBulkDelete,
    resetBulkEditData,
    validateBulkEditData,
  };
};
