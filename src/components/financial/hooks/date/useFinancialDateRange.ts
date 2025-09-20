// src/components/financial/hooks/date/useFinancialDateRange.ts
import { useState, useCallback } from 'react';
import { startOfMonth, endOfDay, subDays } from 'date-fns';
import { DateRange } from '../../types/financial';

interface UseFinancialDateRangeReturn {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetToCurrentMonth: () => void;
  setToLastMonth: () => void;
  setToLastWeek: () => void;
}

/**
 * Financial Date Range Hook
 * Handles date range selection for financial reports
 */
export const useFinancialDateRange = (initialRange?: DateRange): UseFinancialDateRangeReturn => {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || { 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    }
  );

  const updateDateRange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const resetToCurrentMonth = useCallback(() => {
    setDateRange({ 
      from: startOfMonth(new Date()), 
      to: endOfDay(new Date()) 
    });
  }, []);

  const setToLastMonth = useCallback(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    setDateRange({
      from: startOfMonth(lastMonth),
      to: endOfDay(lastMonth)
    });
  }, []);

  const setToLastWeek = useCallback(() => {
    const today = new Date();
    const lastWeek = subDays(today, 7);
    setDateRange({
      from: startOfDay(lastWeek),
      to: endOfDay(today)
    });
  }, []);

  return {
    dateRange,
    setDateRange: updateDateRange,
    resetToCurrentMonth,
    setToLastMonth,
    setToLastWeek
  };
};

// Helper function for startOfDay (missing from imports)
function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}