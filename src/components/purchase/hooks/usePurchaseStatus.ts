// src/components/purchase/hooks/usePurchaseStatus.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PurchaseStatus, Purchase } from '../types/purchase.types';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

/**
 * Props
 * - onStatusUpdate: sebaiknya implementasinya memanggil purchaseApi.setPurchaseStatus(purchaseId, userId, newStatus)
 *   supaya manual warehouse sync yang mengatur stok + WAC berjalan.
 */
export interface UsePurchaseStatusProps {
  purchases: Purchase[];
  onStatusUpdate: (purchaseId: string, newStatus: PurchaseStatus) => Promise<boolean>;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;

  /**
   * Jika true, kita pakai WarehouseContext hanya untuk VALIDASI ringan (warning),
   * BUKAN untuk mengubah stok. Default: false (disarankan).
   */
  enableWarehouseValidationOnly?: boolean;

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
  enableWarehouseValidationOnly = false,
  enableDebugLogs = false,
}: UsePurchaseStatusProps): UsePurchaseStatusReturn => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Dynamic warehouse context
  const [warehouseContext, setWarehouseContext] = useState<any>({ 
    bahanBaku: [], 
    refreshData: async () => {} 
  });
  const { user } = useAuth();

  // Load warehouse context dynamically
  useEffect(() => {
    if (enableWarehouseValidationOnly) {
      import('@/components/warehouse/context/WarehouseContext')
        .then(({ useWarehouseContext }) => {
          try {
            const context = useWarehouseContext();
            setWarehouseContext(context);
          } catch (error) {
            logger.error('Error using warehouse context:', error);
          }
        })
        .catch(error => {
          logger.error('Failed to load warehouse context:', error);
        });
    }
  }, [enableWarehouseValidationOnly]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const statusDisplayMap = useMemo<Record<PurchaseStatus, string>>(
    () => ({ pending: 'Menunggu', completed: 'Selesai', cancelled: 'Dibatalkan' }),
    []
  );

  const getStatusDisplayText = useCallback(
    (status: PurchaseStatus): string => statusDisplayMap[status] || status,
    [statusDisplayMap]
  );

  const purchaseMap = useMemo(
    () => new Map(purchases.map((p) => [p.id, p])),
    [purchases]
  );

  // VALIDASI: tidak menyentuh stok; hanya kasih warning/pengecekan data
  const validateStatusChange = useCallback(async (
    purchaseId: string,
    newStatus: PurchaseStatus
  ): Promise<StatusChangeValidation> => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const purchase = purchaseMap.get(purchaseId);
    if (!purchase) {
      errors.push('Purchase tidak ditemukan');
      return { canChange: false, warnings, errors };
    }

    const oldStatus = purchase.status;

    if (oldStatus === newStatus) {
      warnings.push('Status tidak berubah');
      return { canChange: true, warnings, errors };
    }

    if (oldStatus === 'cancelled') {
      warnings.push('Purchase yang sudah dibatalkan sebaiknya tidak diubah statusnya');
    }

    // Info kepada user: perubahan dari completed akan mengoreksi stok via manual sync
    if (oldStatus === 'completed' && newStatus !== 'completed') {
      warnings.push('Mengubah status dari "Selesai" akan mengoreksi stok di gudang (manual sync).');
    }

    if (newStatus === 'completed') {
      if (!purchase.items || purchase.items.length === 0) {
        errors.push('Tidak dapat menyelesaikan purchase tanpa item');
      }
      if (!purchase.totalNilai || purchase.totalNilai <= 0) {
        errors.push('Total nilai purchase harus lebih dari 0');
      }
      if (!purchase.supplier) {
        errors.push('Supplier harus diisi sebelum menyelesaikan purchase');
      }

      const invalidItems = (purchase.items ?? []).filter((it) => {
        const issues = [];
        if (!it.bahanBakuId) issues.push('ID bahan baku');
        if (!it.nama || !it.nama.trim()) issues.push('nama');
        if (!it.quantity || it.quantity <= 0) issues.push('kuantitas');
        if (!it.satuan || !it.satuan.trim()) issues.push('satuan');
        // Allow zero price for free items or automatic calculation
        if (it.unitPrice === undefined || it.unitPrice === null || it.unitPrice < 0) {
          issues.push('harga satuan');
        }
        return issues.length > 0;
      });
      
      if (invalidItems.length > 0) {
        const firstItem = invalidItems[0];
        const itemName = firstItem.nama || 'Item tanpa nama';
        
        if (invalidItems.length === 1) {
          const missingFields = [];
          if (!firstItem.bahanBakuId) missingFields.push('ID bahan baku');
          if (!firstItem.nama || !firstItem.nama.trim()) missingFields.push('nama');
          if (!firstItem.quantity || firstItem.quantity <= 0) missingFields.push('kuantitas');
          if (!firstItem.satuan || !firstItem.satuan.trim()) missingFields.push('satuan');
          if (firstItem.unitPrice === undefined || firstItem.unitPrice === null || firstItem.unitPrice < 0) {
            missingFields.push('harga satuan');
          }
          errors.push(`Item "${itemName}" tidak lengkap: ${missingFields.join(', ')}`);
        } else {
          errors.push(`${invalidItems.length} item tidak lengkap`);
        }
      }

      // Validasi ringan terhadap master bahan (opsional)
      if (enableWarehouseValidationOnly && user?.id) {
        try {
          const missing = (purchase.items ?? []).filter(
            (it) =>
              !warehouseContext.bahanBaku.some(
                (b) =>
                  b.id === it.bahanBakuId ||
                  b.nama?.toLowerCase().trim() === it.nama?.toLowerCase().trim()
              )
          );
          if (missing.length > 0) {
            // Ini hanya warning; trigger tetap bisa apply karena pakai id
            warnings.push(`${missing.length} item belum terdaftar di master gudang (akan tetap diproses berdasarkan ID).`);
          }
        } catch (e) {
          if (enableDebugLogs) logger.warn('Warehouse validation skipped:', e);
        }
      }
    }

    return { canChange: errors.length === 0, warnings, errors };
  }, [purchaseMap, warehouseContext.bahanBaku, enableWarehouseValidationOnly, enableDebugLogs, user?.id]);

  const cancelUpdate = useCallback(() => setIsUpdating(null), []);

  const updateStatus = useCallback(async (purchaseId: string, newStatus: PurchaseStatus) => {
    const purchase = purchaseMap.get(purchaseId);
    if (!purchase) {
      const msg = 'Purchase tidak ditemukan';
      onError?.(msg);
      throw new Error(msg);
    }

    const oldStatus = purchase.status;
    const validation = await validateStatusChange(purchaseId, newStatus);

    if (!validation.canChange) {
      const msg = validation.errors.join(', ');
      onError?.(msg);
      throw new Error(msg);
    }

    if (validation.warnings.length && enableDebugLogs) {
      logger.warn(`Warnings (${purchaseId}):`, validation.warnings);
    }

    if (isUpdating && isUpdating !== purchaseId) {
      throw new Error('Sudah ada proses update yang sedang berjalan');
    }
    if (!isMountedRef.current) throw new Error('Component unmounted');

    setIsUpdating(purchaseId);

    try {
      const ok = await onStatusUpdate(purchaseId, newStatus);
      if (!ok) throw new Error('Gagal mengubah status purchase');

      // ✅ Manual warehouse sync handles stock and WAC updates when status = 'completed',
      // and adjusts stock when editing/deleting after completion.

      // Setelah status berhasil diubah, refresh data gudang agar stok terbaru ter-fetch
      try {
        await warehouseContext.refreshData();
      } catch (refreshError) {
        if (enableDebugLogs) {
          logger.warn('Gagal me-refresh data gudang:', refreshError);
        }
      }

      onSuccess?.(
        `Status berhasil diubah menjadi "${getStatusDisplayText(newStatus)}". Stok gudang akan tersinkron otomatis.`
      );
    } catch (e: any) {
      const msg = e?.message || 'Terjadi kesalahan saat mengubah status';
      onError?.(msg);
      throw e;
    } finally {
      if (isMountedRef.current) setIsUpdating(null);
    }
  }, [purchaseMap, onStatusUpdate, onError, onSuccess, validateStatusChange, getStatusDisplayText, isUpdating, enableDebugLogs]);

  const isUpdatingPurchase = useCallback((purchaseId: string) => isUpdating === purchaseId, [isUpdating]);

  return { updateStatus, isUpdating, isUpdatingPurchase, validateStatusChange, cancelUpdate };
};
