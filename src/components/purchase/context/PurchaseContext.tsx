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
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { PurchaseApiService } from '../services/purchaseApi';
import type { Purchase, PurchaseContextType, PurchaseStatus, PurchaseItem } from '../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';
import {
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB,
  transformPurchasesFromDB,
} from '../utils/purchaseTransformers';
import { validatePurchaseData, getStatusDisplayText } from '../utils/purchaseHelpers';

// ------------------- Query Keys -------------------
const purchaseQueryKeys = {
  all: ['purchases'] as const,
  list: (userId?: string) => [...purchaseQueryKeys.all, 'list', userId] as const,
} as const;

// ✅ WAREHOUSE QUERY KEYS: Untuk invalidation
const warehouseQueryKeys = {
  list: () => ['warehouse', 'list'] as const,
  analysis: () => ['warehouse', 'analysis'] as const,
} as const;

// ------------------- API helpers -------------------
const fetchPurchases = async (userId: string): Promise<Purchase[]> => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false });

  if (error) throw new Error(error.message);
  return transformPurchasesFromDB(data || []);
};

// CREATE via service (manual warehouse sync handled in service), then fetch the created row
const apiCreatePurchase = async (payload: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string) => {
  const res = await PurchaseApiService.createPurchase(payload, userId);
  if (!res.success || !res.purchaseId) throw new Error(res.error || 'Gagal membuat pembelian');
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', res.purchaseId)
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return transformPurchaseFromDB(data);
};

const apiUpdatePurchase = async (id: string, updates: Partial<Purchase>, userId: string) => {
  const res = await PurchaseApiService.updatePurchase(id, updates, userId);
  if (!res.success) throw new Error(res.error || 'Gagal memperbarui pembelian');
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return transformPurchaseFromDB(data);
};

// Status via service (service handles manual warehouse sync), then fetch fresh row
const apiSetStatus = async (id: string, userId: string, newStatus: PurchaseStatus) => {
  const res = await PurchaseApiService.setPurchaseStatus(id, userId, newStatus);
  if (!res.success) throw new Error(res.error || 'Gagal update status');
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return transformPurchaseFromDB(data);
};

const apiDeletePurchase = async (id: string, userId: string) => {
  const res = await PurchaseApiService.deletePurchase(id, userId);
  if (!res.success) throw new Error(res.error || 'Gagal menghapus pembelian');
};

