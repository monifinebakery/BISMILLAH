// src/components/operational-costs/hooks/useCostAllocation.ts

import { useState, useCallback, useEffect } from 'react';
import { 
  AllocationSettings, 
  AllocationFormData, 
  ApiResponse 
} from '../types';
import { allocationApi } from '../services';
import { 
  validateAllocationForm, 
  validateCostAllocation 
} from '../utils/costValidation';
import { 
  transformAllocationToForm, 
  transformAllocationForDisplay 
} from '../utils/costTransformers';
import { DEFAULT_ALLOCATION_VALUES } from '../constants/allocationMethods';

interface UseCostAllocationReturn {
  // State
  settings: AllocationSettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  saveSettings: (data: AllocationFormData) => Promise<ApiResponse<AllocationSettings>>;
  resetToDefaults: () => AllocationFormData;
  
  // Computed values
  getDisplaySettings: (totalCosts?: number) => {
    metode_name: string;
    nilai_formatted: string;
    overhead_example: string;
    description: string;
  } | null;
  getFormData: () => AllocationFormData | null;
  
  // Validation
  validateSettings: (data: AllocationFormData, totalCosts?: number) => {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
  };
  
  // Utilities
  refreshSettings: () => Promise<void>;
  clearError: () => void;
}

export const useCostAllocation = (): UseCostAllocationReturn => {
  const [settings, setSettings] = useState<AllocationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load allocation settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await allocationApi.getSettings();
      
      if (response.error) {
        setError(response.error);
      } else {
        setSettings(response.data);
      }
    } catch (err) {
      setError('Gagal memuat pengaturan alokasi');
      console.error('Error loading allocation settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save allocation settings
  const saveSettings = useCallback(async (
    data: AllocationFormData
  ): Promise<ApiResponse<AllocationSettings>> => {
    // Validate form data
    const validation = validateAllocationForm(data);
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(', ');
      return { data: {} as AllocationSettings, error: errorMessage };
    }

    try {
      setError(null);
      const response = await allocationApi.upsertSettings(data);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSettings(response.data);
      }
      
      return response;
    } catch (err) {
      const errorMessage = 'Gagal menyimpan pengaturan alokasi';
      setError(errorMessage);
      console.error('Error saving allocation settings:', err);
      return { data: {} as AllocationSettings, error: errorMessage };
    }
  }, []);

  // Reset to default values
  const resetToDefaults = useCallback((): AllocationFormData => {
    return {
      metode: 'per_unit',
      nilai: DEFAULT_ALLOCATION_VALUES.PER_UNIT,
    };
  }, []);

  // Get display settings
  const getDisplaySettings = useCallback((totalCosts: number = 0) => {
    if (!settings) return null;
    return transformAllocationForDisplay(settings, totalCosts);
  }, [settings]);

  // Get form data from current settings
  const getFormData = useCallback((): AllocationFormData | null => {
    if (!settings) return null;
    return transformAllocationToForm(settings);
  }, [settings]);

  // Validate settings with additional context
  const validateSettings = useCallback((
    data: AllocationFormData, 
    totalCosts: number = 0
  ) => {
    // Basic form validation
    const formValidation = validateAllocationForm(data);
    
    // Additional allocation validation
    const allocationValidation = validateCostAllocation(
      totalCosts, 
      data.nilai, 
      data.metode
    );

    return {
      isValid: formValidation.isValid && allocationValidation.isValid,
      errors: {
        ...formValidation.errors,
        ...allocationValidation.errors,
      },
      warnings: [
        ...formValidation.warnings,
        ...allocationValidation.warnings,
      ],
    };
  }, []);

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial settings
  useEffect(() => {
    loadSettings();
  }, []); // Only run once on mount

  return {
    // State
    settings,
    loading,
    error,
    
    // Actions
    loadSettings,
    saveSettings,
    resetToDefaults,
    
    // Computed values
    getDisplaySettings,
    getFormData,
    
    // Validation
    validateSettings,
    
    // Utilities
    refreshSettings,
    clearError,
  };
};