// src/components/orders/components/DatePresets.tsx - BULLETPROOF VERSION
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '@/types/order';
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// 🔧 BULLETPROOF: Multiple import strategies with fallbacks
let getDateRangePreset: ((key: string) => { from: Date; to: Date }) | null = null;
let DATE_RANGE_PRESETS: Array<{ label: string; key: string }> = [];

// Strategy 1: Try named import
try {
  const { getDateRangePreset: imported } = require('@/utils/dashboardUtils');
  if (typeof imported === 'function') {
    getDateRangePreset = imported;
    console.log('✅ Strategy 1: Named import successful');
  }
} catch (error) {
  console.warn('❌ Strategy 1 failed:', error);
}

// Strategy 2: Try default import
if (!getDateRangePreset) {
  try {
    const dashboardUtils = require('@/utils/dashboardUtils').default;
    if (dashboardUtils && typeof dashboardUtils.getDateRangePreset === 'function') {
      getDateRangePreset = dashboardUtils.getDateRangePreset;
      console.log('✅ Strategy 2: Default import successful');
    }
  } catch (error) {
    console.warn('❌ Strategy 2 failed:', error);
  }
}

// Strategy 3: Try global window access
if (!getDateRangePreset && typeof window !== 'undefined') {
  try {
    const globalUtils = (window as any).dashboardUtils;
    if (globalUtils && typeof globalUtils.getDateRangePreset === 'function') {
      getDateRangePreset = globalUtils.getDateRangePreset;
      console.log('✅ Strategy 3: Global access successful');
    }
  } catch (error) {
    console.warn('❌ Strategy 3 failed:', error);
  }
}

// Strategy 4: Inline fallback implementation
if (!getDateRangePreset) {
  console.log('🔧 Using inline fallback implementation');
  getDateRangePreset = (key: string): { from: Date; to: Date } => {
    const today = new Date();
    
    try {
      switch (key) {
        case 'today':
          return { from: startOfDay(today), to: endOfDay(today) };
        case 'yesterday':
          const yesterday = subDays(today, 1);
          return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
        case 'last7days':
          return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
        case 'last30days':
          return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
        case 'thisMonth':
          return { from: startOfMonth(today), to: endOfMonth(today) };
        case 'lastMonth':
          const lastMonth = subMonths(today, 1);
          return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        default:
          console.warn('Unknown preset key:', key);
          return { from: startOfDay(today), to: endOfDay(today) };
      }
    } catch (error) {
      console.error('Fallback preset generation error:', error);
      return { from: today, to: today };
    }
  };
}

// Load DATE_RANGE_PRESETS
try {
  const constants = require('@/constants/orderConstants');
  DATE_RANGE_PRESETS = constants.DATE_RANGE_PRESETS || [];
  console.log('✅ Order constants loaded');
} catch (error) {
  console.warn('❌ Order constants failed, using fallback');
  DATE_RANGE_PRESETS = [
    { label: "Hari Ini", key: 'today' },
    { label: "Kemarin", key: 'yesterday' },
    { label: "7 Hari Terakhir", key: 'last7days' },
    { label: "30 Hari Terakhir", key: 'last30days' },
    { label: "Bulan Ini", key: 'thisMonth' },
    { label: "Bulan Lalu", key: 'lastMonth' }
  ];
}

interface DatePresetsProps {
  setDateRange: (range: DateRange | undefined) => void;
  onClose?: () => void;
  setCurrentPage?: (page: number) => void;
}

const DatePresets: React.FC<DatePresetsProps> = ({ 
  setDateRange, 
  onClose,
  setCurrentPage 
}) => {
  
  const handlePresetClick = useCallback((key: string) => {
    console.log('🚀 Preset clicked:', key);
    
    try {
      // Comprehensive validation
      if (!setDateRange) {
        console.error('❌ setDateRange is null');
        return;
      }
      
      if (typeof setDateRange !== 'function') {
        console.error('❌ setDateRange is not a function:', typeof setDateRange);
        return;
      }
      
      if (!getDateRangePreset) {
        console.error('❌ getDateRangePreset is null');
        return;
      }
      
      if (typeof getDateRangePreset !== 'function') {
        console.error('❌ getDateRangePreset is not a function:', typeof getDateRangePreset);
        return;
      }
      
      // Generate date range
      console.log('🔧 Generating range for key:', key);
      const range = getDateRangePreset(key);
      console.log('✅ Range generated:', range);
      
      if (!range || !range.from) {
        console.error('❌ Invalid range generated:', range);
        return;
      }
      
      // Call setDateRange
      console.log('🔧 Setting date range...');
      setDateRange(range);
      console.log('✅ Date range set successfully');
      
      // Handle optional callbacks
      if (setCurrentPage && typeof setCurrentPage === 'function') {
        try {
          setCurrentPage(1);
          console.log('✅ Page reset to 1');
        } catch (pageError) {
          console.error('❌ Page reset error:', pageError);
        }
      }
      
      if (onClose && typeof onClose === 'function') {
        try {
          onClose();
          console.log('✅ Dialog closed');
        } catch (closeError) {
          console.error('❌ Dialog close error:', closeError);
        }
      }
      
      console.log('🎉 Preset selection completed successfully');
      
    } catch (error) {
      console.error('💥 Critical error in handlePresetClick:', error);
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Additional debugging info
      console.log('🔍 Debug info:', {
        key,
        setDateRangeType: typeof setDateRange,
        getDateRangePresetType: typeof getDateRangePreset,
        setCurrentPageType: typeof setCurrentPage,
        onCloseType: typeof onClose
      });
    }
  }, [setDateRange, setCurrentPage, onClose, getDateRangePreset]);

  // Validation on render
  React.useEffect(() => {
    console.log('🎨 DatePresets mounted with:', {
      setDateRange: typeof setDateRange,
      getDateRangePreset: typeof getDateRangePreset,
      presetsCount: DATE_RANGE_PRESETS.length
    });
    
    if (!getDateRangePreset) {
      console.error('❌ getDateRangePreset not available on mount');
    }
    
    if (!setDateRange) {
      console.error('❌ setDateRange not available on mount');
    }
  }, [setDateRange]);

  return (
    <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
      <div className="p-3">
        <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {DATE_RANGE_PRESETS.map(({ label, key }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200 transition-colors"
              onClick={() => {
                console.log(`🎯 Button clicked: ${key} - ${label}`);
                handlePresetClick(key);
              }}
              type="button"
            >
              {label}
            </Button>
          ))}
        </div>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500">
            <div>Preset function: {getDateRangePreset ? '✅' : '❌'}</div>
            <div>SetDateRange: {setDateRange ? '✅' : '❌'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatePresets;