// src/contexts/SupplierContext.tsx
// VERSI REALTIME - FULL UPDATE

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Supplier } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

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
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('user_id', user.id)
            .order('nama', { ascending: true });
        
        if (error) {
            toast.error(`Gagal memuat supplier: ${error.message}`);
        } else {
            setSuppliers(data.map(transformSupplierFromDB));
        }
        setIsLoading(false);
    };

    fetchInitialSuppliers();

    const channel = supabase.channel(`realtime-suppliers-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
            const transform = transformSupplierFromDB;
            if (payload.eventType === 'INSERT') setSuppliers(current => [transform(payload.new), ...current].sort((a,b) => a.nama.localeCompare(b.nama)));
            if (payload.eventType === 'UPDATE') setSuppliers(current => current.map(s => s.id === payload.new.id ? transform(payload.new) : s));
            if (payload.eventType === 'DELETE') setSuppliers(current => current.filter(s => s.id !== payload.old.id));
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // --- FUNGSI-FUNGSI (Disederhanakan) ---
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk menambahkan supplier'); return false; }

    const supplierToInsert = {
      user_id: user.id,
      nama: supplier.nama,
      kontak: supplier.kontak,
      email: supplier.email,
      telepon: supplier.telepon,
      alamat: supplier.alamat,
      catatan: supplier.catatan ?? null,
    };

    const { error } = await supabase.from('suppliers').insert(supplierToInsert);
    if (error) { toast.error(`Gagal menambahkan supplier: ${error.message}`); return false; }
    
    addActivity({ title: 'Supplier Ditambahkan', description: `${supplier.nama} telah ditambahkan`, type: 'supplier', value: null });
    toast.success(`${supplier.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateSupplier = async (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk memperbarui supplier'); return false; }

    const supplierToUpdate: { [key: string]: any } = {};
    if (supplier.nama !== undefined) supplierToUpdate.nama = supplier.nama;
    if (supplier.kontak !== undefined) supplierToUpdate.kontak = supplier.kontak;
    if (supplier.email !== undefined) supplierToUpdate.email = supplier.email;
    if (supplier.telepon !== undefined) supplierToUpdate.telepon = supplier.telepon;
    if (supplier.alamat !== undefined) supplierToUpdate.alamat = supplier.alamat;
    if (supplier.catatan !== undefined) supplierToUpdate.catatan = supplier.catatan;

    const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id);
    if (error) { toast.error(`Gagal memperbarui supplier: ${error.message}`); return false; }
    
    toast.success(`Supplier berhasil diperbarui!`);
    return true;
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk menghapus supplier'); return false; }
    
    const supplierToDelete = suppliers.find(s => s.id === id);

    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { toast.error(`Gagal menghapus supplier: ${error.message}`); return false; }
    
    if (supplierToDelete) {
        addActivity({ title: 'Supplier Dihapus', description: `${supplierToDelete.nama} telah dihapus`, type: 'supplier', value: null });
    }
    toast.success(`Supplier berhasil dihapus!`);
    return true;
  };

  const value: SupplierContextType = { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier };

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