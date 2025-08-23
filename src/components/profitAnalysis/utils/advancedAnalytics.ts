// src/components/profitAnalysis/utils/advancedAnalytics.ts

// ==============================================
// ADVANCED ANALYTICS UTILITIES
// ==============================================

interface DataPoint {
  period: string;
  value: number;
  timestamp: number;
}

export interface ForecastResult {
  predictions: DataPoint[];
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  accuracy: number;
}

export interface StatisticalAnalysis {
  movingAverage: number[];
  exponentialSmoothing: number[];
  variance: number;
  standardDeviation: number;
  correlation: number;
  rSquared: number;
  trendLine: { slope: number; intercept: number };
}

// ==============================================
// FORECASTING FUNCTIONS
// ==============================================

/**
 * ✅ LINEAR REGRESSION FORECASTING
 */
export function linearRegressionForecast(
  data: number[], 
  periods: number = 3
): ForecastResult {
  if (data.length < 3) {
    return {
      predictions: [],
      confidence: 0,
      trend: 'stable',
      seasonality: false,
      accuracy: 0
    };
  }

  // Calculate linear regression
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate predictions
  const predictions: DataPoint[] = [];
  for (let i = 0; i < periods; i++) {
    const futureX = n + i;
    const predictedValue = slope * futureX + intercept;
    predictions.push({
      period: `Prediksi ${i + 1}`,
      value: Math.max(0, predictedValue), // Ensure non-negative
      timestamp: Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000 // 30 days ahead
    });
  }

  // Calculate confidence and trend
  const yMean = sumY / n;
  const totalSumSquares = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const residualSumSquares = y.reduce((acc, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return acc + Math.pow(yi - predicted, 2);
  }, 0);

  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  const confidence = Math.max(0, Math.min(100, rSquared * 100));

  const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

  return {
    predictions,
    confidence,
    trend,
    seasonality: detectSeasonality(data),
    accuracy: confidence
  };
}

/**
 * ✅ EXPONENTIAL SMOOTHING FORECAST
 */
export function exponentialSmoothingForecast(
  data: number[], 
  alpha: number = 0.3, 
  periods: number = 3
): ForecastResult {
  if (data.length < 2) {
    return {
      predictions: [],
      confidence: 0,
      trend: 'stable',
      seasonality: false,
      accuracy: 0
    };
  }

  // Calculate exponential smoothing
  const smoothed = [data[0]];
  for (let i = 1; i < data.length; i++) {
    smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
  }

  // Generate predictions
  const lastSmoothed = smoothed[smoothed.length - 1];
  const predictions: DataPoint[] = [];
  
  for (let i = 0; i < periods; i++) {
    predictions.push({
      period: `Prediksi ${i + 1}`,
      value: Math.max(0, lastSmoothed),
      timestamp: Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000
    });
  }

  // Calculate accuracy
  const errors = data.slice(1).map((actual, i) => Math.abs(actual - smoothed[i + 1]));
  const mape = errors.reduce((acc, error, i) => acc + (error / data[i + 1]), 0) / errors.length;
  const accuracy = Math.max(0, Math.min(100, (1 - mape) * 100));

  return {
    predictions,
    confidence: accuracy,
    trend: detectTrend(data),
    seasonality: detectSeasonality(data),
    accuracy
  };
}

// ==============================================
// STATISTICAL ANALYSIS FUNCTIONS
// ==============================================

/**
 * ✅ COMPREHENSIVE STATISTICAL ANALYSIS
 */
export function calculateStatistics(data: number[]): StatisticalAnalysis {
  if (data.length < 2) {
    return {
      movingAverage: [],
      exponentialSmoothing: [],
      variance: 0,
      standardDeviation: 0,
      correlation: 0,
      rSquared: 0,
      trendLine: { slope: 0, intercept: 0 }
    };
  }

  // Moving Average (3-period)
  const movingAverage = calculateMovingAverage(data, 3);

  // Exponential Smoothing
  const exponentialSmoothing = calculateExponentialSmoothing(data, 0.3);

  // Variance and Standard Deviation
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  const standardDeviation = Math.sqrt(variance);

  // Trend Line and Correlation
  const trendLine = calculateTrendLine(data);
  const { correlation, rSquared } = calculateCorrelation(data);

  return {
    movingAverage,
    exponentialSmoothing,
    variance,
    standardDeviation,
    correlation,
    rSquared,
    trendLine
  };
}

