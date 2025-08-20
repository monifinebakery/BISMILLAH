// src/utils/calculationUtils.ts
// Placeholder implementations for calculation utilities referenced in index.ts

export const calculatePromoResult = (
  cost: number,
  price: number
): number => {
  return price - cost;
};

export const analyzeMargin = (
  revenue: number,
  cost: number
): number => {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
};

export const findOptimalDiscount = (
  basePrice: number,
  demandFactor: number
): number => {
  return basePrice * (1 - demandFactor);
};

export const calculateBreakEven = (
  fixedCost: number,
  price: number,
  variableCost: number
): number => {
  const contributionMargin = price - variableCost;
  if (contributionMargin === 0) return 0;
  return fixedCost / contributionMargin;
};

export const calculateBulkPromos = (quantities: number[]): number => {
  if (!quantities.length) return 0;
  return quantities.reduce((sum, q) => sum + q, 0);
};

export const compareWithCompetitors = (
  ourPrice: number,
  competitorPrice: number
): number => {
  return ourPrice - competitorPrice;
};

export const calculateROI = (
  gain: number,
  cost: number
): number => {
  if (cost === 0) return 0;
  return ((gain - cost) / cost) * 100;
};

export const estimatePriceElasticity = (
  quantityChange: number,
  priceChange: number
): number => {
  if (priceChange === 0) return 0;
  return quantityChange / priceChange;
};

export const calculateFinancialMetrics = (
  revenues: number[],
  expenses: number[]
): { profit: number; revenue: number; expense: number } => {
  const totalRevenue = revenues.reduce((sum, r) => sum + r, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e, 0);
  return {
    profit: totalRevenue - totalExpense,
    revenue: totalRevenue,
    expense: totalExpense,
  };
};

export const validateCalculationInput = (value: unknown): boolean => {
  return typeof value === 'number' && !isNaN(value);
};

export const roundToDecimal = (value: number, decimals: number = 2): number => {
  return Number(value.toFixed(decimals));
};

export const calculatePercentageChange = (
  original: number,
  newValue: number
): number => {
  if (original === 0) return 0;
  return ((newValue - original) / original) * 100;
};

export const interpolateValue = (
  start: number,
  end: number,
  ratio: number
): number => {
  return start + (end - start) * ratio;
};

export const calculateAverage = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

export const calculateMedian = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const calculateStandardDeviation = (values: number[]): number => {
  if (!values.length) return 0;
  const avg = calculateAverage(values);
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
};

export default {
  calculatePromoResult,
  analyzeMargin,
  findOptimalDiscount,
  calculateBreakEven,
  calculateBulkPromos,
  compareWithCompetitors,
  calculateROI,
  estimatePriceElasticity,
  calculateFinancialMetrics,
  validateCalculationInput,
  roundToDecimal,
  calculatePercentageChange,
  interpolateValue,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
};

