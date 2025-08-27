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
// ✅ STANDARDIZED: Query Keys for consistent patterns across modules
const purchaseQueryKeys = {
  all: ['purchases'] as const,
  list: (userId?: string) => [...purchaseQueryKeys.all, 'list', userId] as const,
  // ✅ ADD: Additional keys for comprehensive functionality
  stats: (userId?: string) => [...purchaseQueryKeys.all, 'stats', userId] as const,
  byStatus: (userId?: string, status?: string) => [...purchaseQueryKeys.all, 'byStatus', userId, status] as const,
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

// ✅ NEW: Fungsi untuk mengambil data purchase dengan paginasi
const fetchPurchasesPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Purchase[]; total: number; totalPages: number }> => {
  const offset = (page - 1) * limit;

  // Ambil total count
  const { count, error: countError } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw new Error(countError.message);

  // Ambil data dengan paginasi
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    data: transformPurchasesFromDB(data || []),
    total: count || 0,
    totalPages
  };
};

// CREATE via service (manual warehouse sync handled in service), then fetch the created row
const apiCreatePurchase = async (payload: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string) => {
  console.log('🆕 apiCreatePurchase called');
  const res = await PurchaseApiService.createPurchase(payload, userId);
  if (!res.success || !res.purchaseId) throw new Error(res.error || 'Gagal membuat pembelian');
  console.log('🔍 apiCreatePurchase fetching created record:', res.purchaseId);
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', res.purchaseId)
    .eq('user_id', userId)
    .single();
  if (error) {
    console.log('⚠️ apiCreatePurchase error:', { code: error.code, message: error.message, purchaseId: res.purchaseId });
    if (error.code === 'PGRST116') {
      throw new Error('Pembelian tidak ditemukan setelah dibuat');
    }
    throw new Error(error.message);
  }
  console.log('✅ apiCreatePurchase success');
  return transformPurchaseFromDB(data);
};

const apiUpdatePurchase = async (id: string, updates: Partial<Purchase>, userId: string) => {
  console.log('✏️ apiUpdatePurchase called:', { id });
  const res = await PurchaseApiService.updatePurchase(id, updates, userId);
  if (!res.success) throw new Error(res.error || 'Gagal memperbarui pembelian');
  console.log('🔍 apiUpdatePurchase fetching updated record:', id);
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) {
    console.log('⚠️ apiUpdatePurchase error:', { code: error.code, message: error.message, id });
    if (error.code === 'PGRST116') {
      throw new Error('Pembelian tidak ditemukan');
    }
    throw new Error(error.message);
  }
  console.log('✅ apiUpdatePurchase success');
  return transformPurchaseFromDB(data);
};

