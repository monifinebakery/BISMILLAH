// src/components/purchase/hooks/usePurchaseCore.ts
/**
 * ✅ CONSOLIDATED: Purchase Core Hook
 * 
 * Combines functionality from:
 * - usePurchaseStats
 * - usePurchaseStatus
 * - Purchase validation logic
 * - Status update operations
 * 
 * Single hook to reduce dependencies in PurchasePage
 */

import { useMemo, useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UsePurchaseCoreProps {
  purchaseContext: PurchaseContextType; // Use the existing context type
  suppliers: any[];
  bahanBaku: any[];
}

export const usePurchaseCore = ({
  purchaseContext,
  suppliers,
  bahanBaku
}: UsePurchaseCoreProps) => {
  const { purchases, updatePurchase, deletePurchase } = purchaseContext;
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ✅ CONSOLIDATED: Stats calculation (was usePurchaseStats)
  const stats = useMemo(() => {
    const total = purchases.length;
    const totalValue = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    
    const byStatus = purchases.reduce((acc, p) => {
      const status = p.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      totalValue,
      byStatus: {
        pending: byStatus.pending || 0,
        approved: byStatus.approved || 0,
        completed: byStatus.completed || 0,
        cancelled: byStatus.cancelled || 0
      }
    };
  }, [purchases]);

  // ✅ CONSOLIDATED: Validation logic
  const validation = useMemo(() => ({
    hasSuppliers: suppliers.length > 0,
    hasBahanBaku: bahanBaku.length > 0,
    hasMinimumData: suppliers.length > 0 && bahanBaku.length > 0
  }), [suppliers.length, bahanBaku.length]);

  // ✅ CONSOLIDATED: Status operations (was usePurchaseStatus)
  const statusOperations = {
    canEdit: useCallback((purchase: any) => {
      if (purchase.status === 'completed') {
        toast.error('Pembelian yang sudah selesai tidak dapat diedit');
        return false;
      }
      
      if (processingIds.has(purchase.id)) {
        toast.warning('Pembelian sedang diproses, tunggu sebentar');
        return false;
      }
      
      return true;
    }, [processingIds]),

    canDelete: useCallback((purchase: any) => {
      if (purchase.status === 'completed') {
        toast.error('Pembelian yang sudah selesai tidak dapat dihapus');
        return false;
      }
      
      if (processingIds.has(purchase.id)) {
        toast.warning('Pembelian sedang diproses, tunggu sebentar');
        return false;
      }
      
      return true;
    }, [processingIds]),

    validateStatusChange: useCallback((purchaseId: string, newStatus: string) => {
      const purchase = purchases.find(p => p.id === purchaseId);
      if (!purchase) return false;

      // Add your status change validation logic here
      const validTransitions: Record<string, string[]> = {
        pending: ['approved', 'cancelled'],
        approved: ['completed', 'cancelled'],
        completed: [],
        cancelled: ['pending']
      };

      return validTransitions[purchase.status]?.includes(newStatus) || false;
    }, [purchases])
  };

  // ✅ CONSOLIDATED: Core operations
  const coreOperations = {
    validatePrerequisites: useCallback(() => {
      if (!validation.hasSuppliers && !validation.hasBahanBaku) {
        toast.error('Mohon tambahkan data supplier dan bahan baku terlebih dahulu');
        return false;
      }
      
      if (!validation.hasSuppliers) {
        toast.error('Mohon tambahkan data supplier terlebih dahulu');
        return false;
      }
      
      if (!validation.hasBahanBaku) {
        toast.warning('Data bahan baku kosong. Tambahkan bahan baku untuk hasil yang optimal');
        // Allow to continue but show warning
      }
      
      return true;
    }, [validation]),

    updateStatus: useCallback(async (purchaseId: string, newStatus: string) => {
      if (!statusOperations.validateStatusChange(purchaseId, newStatus)) {
        toast.error('Perubahan status tidak valid');
        return false;
      }

      setProcessingIds(prev => new Set(prev).add(purchaseId));
      
      try {
        const purchase = purchases.find(p => p.id === purchaseId);
        if (!purchase) {
          throw new Error('Purchase not found');
        }

        const updatedPurchase = { ...purchase, status: newStatus };
        const success = await updatePurchase(purchaseId, updatedPurchase);
        
        if (success) {
          toast.success(`Status berhasil diubah ke ${newStatus}`);
        }
        
        return success;
      } catch (error) {
        console.error('Error updating purchase status:', error);
        toast.error('Gagal mengubah status');
        return false;
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(purchaseId);
          return newSet;
        });
      }
    }, [purchases, updatePurchase, statusOperations]),

    handleDelete: useCallback(async (purchaseId: string) => {
      const purchase = purchases.find(p => p.id === purchaseId);
      if (!purchase) {
        return { success: false, error: 'Pembelian tidak ditemukan' };
      }

      if (!statusOperations.canDelete(purchase)) {
        return { success: false, error: 'Pembelian tidak dapat dihapus' };
      }

      setProcessingIds(prev => new Set(prev).add(purchaseId));
      
      try {
        const success = await deletePurchase(purchaseId);
        return { success, error: success ? null : 'Gagal menghapus pembelian' };
      } catch (error) {
        return { success: false, error: 'Terjadi kesalahan saat menghapus pembelian' };
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(purchaseId);
          return newSet;
        });
      }
    }, [purchases, deletePurchase, statusOperations])
  };

  return {
    // Stats
    stats,
    
    // Validation
    validation,
    validatePrerequisites: coreOperations.validatePrerequisites,
    
    // Status operations
    canEdit: statusOperations.canEdit,
    canDelete: statusOperations.canDelete,
    validateStatusChange: statusOperations.validateStatusChange,
    updateStatus: coreOperations.updateStatus,
    
    // Core operations
    handleDelete: coreOperations.handleDelete,
    
    // Processing state
    isProcessing: processingIds.size > 0,
    isProcessingPurchase: (id: string) => processingIds.has(id)
  };
};