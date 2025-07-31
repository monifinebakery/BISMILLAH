// src/components/purchase/hooks/usePurchaseStatus.ts

import { useState, useCallback, useMemo } from 'react';
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

export interface UsePurchaseStatusReturn {
  updateStatus: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
  isUpdating: string | null;
  isUpdatingPurchase: (purchaseId: string) => boolean;
  validateStatusChange: (purchaseId: string, newStatus: PurchaseStatus) => Promise<{
    canChange: boolean;
    warnings: string[];
    errors: string[];
  }>;
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
  
  // Warehouse integration
  const warehouseContext = useWarehouseContext();
  const { user } = useAuth();

  // Create warehouse service instance
  const warehouseService = useMemo(() => {
    if (!enableWarehouseIntegration || !user?.id) return null;
    
    return createPurchaseWarehouseService(
      warehouseContext,
      user.id,
      enableDebugLogs
    );
  }, [warehouseContext, user?.id, enableWarehouseIntegration, enableDebugLogs]);

  // Get status display text
  const getStatusDisplayText = useCallback((status: PurchaseStatus): string => {
    const statusMap: Record<PurchaseStatus, string> = {
      pending: 'Menunggu',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return statusMap[status] || status;
  }, []);

  // Validate status change before execution
  const validateStatusChange = useCallback(async (
    purchaseId: string, 
    newStatus: PurchaseStatus
  ): Promise<{ canChange: boolean; warnings: string[]; errors: string[] }> => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const purchase = purchases.find(p => p.id === purchaseId);
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

    // Prevent changing from completed if warehouse integration is enabled
    if (oldStatus === 'completed' && newStatus !== 'completed' && enableWarehouseIntegration) {
      warnings.push('Mengubah status dari "Selesai" akan mengurangi stok dari warehouse');
    }

    // Validate completion requirements
    if (newStatus === 'completed') {
      if (purchase.items.length === 0) {
        errors.push('Tidak dapat menyelesaikan purchase tanpa item');
      }

      if (purchase.totalNilai <= 0) {
        errors.push('Total nilai purchase harus lebih dari 0');
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
  }, [purchases, enableWarehouseIntegration, warehouseService, enableDebugLogs]);

  // Main status update function
  const updateStatus = useCallback(async (
    purchaseId: string, 
    newStatus: PurchaseStatus
  ): Promise<void> => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) {
      onError?.('Purchase tidak ditemukan');
      throw new Error('Purchase not found');
    }

    const oldStatus = purchase.status;

    // Validate the status change
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

    setIsUpdating(purchaseId);
    
    try {
      // Step 1: Update purchase status
      const success = await onStatusUpdate(purchaseId, newStatus);
      
      if (!success) {
        throw new Error('Failed to update purchase status');
      }

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
            // You might want to revert the purchase status here or show a warning
            logger.warn(`Warehouse update failed for purchase ${purchaseId}, but purchase status was updated`);
            onError?.('Status purchase berhasil diupdate, tetapi gagal mengupdate warehouse. Periksa stok manual.');
          }
        } catch (warehouseError) {
          logger.error('Warehouse integration error:', warehouseError);
          onError?.('Status purchase berhasil diupdate, tetapi terjadi error pada warehouse integration.');
        }
      }

      // Success message
      const statusText = getStatusDisplayText(newStatus);
      const warehouseText = enableWarehouseIntegration && newStatus === 'completed' 
        ? ' dan stok warehouse telah diupdate' 
        : '';
      
      onSuccess?.(`Status berhasil diubah menjadi "${statusText}"${warehouseText}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsUpdating(null);
    }
  }, [
    purchases, 
    onStatusUpdate, 
    onError, 
    onSuccess, 
    warehouseService, 
    enableWarehouseIntegration,
    validateStatusChange,
    getStatusDisplayText
  ]);

  // Check if specific purchase is being updated
  const isUpdatingPurchase = useCallback((purchaseId: string) => {
    return isUpdating === purchaseId;
  }, [isUpdating]);

  return {
    updateStatus,
    isUpdating,
    isUpdatingPurchase,
    validateStatusChange
  };
};