// Status via service (service handles manual warehouse sync), then fetch fresh row
const apiSetStatus = async (id: string, userId: string, newStatus: PurchaseStatus) => {
  console.log('📊 apiSetStatus called:', { id, newStatus });
  const res = await PurchaseApiService.setPurchaseStatus(id, userId, newStatus);
  if (!res.success) throw new Error(res.error || 'Gagal update status');
  console.log('🔍 apiSetStatus fetching updated record:', id);
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) {
    console.log('⚠️ apiSetStatus error:', { code: error.code, message: error.message, id, newStatus });
    if (error.code === 'PGRST116') {
      throw new Error('Pembelian tidak ditemukan');
    }
    throw new Error(error.message);
  }
  console.log('✅ apiSetStatus success');
  return transformPurchaseFromDB(data);
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

  // ✅ FIXED: Pastikan setiap item memiliki ID bahan baku dengan race condition protection
  const ensureBahanBakuIds = useCallback(
    async (items: PurchaseItem[], supplierId: string): Promise<PurchaseItem[]> => {
      const results: PurchaseItem[] = [];
      
      // Process items sequentially to avoid race conditions
      for (const item of items) {
        if (item.bahanBakuId?.trim()) {
          results.push(item);
          continue;
        }
        
        // Check if bahan baku with same name already exists
        const existingBahanBaku = (bahanBaku as any[])?.find((bb: any) => 
          bb.nama?.toLowerCase()?.trim() === item.nama?.toLowerCase()?.trim() &&
          bb.supplier === supplierId
        );
        
        if (existingBahanBaku) {
          console.log('🔄 [BAHAN BAKU] Reusing existing bahan baku:', existingBahanBaku.nama);
          results.push({ ...item, bahanBakuId: existingBahanBaku.id });
          continue;
        }
        
        // Create new bahan baku with retry logic for race conditions
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;
        let newId = crypto.randomUUID();
        
        while (!success && retryCount < maxRetries) {
          try {
            console.log(`🌱 [BAHAN BAKU] Creating new bahan baku (attempt ${retryCount + 1}):`, item.nama);
            
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
            
            success = true;
            console.log('✅ [BAHAN BAKU] Successfully created:', item.nama);
            results.push({ ...item, bahanBakuId: newId });
            
          } catch (error: any) {
            retryCount++;
            console.log(`⚠️ [BAHAN BAKU] Creation attempt ${retryCount} failed:`, error?.message);
            
            // Check if it's a duplicate error
            if (error?.message?.includes('duplicate') || error?.code === '23505') {
              console.log('🔄 [BAHAN BAKU] Duplicate detected, checking for existing record...');
              
              // Try to find the existing record that was just created by another process
              const newExisting = (bahanBaku as any[])?.find((bb: any) => 
                bb.nama?.toLowerCase()?.trim() === item.nama?.toLowerCase()?.trim() &&
                bb.supplier === supplierId
              );
              
              if (newExisting) {
                console.log('✅ [BAHAN BAKU] Found existing record after duplicate error:', newExisting.nama);
                results.push({ ...item, bahanBakuId: newExisting.id });
                success = true;
                break;
              }
              
              // Generate new ID for next attempt
              newId = crypto.randomUUID();
            }
            
            if (retryCount >= maxRetries) {
              console.error('❌ [BAHAN BAKU] Failed to create after max retries:', item.nama);
              // Use the item without bahanBakuId as fallback
              results.push(item);
            }
          }
        }
      }
      
      return results;
    },
    [addBahanBaku, bahanBaku]
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
    staleTime: 0, // ✅ FIXED: Set to 0 for immediate refresh
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: (count, err: any) => {
      const code = err?.code ?? err?.status;
      return code && code >= 400 && code < 500 ? false : count < 3;
    },
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    // ✅ FIXED: Remove placeholderData to prevent empty array display
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnReconnect: true, // Refetch when reconnecting
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
      console.log('✅ Update mutation success:', fresh.id);
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
      let prevPurchase = ctx?.prev?.find(p => p.id === fresh.id);
      
      // ✅ FALLBACK: If prevPurchase not available in context, try to find it or check database
      if (!prevPurchase) {
        console.log('⚠️ Previous purchase data not found in mutation context, trying fallback methods');
        
        // Try to find in current cache first
        const currentCachePurchase = findPurchase(fresh.id);
        if (currentCachePurchase) {
          prevPurchase = currentCachePurchase;
          console.log('📋 Found previous purchase data in current cache');
        } else {
          // As a last resort, check if fresh status is 'completed' and create transaction anyway
          // This ensures financial sync works even when context is missing
          console.log('📋 No previous purchase data available, will create financial transaction if status is completed');
          
          if (fresh.status === 'completed') {
            console.log('💰 Creating financial transaction for completed purchase (fallback mode)');
            
            void addFinancialTransaction({
              type: 'expense',
              amount: fresh.totalNilai,
              description: `Pembelian dari ${getSupplierName(fresh.supplier)} (auto-sync)`,
              category: 'Pembelian Bahan Baku',
              date: new Date(),
              relatedId: fresh.id,
            });
            
            // Invalidate related caches
            queryClient.invalidateQueries({ queryKey: ['financial'] });
            queryClient.invalidateQueries({ queryKey: ['profit-analysis'] });
            
            window.dispatchEvent(new CustomEvent('purchase:completed', {
              detail: { purchaseId: fresh.id, supplier: fresh.supplier, totalValue: fresh.totalNilai }
            }));
          }
        }
      }
      
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
          
          // ✅ DISPATCH PURCHASE COMPLETION EVENT: Trigger WAC refresh in profit analysis
          console.log('🔄 Dispatching purchase completion event for WAC refresh');
          window.dispatchEvent(new CustomEvent('purchase:completed', {
            detail: { purchaseId: fresh.id, supplier: fresh.supplier, totalValue: fresh.totalNilai }
          }));
          
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
    onSuccess: async (_res, id, ctx) => {
      // ✅ INVALIDATE WAREHOUSE
      invalidateWarehouseData();
      
      const p = ctx?.prev?.find((x) => x.id === id);
      if (p) {
        // ✅ FIXED: Delete related financial transactions when purchase is deleted
        console.log('💰 Cleaning up financial transactions for deleted purchase:', id);
        try {
          const { data, error } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('user_id', user!.id)
            .eq('related_id', id)
            .eq('type', 'expense');
          
          if (error) {
            console.error('⚠️ Error fetching financial transactions for cleanup:', error);
          } else if (data && data.length > 0) {
            console.log(`🗑️ Found ${data.length} financial transaction(s) to delete for purchase:`, id);
            const deletePromises = data.map((transaction: any) => 
              deleteFinancialTransaction(transaction.id)
            );
            await Promise.all(deletePromises);
            console.log('✅ Financial transactions cleaned up successfully');
            
            // ✅ INVALIDATE FINANCIAL REPORTS: Financial transaction deletion affects reports
            queryClient.invalidateQueries({ 
              queryKey: ['financial'] 
            });
            
            // ✅ INVALIDATE PROFIT ANALYSIS: Financial transaction deletion affects profit calculations
            queryClient.invalidateQueries({ 
              queryKey: ['profit-analysis'] 
            });
          } else {
            console.log('ℹ️ No financial transactions found for purchase:', id);
          }
        } catch (e) {
          console.error('⚠️ Failed to cleanup financial transactions for deleted purchase:', e);
          logger.warn('Gagal membersihkan transaksi keuangan saat hapus purchase:', e);
        }
        
        const supplierName = getSupplierName(p.supplier);
        const totalValue = formatCurrency(p.totalNilai);
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



  // Prasyarat data (buat tombol "Tambah")
  const validatePrerequisites = useCallback(() => {
    const hasSuppliers = (suppliers?.length || 0) > 0;
    if (!hasSuppliers) {
      toast.warning('Belum ada data supplier. Kamu bisa menambahkannya nanti.');
    }
    return true;
  }, [suppliers?.length]);

  const refreshPurchases = useCallback(async () => {
    console.log('🔄 Manual refresh purchases triggered');
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
        console.log('🔄 Realtime invalidating purchase data');
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
