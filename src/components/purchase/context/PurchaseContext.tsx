// src/components/purchase/context/PurchaseContext.tsx
// ✅ PERFORMANCE & MERGED CORE: Context ini sudah menggabungkan fungsionalitas usePurchaseCore
// - Optimistic updates untuk create/update/status/delete
// - Stats, bulk ops, validate prerequisites
// - Edit/Hapus setelah 'completed' diperbolehkan (stok & WAC diurus trigger DB)
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
import {
  applyPurchaseToWarehouse,
  reversePurchaseFromWarehouse
} from '@/components/warehouse/services/warehouseSyncService';

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

// Insert biasa (status awal umumnya 'pending'); trigger DB akan apply ketika status==completed
const apiCreatePurchase = async (payload: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string) => {
  const db = transformPurchaseForDB(payload, userId);
  const { data, error } = await supabase.from('purchases').insert(db).select('*').single();
  if (error) throw new Error(error.message);
  return transformPurchaseFromDB(data);
};

const apiUpdatePurchase = async (id: string, updates: Partial<Purchase>) => {
  const patch = transformPurchaseUpdateForDB(updates);
  const { data, error } = await supabase.from('purchases').update(patch).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return transformPurchaseFromDB(data);
};

// Pakai UPDATE kolom status; trigger DB akan urus stok/WAC apply/rollback/re-apply
const apiSetStatus = async (id: string, userId: string, newStatus: PurchaseStatus) => {
  const { data, error } = await supabase
    .from('purchases')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return transformPurchaseFromDB(data);
};

