// src/contexts/SupplierContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Supplier } from '@/types/supplier'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

// --- INTERFACE & CONTEXT ---
interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_suppliers';

// --- PROVIDER COMPONENT ---
export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();

  // --- LOAD & SAVE EFFECTS ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: safeParseDate(item.createdAt),
          updatedAt: safeParseDate(item.updatedAt),
        }));
        setSuppliers(parsed);
      }
    } catch (error) {
      console.error("Gagal memuat supplier dari localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  // --- FUNCTIONS ---
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!session) {
      toast.error('Anda harus login untuk menambahkan supplier');
      return false;
    }

    const newSupplier: Supplier = {
      ...supplier,
      id: generateUUID(),
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const supplierToInsert = {
      id: newSupplier.id,
      nama: newSupplier.nama,
      kontak: newSupplier.kontak,
      email: newSupplier.email,
      telepon: newSupplier.telepon,
      alamat: newSupplier.alamat,
      catatan: newSupplier.catatan ?? null,
      user_id: newSupplier.userId,
      created_at: toSafeISOString(newSupplier.createdAt),
      updated_at: toSafeISOString(newSupplier.updatedAt),
    };

    const { error } = await supabase.from('suppliers').insert([supplierToInsert]);
    if (error) {
      console.error('Error adding supplier to DB:', error);
      toast.error(`Gagal menambahkan supplier: ${error.message}`);
      return false;
    }

    setSuppliers(prev => [...prev, newSupplier]);
    addActivity({
      title: 'Supplier Ditambahkan',
      description: `${supplier.nama} telah ditambahkan`,
      type: 'supplier',
      value: null,
    });
    toast.success(`${supplier.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateSupplier = async (id: string, updatedSupplier: Partial<Supplier>): Promise<boolean> => {
    if (!session) {
        toast.error('Anda harus login untuk memperbarui supplier');
        return false;
    }

    // ... Logika untuk mengonversi properti ke snake_case untuk Supabase ...
    const supplierToUpdate: Partial<any> = {
        updated_at: toSafeISOString(new Date()),
        // ...map properti lain...
    };

    const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id).eq('user_id', session.user.id);
    if (error) {
        console.error('Error updating supplier in DB:', error);
        toast.error(`Gagal memperbarui supplier: ${error.message}`);
        return false;
    }

    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updatedSupplier, updatedAt: new Date() } : s)));
    toast.success(`Supplier berhasil diperbarui!`);
    return true;
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    if (!session) {
        toast.error('Anda harus login untuk menghapus supplier');
        return false;
    }
    const supplier = suppliers.find(s => s.id === id);

    const { error } = await supabase.from('suppliers').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
        console.error('Error deleting supplier from DB:', error);
        toast.error(`Gagal menghapus supplier: ${error.message}`);
        return false;
    }

    setSuppliers(prev => prev.filter(s => s.id !== id));
    if (supplier) {
        addActivity({
            title: 'Supplier Dihapus',
            description: `${supplier.nama} telah dihapus`,
            type: 'supplier',
            value: null,
        });
        toast.success(`Supplier ${supplier.nama} berhasil dihapus!`);
    }
    return true;
  };

  const value: SupplierContextType = {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
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