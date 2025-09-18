// 🎯 Hook untuk analytics data

import { useState, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

export const usePromoAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAnalytics = useCallback(async (dateRange) => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getAnalytics(dateRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analyticsData,
    isLoading,
    refreshAnalytics
  };
};
