// src/components/profitAnalysis/tabs/PerbandinganTab/utils/formatters.ts

export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

export const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;

export const formatNumber = (value: number, decimals: number = 0): string =>
  value.toFixed(decimals);