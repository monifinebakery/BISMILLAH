// utils/chartDataValidation.ts - Chart Data Validation Utilities

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  correctedData?: any;
  isEmpty?: boolean; // ✅ ADD: Flag to indicate empty data state
}

export interface FinancialMetrics {
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit?: number;
  netProfit?: number;
  grossMargin?: number;
  netMargin?: number;
}

/**
 * Validates financial metrics for logical consistency
 */
export function validateFinancialMetrics(metrics: FinancialMetrics): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let correctedData = { ...metrics };

  // Calculate derived metrics if not provided
  const grossProfit = metrics.grossProfit ?? (metrics.revenue - metrics.cogs);
  const netProfit = metrics.netProfit ?? (grossProfit - metrics.opex);
  const grossMargin = metrics.grossMargin ?? (metrics.revenue > 0 ? (grossProfit / metrics.revenue) * 100 : 0);
  const netMargin = metrics.netMargin ?? (metrics.revenue > 0 ? (netProfit / metrics.revenue) * 100 : 0);

  // Validation Rule 1: Revenue should be non-negative
  if (metrics.revenue < 0) {
    errors.push(`Revenue cannot be negative: ${metrics.revenue}`);
  }

  // Validation Rule 2: COGS should be non-negative
  if (metrics.cogs < 0) {
    errors.push(`COGS cannot be negative: ${metrics.cogs}`);
  }

  // Validation Rule 3: OpEx should be non-negative
  if (metrics.opex < 0) {
    errors.push(`OpEx cannot be negative: ${metrics.opex}`);
  }

  // Validation Rule 4: COGS should not exceed revenue (with tolerance)
  if (metrics.cogs > metrics.revenue && metrics.revenue > 0) {
    const ratio = (metrics.cogs / metrics.revenue) * 100;
    if (ratio > 150) {
      errors.push(`COGS significantly exceeds revenue: ${ratio.toFixed(1)}% of revenue`);
    } else if (ratio > 100) {
      warnings.push(`COGS exceeds revenue: ${ratio.toFixed(1)}% of revenue`);
      // Auto-correct: Cap COGS at 95% of revenue
      correctedData.cogs = metrics.revenue * 0.95;
    }
  }

  // Validation Rule 5: Gross margin should be reasonable
  if (grossMargin < -100 || grossMargin > 100) {
    warnings.push(`Unusual gross margin: ${grossMargin.toFixed(1)}%`);
  }

  // Validation Rule 6: Net margin should be reasonable
  if (netMargin < -200 || netMargin > 100) {
    warnings.push(`Unusual net margin: ${netMargin.toFixed(1)}%`);
  }

  // Validation Rule 7: Calculated vs provided values consistency
  if (metrics.grossProfit !== undefined && Math.abs(metrics.grossProfit - grossProfit) > 0.01) {
    warnings.push(`Gross profit calculation mismatch: provided ${metrics.grossProfit}, calculated ${grossProfit}`);
  }

  if (metrics.netProfit !== undefined && Math.abs(metrics.netProfit - netProfit) > 0.01) {
    warnings.push(`Net profit calculation mismatch: provided ${metrics.netProfit}, calculated ${netProfit}`);
  }

  // Update corrected data with calculated values
  correctedData = {
    ...correctedData,
    grossProfit,
    netProfit,
    grossMargin,
    netMargin
  };

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    correctedData: warnings.length > 0 || errors.length > 0 ? correctedData : undefined
  };
}

/**
 * ✅ IMPROVED: Validates trend data for chronological consistency with enhanced empty data handling
 */
