
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Asset {
  id: string;
  nama: string;
  kategori: 'Peralatan' | 'Kendaraan' | 'Properti' | 'Teknologi';
  nilaiAwal: number;
  nilaiSekarang: number;
  tanggalBeli: string;
  kondisi: 'Baik' | 'Cukup' | 'Buruk';
  lokasi: string;
  deskripsi: string;
  depresiasi: number;
}

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assets:', error);
        toast.error('Gagal memuat data aset');
        return;
      }

      const formattedAssets = data?.map((item: any) => ({
        id: item.id,
        nama: item.nama,
        kategori: item.kategori,
        nilaiAwal: parseFloat(item.nilai_awal) || 0,
        nilaiSekarang: parseFloat(item.nilai_sekarang) || 0,
        tanggalBeli: item.tanggal_beli,
        kondisi: item.kondisi,
        lokasi: item.lokasi,
        deskripsi: item.deskripsi || '',
        depresiasi: parseFloat(item.depresiasi) || 0,
      })) || [];

      setAssets(formattedAssets);
    } catch (error) {
      console.error('Error in loadAssets:', error);
      toast.error('Gagal memuat data aset');
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'depresiasi'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah aset');
        return false;
      }

      const depresiasi = asset.nilaiAwal > 0 ? ((asset.nilaiAwal - asset.nilaiSekarang) / asset.nilaiAwal * 100) : 0;

      const { data, error } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          nama: asset.nama,
          kategori: asset.kategori,
          nilai_awal: asset.nilaiAwal,
          nilai_sekarang: asset.nilaiSekarang,
          tanggal_beli: asset.tanggalBeli,
          kondisi: asset.kondisi,
          lokasi: asset.lokasi,
          deskripsi: asset.deskripsi,
          depresiasi: depresiasi,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding asset:', error);
        toast.error('Gagal menambah aset');
        return false;
      }

      await loadAssets();
      toast.success('Aset berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addAsset:', error);
      toast.error('Gagal menambah aset');
      return false;
    }
  };

  const updateAsset = async (id: string, asset: Omit<Asset, 'id' | 'depresiasi'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate aset');
        return false;
      }

      const depresiasi = asset.nilaiAwal > 0 ? ((asset.nilaiAwal - asset.nilaiSekarang) / asset.nilaiAwal * 100) : 0;

      const { error } = await supabase
        .from('assets')
        .update({
          nama: asset.nama,
          kategori: asset.kategori,
          nilai_awal: asset.nilaiAwal,
          nilai_sekarang: asset.nilaiSekarang,
          tanggal_beli: asset.tanggalBeli,
          kondisi: asset.kondisi,
          lokasi: asset.lokasi,
          deskripsi: asset.deskripsi,
          depresiasi: depresiasi,
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating asset:', error);
        toast.error('Gagal mengupdate aset');
        return false;
      }

      await loadAssets();
      toast.success('Aset berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error in updateAsset:', error);
      toast.error('Gagal mengupdate aset');
      return false;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus aset');
        return false;
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting asset:', error);
        toast.error('Gagal menghapus aset');
        return false;
      }

      setAssets(prev => prev.filter(asset => asset.id !== id));
      toast.success('Aset berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      toast.error('Gagal menghapus aset');
      return false;
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  return {
    assets,
    loading,
    loadAssets,
    addAsset,
    updateAsset,
    deleteAsset,
  };
};
