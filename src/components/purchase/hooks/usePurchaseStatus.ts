// src/components/purchase/hooks/usePurchaseStatus.ts

import { useState } from 'react';
import { PurchaseStatus } from '../types/purchase.types';

export interface UsePurchaseStatusProps {
  onStatusUpdate: (purchaseId: string, newStatus: PurchaseStatus) => Promise<boolean>;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const usePurchaseStatus = ({ 
  onStatusUpdate, 
  onError, 
  onSuccess 
}: UsePurchaseStatusProps) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const updateStatus = async (purchaseId: string, newStatus: PurchaseStatus): Promise<void> => {
    setIsUpdating(purchaseId);
    
    try {
      const success = await onStatusUpdate(purchaseId, newStatus);
      
      if (success) {
        const statusText = getStatusDisplayText(newStatus);
        onSuccess?.(`Status berhasil diubah menjadi "${statusText}"`);
      } else {
        throw new Error('Gagal mengubah status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      onError?.(errorMessage);
      throw error; // Re-throw untuk handling di component
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusDisplayText = (status: PurchaseStatus): string => {
    const statusMap: Record<PurchaseStatus, string> = {
      pending: 'Menunggu',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return statusMap[status] || status;
  };

  return {
    updateStatus,
    isUpdating,
    isUpdatingPurchase: (purchaseId: string) => isUpdating === purchaseId
  };
};