// ------------------- Context -------------------
const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { addActivity } = useActivity();
  const { addFinancialTransaction, deleteFinancialTransaction } = useFinancial();
  const { suppliers } = useSupplier();
  const { addNotification } = useNotification();
  
  // ✅ FIXED: Safe warehouse context access without try-catch around hooks
  const warehouseContext = useBahanBaku();
  const bahanBaku = warehouseContext?.bahanBaku || [];
  const addBahanBaku = warehouseContext?.addBahanBaku || (async (_: any) => {
    console.warn('addBahanBaku not available in warehouse context');
    return false;
  });
  const getSupplierName = useCallback((supplierId: string): string => {
    try {
      const s = suppliers?.find(
        (x: any) => x.id === supplierId || x.nama === supplierId
      );
      return s?.nama || supplierId || 'Supplier';
    } catch {
      return supplierId || 'Supplier';
    }
  }, [suppliers]);

  // ✅ HELPER: Invalidate warehouse data after purchase changes
  const invalidateWarehouseData = useCallback(() => {
    console.log('🔄 Invalidating warehouse data');
    queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.list() });
    queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.analysis() });
  }, [queryClient]);

  // Pastikan setiap item memiliki ID bahan baku; jika belum, buat otomatis
  const ensureBahanBakuIds = useCallback(
    async (items: PurchaseItem[], supplierId: string): Promise<PurchaseItem[]> => {
      return Promise.all(
        items.map(async (item) => {
          if (item.bahanBakuId?.trim()) return item;
          const newId = crypto.randomUUID();
          await addBahanBaku({
            id: newId,
            nama: item.nama,
            kategori: 'Lainnya',
            // Stok awal 0; penambahan stok dilakukan saat status purchase menjadi 'completed'
            stok: 0,
            minimum: 0,
            satuan: item.satuan || '-',
            harga: item.hargaSatuan || 0,
            supplier: supplierId,
          });
          return { ...item, bahanBakuId: newId };
        })
      );
    },
    [addBahanBaku]
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
    staleTime: 2 * 60 * 1000,
    retry: (count, err: any) => {
      const code = err?.code ?? err?.status;
      return code && code >= 400 && code < 500 ? false : count < 3;
    },
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    // keepPreviousData is deprecated in newer versions, use placeholderData instead
    placeholderData: [],
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
    const totalValue = (purchases as Purchase[]).reduce((sum: number, p: Purchase) => sum + Number(p.totalNilai || 0), 0);
    const statusCounts = (purchases as Purchase[]).reduce((acc: Record<string, number>, p: Purchase) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    return {
      total,
      totalValue,
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
        totalNilai: payload.totalNilai,
        items: payload.items,
        status: payload.status ?? 'pending',
        metodePerhitungan: payload.metodePerhitungan ?? 'AVERAGE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCacheList((old) => [temp, ...old]);
      return { prev, tempId: temp.id };
    },
    onSuccess: async (newRow, _payload, ctx) => {
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
              harga: item.hargaSatuan || 0,
              supplier: newRow.supplier,
            });
          }
        }
      } catch (e) {
        logger.error('Gagal menambahkan bahan baku baru dari pembelian', e);
      }

      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();

      // Info
      const totalValue = formatCurrency(newRow.totalNilai);
      toast.success(`Pembelian dibuat (${getSupplierName(newRow.supplier)} • ${totalValue})`);
      addActivity?.({ title: 'Pembelian Ditambahkan', description: `Pembelian dari ${getSupplierName(newRow.supplier)} senilai ${totalValue}`, type: 'purchase', value: null });
      addNotification?.({
        title: '📦 Pembelian Baru',
        message: `Pembelian dari ${getSupplierName(newRow.supplier)} senilai ${totalValue}`,
        type: 'success',
        icon: 'shopping-cart',
        priority: 2,
        related_type: 'purchase',
        related_id: newRow.id,
        action_url: '/pembelian',
        is_read: false,
        is_archived: false,
      });
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
      setCacheList((old) => old.map((p) => (p.id === ctx?.id ? fresh : p)));

      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();

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
      console.log('🔄 Status mutation called with:', { id, newStatus });
      return apiSetStatus(id, user!.id, newStatus);
    },
    onMutate: async ({ id, newStatus }) => {
      console.log('🔄 Status mutation onMutate with:', { id, newStatus });
      await queryClient.cancelQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
      const prev = queryClient.getQueryData<Purchase[]>(purchaseQueryKeys.list(user?.id)) || [];
      setCacheList((old) => old.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      return { prev, id, newStatus };
    },
    onSuccess: (fresh, _vars, ctx) => {
      console.log('✅ Status mutation onSuccess with:', fresh);
      setCacheList((old) => old.map((p) => (p.id === ctx?.id ? fresh : p)));

      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();

      toast.success(`Status diubah ke "${getStatusDisplayText(fresh.status)}". Stok gudang akan tersinkron otomatis.`);

      // 🔍 DEBUG: Log mutation context for debugging
      console.log('🔍 Status mutation context:', {
        id: ctx?.id,
        newStatus: ctx?.newStatus,
        previousData: ctx?.prev?.find(p => p.id === ctx?.id),
        freshData: fresh
      });

      // Catatan keuangan: tambahkan transaksi saat completed, hapus saat revert
      // 🔧 FIX: Use previous data from mutation context instead of current cache
      const prevPurchase = ctx?.prev?.find(p => p.id === fresh.id);
      
      if (prevPurchase) {
        console.log('🔍 Purchase status comparison:', {
          previousStatus: prevPurchase.status,
          newStatus: fresh.status,
          willCreateTransaction: prevPurchase.status !== 'completed' && fresh.status === 'completed'
        });
        
        if (prevPurchase.status !== 'completed' && fresh.status === 'completed') {
          // Tambahkan transaksi ketika status berubah ke completed (expense)
          console.log('💰 Creating financial transaction for completed purchase:', {
            purchaseId: fresh.id,
            amount: fresh.totalNilai,
            supplier: getSupplierName(fresh.supplier),
            category: 'Pembelian Bahan Baku',
            transactionData: {
              type: 'expense',
              amount: fresh.totalNilai,
              description: `Pembelian dari ${getSupplierName(fresh.supplier)}`,
              category: 'Pembelian Bahan Baku',
              date: new Date(),
              relatedId: fresh.id,
            }
          });
          
          void addFinancialTransaction({
            type: 'expense',
            amount: fresh.totalNilai,
            description: `Pembelian dari ${getSupplierName(fresh.supplier)}`,
            category: 'Pembelian Bahan Baku',
            date: new Date(),
            relatedId: fresh.id,
          });
          
          // ✅ INVALIDATE PROFIT ANALYSIS: Purchase completion affects profit calculations
          console.log('📈 Invalidating profit analysis cache after purchase completion');
          queryClient.invalidateQueries({ 
            queryKey: ['profit-analysis'] 
          });
          
          // ✅ INVALIDATE FINANCIAL REPORTS: Purchase completion creates financial transaction
          console.log('💰 Invalidating financial transaction cache after purchase completion');
          queryClient.invalidateQueries({ 
            queryKey: ['financial'] 
          });
        } else if (prevPurchase.status === 'completed' && fresh.status !== 'completed') {
          // Hapus transaksi ketika status berubah dari completed (berdasarkan related_id)
          console.log('💰 Deleting financial transaction for reverted purchase:', fresh.id);
          
          // Cari transaksi terkait lalu hapus
          (async () => {
            try {
              const { data, error } = await supabase
                .from('financial_transactions')
                .select('id')
                .eq('user_id', user!.id)
                .eq('related_id', fresh.id)
                .eq('type', 'expense');
              if (error) throw error;
              const ids = (data || []).map((r: any) => r.id);
              for (const id of ids) {
                await deleteFinancialTransaction(id);
              }
              
              // ✅ INVALIDATE PROFIT ANALYSIS: Financial transaction deletion affects profit calculations
              console.log('📈 Invalidating profit analysis cache after financial transaction deletion');
              queryClient.invalidateQueries({ 
                queryKey: ['profit-analysis'] 
              });
              
              // ✅ INVALIDATE FINANCIAL REPORTS: Financial transaction deletion affects reports
              console.log('💰 Invalidating financial transaction cache after deletion');
              queryClient.invalidateQueries({ 
                queryKey: ['financial'] 
              });
            } catch (e) {
              logger.warn('Gagal membersihkan transaksi keuangan saat revert purchase:', e);
            }
          })();
        }
      } else {
        console.warn('⚠️ Previous purchase data not found in mutation context for:', fresh.id);
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
    onSuccess: (_res, id, ctx) => {
      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();
      const p = ctx?.prev?.find((x) => x.id === id);
      if (p) {
        const supplierName = getSupplierName(p.supplier);
        const totalValue = formatCurrency(p.totalNilai);
        toast.success('Pembelian dihapus. Stok gudang disesuaikan otomatis.');
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
          is_archived: false,
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
      let payload = { ...updated };
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
      if (!p.totalNilai || p.totalNilai <= 0) errors.push('Total nilai harus > 0');
      if (!p.supplier) errors.push('Supplier wajib diisi');
      
      // Enhanced item validation for better error reporting
      const invalid = p.items.filter((it: any) => {
        const issues = [];
        if (!it.bahanBakuId) issues.push('ID bahan baku');
        if (!it.nama || !it.nama.trim()) issues.push('nama');
        if (!it.kuantitas || it.kuantitas <= 0) issues.push('kuantitas');
        if (!it.satuan || !it.satuan.trim()) issues.push('satuan');
        // Allow zero price for free items or automatic calculation
        if (it.hargaSatuan === undefined || it.hargaSatuan === null || it.hargaSatuan < 0) {
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
        if (!firstItem.kuantitas || firstItem.kuantitas <= 0) missingFields.push('kuantitas');
        if (!firstItem.satuan || !firstItem.satuan.trim()) missingFields.push('satuan');
        if (firstItem.hargaSatuan === undefined || firstItem.hargaSatuan === null || firstItem.hargaSatuan < 0) {
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

  // Bulk ops (loop saja, manfaatkan optimistic dari mutation)
  const bulkDelete = useCallback(async (ids: string[]) => {
    let success = 0;
    for (const id of ids) {
      const ok = await deletePurchaseAction(id);
      if (ok) success++;
    }
    toast.success(`${success}/${ids.length} pembelian terhapus`);
  }, [deletePurchaseAction]);

  const bulkStatusUpdate = useCallback(async (ids: string[], newStatus: PurchaseStatus) => {
    let success = 0;
    for (const id of ids) {
      const ok = await setStatus(id, newStatus);
      if (ok) success++;
    }
    toast.success(`${success}/${ids.length} status berhasil diubah`);
  }, [setStatus]);

  // Prasyarat data (buat tombol "Tambah")
  const validatePrerequisites = useCallback(() => {
    const hasSuppliers = (suppliers?.length || 0) > 0;
    if (!hasSuppliers) {
      toast.warning('Belum ada data supplier. Kamu bisa menambahkannya nanti.');
    }
    return true;
  }, [suppliers?.length]);

  const refreshPurchases = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
  }, [queryClient, user?.id]);

  // ------------------- Realtime (debounced/guarded) -------------------
  const blockRealtimeRef = useRef(false);
  // blok sementara saat bulk
  const setBulkProcessing = useCallback((v: boolean) => { blockRealtimeRef.current = v; }, []);

  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const requestInvalidate = () => {
      if (blockRealtimeRef.current) return;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        // ringan: cukup soft-invalidate
        queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.list(user.id) });
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
    error: error ? (error as Error).message : null,
    isProcessing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending,

    addPurchase,
    updatePurchase: updatePurchaseAction,
    deletePurchase: deletePurchaseAction,
    refreshPurchases,

    // merged core api
    stats,
    setStatus,
    bulkDelete,
    bulkStatusUpdate,
    findPurchase,
    validatePrerequisites,
    setBulkProcessing,
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
    bulkDelete,
    bulkStatusUpdate,
    findPurchase,
    validatePrerequisites,
    setBulkProcessing,
    getSupplierName,
  ]);

  return (
    <PurchaseContext.Provider value={contextValue}>
      {children}
    </PurchaseContext.Provider>
  );
};

export const usePurchase = () => {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used within a PurchaseProvider');
  return ctx;
};
