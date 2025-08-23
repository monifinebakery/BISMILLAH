// src/components/purchase/hooks/usePurchaseCore.ts
import { useMemo, useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { purchaseApi } from '../services/purchaseApi';
import { useAuth } from '@/contexts/AuthContext';

interface UsePurchaseCoreProps {
  purchaseContext: any;   // tetap fleksibel
  suppliers: any[];
}

export const usePurchaseCore = ({
  purchaseContext,
  suppliers
}: UsePurchaseCoreProps) => {
  const { user } = useAuth();
  const { purchases, updatePurchase, deletePurchase } = purchaseContext;

  // processing state
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const statsRef = useRef<any>(null);
  const validationRef = useRef<any>(null);

  // ---------- Stats ----------
  const stats = useMemo(() => {
    if (statsRef.current && statsRef.current.length === purchases.length) {
      return statsRef.current.stats;
    }
    const total = purchases.length;
    const totalValue = purchases.reduce((s: number, p: any) => s + Number(p.totalNilai ?? 0), 0);
    const statusCounts = purchases.reduce((acc: Record<string, number>, p: any) => {
      acc[p.status ?? 'pending'] = (acc[p.status ?? 'pending'] || 0) + 1;
      return acc;
    }, {});
    const calculated = {
      total,
      totalValue,
      byStatus: {
        pending: statusCounts.pending || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0
      },
      completionRate: total ? ((statusCounts.completed || 0) / total) * 100 : 0
    };
    statsRef.current = { length: purchases.length, stats: calculated };
    return calculated;
  }, [purchases]);

  // ---------- Data prerequisites ----------
  const validation = useMemo(() => {
    const suppliersLength = suppliers?.length || 0;
    if (
      validationRef.current &&
      validationRef.current.suppliersLength === suppliersLength
    ) {
      return validationRef.current.validation;
    }
    const calculated = {
      hasSuppliers: true,
      hasMinimumData: true,
      missingDataTypes: suppliersLength > 0 ? [] : ['suppliers']
    };
    validationRef.current = { suppliersLength, validation: calculated };
    return calculated;
  }, [suppliers?.length]);

  // ---------- Processing helpers ----------
  const addProcessing = useCallback((id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
  }, []);
  const removeProcessing = useCallback((id: string) => {
    setProcessingIds(prev => {
      const ns = new Set(prev); ns.delete(id); return ns;
    });
  }, []);
  const isProcessing = useCallback((id: string) => processingIds.has(id), [processingIds]);

  // ---------- Rules & helpers ----------
  const getStatusDisplayText = useCallback((status: string) => {
    const map: Record<string, string> = {
      pending: 'Menunggu',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };
    return map[status] || status;
  }, []);

  /** Validasi ringan (semua transisi diizinkan antar pending/completed/cancelled) */
  const validateStatusChange = useCallback((purchaseId: string, newStatus: 'pending'|'completed'|'cancelled') => {
    const p = purchases.find((x: any) => x.id === purchaseId);
    if (!p) return { canChange: false, warnings: [], errors: ['Pembelian tidak ditemukan'] };

    const warnings: string[] = [];
    const errors: string[] = [];

    if (p.status === newStatus) warnings.push('Status tidak berubah');

    if (newStatus === 'completed') {
      if (!p.items || p.items.length === 0) errors.push('Tidak dapat selesai tanpa item');
      if (!p.totalNilai || p.totalNilai <= 0) errors.push('Total nilai harus > 0');
      if (!p.supplier) errors.push('Supplier wajib diisi');
      
      // Enhanced item validation with better error messages
      const invalid = (p.items ?? []).filter((it: any) => {
        const missingFields = [];
        if (!it.bahanBakuId) missingFields.push('ID bahan baku');
        if (!it.nama || !it.nama.trim()) missingFields.push('nama item');
        if (!it.kuantitas || it.kuantitas <= 0) missingFields.push('kuantitas');
        if (!it.satuan || !it.satuan.trim()) missingFields.push('satuan');
        // Allow hargaSatuan to be 0 for automatic calculation or free items
        if (it.hargaSatuan === undefined || it.hargaSatuan === null || it.hargaSatuan < 0) {
          missingFields.push('harga satuan');
        }
        return missingFields.length > 0;
      });
      
      if (invalid.length) {
        // More descriptive error message
        const firstInvalidItem = invalid[0];
        const missingFields = [];
        if (!firstInvalidItem.bahanBakuId) missingFields.push('ID bahan baku');
        if (!firstInvalidItem.nama || !firstInvalidItem.nama.trim()) missingFields.push('nama');
        if (!firstInvalidItem.kuantitas || firstInvalidItem.kuantitas <= 0) missingFields.push('kuantitas');
        if (!firstInvalidItem.satuan || !firstInvalidItem.satuan.trim()) missingFields.push('satuan');
        if (firstInvalidItem.hargaSatuan === undefined || firstInvalidItem.hargaSatuan === null || firstInvalidItem.hargaSatuan < 0) {
          missingFields.push('harga satuan');
        }
        
        if (invalid.length === 1) {
          errors.push(`Item "${firstInvalidItem.nama || 'Tanpa nama'}" tidak lengkap: ${missingFields.join(', ')}`);
        } else {
          errors.push(`${invalid.length} item tidak lengkap (contoh: ${missingFields.join(', ')})`);
        }
      }
    }

    // info buat user kalau revert dari completed
    if (p.status === 'completed' && newStatus !== 'completed') {
      warnings.push('Mengubah dari "Selesai" akan mengoreksi stok gudang otomatis.');
    }

    return { canChange: errors.length === 0, warnings, errors };
  }, [purchases]);

  // ---------- Permissions (edit/delete selalu boleh, hanya beri info) ----------
  const canEdit = useCallback((purchase: any) => {
    if (isProcessing(purchase.id)) {
      toast.warning('Pembelian sedang diproses, tunggu sebentar');
      return false;
    }
    if (purchase.status === 'completed') {
      // izinkan edit, beri info
      toast.message('Edit setelah selesai diperbolehkan. Stok akan disesuaikan otomatis.');
    }
    return true;
  }, [isProcessing]);

  const canDelete = useCallback((purchase: any) => {
    if (isProcessing(purchase.id)) {
      toast.warning('Pembelian sedang diproses, tunggu sebentar');
      return false;
    }
    // izinkan delete; manual sync akan rollback stok jika sudah applied
    return true;
  }, [isProcessing]);

  // ---------- Actions ----------
  /** Ubah status via API khusus supaya manual sync jalan */
  const updateStatus = useCallback(async (purchaseId: string, newStatus: 'pending'|'completed'|'cancelled'): Promise<boolean> => {
    const v = validateStatusChange(purchaseId, newStatus);
    if (!v.canChange) {
      toast.error(v.errors[0] || 'Perubahan status tidak valid');
      return false;
    }
    v.warnings.forEach(w => toast.warning(w));

    addProcessing(purchaseId);
    try {
      if (!user?.id) throw new Error('User belum login');
      const res = await purchaseApi.setPurchaseStatus(purchaseId, user.id, newStatus);
      if (res.success) {
        toast.success(`Status berhasil diubah ke ${getStatusDisplayText(newStatus)}. Stok gudang akan tersinkron otomatis.`);
        return true;
      }
      throw new Error(res.error || 'Gagal update status');
    } catch (e: any) {
      logger.error('Error updating status', e);
      toast.error(e?.message || 'Gagal mengubah status');
      return false;
    } finally {
      removeProcessing(purchaseId);
    }
  }, [user?.id, addProcessing, removeProcessing, validateStatusChange, getStatusDisplayText]);

  /** Edit purchase (boleh setelah completed) — gunakan context.updatePurchase */
  const updatePurchasePatch = useCallback(async (id: string, patch: any): Promise<boolean> => {
    addProcessing(id);
    try {
      const ok = await updatePurchase(id, patch);
      if (ok) toast.success('Pembelian berhasil diperbarui. Stok gudang akan dikoreksi otomatis bila diperlukan.');
      return ok;
    } catch (e: any) {
      logger.error('Update purchase error', e);
      toast.error(e?.message || 'Gagal memperbarui pembelian');
      return false;
    } finally {
      removeProcessing(id);
    }
  }, [updatePurchase, addProcessing, removeProcessing]);

  /** Hapus purchase (selalu boleh) — trigger DB rollback stok jika sudah applied */
  const handleDelete = useCallback(async (purchaseId: string): Promise<{ success: boolean; error: string | null }> => {
    const p = purchases.find((x: any) => x.id === purchaseId);
    if (!p) return { success: false, error: 'Pembelian tidak ditemukan' };
    if (!canDelete(p)) return { success: false, error: 'Sedang diproses' };

    addProcessing(purchaseId);
    try {
      const ok = await deletePurchase(purchaseId);
      if (ok) toast.success('Pembelian dihapus. Stok gudang disesuaikan otomatis.');
      return { success: ok, error: ok ? null : 'Gagal menghapus pembelian' };
    } catch (e: any) {
      logger.error('Delete purchase error', e);
      return { success: false, error: e?.message || 'Gagal menghapus pembelian' };
    } finally {
      removeProcessing(purchaseId);
    }
  }, [purchases, deletePurchase, canDelete, addProcessing, removeProcessing]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    const res = { successCount: 0, failCount: 0, errors: [] as string[] };
    for (const id of ids) {
      const r = await handleDelete(id);
      if (r.success) res.successCount++;
      else { res.failCount++; if (r.error) res.errors.push(r.error); }
    }
    return res;
  }, [handleDelete]);

  const handleBulkStatusUpdate = useCallback(async (ids: string[], newStatus: 'pending'|'completed'|'cancelled') => {
    const res = { successCount: 0, failCount: 0 };
    for (const id of ids) {
      const ok = await updateStatus(id, newStatus);
      ok ? res.successCount++ : res.failCount++;
    }
    return res;
  }, [updateStatus]);

  // ---------- Return API ----------
  return {
    // Stats
    stats,

    // Validation / prerequisites
    validation,
    validatePrerequisites: useCallback((): boolean => {
      if (!suppliers?.length) {
        toast.warning('Belum ada data supplier. Kamu bisa menambahkannya nanti.');
      }
      return true;
    }, [suppliers?.length]),

    // Status operations
    canEdit,
    canDelete,
    validateStatusChange,
    updateStatus,             // pakai purchaseApi.setPurchaseStatus
    updatePurchase: updatePurchasePatch,

    // Core ops
    handleDelete,
    handleBulkDelete,
    handleBulkStatusUpdate,

    // Processing
    isProcessing: processingIds.size > 0,
    isProcessingPurchase: isProcessing,
    processingCount: processingIds.size,

    // Utils
    findPurchase: useCallback((id: string) => purchases.find((p: any) => p.id === id), [purchases]),
    getPurchasesByStatus: useCallback((s: string) => purchases.filter((p: any) => p.status === s), [purchases]),
    getSupplierPurchases: useCallback((sid: string) => purchases.filter((p: any) => p.supplier === sid), [purchases])
  };
};