/**
 * ✅ MOVING AVERAGE CALCULATION
 */
export function calculateMovingAverage(data: number[], window: number = 3): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]); // Use original data for insufficient window
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  
  return result;
}

/**
 * ✅ EXPONENTIAL SMOOTHING CALCULATION
 */
export function calculateExponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  const result = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
  }
  
  return result;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function detectSeasonality(data: number[]): boolean {
  if (data.length < 12) return false;
  
  // Simple seasonality detection using autocorrelation
  const quarterlyCorrelation = calculateAutocorrelation(data, 3);
  const yearlyCorrelation = calculateAutocorrelation(data, 12);
  
  return quarterlyCorrelation > 0.3 || yearlyCorrelation > 0.3;
}

function detectTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 3) return 'stable';
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  return change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable';
}

function calculateTrendLine(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * data[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

function calculateCorrelation(data: number[]): { correlation: number; rSquared: number } {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const { slope, intercept } = calculateTrendLine(data);
  
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  const totalSumSquares = data.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const residualSumSquares = data.reduce((acc, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return acc + Math.pow(yi - predicted, 2);
  }, 0);
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  const correlation = Math.sqrt(Math.abs(rSquared)) * (slope >= 0 ? 1 : -1);
  
  return { correlation, rSquared };
}

function calculateAutocorrelation(data: number[], lag: number): number {
  if (data.length <= lag) return 0;
  
  const n = data.length - lag;
  const x1 = data.slice(0, n);
  const x2 = data.slice(lag);
  
  const mean1 = x1.reduce((a, b) => a + b, 0) / n;
  const mean2 = x2.reduce((a, b) => a + b, 0) / n;
  
  const numerator = x1.reduce((acc, val, i) => acc + (val - mean1) * (x2[i] - mean2), 0);
  const denominator1 = Math.sqrt(x1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0));
  const denominator2 = Math.sqrt(x2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0));
  
  return numerator / (denominator1 * denominator2);
}

// ==============================================
// ANOMALY DETECTION
// ==============================================

export interface AnomalyDetectionResult {
  anomalies: Array<{
    index: number;
    value: number;
    expected: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  summary: {
    totalAnomalies: number;
    highSeverityCount: number;
    averageDeviation: number;
  };
}

/**
 * ✅ STATISTICAL ANOMALY DETECTION
 */
export function detectAnomalies(data: number[], threshold: number = 2): AnomalyDetectionResult {
  const movingAvg = calculateMovingAverage(data, 5);
  const deviations = data.map((val, i) => Math.abs(val - movingAvg[i]));
  const mean = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const stdDev = Math.sqrt(deviations.reduce((acc, dev) => acc + Math.pow(dev - mean, 2), 0) / deviations.length);
  
  const anomalies = [];
  
  for (let i = 0; i < data.length; i++) {
    const deviation = Math.abs(data[i] - movingAvg[i]);
    const zScore = (deviation - mean) / stdDev;
    
    if (zScore > threshold) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (zScore > threshold * 2) severity = 'high';
      else if (zScore > threshold * 1.5) severity = 'medium';
      
      anomalies.push({
        index: i,
        value: data[i],
        expected: movingAvg[i],
        deviation,
        severity
      });
    }
  }
  
  return {
    anomalies,
    summary: {
      totalAnomalies: anomalies.length,
      highSeverityCount: anomalies.filter(a => a.severity === 'high').length,
      averageDeviation: anomalies.length > 0 
        ? anomalies.reduce((acc, a) => acc + a.deviation, 0) / anomalies.length 
        : 0
    }
  };
}