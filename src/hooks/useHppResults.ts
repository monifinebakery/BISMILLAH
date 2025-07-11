
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HppResult {
  id: string;
  nama: string;
  ingredients: any[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntungan: number;
  totalHPP: number;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  jumlahPorsi: number;
  timestamp: Date;
}

export const useHppResults = () => {
  const [hppResults, setHppResults] = useState<HppResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHppResults = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('hpp_results')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading HPP results:', error);
        toast.error('Gagal memuat data hasil HPP');
        return;
      }

      const formattedResults = data?.map((item: any) => ({
        id: item.id,
        nama: item.nama,
        ingredients: item.ingredients || [],
        biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
        biayaOverhead: parseFloat(item.biaya_overhead) || 0,
        marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
        totalHPP: parseFloat(item.total_hpp) || 0,
        hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
        hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
        jumlahPorsi: item.jumlah_porsi || 1,
        timestamp: new Date(item.created_at),
      })) || [];

      setHppResults(formattedResults);
    } catch (error) {
      console.error('Error in loadHppResults:', error);
      toast.error('Gagal memuat data hasil HPP');
    } finally {
      setLoading(false);
    }
  };

  const addHppResult = async (result: Omit<HppResult, 'id' | 'timestamp'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menyimpan hasil HPP');
        return false;
      }

      const { data, error } = await supabase
        .from('hpp_results')
        .insert({
          user_id: session.user.id,
          nama: result.nama,
          ingredients: JSON.parse(JSON.stringify(result.ingredients)),
          biaya_tenaga_kerja: result.biayaTenagaKerja,
          biaya_overhead: result.biayaOverhead,
          margin_keuntungan: result.marginKeuntungan,
          total_hpp: result.totalHPP,
          hpp_per_porsi: result.hppPerPorsi,
          harga_jual_per_porsi: result.hargaJualPerPorsi,
          jumlah_porsi: result.jumlahPorsi,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding HPP result:', error);
        toast.error('Gagal menyimpan hasil HPP');
        return false;
      }

      await loadHppResults();
      toast.success('Hasil HPP berhasil disimpan');
      return true;
    } catch (error) {
      console.error('Error in addHppResult:', error);
      toast.error('Gagal menyimpan hasil HPP');
      return false;
    }
  };

  const deleteHppResult = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus hasil HPP');
        return false;
      }

      const { error } = await supabase
        .from('hpp_results')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting HPP result:', error);
        toast.error('Gagal menghapus hasil HPP');
        return false;
      }

      setHppResults(prev => prev.filter(result => result.id !== id));
      toast.success('Hasil HPP berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteHppResult:', error);
      toast.error('Gagal menghapus hasil HPP');
      return false;
    }
  };

  useEffect(() => {
    loadHppResults();
  }, []);

  return {
    hppResults,
    loading,
    loadHppResults,
    addHppResult,
    deleteHppResult,
  };
};
