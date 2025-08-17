// src/components/warehouse/hooks/useBulkOperations.ts
// ✅ FIXED: Updated to match useWarehouseCore interface and BahanBakuFrontend types
import { useState, useCallback } from 'react';
import type { BahanBakuFrontend } from '../types'; // ✅ Updated import
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// ✅ FIXED: Updated interface to match WarehouseContextType from useWarehouseCore
interface UseBulkOperationsProps {
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>; // ✅ Updated type
  deleteBahanBaku: (id: string) => Promise<boolean>; // ✅ Match exact method name
  bulkDeleteBahanBaku?: (ids: string[]) => Promise<boolean>; // ✅ Optional, match useWarehouseCore
  selectedItems: string[];
  clearSelection: () => void;
}

// ✅ FIXED: Updated BulkEditData to match BahanBakuFrontend field names (camelCase)
interface BulkEditData {
  kategori?: string;
  supplier?: string;
  minimum?: number;
  harga?: number; // ✅ Changed from hargaSatuan to harga
  expiry?: string; // ✅ Changed from tanggalKadaluwarsa to expiry
}

interface UseBulkOperationsReturn {
  isBulkEditing: boolean;
  isBulkDeleting: boolean;
  bulkEditData: BulkEditData;
  setBulkEditData: (data: Partial<BulkEditData>) => void;
  handleBulkEdit: (selectedItemsData: BahanBakuFrontend[]) => Promise<boolean>; // ✅ Updated type
  handleBulkDelete: () => Promise<boolean>;
  resetBulkEditData: () => void;
  validateBulkEditData: () => { isValid: boolean; errors: string[] };
}

const defaultBulkEditData: BulkEditData = {
  kategori: undefined,
  supplier: undefined,
  minimum: undefined,
  harga: undefined, // ✅ Updated field name
  expiry: undefined, // ✅ Updated field name
};

/**
 * ✅ FIXED: Bulk Operations Hook
 * 
 * FIXES:
 * - Updated to use BahanBakuFrontend instead of BahanBaku
 * - Fixed method names to match useWarehouseCore interface
 * - Updated field names to camelCase (harga, expiry)
 * - Added fallback for missing bulkDeleteBahanBaku method
 * - Enhanced error handling and logging
 */
export const useBulkOperations = ({
  updateBahanBaku,
  deleteBahanBaku, // ✅ Now matches the actual method name
  bulkDeleteBahanBaku, // ✅ Optional method
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

    // Validate minimum stock
    if (bulkEditData.minimum !== undefined && bulkEditData.minimum < 0) {
      errors.push('Stok minimum tidak boleh negatif');
    }

    // ✅ FIXED: Validate harga (not hargaSatuan)
    if (bulkEditData.harga !== undefined && bulkEditData.harga < 0) {
      errors.push('Harga satuan tidak boleh negatif');
    }

    // ✅ FIXED: Validate expiry (not tanggalKadaluwarsa)
    if (bulkEditData.expiry !== undefined && bulkEditData.expiry !== null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(bulkEditData.expiry);
      expiryDate.setHours(0, 0, 0, 0);
      
      if (expiryDate <= today) {
        errors.push('Tanggal kadaluwarsa harus lebih dari hari ini');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [bulkEditData]);

  const handleBulkEdit = useCallback(async (selectedItemsData: BahanBakuFrontend[]): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih item yang ingin diedit terlebih dahulu');
      return false;
    }

    const validation = validateBulkEditData();
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    setIsBulkEditing(true);
    logger.info(`🔄 Starting bulk edit for ${selectedItems.length} items`);

    try {
      // ✅ FIXED: Prepare updates object with correct field names
      const updates: Partial<BahanBakuFrontend> = {};
      
      if (bulkEditData.kategori !== undefined && bulkEditData.kategori !== '') {
        updates.kategori = bulkEditData.kategori;
      }
      
      if (bulkEditData.supplier !== undefined && bulkEditData.supplier !== '') {
        updates.supplier = bulkEditData.supplier;
      }
      
      if (bulkEditData.minimum !== undefined) {
        updates.minimum = bulkEditData.minimum;
      }
      
      // ✅ FIXED: Use 'harga' field name
      if (bulkEditData.harga !== undefined) {
        updates.harga = bulkEditData.harga;
      }
      
      // ✅ FIXED: Use 'expiry' field name
      if (bulkEditData.expiry !== undefined) {
        updates.expiry = bulkEditData.expiry;
      }

      logger.debug('📝 Bulk edit updates:', updates);

      // Apply updates to all selected items
      const updatePromises = selectedItems.map(id => {
        logger.debug(`🔄 Updating item: ${id}`);
        return updateBahanBaku(id, updates);
      });
      
      const results = await Promise.allSettled(updatePromises);

      // Count successful and failed updates
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;
      const failed = results.length - successful;

      logger.info(`📊 Bulk edit results: ${successful} success, ${failed} failed`);

      if (successful > 0) {
        toast.success(`${successful} item berhasil diperbarui${failed > 0 ? `, ${failed} gagal` : ''}`);
        clearSelection();
        resetBulkEditData();
        
        if (failed === 0) {
          return true;
        }
      }

      if (failed > 0) {
        toast.error(`${failed} item gagal diperbarui`);
        // Log failed items for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            logger.error(`❌ Failed to update item ${selectedItems[index]}:`, result.reason);
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
  }, [selectedItems, bulkEditData, validateBulkEditData, updateBahanBaku, clearSelection, resetBulkEditData]);

  // ✅ FIXED: Enhanced handleBulkDelete with fallback logic
  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih item yang ingin dihapus terlebih dahulu');
      return false;
    }

    setIsBulkDeleting(true);
    logger.info(`🗑️ Starting bulk delete for ${selectedItems.length} items`);

    try {
      let success = false;

      // ✅ Try bulk delete first if available
      if (bulkDeleteBahanBaku) {
        logger.debug('🚀 Using bulk delete API');
        success = await bulkDeleteBahanBaku(selectedItems);
        logger.debug(`📊 Bulk delete API result: ${success}`);
      } else {
        // ✅ Fallback to individual deletes
        logger.debug('🔄 Fallback to individual deletes');
        
        let successCount = 0;
        for (const id of selectedItems) {
          try {
            logger.debug(`🗑️ Deleting individual item: ${id}`);
            const itemSuccess = await deleteBahanBaku(id);
            if (itemSuccess) {
              successCount++;
            } else {
              logger.warn(`❌ Failed to delete item: ${id}`);
            }
          } catch (error) {
            logger.error(`❌ Exception during individual delete for item ${id}:`, error);
          }
        }
        
        success = successCount > 0;
        logger.info(`📊 Individual deletes: ${successCount}/${selectedItems.length} successful`);
        
        if (successCount < selectedItems.length) {
          const failedCount = selectedItems.length - successCount;
          toast.error(`${failedCount} item gagal dihapus`);
        }
      }
      
      if (success) {
        toast.success(`${selectedItems.length} item berhasil dihapus`);
        clearSelection();
        return true;
      } else {
        toast.error('Gagal menghapus item');
        return false;
      }
    } catch (error) {
      logger.error('❌ Bulk delete error:', error);
      toast.error('Terjadi kesalahan saat menghapus item');
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedItems, bulkDeleteBahanBaku, deleteBahanBaku, clearSelection]);

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