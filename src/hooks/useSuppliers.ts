
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuppliers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading suppliers:', error);
        toast.error('Gagal memuat data supplier');
        return;
      }

      const formattedSuppliers = data?.map((item: any) => ({
        id: item.id,
        nama: item.nama,
        kontak: item.kontak || '',
        email: item.email || '',
        telepon: item.telepon || '',
        alamat: item.alamat || '',
        catatan: item.catatan || '',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at || item.created_at),
      })) || [];

      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error('Error in loadSuppliers:', error);
      toast.error('Gagal memuat data supplier');
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah supplier');
        return false;
      }

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          user_id: session.user.id,
          nama: supplier.nama,
          kontak: supplier.kontak || null,
          email: supplier.email || null,
          telepon: supplier.telepon || null,
          alamat: supplier.alamat || null,
          catatan: supplier.catatan || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding supplier:', error);
        toast.error('Gagal menambah supplier');
        return false;
      }

      await loadSuppliers();
      toast.success('Supplier berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addSupplier:', error);
      toast.error('Gagal menambah supplier');
      return false;
    }
  };

  const updateSupplier = async (id: string, supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate supplier');
        return false;
      }

      const { error } = await supabase
        .from('suppliers')
        .update({
          nama: supplier.nama,
          kontak: supplier.kontak || null,
          email: supplier.email || null,
          telepon: supplier.telepon || null,
          alamat: supplier.alamat || null,
          catatan: supplier.catatan || null,
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating supplier:', error);
        toast.error('Gagal mengupdate supplier');
        return false;
      }

      await loadSuppliers();
      toast.success('Supplier berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error in updateSupplier:', error);
      toast.error('Gagal mengupdate supplier');
      return false;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus supplier');
        return false;
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Gagal menghapus supplier');
        return false;
      }

      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      toast.success('Supplier berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteSupplier:', error);
      toast.error('Gagal menghapus supplier');
      return false;
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    loadSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  };
};
