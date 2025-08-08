// src/components/purchase/hooks/usePurchaseCore.ts - Optimized Dependencies & Performance
/**
 * ✅ CONSOLIDATED: Purchase Core Hook
 * 
 * Combines functionality from:
 * - usePurchaseStats (stats calculation)
 * - usePurchaseStatus (status management)
 * - Purchase validation logic
 * - Status update operations
 * - Processing state management
 * 
 * Single hook to reduce dependencies in PurchasePage
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// ✅ TYPES: Keep interface minimal but extensible
interface UsePurchaseCoreProps {
  purchaseContext: any; // PurchaseContextType - kept flexible for better compatibility
  suppliers: any[];
  bahanBaku: any[];
}

// ✅ INTERNAL: Status transition rules
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [], // No transitions from completed
  cancelled: ['pending'] // Can reopen cancelled purchases
};

// ✅ INTERNAL: Status validation messages
const STATUS_MESSAGES = {
  completed: 'Pembelian yang sudah selesai tidak dapat diubah',
  processing: 'Pembelian sedang diproses, tunggu sebentar',
  invalidTransition: 'Perubahan status tidak valid dari'
};

export const usePurchaseCore = ({
  purchaseContext,
  suppliers,
  bahanBaku
}: UsePurchaseCoreProps) => {
  const { purchases, updatePurchase, deletePurchase } = purchaseContext;
  
  // ✅ OPTIMIZED: Processing state with Set for better performance
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  // ✅ OPTIMIZED: Ref for preventing unnecessary re-calculations
  const statsRef = useRef<any>(null);
  const validationRef = useRef<any>(null);

  // ✅ MEMOIZED: Stats calculation (was usePurchaseStats)
  const stats = useMemo(() => {
    // ✅ OPTIMIZATION: Early return if no changes
    if (statsRef.current && statsRef.current.length === purchases.length) {
      return statsRef.current.stats;
    }

    const total = purchases.length;
    const totalValue = purchases.reduce((sum: number, p: any) => sum + (p.totalNilai || p.total || 0), 0);
    
    // ✅ OPTIMIZED: Status aggregation with single pass
    const statusCounts = purchases.reduce((acc: Record<string, number>, p: any) => {
      const status = p.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const calculatedStats = {
      total,
      totalValue,
      byStatus: {
        pending: statusCounts.pending || 0,
        approved: statusCounts.approved || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0
      },
      // ✅ ADDITIONAL: Performance metrics
      completionRate: total > 0 ? ((statusCounts.completed || 0) / total) * 100 : 0,
      pendingValue: purchases
        .filter((p: any) => p.status === 'pending')
        .reduce((sum: number, p: any) => sum + (p.totalNilai || p.total || 0), 0)
    };

    // ✅ CACHE: Store for next comparison
    statsRef.current = { length: purchases.length, stats: calculatedStats };
    
    return calculatedStats;
  }, [purchases]);

  // ✅ MEMOIZED: Validation logic with caching
  const validation = useMemo(() => {
    // ✅ OPTIMIZATION: Cache validation if data hasn't changed
    const suppliersLength = suppliers?.length || 0;
    const bahanBakuLength = bahanBaku?.length || 0;
    
    if (validationRef.current && 
        validationRef.current.suppliersLength === suppliersLength &&
        validationRef.current.bahanBakuLength === bahanBakuLength) {
      return validationRef.current.validation;
    }

    const calculatedValidation = {
      hasSuppliers: suppliersLength > 0,
      hasBahanBaku: bahanBakuLength > 0,
      hasMinimumData: suppliersLength > 0 && bahanBakuLength > 0,
      // ✅ ADDITIONAL: Detailed validation info
      missingDataTypes: [
        ...(!suppliersLength ? ['suppliers'] : []),
        ...(!bahanBakuLength ? ['bahanBaku'] : [])
      ]
    };

    // ✅ CACHE: Store for next comparison
    validationRef.current = {
      suppliersLength,
      bahanBakuLength,
      validation: calculatedValidation
    };

    return calculatedValidation;
  }, [suppliers?.length, bahanBaku?.length]);

  // ✅ MEMOIZED: Processing operations
  const processingOperations = useMemo(() => ({
    addProcessing: (id: string) => {
      setProcessingIds(prev => new Set(prev).add(id));
    },
    
    removeProcessing: (id: string) => {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
    
    isProcessing: (id: string) => processingIds.has(id),
    
    hasAnyProcessing: processingIds.size > 0
  }), [processingIds]);

  // ✅ CONSOLIDATED: Status operations (was usePurchaseStatus)
  const statusOperations = useMemo(() => ({
    canEdit: (purchase: any): boolean => {
      if (purchase.status === 'completed') {
        toast.error(STATUS_MESSAGES.completed);
        return false;
      }
      
      if (processingOperations.isProcessing(purchase.id)) {
        toast.warning(STATUS_MESSAGES.processing);
        return false;
      }
      
      return true;
    },

    canDelete: (purchase: any): boolean => {
      if (purchase.status === 'completed') {
        toast.error(STATUS_MESSAGES.completed);
        return false;
      }
      
      if (processingOperations.isProcessing(purchase.id)) {
        toast.warning(STATUS_MESSAGES.processing);
        return false;
      }
      
      return true;
    },

    validateStatusChange: (purchaseId: string, newStatus: string): any => {
      const purchase = purchases.find((p: any) => p.id === purchaseId);
      if (!purchase) {
        return {
          canChange: false,
          warnings: [],
          errors: ['Pembelian tidak ditemukan']
        };
      }

      const currentStatus = purchase.status;
      const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
      
      if (!allowedTransitions.includes(newStatus)) {
        return {
          canChange: false,
          warnings: [],
          errors: [`${STATUS_MESSAGES.invalidTransition} ${currentStatus} ke ${newStatus}`]
        };
      }

      // ✅ ENHANCED: Add business logic warnings
      const warnings = [];
      if (newStatus === 'completed' && currentStatus === 'pending') {
        warnings.push('Mengubah status langsung ke selesai tanpa persetujuan');
      }

      return {
        canChange: true,
        warnings,
        errors: []
      };
    },

    getStatusDisplayText: (status: string): string => {
      const statusMap: Record<string, string> = {
        pending: 'Menunggu',
        approved: 'Disetujui',
        completed: 'Selesai',
        cancelled: 'Dibatalkan'
      };
      return statusMap[status] || status;
    }
  }), [purchases, processingOperations]);

  // ✅ CONSOLIDATED: Core operations with better error handling
  const coreOperations = {
    validatePrerequisites: useCallback((): boolean => {
      const { hasSuppliers, hasBahanBaku, missingDataTypes } = validation;
      
      if (missingDataTypes.length === 2) {
        toast.error('Mohon tambahkan data supplier dan bahan baku terlebih dahulu');
        return false;
      }
      
      if (!hasSuppliers) {
        toast.error('Mohon tambahkan data supplier terlebih dahulu');
        return false;
      }
      
      if (!hasBahanBaku) {
        toast.warning('Data bahan baku kosong. Tambahkan bahan baku untuk hasil yang optimal');
        // Allow to continue but show warning
      }
      
      return true;
    }, [validation]),

    updateStatus: useCallback(async (purchaseId: string, newStatus: string): Promise<boolean> => {
      // ✅ VALIDATION: Check if status change is valid
      const validationResult = statusOperations.validateStatusChange(purchaseId, newStatus);
      if (!validationResult.canChange) {
        toast.error(validationResult.errors[0] || 'Perubahan status tidak valid');
        return false;
      }

      // ✅ WARNING: Show warnings if any
      if (validationResult.warnings.length > 0) {
        validationResult.warnings.forEach((warning: string) => toast.warning(warning));
      }

      processingOperations.addProcessing(purchaseId);
      
      try {
        const purchase = purchases.find((p: any) => p.id === purchaseId);
        if (!purchase) {
          throw new Error('Purchase not found');
        }

        const success = await updatePurchase(purchaseId, { status: newStatus });
        
        if (success) {
          const statusText = statusOperations.getStatusDisplayText(newStatus);
          toast.success(`Status berhasil diubah ke ${statusText}`);
        }
        
        return success;
      } catch (error) {
        logger.error('Error updating purchase status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Gagal mengubah status: ${errorMessage}`);
        return false;
      } finally {
        processingOperations.removeProcessing(purchaseId);
      }
    }, [purchases, updatePurchase, statusOperations, processingOperations]),

    handleDelete: useCallback(async (purchaseId: string): Promise<{ success: boolean; error: string | null }> => {
      const purchase = purchases.find((p: any) => p.id === purchaseId);
      if (!purchase) {
        return { success: false, error: 'Pembelian tidak ditemukan' };
      }

      if (!statusOperations.canDelete(purchase)) {
        return { success: false, error: 'Pembelian tidak dapat dihapus' };
      }

      processingOperations.addProcessing(purchaseId);
      
      try {
        const success = await deletePurchase(purchaseId);
        return { 
          success, 
          error: success ? null : 'Gagal menghapus pembelian'
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error deleting purchase:', error);
        return { 
          success: false, 
          error: `Terjadi kesalahan saat menghapus pembelian: ${errorMessage}` 
        };
      } finally {
        processingOperations.removeProcessing(purchaseId);
      }
    }, [purchases, deletePurchase, statusOperations, processingOperations]),

    // ✅ NEW: Bulk operations support
    handleBulkDelete: useCallback(async (purchaseIds: string[]): Promise<{ successCount: number; failCount: number; errors: string[] }> => {
      const results = { successCount: 0, failCount: 0, errors: [] as string[] };
      
      for (const id of purchaseIds) {
        const result = await coreOperations.handleDelete(id);
        if (result.success) {
          results.successCount++;
        } else {
          results.failCount++;
          if (result.error) {
            results.errors.push(result.error);
          }
        }
      }
      
      return results;
    }, []),

    // ✅ NEW: Status bulk update
    handleBulkStatusUpdate: useCallback(async (purchaseIds: string[], newStatus: string): Promise<{ successCount: number; failCount: number }> => {
      const results = { successCount: 0, failCount: 0 };
      
      for (const id of purchaseIds) {
        const success = await coreOperations.updateStatus(id, newStatus);
        if (success) {
          results.successCount++;
        } else {
          results.failCount++;
        }
      }
      
      return results;
    }, [])
  };

  // ✅ RETURN: Comprehensive API
  return {
    // Stats (enhanced)
    stats,
    
    // Validation
    validation,
    validatePrerequisites: coreOperations.validatePrerequisites,
    
    // Status operations (enhanced)
    canEdit: statusOperations.canEdit,
    canDelete: statusOperations.canDelete,
    validateStatusChange: statusOperations.validateStatusChange,
    updateStatus: coreOperations.updateStatus,
    getStatusDisplayText: statusOperations.getStatusDisplayText,
    
    // Core operations (enhanced)
    handleDelete: coreOperations.handleDelete,
    handleBulkDelete: coreOperations.handleBulkDelete,
    handleBulkStatusUpdate: coreOperations.handleBulkStatusUpdate,
    
    // Processing state (enhanced)
    isProcessing: processingOperations.hasAnyProcessing,
    isProcessingPurchase: processingOperations.isProcessing,
    processingCount: processingIds.size,
    
    // ✅ NEW: Utility methods
    findPurchase: useCallback((id: string) => purchases.find((p: any) => p.id === id), [purchases]),
    getPurchasesByStatus: useCallback((status: string) => purchases.filter((p: any) => p.status === status), [purchases]),
    getSupplierPurchases: useCallback((supplierId: string) => purchases.filter((p: any) => p.supplier === supplierId), [purchases])
  };
};