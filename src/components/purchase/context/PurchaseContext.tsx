// src/components/purchase/context/PurchaseContext.tsx
// ✅ PERFORMANCE & MERGED CORE: Context ini sudah menggabungkan fungsionalitas usePurchaseCore
// - Optimistic updates untuk create/update/status/delete
// - Stats, bulk ops, validate prerequisites
// - Edit/Hapus setelah 'completed' diperbolehkan (stok & WAC diurus manual sync)
// - Realtime aman (hindari refetch berlebih)
// ✅ TAMBAH: Invalidate warehouse data setiap ada perubahan purchase

import React, { createContext, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';

// ✅ SAFE CONTEXT IMPORTS: Import contexts directly to check availability
import FinancialContext from '@/components/financial/contexts/FinancialContext';
import { SupplierContext } from '@/contexts/SupplierContext';
import { ensureBahanBakuIdsForItems } from '@/components/warehouse/utils/warehouseItemUtils';
import { PurchaseApiService } from '../services/purchaseApi';
import type { Purchase, PurchaseContextType, PurchaseStatus, PurchaseItem } from '../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';
import {
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB,
} from '../utils/purchaseTransformers';
import { validatePurchaseData, getStatusDisplayText } from '../utils/purchaseHelpers';
import { purchaseQueryKeys } from '../query/purchase.queryKeys';
import { broadcastPurchaseCreated } from '../utils/purchaseBroadcast';
import { onCompletedFinancialSync, onRevertedFinancialCleanup, cleanupFinancialForDeleted } from '../utils/financialSync';

// ✅ WAREHOUSE QUERY KEYS: Untuk invalidation
const warehouseQueryKeys = {
  list: () => ['warehouse', 'list'] as const,
  analysis: () => ['warehouse', 'analysis'] as const,
} as const;

// ------------------- API helpers -------------------
const fetchPurchases = async (userId: string): Promise<Purchase[]> => {
  const { data, error } = await PurchaseApiService.fetchPurchases(userId);
  if (error) throw new Error(error);
  return data || [];
};

// ✅ NEW: Fungsi untuk mengambil data purchase dengan paginasi
const fetchPurchasesPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Purchase[]; total: number; totalPages: number }> => {
  const { data, total, totalPages, error } = await PurchaseApiService.fetchPurchasesPaginated(userId, page, limit);
  if (error) throw new Error(error);
  return { data, total, totalPages };
};

// CREATE via service and fetch fresh row in service
const apiCreatePurchase = async (payload: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string) => {
  logger.debug('🆕 apiCreatePurchase called');
  const { data, error } = await PurchaseApiService.createPurchaseAndFetch(payload, userId);
  if (error || !data) throw new Error(error || 'Gagal membuat pembelian');
  logger.info('✅ apiCreatePurchase success', { id: data.id });
  return data;
};

const apiUpdatePurchase = async (id: string, updates: Partial<Purchase>, userId: string) => {
  logger.debug('✏️ apiUpdatePurchase called:', { id });
  const { data, error } = await PurchaseApiService.updatePurchaseAndFetch(id, updates, userId);
  if (error || !data) throw new Error(error || 'Gagal memperbarui pembelian');
  logger.info('✅ apiUpdatePurchase success', { id: data.id });
  return data;
};

// Status via service (service handles manual warehouse sync) and fetch within service
const apiSetStatus = async (id: string, userId: string, newStatus: PurchaseStatus) => {
  logger.debug('📊 apiSetStatus called:', { id, newStatus });
  const { data, error } = await PurchaseApiService.setStatusAndFetch(id, userId, newStatus);
  if (error || !data) throw new Error(error || 'Gagal update status');
  logger.info('✅ apiSetStatus success', { id: data.id, status: data.status });
  return data;
};

const apiDeletePurchase = async (id: string, userId: string) => {
  const res = await PurchaseApiService.deletePurchase(id, userId);
  if (!res.success) throw new Error(res.error || 'Gagal menghapus pembelian');
};

// ------------------- Context -------------------
const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// Export the context for use in hooks
export { PurchaseContext };

