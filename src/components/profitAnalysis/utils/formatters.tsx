// src/components/profitAnalysis/utils/formatters.tsx
// ✅ UTILITY FUNCTIONS UNTUK FORMATTING

export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);

export const formatPercentage = (value: number): string => 
  `${value.toFixed(1)}%`;

export const getMarginStatus = (margin: number, type: 'gross' | 'net'): string => {
  const thresholds = {
    gross: { excellent: 40, good: 25, acceptable: 15, poor: 5 },
    net: { excellent: 15, good: 10, acceptable: 5, poor: 2 }
  };

  const threshold = thresholds[type];

  if (margin >= threshold.excellent) return 'Sangat Baik';
  if (margin >= threshold.good) return 'Baik';
  if (margin >= threshold.acceptable) return 'Cukup';
  if (margin >= threshold.poor) return 'Perlu Perbaikan';
  return 'Kritis';
};

export const getMarginColor = (margin: number, type: 'gross' | 'net'): 'green' | 'blue' | 'orange' | 'red' => {
  const thresholds = {
    gross: { excellent: 40, good: 25, acceptable: 15, poor: 5 },
    net: { excellent: 15, good: 10, acceptable: 5, poor: 2 }
  };

  const threshold = thresholds[type];

  if (margin >= threshold.excellent) return 'green';
  if (margin >= threshold.good) return 'blue';
  if (margin >= threshold.acceptable) return 'orange';
  return 'red';
};