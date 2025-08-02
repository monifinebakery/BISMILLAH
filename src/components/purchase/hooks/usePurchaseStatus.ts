// src/components/purchase/hooks/usePurchaseStatus.ts

import { useState, useCallback, useMemo, useRef } from 'react';
import { PurchaseStatus, Purchase } from '../types/purchase.types';
import { createPurchaseWarehouseService } from '../services/purchaseWarehouseService';
import { useWarehouseContext } from '@/components/warehouse/context/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export interface UsePurchaseStatusProps {
  purchases: Purchase[];
  onStatusUpdate: (purchaseId: string, newStatus: PurchaseStatus) => Promise<boolean>;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  enableWarehouseIntegration?: boolean;
  enableDebugLogs?: boolean;
}

export interface StatusChangeValidation {
  canChange: boolean;
  warnings: string[];
  errors: string[];
}

export interface UsePurchaseStatusReturn {
  updateStatus: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
  isUpdating: string | null;
  isUpdatingPurchase: (purchaseId: string) => boolean;
  validateStatusChange: (purchaseId: string, newStatus: PurchaseStatus) => Promise<StatusChangeValidation>;
  cancelUpdate: () => void;
}

export const usePurchaseStatus = ({ 
  purchases,
  onStatusUpdate, 
  onError, 
  onSuccess,
  enableWarehouseIntegration = true,
  enableDebugLogs = false
}: UsePurchaseStatusProps): UsePurchaseStatusReturn => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Warehouse integration
  const warehouseContext = useWarehouseContext();
  const { user } = useAuth();

  // Create warehouse service instance with memoization
  const warehouseService = useMemo(() => {
    if (!enableWarehouseIntegration || !user?.id) return null;
    
    try {
      return createPurchaseWarehouseService(
        warehouseContext,
        user.id,
        enableDebugLogs
      );
    } catch (error) {
      if (enableDebugLogs) {
        logger.error('Failed to create warehouse service:', error);
      }
      return null;
    }
  }, [warehouseContext, user?.id, enableWarehouseIntegration, enableDebugLogs]);

  // Get status display text - now memoized
  const statusDisplayMap = useMemo<Record<PurchaseStatus, string>>(() => ({
    pending: 'Menunggu',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }), []);

  const getStatusDisplayText = useCallback((status: PurchaseStatus): string => {
    return statusDisplayMap[status] || status;
  }, [statusDisplayMap]);

  // Memoized purchase lookup for better performance
  const purchaseMap = useMemo(() => {
    return new Map(purchases.map(purchase => [purchase.id, purchase]));
  }, [purchases]);

  // Enhanced validation with better error handling
  const validateStatusChange = useCallback(async (
    purchaseId: string, 
    newStatus: PurchaseStatus
  ): Promise<StatusChangeValidation> => {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const purchase = purchaseMap.get(purchaseId);
      if (!purchase) {
        errors.push('Purchase tidak ditemukan');
        return { canChange: false, warnings, errors };
      }

      const oldStatus = purchase.status;

      // Basic validation rules
      if (oldStatus === newStatus) {
        warnings.push('Status tidak berubah');
        return { canChange: true, warnings, errors };
      }

      // Validate status transition rules
      if (oldStatus === 'cancelled') {
        warnings.push('Purchase yang sudah dibatalkan sebaiknya tidak diubah statusnya');
      }

      // Prevent changing from completed if warehouse integration is enabled
      if (oldStatus === 'completed' && newStatus !== 'completed' && enableWarehouseIntegration) {
        warnings.push('Mengubah status dari "Selesai" akan mengurangi stok dari warehouse');
      }

      // Validate completion requirements
      if (newStatus === 'completed') {
        if (!purchase.items || purchase.items.length === 0) {
          errors.push('Tidak dapat menyelesaikan purchase tanpa item');
        }

        if (!purchase.totalNilai || purchase.totalNilai <= 0) {
          errors.push('Total nilai purchase harus lebih dari 0');
        }

        // Check for required fields
        if (!purchase.supplier) {
          errors.push('Supplier harus diisi sebelum menyelesaikan purchase');
        }

        // Validate each item
        if (purchase.items) {
          const invalidItems = purchase.items.filter(item => 
            !item.nama || !item.kuantitas || item.kuantitas <= 0
          );
          
          if (invalidItems.length > 0) {
            errors.push(`Terdapat ${invalidItems.length} item dengan data tidak lengkap`);
          }
        }

        // Warehouse-specific validation
        if (warehouseService) {
          try {
            const warehouseValidation = await warehouseService.validatePurchaseCompletion(purchase);
            warnings.push(...warehouseValidation.warnings);
          } catch (error) {
            if (enableDebugLogs) {
              logger.warn('Warehouse validation failed:', error);
            }
            warnings.push('Tidak dapat memvalidasi dengan warehouse, tetapi perubahan status tetap dapat dilakukan');
          }
        }
      }

      return {
        canChange: errors.length === 0,
        warnings,
        errors
      };
    } catch (error) {
      logger.error('Validation error:', error);
      errors.push('Terjadi kesalahan saat validasi');
      return { canChange: false, warnings, errors };
    }
  }, [purchaseMap, enableWarehouseIntegration, warehouseService, enableDebugLogs]);

  // Cancel update function
  const cancelUpdate = useCallback(() => {
    setIsUpdating(null);
  }, []);

  // Enhanced status update function with better error handling and rollback
  const updateStatus = useCallback(async (
    purchaseId: string, 
    newStatus: PurchaseStatus
  ): Promise<void> => {
    const purchase = purchaseMap.get(purchaseId);
    if (!purchase) {
      const errorMessage = 'Purchase tidak ditemukan';
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }

    const oldStatus = purchase.status;

    // Pre-validate the status change
    const validation = await validateStatusChange(purchaseId, newStatus);
    if (!validation.canChange) {
      const errorMessage = validation.errors.join(', ');
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }

    // Show warnings if any
    if (validation.warnings.length > 0 && enableDebugLogs) {
      logger.warn(`Status change warnings for ${purchaseId}:`, validation.warnings);
    }

    // Prevent multiple concurrent updates
    if (isUpdating && isUpdating !== purchaseId) {
      throw new Error('Sudah ada proses update yang sedang berjalan');
    }

    if (!isMountedRef.current) {
      throw new Error('Component unmounted');
    }

    setIsUpdating(purchaseId);
    
    let purchaseStatusUpdated = false;
    
    try {
      // Step 1: Update purchase status
      const success = await onStatusUpdate(purchaseId, newStatus);
      
      if (!success) {
        throw new Error('Failed to update purchase status');
      }
      
      purchaseStatusUpdated = true;

      // Step 2: Handle warehouse integration if enabled
      if (warehouseService && enableWarehouseIntegration) {
        try {
          const warehouseSuccess = await warehouseService.handlePurchaseStatusChange(
            { ...purchase, status: newStatus }, // Use new status
            oldStatus,
            newStatus
          );

          if (!warehouseSuccess) {
            // Warehouse update failed, but purchase status was already updated
            logger.warn(`Warehouse update failed for purchase ${purchaseId}, but purchase status was updated`);
            onError?.('Status purchase berhasil diupdate, tetapi gagal mengupdate warehouse. Periksa stok manual.');
            return; // Don't throw error since purchase update succeeded
          }
        } catch (warehouseError) {
          logger.error('Warehouse integration error:', warehouseError);
          onError?.('Status purchase berhasil diupdate, tetapi terjadi error pada warehouse integration.');
          return; // Don't throw error since purchase update succeeded
        }
      }

      // Success message
      const statusText = getStatusDisplayText(newStatus);
      const warehouseText = enableWarehouseIntegration && newStatus === 'completed' 
        ? ' dan stok warehouse telah diupdate' 
        : '';
      
      onSuccess?.(`Status berhasil diubah menjadi "${statusText}"${warehouseText}`);

    } catch (error) {
      // If purchase status was updated but warehouse failed, 
      // we might want to attempt rollback (optional)
      if (purchaseStatusUpdated && oldStatus !== newStatus) {
        if (enableDebugLogs) {
          logger.info(`Considering rollback for purchase ${purchaseId} from ${newStatus} to ${oldStatus}`);
        }
        // Uncomment below if you want automatic rollback
        // try {
        //   await onStatusUpdate(purchaseId, oldStatus);
        //   logger.info(`Rolled back purchase ${purchaseId} status to ${oldStatus}`);
        // } catch (rollbackError) {
        //   logger.error('Rollback failed:', rollbackError);
        // }
      }

      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      onError?.(errorMessage);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(null);
      }
    }
  }, [
    purchaseMap, 
    onStatusUpdate, 
    onError, 
    onSuccess, 
    warehouseService, 
    enableWarehouseIntegration,
    validateStatusChange,
    getStatusDisplayText,
    isUpdating,
    enableDebugLogs
  ]);

  // Check if specific purchase is being updated
  const isUpdatingPurchase = useCallback((purchaseId: string) => {
    return isUpdating === purchaseId;
  }, [isUpdating]);

  // Cleanup on unmount
  useState(() => {
    return () => {
      isMountedRef.current = false;
    };
  });

  return {
    updateStatus,
    isUpdating,
    isUpdatingPurchase,
    validateStatusChange,
    cancelUpdate
  };
};