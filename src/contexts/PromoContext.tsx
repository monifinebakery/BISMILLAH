// src/contexts/PromoContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PromoEstimation } from '@/types/promo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { safeParseDate } from '@/utils/dateUtils';

interface PromoContextType {
  promoHistory: PromoEstimation[];
  isLoading: boolean;
  addPromoEstimation: (estimation: Omit<PromoEstimation, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  deletePromoEstimation: (id: string) => Promise<boolean>;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

export const PromoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promoHistory, setPromoHistory] = useState<PromoEstimation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const transformFromDB = (dbItem: any): PromoEstimation => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    promo_name: dbItem.promo_name,
    promo_type: dbItem.promo_type,
    base_recipe_id: dbItem.base_recipe_id,
    base_recipe_name: dbItem.base_recipe_name,
    promo_details: dbItem.promo_details,
    original_price: Number(dbItem.original_price),
    original_hpp: Number(dbItem.original_hpp),
    promo_price_effective: Number(dbItem.promo_price_effective),
    estimated_margin_percent: Number(dbItem.estimated_margin_percent),
    estimated_margin_rp: Number(dbItem.estimated_margin_rp),
  });

  useEffect(() => {
    if (!user) {
      setPromoHistory([]);
      setIsLoading(false);
      return;
    }
    const fetchHistory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('promo_estimations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) toast.error(`Gagal memuat riwayat promo: ${error.message}`);
      else setPromoHistory(data.map(transformFromDB));
      setIsLoading(false);
    };
    fetchHistory();
    
    // Realtime listener
    const channel = supabase.channel(`realtime-promos-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_estimations', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setPromoHistory(current => [transformFromDB(payload.new), ...current]);
        if (payload.eventType === 'DELETE') setPromoHistory(current => current.filter(p => p.id !== payload.old.id));
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addPromoEstimation = async (estimation: Omit<PromoEstimation, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) { toast.error('Anda harus login'); return false; }
    
    const { error } = await supabase.from('promo_estimations').insert({ ...estimation, user_id: user.id });
    if (error) { toast.error(`Gagal menyimpan estimasi: ${error.message}`); return false; }
    
    toast.success('Estimasi promo berhasil disimpan!');
    return true;
  };

  const deletePromoEstimation = async (id: string) => {
    const { error } = await supabase.from('promo_estimations').delete().eq('id', id);
    if (error) { toast.error(`Gagal menghapus estimasi: ${error.message}`); return false; }
    
    toast.success('Estimasi promo berhasil dihapus.');
    return true;
  };

  return (
    <PromoContext.Provider value={{ promoHistory, isLoading, addPromoEstimation, deletePromoEstimation }}>
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = () => {
  const context = useContext(PromoContext);
  if (!context) throw new Error('usePromo must be used within a PromoProvider');
  return context;
};