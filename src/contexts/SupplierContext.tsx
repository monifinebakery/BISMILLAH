// src/contexts/SupplierContext.tsx
// Optimized SupplierContext with proper error handling and performance optimization

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback,
  useMemo
} from 'react';
import { Supplier } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Dependencies
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { safeParseDate } from '@/utils/unifiedDateUtils';

// ================================================================
// TYPES & INTERFACES
// ================================================================

interface SupplierContextType {
  // State
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  
  // Utility methods
  getSupplierById: (id: string) => Supplier | undefined;
  refreshSuppliers: () => Promise<void>;
  clearError: () => void;
}

interface SupplierProviderProps {
  children: ReactNode;
}

// Database row type
interface SupplierDbRow {
  id: string;
  nama: string;
  kontak: string;
  email: string | null;
  telepon: string | null;
  alamat: string | null;
  catatan: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ================================================================
// CONTEXT CREATION
// ================================================================

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// ================================================================
// HELPER FUNCTIONS
// ================================================================

const transformSupplierFromDB = (dbItem: SupplierDbRow): Supplier => ({
  id: dbItem.id,
  nama: dbItem.nama,
  kontak: dbItem.kontak,
  email: dbItem.email || undefined,
  telepon: dbItem.telepon || undefined,
  alamat: dbItem.alamat || undefined,
  catatan: dbItem.catatan || undefined,
  userId: dbItem.user_id,
  createdAt: safeParseDate(dbItem.created_at),
  updatedAt: safeParseDate(dbItem.updated_at),
});

const transformSupplierToDB = (supplier: Partial<Supplier>) => ({
  nama: supplier.nama,
  kontak: supplier.kontak,
  email: supplier.email || null,
  telepon: supplier.telepon || null,
  alamat: supplier.alamat || null,
  catatan: supplier.catatan || null,
});

// ================================================================
// PROVIDER COMPONENT
// ================================================================

export const SupplierProvider: React.FC<SupplierProviderProps> = ({ children }) => {
  // ================================================================
  // STATE
  // ================================================================
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================================================
  // DEPENDENCIES
  // ================================================================
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // ================================================================
  // UTILITY METHODS
  // ================================================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getSupplierById = useCallback((id: string) => {
    return suppliers.find(s => s.id === id);
  }, [suppliers]);

  // ================================================================
  // DATA FETCHING
  // ================================================================
  const fetchSuppliers = useCallback(async () => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const transformedSuppliers = (data || []).map(transformSupplierFromDB);
      setSuppliers(transformedSuppliers);
      
      logger.context('SupplierContext', `Loaded ${transformedSuppliers.length} suppliers`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('SupplierContext - Error fetching suppliers:', err);
      
      toast.error(`Gagal memuat supplier: ${errorMessage}`);
      
      await addNotification(createNotificationHelper.systemError(
        `Gagal memuat data supplier: ${errorMessage}`
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]);

  const refreshSuppliers = useCallback(async () => {
    setIsLoading(true);
    await fetchSuppliers();
  }, [fetchSuppliers]);

  // ================================================================
  // CRUD OPERATIONS
  // ================================================================
  
  const addSupplier = useCallback(async (
    supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan supplier');
      return false;
    }

    try {
      setError(null);
      
      const supplierToInsert = {
        user_id: user.id,
        ...transformSupplierToDB(supplierData),
      };

      logger.context('SupplierContext', 'Adding supplier:', supplierToInsert);
      
      const { data, error: insertError } = await supabase
        .from('suppliers')
        .insert(supplierToInsert)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (data) {
        const newSupplier = transformSupplierFromDB(data);
        setSuppliers(prev => [newSupplier, ...prev].sort((a, b) => a.nama.localeCompare(b.nama)));
      }

      // Activity log
      addActivity({
        title: 'Supplier Ditambahkan',
        description: `${supplierData.nama} telah ditambahkan`,
        type: 'supplier',
        value: null
      });

      // Success notification
      await addNotification({
        title: '🏢 Supplier Baru Ditambahkan!',
        message: `${supplierData.nama} berhasil ditambahkan ke daftar supplier`,
        type: 'success',
        icon: 'building',
        priority: 2,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      toast.success(`${supplierData.nama} berhasil ditambahkan!`);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('SupplierContext - Error in addSupplier:', err);
      
      toast.error(`Gagal menambahkan supplier: ${errorMessage}`);
      
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan supplier ${supplierData.nama}: ${errorMessage}`
      ));
      
      return false;
    }
  }, [user, addActivity, addNotification]);

  const updateSupplier = useCallback(async (
    id: string,
    supplierData: Partial<Omit<Supplier, 'id' | 'userId'>>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui supplier');
      return false;
    }

    try {
      setError(null);
      
      const existingSupplier = suppliers.find(s => s.id === id);
      if (!existingSupplier) {
        throw new Error('Supplier tidak ditemukan');
      }

      const supplierToUpdate = transformSupplierToDB(supplierData);

      logger.context('SupplierContext', 'Updating supplier:', id, supplierToUpdate);
      
      const { data, error: updateError } = await supabase
        .from('suppliers')
        .update(supplierToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (data) {
        const updatedSupplier = transformSupplierFromDB(data);
        setSuppliers(prev => 
          prev.map(s => s.id === id ? updatedSupplier : s)
            .sort((a, b) => a.nama.localeCompare(b.nama))
        );
      }

      // Success notification
      await addNotification({
        title: '📝 Supplier Diperbarui',
        message: `${supplierData.nama || existingSupplier.nama} telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      toast.success('Supplier berhasil diperbarui!');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('SupplierContext - Error in updateSupplier:', err);
      
      toast.error(`Gagal memperbarui supplier: ${errorMessage}`);
      
      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui supplier: ${errorMessage}`
      ));
      
      return false;
    }
  }, [user, suppliers, addNotification]);

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus supplier');
      return false;
    }

    try {
      setError(null);
      
      const supplierToDelete = suppliers.find(s => s.id === id);
      if (!supplierToDelete) {
        throw new Error('Supplier tidak ditemukan');
      }

      logger.context('SupplierContext', 'Deleting supplier:', id);
      
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuppliers(prev => prev.filter(s => s.id !== id));

      // Activity log
      addActivity({
        title: 'Supplier Dihapus',
        description: `${supplierToDelete.nama} telah dihapus`,
        type: 'supplier',
        value: null
      });

      // Delete notification
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

      toast.success('Supplier berhasil dihapus!');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('SupplierContext - Error in deleteSupplier:', err);
      
      toast.error(`Gagal menghapus supplier: ${errorMessage}`);
      
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus supplier: ${errorMessage}`
      ));
      
      return false;
    }
  }, [user, suppliers, addActivity, addNotification]);

  // ================================================================
  // REALTIME SUBSCRIPTION
  // ================================================================
  useEffect(() => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchSuppliers();

    // Setup realtime subscription
    const channel = supabase.channel(`realtime-suppliers-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'suppliers',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        logger.context('SupplierContext', 'Real-time event received:', payload);

        if (payload.eventType === 'INSERT' && payload.new) {
          const newSupplier = transformSupplierFromDB(payload.new as SupplierDbRow);
          setSuppliers(current => 
            [newSupplier, ...current].sort((a, b) => a.nama.localeCompare(b.nama))
          );
        }
        
        if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedSupplier = transformSupplierFromDB(payload.new as SupplierDbRow);
          setSuppliers(current => 
            current.map(s => s.id === updatedSupplier.id ? updatedSupplier : s)
              .sort((a, b) => a.nama.localeCompare(b.nama))
          );
        }
        
        if (payload.eventType === 'DELETE' && payload.old) {
          setSuppliers(current => current.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    // Cleanup function
    return () => {
      logger.context('SupplierContext', 'Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user, fetchSuppliers]);

  // ================================================================
  // CONTEXT VALUE
  // ================================================================
  const contextValue = useMemo<SupplierContextType>(() => ({
    // State
    suppliers,
    isLoading,
    error,
    
    // Actions
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Utility methods
    getSupplierById,
    refreshSuppliers,
    clearError,
  }), [
    suppliers,
    isLoading,
    error,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    refreshSuppliers,
    clearError,
  ]);

  return (
    <SupplierContext.Provider value={contextValue}>
      {children}
    </SupplierContext.Provider>
  );
};

// ================================================================
// CUSTOM HOOK
// ================================================================
export const useSupplier = (): SupplierContextType => {
  const context = useContext(SupplierContext);
  
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  
  return context;
};

// ================================================================
// ADDITIONAL HOOKS FOR SPECIFIC USE CASES
// ================================================================

// Hook for getting a specific supplier
export const useSupplierById = (id: string | undefined): Supplier | undefined => {
  const { getSupplierById } = useSupplier();
  return useMemo(() => {
    return id ? getSupplierById(id) : undefined;
  }, [id, getSupplierById]);
};

// Hook for filtered suppliers
export const useFilteredSuppliers = (searchTerm: string = ''): Supplier[] => {
  const { suppliers } = useSupplier();
  
  return useMemo(() => {
    if (!searchTerm.trim()) {
      return suppliers;
    }
    
    const term = searchTerm.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(term) ||
      supplier.kontak.toLowerCase().includes(term) ||
      (supplier.email && supplier.email.toLowerCase().includes(term))
    );
  }, [suppliers, searchTerm]);
};

// Hook for supplier statistics
export const useSupplierStats = () => {
  const { suppliers } = useSupplier();
  
  return useMemo(() => {
    const total = suppliers.length;
    const withEmail = suppliers.filter(s => s.email).length;
    const withPhone = suppliers.filter(s => s.telepon).length;
    const withAddress = suppliers.filter(s => s.alamat).length;
    
    return {
      total,
      withEmail,
      withPhone,
      withAddress,
      completionRate: total > 0 ? Math.round((withEmail / total) * 100) : 0,
    };
  }, [suppliers]);
};