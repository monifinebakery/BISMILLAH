// src/components/recipe/shared/utils/recipeFormatters.ts

import { RECIPE_CALCULATION } from '../constants';

/**
 * Format currency value to Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage value
 */
export const formatPercentage = (value: number, precision: number = 1): string => {
  return `${(value * 100).toFixed(precision)}%`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number, precision: number = RECIPE_CALCULATION.PRECISION): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(value);
};

/**
 * Format weight/volume units
 */
export const formatUnit = (value: number, unit: string): string => {
  return `${formatNumber(value)} ${unit}`;
};

/**
 * Format date to Indonesian locale
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Format date time to Indonesian locale
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Format recipe name for display (capitalize first letter)
 */
export const formatRecipeName = (name: string): string => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

/**
 * Format profit margin color class based on percentage
 */
export const getProfitColorClass = (profitMargin: number): string => {
  if (profitMargin < 0) return 'text-red-600';
  if (profitMargin < 0.1) return 'text-orange-600';
  if (profitMargin < 0.2) return 'text-yellow-600';
  return 'text-green-600';
};

/**
 * Format HPP difference indicator
 */
export const formatHppDifference = (current: number, previous: number): {
  percentage: number;
  formatted: string;
  colorClass: string;
} => {
  const difference = current - previous;
  const percentage = previous > 0 ? (difference / previous) * 100 : 0;
  
  const colorClass = difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-600';
  const sign = difference > 0 ? '+' : '';
  
  return {
    percentage,
    formatted: `${sign}${formatPercentage(percentage / 100)}`,
    colorClass
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format search highlight
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};