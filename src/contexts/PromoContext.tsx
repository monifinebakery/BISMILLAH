// src/contexts/PromoContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PromoEstimation } from '@/types/promo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';

interface PromoContextType {
  promoHistory: PromoEstimation[];
  isLoading: boolean;
  error: string | null;
  addPromoEstimation: (estimation: Omit<PromoEstimation, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  deletePromoEstimation: (id: string) => Promise<boolean>;
  clearError: () => void;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

export const PromoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promoHistory, setPromoHistory] = useState<PromoEstimation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get auth context with safety check
  const authContext = useAuth();
  const user = authContext?.user;

  // Helper function to safely transform data from DB
  const transformFromDB = useCallback((dbItem: any): PromoEstimation | null => {
    try {
      if (!dbItem || !dbItem.id) {
        logger.warn('PromoContext - Invalid promo data received from database:', dbItem);
        return null;
      }

      return {
        id: dbItem.id,
        userId: dbItem.user_id,
        createdAt: safeParseDate(dbItem.created_at),
        promo_name: dbItem.promo_name || '',
        promo_type: dbItem.promo_type || '',
        base_recipe_id: dbItem.base_recipe_id || '',
        base_recipe_name: dbItem.base_recipe_name || '',
        promo_details: dbItem.promo_details || {},
        original_price: Number(dbItem.original_price) || 0,
        original_hpp: Number(dbItem.original_hpp) || 0,
        promo_price_effective: Number(dbItem.promo_price_effective) || 0,
        estimated_margin_percent: Number(dbItem.estimated_margin_percent) || 0,
        estimated_margin_rp: Number(dbItem.estimated_margin_rp) || 0,
      };
    } catch (error) {
      logger.error('PromoContext - Error transforming promo from DB:', error);
      return null;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Main effect for data loading and real-time subscription
  useEffect(() => {
    // If auth context is not available, handle gracefully
    if (!authContext) {
      logger.warn('PromoContext - Auth context not available');
      setIsLoading(false);
      setError('Auth context not available');
      return;
    }

    // If user status is still loading, wait
    if (user === undefined) {
      return;
    }

    // If user is not logged in, clear data
    if (!user) {
      logger.context('PromoContext', 'User logout, clearing promo data.');
      setPromoHistory([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // User is logged in, fetch data and setup realtime
    const fetchInitialData = async () => {
      try {
        logger.context('PromoContext', `User detected (${user.id}), loading promo data...`);
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('promo_estimations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          const transformedPromos = data
            .map(transformFromDB)
            .filter((promo): promo is PromoEstimation => promo !== null);
          
          setPromoHistory(transformedPromos);
          logger.context('PromoContext', `Loaded ${transformedPromos.length} promo estimations`);
        } else {
          setPromoHistory([]);
        }
      } catch (error) {
        logger.error('PromoContext - Error fetching promo history:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Gagal memuat riwayat promo: ${errorMessage}`);
        toast.error(`Gagal memuat riwayat promo: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Setup realtime subscription
    const channel = supabase
      .channel(`realtime-promos-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promo_estimations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          try {
            logger.context('PromoContext', 'Realtime change received:', payload);

            if (payload.eventType === 'INSERT' && payload.new) {
              const newPromo = transformFromDB(payload.new);
              if (newPromo) {
                setPromoHistory(current => [newPromo, ...current]);
              }
            }

            if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedPromo = transformFromDB(payload.new);
              if (updatedPromo) {
                setPromoHistory(current => 
                  current.map(p => p.id === updatedPromo.id ? updatedPromo : p)
                );
              }
            }

            if (payload.eventType === 'DELETE' && payload.old?.id) {
              const deletedPromoId = payload.old.id;
              setPromoHistory(current => current.filter(p => p.id !== deletedPromoId));
            }
          } catch (error) {
            logger.error('PromoContext - Error handling realtime event:', error);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      logger.context('PromoContext', 'Cleaning up realtime channel.');
      supabase.removeChannel(channel);
    };
  }, [user, authContext, transformFromDB]);

  // Add promo estimation function
  const addPromoEstimation = useCallback(async (
    estimation: Omit<PromoEstimation, 'id' | 'userId' | 'createdAt'>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan estimasi promo');
      return false;
    }

    try {
      // Prepare data for database (ensure all required fields are present)
      const estimationToInsert = {
        user_id: user.id,
        promo_name: estimation.promo_name?.trim() || '',
        promo_type: estimation.promo_type || '',
        base_recipe_id: estimation.base_recipe_id || '',
        base_recipe_name: estimation.base_recipe_name?.trim() || '',
        promo_details: estimation.promo_details || {},
        original_price: estimation.original_price || 0,
        original_hpp: estimation.original_hpp || 0,
        promo_price_effective: estimation.promo_price_effective || 0,
        estimated_margin_percent: estimation.estimated_margin_percent || 0,
        estimated_margin_rp: estimation.estimated_margin_rp || 0,
      };

      const { error } = await supabase
        .from('promo_estimations')
        .insert(estimationToInsert);

      if (error) {
        throw new Error(error.message);
      }

      // Clear any previous errors
      setError(null);
      return true;
    } catch (error) {
      logger.error('PromoContext - Error adding promo estimation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Gagal menyimpan estimasi: ${errorMessage}`);
      return false;
    }
  }, [user]);

  // Delete promo estimation function
  const deletePromoEstimation = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus estimasi promo');
      return false;
    }

    if (!id) {
      toast.error('ID estimasi tidak valid');
      return false;
    }

    try {
      const { error } = await supabase
        .from('promo_estimations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        throw new Error(error.message);
      }

      // Clear any previous errors
      setError(null);
      return true;
    } catch (error) {
      logger.error('PromoContext - Error deleting promo estimation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Gagal menghapus estimasi: ${errorMessage}`);
      return false;
    }
  }, [user]);

  const value: PromoContextType = {
    promoHistory,
    isLoading,
    error,
    addPromoEstimation,
    deletePromoEstimation,
    clearError,
  };

  return (
    <PromoContext.Provider value={value}>
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = (): PromoContextType => {
  const context = useContext(PromoContext);
  if (!context) {
    throw new Error('usePromo must be used within a PromoProvider');
  }
  return context;
};