export function validateTrendData(trendData: any[]): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!Array.isArray(trendData)) {
    errors.push('Trend data must be an array');
    return { isValid: false, warnings, errors };
  }

  if (trendData.length === 0) {
    // ✅ IMPROVED: Don't treat empty data as a warning, it's a normal state
    return { 
      isValid: true, 
      warnings: [], 
      errors: [], 
      isEmpty: true 
    };
  }

  // Check period formatting consistency
  const periodFormats = trendData.map(item => {
    if (!item.period) return 'missing';
    const parts = item.period.split('-');
    if (parts.length === 2) return 'monthly'; // YYYY-MM
    if (parts.length === 3) return 'daily';   // YYYY-MM-DD
    return 'invalid';
  });

  const uniqueFormats = [...new Set(periodFormats)];
  if (uniqueFormats.length > 1) {
    warnings.push(`Mixed period formats detected: ${uniqueFormats.join(', ')}`);
  }

  if (uniqueFormats.includes('invalid') || uniqueFormats.includes('missing')) {
    errors.push('Invalid or missing period formats detected');
  }

  // Check chronological order
  for (let i = 1; i < trendData.length; i++) {
    const prevPeriod = trendData[i - 1].period;
    const currPeriod = trendData[i].period;
    
    if (prevPeriod && currPeriod && prevPeriod > currPeriod) {
      warnings.push(`Non-chronological period order: ${prevPeriod} followed by ${currPeriod}`);
    }
  }

  // Validate each period's financial metrics
  trendData.forEach((item, index) => {
    if (item.revenue !== undefined || item.cogs !== undefined || item.opex !== undefined) {
      const validation = validateFinancialMetrics({
        revenue: item.revenue || 0,
        cogs: item.cogs || 0,
        opex: item.opex || 0,
        grossProfit: item.grossProfit,
        netProfit: item.netProfit,
        grossMargin: item.grossMargin,
        netMargin: item.netMargin
      });

      validation.warnings.forEach(warning => {
        warnings.push(`Period ${item.period || index}: ${warning}`);
      });

      validation.errors.forEach(error => {
        errors.push(`Period ${item.period || index}: ${error}`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * ✅ IMPROVED: Validates chart configuration with enhanced empty data handling
 */
export function validateChartConfig(chartData: any[], chartType: string, selectedMetrics: string[]): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if chart data exists
  if (!chartData || chartData.length === 0) {
    // ✅ IMPROVED: Don't treat empty chart data as a warning
    return { 
      isValid: true, 
      warnings: [], 
      errors: [], 
      isEmpty: true 
    };
  }

  // Check if selected metrics exist in data
  const availableMetrics = chartData.length > 0 ? Object.keys(chartData[0]) : [];
  const missingMetrics = selectedMetrics.filter(metric => !availableMetrics.includes(metric));
  
  if (missingMetrics.length > 0) {
    warnings.push(`Missing metrics in chart data: ${missingMetrics.join(', ')}`);
  }

  // Chart type specific validations
  if (chartType === 'pie') {
    // Pie charts need positive values
    const hasNegativeValues = chartData.some(item => 
      selectedMetrics.some(metric => (item[metric] || 0) < 0)
    );
    
    if (hasNegativeValues) {
      warnings.push('Pie chart contains negative values which may not display correctly');
    }
  }

  if (chartType === 'line' || chartType === 'area') {
    // Line charts need ordered data
    const isOrderedData = chartData.every((item, index) => 
      index === 0 || !item.period || chartData[index - 1].period <= item.period
    );
    
    if (!isOrderedData) {
      warnings.push('Line chart data should be in chronological order');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * ✅ IMPROVED: Comprehensive chart validation with better empty data handling
 */
export function validateChartData(
  chartData: any[],
  chartType: string = 'line',
  selectedMetrics: string[] = []
): ValidationResult {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  let isEmpty = false;

  // Run trend data validation
  const trendValidation = validateTrendData(chartData);
  allWarnings.push(...trendValidation.warnings);
  allErrors.push(...trendValidation.errors);
  if (trendValidation.isEmpty) isEmpty = true;

  // Run chart config validation
  const configValidation = validateChartConfig(chartData, chartType, selectedMetrics);
  allWarnings.push(...configValidation.warnings);
  allErrors.push(...configValidation.errors);
  if (configValidation.isEmpty) isEmpty = true;

  return {
    isValid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
    isEmpty
  };
}

/**
 * ✅ IMPROVED: Enhanced logger with better empty data handling
 */
export function logValidationResults(validationResult: ValidationResult, context: string = 'Chart'): void {
  // ✅ IMPROVED: Don't log warnings for empty data - it's a normal state
  if (validationResult.isEmpty) {
    console.debug(`${context}: No data available (normal state)`);
    return;
  }

  if (validationResult.errors.length > 0) {
    console.error(`${context} Validation Errors:`, validationResult.errors);
  }
  
  if (validationResult.warnings.length > 0) {
    console.warn(`${context} Validation Warnings:`, validationResult.warnings);
  }
  
  if (validationResult.isValid && validationResult.warnings.length === 0) {
    console.debug(`${context} validation passed successfully`);
  }
}

/**
 * Auto-correction utility for chart data
 */
export function autoCorrectChartData(chartData: any[]): { correctedData: any[]; corrections: string[] } {
  const corrections: string[] = [];
  
  const correctedData = chartData.map((item, index) => {
    if (!item.period && item.revenue !== undefined) {
      const validation = validateFinancialMetrics({
        revenue: item.revenue || 0,
        cogs: item.cogs || 0,
        opex: item.opex || 0
      });
      
      if (validation.correctedData && validation.warnings.length > 0) {
        corrections.push(`Period ${index}: Applied auto-corrections`);
        return { ...item, ...validation.correctedData };
      }
    }
    
    return item;
  });
  
  return { correctedData, corrections };
}