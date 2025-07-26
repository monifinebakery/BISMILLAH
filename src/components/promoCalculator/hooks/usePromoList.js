import { useState, useCallback } from 'react';
import { promoService } from '../services/promoService';

export const usePromoList = () => {
  const [promos, setPromos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPromos = useCallback(async (options = {}) => {
    setIsLoading(true);
    try {
      const { data, count } = await promoService.getPromos({
        search: options.search,
        ...options.filters,
        ...options.pagination
      });
      
      setPromos(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error refreshing promos:', error);
      setPromos([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePromo = useCallback(async (id) => {
    return await promoService.deletePromo(id);
  }, []);

  const bulkDelete = useCallback(async (ids) => {
    return await promoService.bulkDeletePromos(ids);
  }, []);

  const toggleStatus = useCallback(async (id, newStatus) => {
    return await promoService.toggleStatus(id, newStatus);
  }, []);

  const updatePromo = useCallback(async (id, updates) => {
    return await promoService.updatePromo(id, updates);
  }, []);

  return {
    promos,
    totalCount,
    isLoading,
    refreshPromos,
    deletePromo,
    bulkDelete,
    toggleStatus,
    updatePromo
  };
};