import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { logger } from '@/utils/logger';

// PromoContext types
interface Promo {
  id: string;
  userId: string;
  namaPromo: string;
  tipePromo: 'bogo' | 'discount' | 'bundle';
  status: 'aktif' | 'nonaktif' | 'draft';
  dataPromo: any;
  calculationResult: any;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  deskripsi?: string;
  createdAt: string;
  updatedAt: string;
}

interface PromoContextType {
  promos: Promo[];
  isLoading: boolean;
  addPromo: (promo: Partial<Promo>) => Promise<boolean>;
  updatePromo: (id: string, updates: Partial<Promo>) => Promise<boolean>;
  deletePromo: (id: string) => Promise<boolean>;
  bulkDeletePromos: (ids: string[]) => Promise<boolean>;
  togglePromoStatus: (id: string, newStatus: string) => Promise<boolean>;
  searchPromos: (query: string) => Promo[];
  getPromosByType: (type: string) => Promo[];
  getPromosByStatus: (status: string) => Promo[];
  refreshPromos: () => Promise<void>;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

export const PromoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // Transform from database format
  const transformFromDB = useCallback((dbItem: any): Promo => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    namaPromo: dbItem.nama_promo,
    tipePromo: dbItem.tipe_promo,
    status: dbItem.status,
    dataPromo: dbItem.data_promo,
    calculationResult: dbItem.calculation_result,
    tanggalMulai: dbItem.tanggal_mulai,
    tanggalSelesai: dbItem.tanggal_selesai,
    deskripsi: dbItem.deskripsi,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at
  }), []);

  // Transform to database format
  const transformToDB = useCallback((promo: Partial<Promo>) => ({
    nama_promo: promo.namaPromo,
    tipe_promo: promo.tipePromo,
    status: promo.status,
    data_promo: promo.dataPromo,
    calculation_result: promo.calculationResult,
    tanggal_mulai: promo.tanggalMulai,
    tanggal_selesai: promo.tanggalSelesai,
    deskripsi: promo.deskripsi
  }), []);

  // Add new promo
  const addPromo = useCallback(async (promo: Partial<Promo>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan promo.');
      return false;
    }

    try {
      logger.context('PromoContext', 'Adding promo:', promo);

      const { error } = await supabase
        .from('promos')
        .insert({ ...transformToDB(promo), user_id: user.id });

      if (error) {
        logger.error('PromoContext - Error adding promo:', error);
        throw new Error(error.message);
      }

      // Activity log
      addActivity({
        title: 'Promo Baru Dibuat',
        description: `Promo "${promo.namaPromo}" telah ditambahkan.`,
        type: 'promo',
        value: null
      });

      // Success notification
      await addNotification({
        title: '🎯 Promo Baru Dibuat!',
        message: `Promo "${promo.namaPromo}" berhasil ditambahkan`,
        type: 'success',
        icon: 'gift',
        priority: 2,
        related_type: 'system',
        action_url: '/promo',
        is_read: false,
        is_archived: false
      });

      toast.success('Promo baru berhasil ditambahkan!');
      return true;
    } catch (error) {
      logger.error('PromoContext - Error in addPromo:', error);
      toast.error(`Gagal menambah promo: ${error.message}`);
      return false;
    }
  }, [user, transformToDB, addActivity, addNotification]);

  // Update promo
  const updatePromo = useCallback(async (id: string, updates: Partial<Promo>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui promo.');
      return false;
    }

    try {
      logger.context('PromoContext', 'Updating promo:', id, updates);

      const { error } = await supabase
        .from('promos')
        .update(transformToDB(updates))
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        logger.error('PromoContext - Error updating promo:', error);
        throw new Error(error.message);
      }

      addActivity({
        title: 'Promo Diperbarui',
        description: `Promo "${updates.namaPromo || '...'}" telah diperbarui.`,
        type: 'promo',
        value: null
      });

      toast.success('Promo berhasil diperbarui!');
      return true;
    } catch (error) {
      logger.error('PromoContext - Error in updatePromo:', error);
      toast.error(`Gagal memperbarui promo: ${error.message}`);
      return false;
    }
  }, [user, transformToDB, addActivity]);

  // Delete promo
  const deletePromo = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus promo.');
      return false;
    }

    try {
      const promoToDelete = promos.find(p => p.id === id);
      if (!promoToDelete) {
        toast.error('Promo tidak ditemukan');
        return false;
      }

      logger.context('PromoContext', 'Deleting promo:', id);
      const { error } = await supabase.from('promos').delete().eq('id', id).eq('user_id', user.id);

      if (error) {
        logger.error('PromoContext - Error deleting promo:', error);
        throw new Error(error.message);
      }

      addActivity({
        title: 'Promo Dihapus',
        description: `Promo "${promoToDelete.namaPromo}" telah dihapus.`,
        type: 'promo',
        value: null
      });

      toast.success('Promo berhasil dihapus.');
      return true;
    } catch (error) {
      logger.error('PromoContext - Error in deletePromo:', error);
      toast.error(`Gagal menghapus promo: ${error.message}`);
      return false;
    }
  }, [user, promos, addActivity]);

  // Bulk delete promos
  const bulkDeletePromos = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus promo.');
      return false;
    }

    try {
      logger.context('PromoContext', 'Bulk deleting promos:', ids);
      const { error } = await supabase
        .from('promos')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) {
        logger.error('PromoContext - Error bulk deleting promos:', error);
        throw new Error(error.message);
      }

      addActivity({
        title: 'Bulk Delete Promo',
        description: `${ids.length} promo telah dihapus.`,
        type: 'promo',
        value: null
      });

      toast.success(`${ids.length} promo berhasil dihapus.`);
      return true;
    } catch (error) {
      logger.error('PromoContext - Error in bulkDeletePromos:', error);
      toast.error(`Gagal menghapus promo: ${error.message}`);
      return false;
    }
  }, [user, addActivity]);

  // Toggle promo status
  const togglePromoStatus = useCallback(async (id: string, newStatus: string): Promise<boolean> => {
    return await updatePromo(id, { status: newStatus });
  }, [updatePromo]);

  // Search promos
  const searchPromos = useCallback((query: string): Promo[] => {
    if (!query.trim()) return promos;

    const lowercaseQuery = query.toLowerCase();
    return promos.filter(promo =>
      promo.namaPromo.toLowerCase().includes(lowercaseQuery) ||
      promo.tipePromo.toLowerCase().includes(lowercaseQuery) ||
      promo.deskripsi?.toLowerCase().includes(lowercaseQuery)
    );
  }, [promos]);

  // Get promos by type
  const getPromosByType = useCallback((type: string): Promo[] => {
    if (!type.trim()) return promos;
    return promos.filter(promo => promo.tipePromo === type);
  }, [promos]);

  // Get promos by status
  const getPromosByStatus = useCallback((status: string): Promo[] => {
    if (!status.trim()) return promos;
    return promos.filter(promo => promo.status === status);
  }, [promos]);

  // Refresh promos
  const refreshPromos = useCallback(async () => {
    if (!user) {
      setPromos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      logger.context('PromoContext', 'Fetching promos for user:', user.id);
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('PromoContext - Error fetching promos:', error);
        toast.error(`Gagal memuat promo: ${error.message}`);
      } else {
        setPromos(data.map(transformFromDB));
        logger.context('PromoContext', `Loaded ${data.length} promos`);
      }
    } catch (error) {
      logger.error('PromoContext - Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, transformFromDB]);

  // Load promos and setup real-time
  useEffect(() => {
    refreshPromos();

    if (!user) return;

    const channel = supabase.channel(`realtime-promos-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'promos',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        logger.context('PromoContext', 'Real-time event received:', payload);

        if (payload.eventType === 'INSERT') {
          setPromos(current => [transformFromDB(payload.new), ...current]);
        }
        if (payload.eventType === 'UPDATE') {
          setPromos(current => current.map(p => p.id === payload.new.id ? transformFromDB(payload.new) : p));
        }
        if (payload.eventType === 'DELETE') {
          setPromos(current => current.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      logger.context('PromoContext', 'Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user, refreshPromos, transformFromDB]);

  const value: PromoContextType = {
    promos,
    isLoading,
    addPromo,
    updatePromo,
    deletePromo,
    bulkDeletePromos,
    togglePromoStatus,
    searchPromos,
    getPromosByType,
    getPromosByStatus,
    refreshPromos
  };

  return (
    <PromoContext.Provider value={value}>
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = () => {
  const context = useContext(PromoContext);
  if (context === undefined) {
    throw new Error('usePromo must be used within a PromoProvider');
  }
  return context;
};