const apiDeletePurchase = async (id: string) => {
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  // Add defensive check for useBahanBaku
  let bahanBaku = [];
  let addBahanBaku = async (_: any) => false;
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
    addBahanBaku = warehouseContext?.addBahanBaku || addBahanBaku;
  } catch (error) {
    console.warn('Failed to get warehouse data in PurchaseContext:', error);
  }
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

  // Pastikan setiap item memiliki ID bahan baku; cari jika sudah ada, jika tidak buat baru
  const ensureBahanBakuIds = useCallback(
    async (items: PurchaseItem[], supplierId: string): Promise<PurchaseItem[]> => {
      return Promise.all(
        items.map(async (item) => {
          if (item.bahanBakuId?.trim()) return item;

          // Cari bahan baku yang sudah ada berdasarkan nama + supplier
          const existing = bahanBaku.find(
            (b) =>
              b.nama.toLowerCase() === item.nama.toLowerCase() &&
              b.supplier === supplierId
          );
          if (existing) {
            return { ...item, bahanBakuId: existing.id };
          }

          const newId = crypto.randomUUID();
          const payload = {
            id: newId,
            nama: item.nama,
            kategori: 'Lainnya',
            // Stok awal 0; penambahan stok dilakukan saat status purchase menjadi 'completed'
            stok: 0,
            minimum: 0,
            satuan: item.satuan || '-',
            harga: item.hargaSatuan || 0,
            supplier: supplierId,
          };

          let finalId = newId;
          const success = await addBahanBaku(payload);

          if (!success) {
            try {
              // Jika gagal (misal duplikat 409), coba ambil ID yang sudah ada atau upsert
              const { data: existingDb } = await supabase
                .from('bahan_baku')
                .select('id')
                .eq('user_id', user?.id)
                .eq('nama', item.nama)
                .eq('supplier', supplierId)
                .maybeSingle();

              if (existingDb?.id) {
                finalId = existingDb.id;
              } else {
                const { data: upserted, error } = await supabase
                  .from('bahan_baku')
                  .upsert(
                    {
                      id: newId,
                      user_id: user?.id,
                      nama: item.nama,
                      kategori: 'Lainnya',
                      stok: 0,
                      minimum: 0,
                      satuan: item.satuan || '-',
                      harga_satuan: item.hargaSatuan || 0,
                      supplier: supplierId,
                    },
                    { onConflict: 'user_id,nama,supplier' }
                  )
                  .select('id')
                  .single();

                if (error) throw error;
                finalId = upserted?.id || newId;
              }
            } catch (err) {
              logger.error('Gagal memastikan ID bahan baku:', err);
            }
          }

          return { ...item, bahanBakuId: finalId };
        })
      );
    },
    [addBahanBaku, bahanBaku, user?.id]
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
    keepPreviousData: true,
  });

  // ------------------- Optimistic helpers -------------------
  const setCacheList = useCallback((updater: (old: Purchase[]) => Purchase[]) => {
    queryClient.setQueryData(purchaseQueryKeys.list(user?.id), (old: Purchase[] | undefined) => {
      return updater(old || []);
    });
  }, [queryClient, user?.id]);

  const findPurchase = useCallback((id: string) => purchases.find((p) => p.id === id), [purchases]);

  // ------------------- Stats (memo) -------------------
  const stats = useMemo(() => {
    const total = purchases.length;
    const totalValue = purchases.reduce((sum, p) => sum + Number(p.totalNilai || 0), 0);
    const statusCounts = purchases.reduce((acc: Record<string, number>, p) => {
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
          const exists = bahanBaku?.some((bb) => bb.id === item.bahanBakuId);
          if (!exists) {
            await addBahanBaku({
              id: item.bahanBakuId,
              nama: item.nama,
              kategori: 'Lainnya',
              // Jika purchase belum selesai, stok awal tetap 0 agar tidak double saat diselesaikan
              stok: newRow.status === 'completed' ? item.kuantitas : 0,
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

      // Terapkan ke gudang jika langsung selesai
      if (newRow.status === 'completed') {
        void applyPurchaseToWarehouse(newRow);
      }

      // ✅ INVALIDATE WAREHOUSE: Trigger DB mungkin sudah update stok jika status=completed
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
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Purchase> }) => apiUpdatePurchase(id, updates),
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

      // ✅ INVALIDATE WAREHOUSE: Trigger DB akan rekalkulasi stok/WAC jika diperlukan
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

      const prevPurchase = ctx?.prev?.find(p => p.id === fresh.id);
      if (prevPurchase?.status !== 'completed' && fresh.status === 'completed') {
        void applyPurchaseToWarehouse(fresh);
      } else if (prevPurchase?.status === 'completed' && fresh.status !== 'completed') {
        void reversePurchaseFromWarehouse(prevPurchase);
      }

      // ✅ INVALIDATE WAREHOUSE: Apply/rollback WAC & stok terjadi di trigger DB
      invalidateWarehouseData();

      toast.success(`Status diubah ke "${getStatusDisplayText(fresh.status)}". Stok gudang akan tersinkron otomatis.`);

      // Catatan keuangan: tambahkan transaksi saat completed, hapus saat revert
      if (prevPurchase) {
        if (prevPurchase.status !== 'completed' && fresh.status === 'completed') {
          // Tambahkan transaksi ketika status berubah ke completed (expense)
          void addFinancialTransaction({
            type: 'expense',
            amount: fresh.totalNilai,
            description: `Pembelian dari ${getSupplierName(fresh.supplier)}`,
            category: 'Pembelian Bahan Baku',
            date: new Date(),
            relatedId: fresh.id,
          });
        } else if (prevPurchase.status === 'completed' && fresh.status !== 'completed') {
          // Hapus transaksi ketika status berubah dari completed (berdasarkan related_id)
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
            } catch (e) {
              logger.warn('Gagal membersihkan transaksi keuangan saat revert purchase:', e);
            }
          })();
        }
      }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(purchaseQueryKeys.list(user?.id), ctx.prev);
      toast.error(`Gagal mengubah status: ${err instanceof Error ? err.message : 'Error'}`);
    },
  });

  // DELETE (optimistic remove)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeletePurchase(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: purchaseQueryKeys.list(user?.id) });
      const prev = queryClient.getQueryData<Purchase[]>(purchaseQueryKeys.list(user?.id)) || [];
      setCacheList((old) => old.filter((p) => p.id !== id));
      return { prev, id };
    },
    onSuccess: (_res, id, ctx) => {
      // ✅ INVALIDATE WAREHOUSE: Trigger DB akan reversal stok/WAC jika pernah applied
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

  // Edit diperbolehkan walau completed — trigger DB akan rekalkulasi stok jika perlu
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
      const invalid = p.items.filter((it: any) => !it.bahanBakuId || !it.nama || !it.kuantitas || it.kuantitas <= 0 || !it.hargaSatuan);
      if (invalid.length) errors.push(`Ada ${invalid.length} item tidak lengkap`);
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
    purchases,
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