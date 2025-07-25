// src/contexts/SupplierContext.tsx
// VERSI REALTIME - FULL UPDATE
// 🔔 UPDATED WITH NOTIFICATION SYSTEM

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Supplier } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
// 🔔 ADD NOTIFICATION IMPORTS
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { safeParseDate } from '@/utils/unifiedDateUtils';

// --- INTERFACE & CONTEXT ---
interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();
  // 🔔 ADD NOTIFICATION CONTEXT
  const { addNotification } = useNotification();
  
  // --- HELPER FUNCTION ---
  const transformSupplierFromDB = (dbItem: any): Supplier => ({
    id: dbItem.id,
    nama: dbItem.nama,
    kontak: dbItem.kontak,
    email: dbItem.email,
    telepon: dbItem.telepon,
    alamat: dbItem.alamat,
    catatan: dbItem.catatan,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  // --- EFEK UTAMA: FETCH DATA & REALTIME LISTENER ---
  useEffect(() => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialSuppliers = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .order('nama', { ascending: true });
        
        if (error) {
          logger.error('SupplierContext - Error fetching suppliers:', error);
          toast.error(`Gagal memuat supplier: ${error.message}`);
          
          // 🔔 CREATE ERROR NOTIFICATION
          await addNotification(createNotificationHelper.systemError(
            `Gagal memuat data supplier: ${error.message}`
          ));
        } else {
          setSuppliers(data.map(transformSupplierFromDB));
          logger.context('SupplierContext', `Loaded ${data.length} suppliers`);
        }
      } catch (error) {
        logger.error('SupplierContext - Unexpected error:', error);
        await addNotification(createNotificationHelper.systemError(
          `Error tidak terduga saat memuat supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
        ));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialSuppliers();

    const channel = supabase.channel(`realtime-suppliers-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'suppliers', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        logger.context('SupplierContext', 'Real-time event received:', payload);
        const transform = transformSupplierFromDB;
        
        if (payload.eventType === 'INSERT') {
          setSuppliers(current => [transform(payload.new), ...current].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
        if (payload.eventType === 'UPDATE') {
          setSuppliers(current => current.map(s => s.id === payload.new.id ? transform(payload.new) : s));
        }
        if (payload.eventType === 'DELETE') {
          setSuppliers(current => current.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      logger.context('SupplierContext', 'Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]); // 🔔 ADD addNotification dependency

  // --- FUNGSI-FUNGSI (Disederhanakan) ---
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan supplier'); 
      return false; 
    }

    try {
      const supplierToInsert = {
        user_id: user.id,
        nama: supplier.nama,
        kontak: supplier.kontak,
        email: supplier.email,
        telepon: supplier.telepon,
        alamat: supplier.alamat,
        catatan: supplier.catatan ?? null,
      };

      logger.context('SupplierContext', 'Adding supplier:', supplierToInsert);
      const { error } = await supabase.from('suppliers').insert(supplierToInsert);
      
      if (error) {
        logger.error('SupplierContext - Error adding supplier:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Supplier Ditambahkan', 
        description: `${supplier.nama} telah ditambahkan`, 
        type: 'supplier', 
        value: null 
      });

      // Success toast
      toast.success(`${supplier.nama} berhasil ditambahkan!`);

      // 🔔 CREATE SUCCESS NOTIFICATION
      await addNotification({
        title: '🏢 Supplier Baru Ditambahkan!',
        message: `${supplier.nama} berhasil ditambahkan ke daftar supplier`,
        type: 'success',
        icon: 'building',
        priority: 2,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      logger.error('SupplierContext - Error in addSupplier:', error);
      toast.error(`Gagal menambahkan supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan supplier ${supplier.nama}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk memperbarui supplier'); 
      return false; 
    }

    try {
      const existingSupplier = suppliers.find(s => s.id === id);

      const supplierToUpdate: { [key: string]: any } = {};
      if (supplier.nama !== undefined) supplierToUpdate.nama = supplier.nama;
      if (supplier.kontak !== undefined) supplierToUpdate.kontak = supplier.kontak;
      if (supplier.email !== undefined) supplierToUpdate.email = supplier.email;
      if (supplier.telepon !== undefined) supplierToUpdate.telepon = supplier.telepon;
      if (supplier.alamat !== undefined) supplierToUpdate.alamat = supplier.alamat;
      if (supplier.catatan !== undefined) supplierToUpdate.catatan = supplier.catatan;

      logger.context('SupplierContext', 'Updating supplier:', id, supplierToUpdate);
      const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id);
      
      if (error) {
        logger.error('SupplierContext - Error updating supplier:', error);
        throw new Error(error.message);
      }
      
      // Success toast
      toast.success(`Supplier berhasil diperbarui!`);

      // 🔔 CREATE UPDATE NOTIFICATION
      await addNotification({
        title: '📝 Supplier Diperbarui',
        message: `${supplier.nama || existingSupplier?.nama} telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      logger.error('SupplierContext - Error in updateSupplier:', error);
      toast.error(`Gagal memperbarui supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menghapus supplier'); 
      return false; 
    }
    
    try {
      const supplierToDelete = suppliers.find(s => s.id === id);
      if (!supplierToDelete) {
        toast.error('Supplier tidak ditemukan');
        return false;
      }

      logger.context('SupplierContext', 'Deleting supplier:', id);
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      
      if (error) {
        logger.error('SupplierContext - Error deleting supplier:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Supplier Dihapus', 
        description: `${supplierToDelete.nama} telah dihapus`, 
        type: 'supplier', 
        value: null 
      });

      // Success toast
      toast.success(`Supplier berhasil dihapus!`);

      // 🔔 CREATE DELETE NOTIFICATION
      await addNotification({
        title: '🗑️ Supplier Dihapus',
        message: `${supplierToDelete.nama} telah dihapus dari daftar supplier`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      logger.error('SupplierContext - Error in deleteSupplier:', error);
      toast.error(`Gagal menghapus supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const value: SupplierContextType = { 
    suppliers, 
    isLoading, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier 
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};