export const PurchaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { addActivity } = useActivity();
  
  // ✅ SAFE CONTEXT ACCESS: Use optional context pattern
  const financialContext = useContext(FinancialContext);
  
  // Financial context handlers with safe fallbacks using useMemo
  const addFinancialTransaction = useMemo(() => {
    if (financialContext?.addFinancialTransaction) {
      logger.debug('PurchaseContext: FinancialContext available');
      return financialContext.addFinancialTransaction;
    }
    logger.warn('PurchaseContext: FinancialContext not available, using fallbacks');
    return async () => {
      logger.debug('PurchaseContext: addFinancialTransaction not available, skipping');
      return false;
    };
  }, [financialContext]);
  
  const deleteFinancialTransaction = useMemo(() => {
    if (financialContext?.deleteFinancialTransaction) {
      return financialContext.deleteFinancialTransaction;
    }
    return async () => {
      logger.debug('PurchaseContext: deleteFinancialTransaction not available, skipping');
      return false;
    };
  }, [financialContext]);
  
  // ✅ Supplier context access with safe fallback (no hook rule violations)
  const supplierContext = useContext(SupplierContext);
  const suppliers = useMemo(() => {
    if (supplierContext?.suppliers) {
      logger.debug('PurchaseContext: SupplierContext available');
      return supplierContext.suppliers;
    }
    logger.warn('PurchaseContext: SupplierContext not available, using fallback empty list');
    return [];
  }, [supplierContext]);
  
  const { addNotification } = useNotification();
  
  // ✅ FIXED: Safe warehouse context access without try-catch around hooks
  const warehouseContext = useBahanBaku();
  const bahanBaku = warehouseContext?.bahanBaku || [];
  const addBahanBaku = warehouseContext?.addBahanBaku || (async (_: any) => {
    logger.warn('addBahanBaku not available in warehouse context');
    return false;
  });
  const getSupplierName = useCallback((supplierValue: string): string => {
    // Handle supplier field that could be either ID or name
    try {
      if (!supplierValue || typeof supplierValue !== 'string') {
        return 'Supplier Tidak Diketahui';
      }
      
      const trimmedValue = supplierValue.trim();
      if (!trimmedValue) {
        return 'Supplier Tidak Diketahui';
      }
      
      // If supplierValue looks like an ID (UUID pattern), try to find the supplier name
      if (trimmedValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const supplierFound = suppliers?.find(s => s.id === trimmedValue);
        if (supplierFound) {
          return supplierFound.nama;
        }
        // If ID not found, return "Unknown Supplier" with ID hint
        return `Supplier (${trimmedValue.slice(0, 8)}...)`;
      }
      
      // If it's not an ID pattern, assume it's already a name
      return trimmedValue;
    } catch {
      return supplierValue || 'Supplier Tidak Diketahui';
    }
  }, [suppliers]);

  // ✅ HELPER: Invalidate warehouse data after purchase changes
  const invalidateWarehouseData = useCallback(() => {
    logger.debug('🔄 Invalidating warehouse data');
    queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
    queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.analysis() });
  }, [queryClient]);

  // ✅ Moved to util: ensure all items have bahanBakuId (decoupled from context)
  const ensureBahanBakuIds = useCallback(
    async (items: PurchaseItem[], supplierId: string): Promise<PurchaseItem[]> => {
      return ensureBahanBakuIdsForItems(items, supplierId, {
        bahanBaku,
        addBahanBaku,
      });
    },
    [bahanBaku, addBahanBaku]
  );

  // ------------------- Query (list) -------------------
  const {
    data: purchases = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: purchaseQueryKeys.list(user?.id),
    queryFn: () => fetchPurchases(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minute cache for better performance
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: (count, err: any) => {
      const code = err?.code ?? err?.status;
      // Don't retry client errors (4xx)
      if (code >= 400 && code < 500) return false;
      // Retry server errors up to 2 times
      return count < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // PERFORMANCE: Only refetch if data is stale
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ------------------- Optimistic helpers -------------------
  const setCacheList = useCallback((updater: (old: Purchase[]) => Purchase[]) => {
    queryClient.setQueryData(purchaseQueryKeys.list(user?.id), (old: Purchase[] | undefined) => {
      return updater(old || []);
    });
  }, [queryClient, user?.id]);

  const findPurchase = useCallback((id: string) => (purchases as Purchase[]).find((p: Purchase) => p.id === id), [purchases]);

  // ------------------- Stats (memo) -------------------
  const stats = useMemo(() => {
    const total = (purchases as Purchase[]).length;
    const totalValue = (purchases as Purchase[]).reduce((sum: number, p: Purchase) => sum + Number(((p as any).totalNilai ?? (p as any).total_nilai ?? 0)), 0);
    const statusCounts = (purchases as Purchase[]).reduce((acc: Record<string, number>, p: Purchase) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    return {
      total,
      total_nilai: totalValue,
      byStatus: {
        pending: statusCounts.pending || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0,
      },
      completionRate: total ? ((statusCounts.completed || 0) / total) * 100 : 0,
    };
  }, [purchases]);

  // ------------------- Mutations -------------------

  // CREATE (optimistic append)
  const createMutation = useMutation({
    mutationFn: (payload: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => apiCreatePurchase(payload, user!.id),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
      const prev = queryClient.getQueryData<Purchase[]>(purchaseQueryKeys.list(user?.id)) || [];
      const temp: Purchase = {
        id: `temp-${Date.now()}`,
        userId: user!.id,
        supplier: payload.supplier,
        tanggal: payload.tanggal,
        total_nilai: payload.total_nilai,
        items: payload.items,
        status: payload.status ?? 'pending',
        metode_perhitungan: payload.metode_perhitungan ?? 'AVERAGE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCacheList((old) => [temp, ...old]);
      return { prev, tempId: temp.id };
    },
    onSuccess: async (newRow, _payload, ctx) => {
      console.log('✅ Create mutation success:', newRow.id);
      // swap temp with real
      setCacheList((old) => [newRow, ...old.filter((p) => p.id !== ctx?.tempId)]);

      // Tambahkan otomatis bahan baku baru jika belum ada di gudang
      try {
        for (const item of newRow.items || []) {
          const exists = (bahanBaku as any[])?.some((bb: any) => bb.id === item.bahanBakuId);
          if (!exists) {
            await addBahanBaku({
              id: item.bahanBakuId,
              nama: item.nama,
              kategori: 'Lainnya',
              // Manual sync: stok awal selalu 0. Akan dinaikkan saat status 'completed'.
              stok: 0,
              minimum: 0,
              satuan: item.satuan || '-',
              harga: item.unitPrice || 0,
              supplier: newRow.supplier,
            });
          }
        }
      } catch (e) {
        logger.error('Gagal menambahkan bahan baku baru dari pembelian', e);
      }

      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();
      // ✅ INVALIDATE PURCHASE STATS
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(user?.id) });
      // ✅ Broadcast info
      broadcastPurchaseCreated(newRow, getSupplierName, addActivity, addNotification);
    },
    onError: (err, _payload, ctx) => {
      // rollback
      if (ctx?.prev) queryClient.setQueryData(purchaseQueryKeys.list(user?.id), ctx.prev);
      toast.error(`Gagal membuat pembelian: ${err instanceof Error ? err.message : 'Error'}`);
    },
    // tidak perlu invalidate di onSettled karena kita sudah set cache dengan data hasil insert
  });

  // UPDATE (optimistic merge)
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Purchase> }) => apiUpdatePurchase(id, updates, user!.id),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
      const prev = queryClient.getQueryData<Purchase[]>(purchaseQueryKeys.list(user?.id)) || [];
      setCacheList((old) =>
        old.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } as Purchase : p))
      );
      return { prev, id };
    },
    onSuccess: (fresh, _vars, ctx) => {
      logger.info('✅ Update mutation success:', { id: fresh.id });
      setCacheList((old) => old.map((p) => (p.id === ctx?.id ? fresh : p)));

      // ✅ OPTIMIZED: Only invalidate warehouse if items changed
      if (_vars.updates.items || _vars.updates.status) {
        invalidateWarehouseData();
      }
      // ✅ INVALIDATE PURCHASE STATS
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(user?.id) });

      toast.success('Pembelian diperbarui. (Stok akan disesuaikan otomatis bila diperlukan)');
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(purchaseQueryKeys.list(user?.id), ctx.prev);
      toast.error(`Gagal memperbarui pembelian: ${err instanceof Error ? err.message : 'Error'}`);
    },
  });

  // SET STATUS (optimistic)
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: PurchaseStatus }) => {
      logger.debug('🔄 Status mutation called with:', { id, newStatus });
      return apiSetStatus(id, user!.id, newStatus);
    },
    onMutate: async ({ id, newStatus }) => {
      logger.debug('🔄 Status mutation onMutate with:', { id, newStatus });
      await queryClient.cancelQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
      const prev = queryClient.getQueryData<Purchase[]>(purchaseQueryKeys.list(user?.id)) || [];
      setCacheList((old) => old.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      return { prev, id, newStatus };
    },
    onSuccess: (fresh, _vars, ctx) => {
      logger.info('✅ Status mutation onSuccess with:', { id: fresh.id, status: fresh.status });
      setCacheList((old) => old.map((p) => (p.id === ctx?.id ? fresh : p)));

      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();
      // ✅ INVALIDATE PURCHASE STATS
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(user?.id) });

      toast.success(`Status diubah ke "${getStatusDisplayText(fresh.status)}". Stok gudang akan tersinkron otomatis.`);

      // 🔍 DEBUG: Log mutation context for debugging
      logger.debug('🔍 Status mutation context:', {
        id: ctx?.id,
        newStatus: ctx?.newStatus,
        previousData: ctx?.prev?.find(p => p.id === ctx?.id),
        freshData: fresh
      });

      // Catatan keuangan: tambahkan transaksi saat completed, hapus saat revert
      // 🔧 FIX: Use previous data from mutation context instead of current cache
      let prevPurchase = ctx?.prev?.find(p => p.id === fresh.id);
      
      // ✅ FALLBACK: If prevPurchase not available in context, try to find it or check database
      if (!prevPurchase) {
        logger.warn('⚠️ Previous purchase data not found in mutation context, trying fallback methods');
        
        // Try to find in current cache first
        const currentCachePurchase = findPurchase(fresh.id);
        if (currentCachePurchase) {
          prevPurchase = currentCachePurchase;
          logger.debug('📋 Found previous purchase data in current cache');
        } else {
          // As a last resort, check if fresh status is 'completed' and create transaction anyway
          // This ensures financial sync works even when context is missing
          logger.debug('📋 No previous purchase data available, will create financial transaction if status is completed');
          
          if (fresh.status === 'completed') {
            logger.info('💰 Creating financial transaction for completed purchase (fallback mode)');
            
            void addFinancialTransaction({
              type: 'expense',
              amount: (((fresh as any).totalNilai ?? (fresh as any).total_nilai) as number),
              description: `Pembelian dari ${getSupplierName(fresh.supplier)} (auto-sync)`,
              category: 'Pembelian Bahan Baku',
              date: new Date(),
              relatedId: fresh.id,
            });
            
            // Invalidate related caches
            queryClient.invalidateQueries({ queryKey: ['financial'] });
            queryClient.invalidateQueries({ queryKey: ['profit-analysis'] });
            queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(user?.id) });
            
            window.dispatchEvent(new CustomEvent('purchase:completed', {
              detail: { purchaseId: fresh.id, supplier: fresh.supplier, total_nilai: (((fresh as any).totalNilai ?? (fresh as any).total_nilai) as number) }
            }));
          }
        }
      }
      
      if (prevPurchase) {
        logger.debug('🔍 Purchase status comparison:', {
          previousStatus: prevPurchase.status,
          newStatus: fresh.status,
          willCreateTransaction: prevPurchase.status !== 'completed' && fresh.status === 'completed'
        });
        
        if (prevPurchase.status !== 'completed' && fresh.status === 'completed') {
          void onCompletedFinancialSync(fresh, getSupplierName, addFinancialTransaction, queryClient, user!.id);
        } else if (prevPurchase.status === 'completed' && fresh.status !== 'completed') {
          void onRevertedFinancialCleanup(fresh.id, user!.id, deleteFinancialTransaction, queryClient);
        }
      } else {
        logger.warn('⚠️ Previous purchase data not found in mutation context for:', fresh.id);
      }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(purchaseQueryKeys.list(user?.id), ctx.prev);
      toast.error(`Gagal mengubah status: ${err instanceof Error ? err.message : 'Error'}`);
    },
  });

  // DELETE (optimistic remove)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeletePurchase(id, user!.id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
      const prev = queryClient.getQueryData<Purchase[]>(purchaseQueryKeys.list(user?.id)) || [];
      setCacheList((old) => old.filter((p) => p.id !== id));
      return { prev, id };
    },
    onSuccess: async (_res, id, ctx) => {
      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();
      // ✅ INVALIDATE PURCHASE STATS
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(user?.id) });
      
      const p = ctx?.prev?.find((x) => x.id === id);
      if (p) {
        await cleanupFinancialForDeleted(id, user!.id, deleteFinancialTransaction, queryClient);
        
        const supplierName = getSupplierName(p.supplier);
        const totalValue = formatCurrency(p.total_nilai);
        toast.success('Pembelian dan transaksi keuangan terkait berhasil dihapus.');
        addActivity?.({ title: 'Pembelian Dihapus', description: `Pembelian dari ${supplierName} telah dihapus.`, type: 'purchase', value: null });
        addNotification?.({
          title: '🗑️ Pembelian Dihapus',
          message: `Pembelian dari ${supplierName} senilai ${totalValue} telah dihapus`,
          type: 'warning',
          icon: 'trash',
          priority: 2,
          related_type: 'purchase',
          related_id: id,
          action_url: '/pembelian',
          is_read: false,
        });
      }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(purchaseQueryKeys.list(user?.id), ctx.prev);
      toast.error(`Gagal menghapus pembelian: ${err instanceof Error ? err.message : 'Error'}`);
    },
  });

  // ------------------- Public actions -------------------
  const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) { toast.error('Anda harus login'); return false; }
    const errs = validatePurchaseData(purchase);
    if (errs.length) { toast.error(errs[0]); return false; }
    try {
      const items = await ensureBahanBakuIds(purchase.items || [], purchase.supplier);
      await createMutation.mutateAsync({ ...purchase, items });
      return true;
    } catch (e) {
      logger.error('Add purchase failed', e);
      return false;
    }
  }, [user, createMutation, ensureBahanBakuIds]);

  // Edit diperbolehkan walau completed — manual sync akan rekalkulasi stok jika perlu
  const updatePurchaseAction = useCallback(async (id: string, updated: Partial<Purchase>) => {
    if (!user) { toast.error('Anda harus login'); return false; }
    try {
      const payload = { ...updated };
      if (updated.items && updated.items.length > 0) {
        const supplierId = updated.supplier || findPurchase(id)?.supplier || '';
        payload.items = await ensureBahanBakuIds(updated.items, supplierId);
      }
      await updateMutation.mutateAsync({ id, updates: payload });
      return true;
    } catch (e) {
      logger.error('Update purchase failed', e);
      return false;
    }
  }, [user, updateMutation, ensureBahanBakuIds, findPurchase]);

  const setStatus = useCallback(async (id: string, newStatus: PurchaseStatus) => {
    if (!user) { toast.error('Anda harus login'); return false; }
    const p = findPurchase(id);
    if (!p) { toast.error('Pembelian tidak ditemukan'); return false; }

    // Validasi ringan
    const warnings: string[] = [];
    const errors: string[] = [];
    if (p.status === newStatus) warnings.push('Status tidak berubah');
    if (newStatus === 'completed') {
      if (!p.items?.length) errors.push('Tidak dapat selesai tanpa item');
      if (!p.total_nilai || p.total_nilai <= 0) errors.push('Total nilai harus > 0');
      if (!p.supplier) errors.push('Supplier wajib diisi');
      
      // Enhanced item validation for better error reporting
      const invalid = p.items.filter((it: any) => {
        const issues = [];
        if (!it.bahanBakuId) issues.push('ID bahan baku');
        if (!it.nama || !it.nama.trim()) issues.push('nama');
        // Use standardized field name 'quantity' (mapped from DB 'jumlah')
        if (!it.quantity || it.quantity <= 0) issues.push('kuantitas');
        if (!it.satuan || !it.satuan.trim()) issues.push('satuan');
        // Allow zero price for free items or automatic calculation
        if (it.unitPrice === undefined || it.unitPrice === null || it.unitPrice < 0) {
          issues.push('harga satuan');
        }
        return issues.length > 0;
      });
      
      if (invalid.length) {
        const firstItem = invalid[0];
        const itemName = firstItem.nama || 'Item tanpa nama';
        const missingFields = [];
        if (!firstItem.bahanBakuId) missingFields.push('ID bahan baku');
        if (!firstItem.nama || !firstItem.nama.trim()) missingFields.push('nama');
        if (!firstItem.quantity || firstItem.quantity <= 0) missingFields.push('kuantitas');
        if (!firstItem.satuan || !firstItem.satuan.trim()) missingFields.push('satuan');
        if (firstItem.unitPrice === undefined || firstItem.unitPrice === null || firstItem.unitPrice < 0) {
          missingFields.push('harga satuan');
        }
        
        if (invalid.length === 1) {
          errors.push(`Item "${itemName}" tidak lengkap: ${missingFields.join(', ')}`);
        } else {
          errors.push(`${invalid.length} item tidak lengkap (contoh: ${missingFields.join(', ')})`);
        }
      }
    }
    if (p.status === 'completed' && newStatus !== 'completed') {
      warnings.push('Mengubah dari "Selesai" akan mengoreksi stok gudang otomatis.');
    }
    if (errors.length) { toast.error(errors[0]); return false; }
    warnings.forEach((w) => toast.warning(w));

    try {
      await statusMutation.mutateAsync({ id, newStatus });
      return true;
    } catch (e) {
      logger.error('Set status failed', e);
      return false;
    }
  }, [user, findPurchase, statusMutation]);

  const deletePurchaseAction = useCallback(async (id: string) => {
    if (!user) { toast.error('Anda harus login'); return false; }
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (e) {
      logger.error('Delete purchase failed', e);
      return false;
    }
  }, [user, deleteMutation]);



  // Prasyarat data (buat tombol "Tambah")
  const validatePrerequisites = useCallback(() => {
    const hasSuppliers = (suppliers?.length || 0) > 0;
    if (!hasSuppliers) {
      toast.warning('Belum ada data supplier. Kamu bisa menambahkannya nanti.');
    }
    return true;
  }, [suppliers?.length]);

  const refreshPurchases = useCallback(async () => {
    logger.debug('🔄 Manual refresh purchases triggered');
    await queryClient.invalidateQueries({ 
      queryKey: purchaseQueryKeys.list(user?.id),
      refetchType: 'active' // Force active queries to refetch immediately
    });
  }, [queryClient, user?.id]);

  // ------------------- Realtime (debounced/guarded) -------------------
  const blockRealtimeRef = useRef(false);

  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const requestInvalidate = () => {
      if (blockRealtimeRef.current) return;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        logger.debug('🔄 Realtime invalidating purchase data');
        // ✅ FIXED: Force refetch for realtime updates
        queryClient.invalidateQueries({ 
          queryKey: purchaseQueryKeys.list(user.id),
          refetchType: 'active' // Force active queries to refetch
        });
        // ✅ JUGA INVALIDATE WAREHOUSE: Karena realtime change bisa jadi dari user lain/trigger
        invalidateWarehouseData();
        debounceTimerRef.current = null;
      }, 300);
    };

    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `user_id=eq.${user.id}` },
        (_payload) => {
          requestInvalidate();
        })
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, invalidateWarehouseData]);

  // ------------------- Context value -------------------
  const contextValue: PurchaseContextType = useMemo(() => ({
    // from original type
    purchases: purchases as Purchase[],
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    isProcessing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending,

    addPurchase,
    updatePurchase: updatePurchaseAction,
    deletePurchase: deletePurchaseAction,
    refreshPurchases,

    // merged core api
    stats,
    setStatus,
    findPurchase,
    getPurchaseById: findPurchase, // Same as findPurchase for compatibility
    validatePrerequisites,
    getSupplierName,
  }), [
    purchases,
    isLoading,
    error,
    createMutation.isPending,
    updateMutation.isPending,
    deleteMutation.isPending,
    statusMutation.isPending,
    addPurchase,
    updatePurchaseAction,
    deletePurchaseAction,
    refreshPurchases,
    stats,
    setStatus,
    findPurchase,
    validatePrerequisites,
    getSupplierName,
  ]);

  return (
    <PurchaseContext.Provider value={contextValue}>
      {children}
    </PurchaseContext.Provider>
  );
};

// ✅ REMOVED: Duplicate usePurchase export to avoid conflicts
// Use the dedicated hook from ../hooks/usePurchase.ts instead
