// src/components/profitAnalysis/utils/loadingStateManager.ts
// Unified loading state management for profit analysis

import { useState, useCallback } from 'react';

export interface LoadingStates {
  analysis: boolean;
  wac: boolean;
  history: boolean;
  calculations: boolean;
  dateRange: boolean;
  refresh: boolean;
}

export interface LoadingOperation {
  type: keyof LoadingStates;
  message: string;
  description?: string;
}

export const useLoadingStateManager = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    analysis: false,
    wac: false,
    history: false,
    calculations: false,
    dateRange: false,
    refresh: false,
  });

  const [currentOperation, setCurrentOperation] = useState<LoadingOperation | null>(null);

  const setLoading = useCallback((type: keyof LoadingStates, loading: boolean, operation?: LoadingOperation) => {
    setLoadingStates(prev => ({
      ...prev,
      [type]: loading
    }));

    if (loading && operation) {
      setCurrentOperation(operation);
    } else if (!loading && currentOperation?.type === type) {
      setCurrentOperation(null);
    }
  }, [currentOperation]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  
  const getLoadingMessage = (): string => {
    if (currentOperation) {
      return currentOperation.message;
    }
    
    if (loadingStates.calculations) return 'Menghitung profit...';
    if (loadingStates.analysis) return 'Memuat analisis...';
    if (loadingStates.wac) return 'Menghitung harga rata-rata...';
    if (loadingStates.history) return 'Memuat riwayat...';
    if (loadingStates.dateRange) return 'Memproses rentang tanggal...';
    if (loadingStates.refresh) return 'Menyegarkan data...';
    
    return 'Memproses...';
  };

  const getLoadingDescription = (): string => {
    if (currentOperation?.description) {
      return currentOperation.description;
    }

    if (loadingStates.calculations) return 'Sistem sedang menghitung margin dan profitabilitas';
    if (loadingStates.analysis) return 'Mengambil data transaksi dan biaya operasional';
    if (loadingStates.wac) return 'Menghitung harga rata-rata bahan baku (WAC)';
    if (loadingStates.history) return 'Memuat data historis untuk perbandingan';
    if (loadingStates.dateRange) return 'Menganalisis data dalam rentang tanggal yang dipilih';
    if (loadingStates.refresh) return 'Memperbarui semua data terkini';
    
    return 'Mohon tunggu sebentar...';
  };

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
    currentOperation,
    getLoadingMessage,
    getLoadingDescription,
  };
};

// Indonesian loading messages for different operations
export const LOADING_MESSAGES = {
  analysis: {
    message: 'Menganalisis Profit',
    description: 'Menghitung pendapatan, biaya, dan margin profit'
  },
  wac: {
    message: 'Menghitung WAC',
    description: 'Menghitung harga rata-rata tertimbang bahan baku'
  },
  history: {
    message: 'Memuat Riwayat',
    description: 'Mengambil data historis untuk analisis tren'
  },
  calculations: {
    message: 'Menghitung Profit',
    description: 'Memproses kalkulasi profit dan margin'
  },
  dateRange: {
    message: 'Memproses Tanggal',
    description: 'Menganalisis data dalam rentang waktu yang dipilih'
  },
  refresh: {
    message: 'Menyegarkan Data',
    description: 'Memperbarui semua informasi ke data terbaru'
  },
} as const;
