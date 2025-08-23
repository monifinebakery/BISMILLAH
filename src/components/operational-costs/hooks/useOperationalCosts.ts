// src/components/operational-costs/hooks/useOperationalCosts.ts

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { 
  OperationalCost, 
  CostFormData, 
  CostFilters, 
  CostSummary,
  ApiResponse 
} from '../types';
import { operationalCostApi, setQueryClient } from '../services';
import { transformCostsToSummary } from '../utils/costTransformers';
import { validateCostForm } from '../utils/costValidation';

interface UseOperationalCostsReturn {
  // State
  costs: OperationalCost[];
  filteredCosts: OperationalCost[];
  summary: CostSummary;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadCosts: (filters?: CostFilters) => Promise<void>;
  createCost: (data: CostFormData) => Promise<ApiResponse<OperationalCost>>;
  updateCost: (id: string, data: Partial<CostFormData>) => Promise<ApiResponse<OperationalCost>>;
  deleteCost: (id: string) => Promise<ApiResponse<boolean>>;
  getCostById: (id: string) => OperationalCost | undefined;
  
  // Filters
  applyFilters: (filters: CostFilters) => void;
  clearFilters: () => void;
  
  // Utilities
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useOperationalCosts = (initialFilters?: CostFilters): UseOperationalCostsReturn => {
  const queryClient = useQueryClient();
  const [costs, setCosts] = useState<OperationalCost[]>([]);
  const [filters, setFilters] = useState<CostFilters>(initialFilters || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Set up query client for cache invalidation
  useEffect(() => {
    setQueryClient(queryClient);
  }, [queryClient]);

  // Computed values
  const filteredCosts = costs.filter(cost => {
    if (filters.jenis && cost.jenis !== filters.jenis) return false;
    if (filters.status && cost.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return cost.nama_biaya.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const summary = transformCostsToSummary(filteredCosts);

  // Load costs from API
  const loadCosts = useCallback(async (queryFilters?: CostFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await operationalCostApi.getCosts(queryFilters);
      
      if (response.error) {
        setError(response.error);
      } else {
        setCosts(response.data);
      }
    } catch (err) {
      setError('Gagal memuat data biaya operasional');
      logger.error('Error loading costs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new cost
  const createCost = useCallback(async (data: CostFormData): Promise<ApiResponse<OperationalCost>> => {
    // Validate form data
    const validation = validateCostForm(data);
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(', ');
      return { data: {} as OperationalCost, error: errorMessage };
    }

    try {
      setError(null);
      const response = await operationalCostApi.createCost(data);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Add to local state
        setCosts(prev => [...prev, response.data]);
      }
      
      return response;
    } catch (err) {
      const errorMessage = 'Gagal menambahkan biaya operasional';
      setError(errorMessage);
      logger.error('Error creating cost:', err);
      return { data: {} as OperationalCost, error: errorMessage };
    }
  }, []);

  // Update existing cost
  const updateCost = useCallback(async (
    id: string, 
    data: Partial<CostFormData>
  ): Promise<ApiResponse<OperationalCost>> => {
    try {
      setError(null);
      const response = await operationalCostApi.updateCost(id, data);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Update local state
        setCosts(prev => prev.map(cost => 
          cost.id === id ? response.data : cost
        ));
      }
      
      return response;
    } catch (err) {
      const errorMessage = 'Gagal memperbarui biaya operasional';
      setError(errorMessage);
      logger.error('Error updating cost:', err);
      return { data: {} as OperationalCost, error: errorMessage };
    }
  }, []);

  // Delete cost
  const deleteCost = useCallback(async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      setError(null);
      const response = await operationalCostApi.deleteCost(id);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Remove from local state
        setCosts(prev => prev.filter(cost => cost.id !== id));
      }
      
      return response;
    } catch (err) {
      const errorMessage = 'Gagal menghapus biaya operasional';
      setError(errorMessage);
      logger.error('Error deleting cost:', err);
      return { data: false, error: errorMessage };
    }
  }, []);

  // Get cost by ID
  const getCostById = useCallback((id: string): OperationalCost | undefined => {
    return costs.find(cost => cost.id === id);
  }, [costs]);

  // Apply filters
  const applyFilters = useCallback((newFilters: CostFilters) => {
    setFilters(newFilters);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadCosts(filters);
  }, [loadCosts, filters]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    loadCosts(initialFilters);
  }, []); // Only run once on mount

  return {
    // State
    costs,
    filteredCosts,
    summary,
    loading,
    error,
    
    // Actions
    loadCosts,
    createCost,
    updateCost,
    deleteCost,
    getCostById,
    
    // Filters
    applyFilters,
    clearFilters,
    
    // Utilities
    refreshData,
    clearError,
  };
};