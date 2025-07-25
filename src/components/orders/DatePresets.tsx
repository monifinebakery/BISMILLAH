// src/components/orders/components/DatePresets.tsx - DEBUG VERSION
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '@/types/order';

// 🔧 DEBUG: Try different import strategies
let getDateRangePreset: any;
let DATE_RANGE_PRESETS: any;

try {
  // Strategy 1: Direct import
  const dashboardUtils = require('@/utils/dashboardUtils');
  getDateRangePreset = dashboardUtils.getDateRangePreset;
  console.log('✅ Strategy 1 - Direct import worked:', typeof getDateRangePreset);
} catch (error) {
  console.error('❌ Strategy 1 failed:', error);
  
  try {
    // Strategy 2: Named import
    import('@/utils/dashboardUtils').then(module => {
      getDateRangePreset = module.getDateRangePreset;
      console.log('✅ Strategy 2 - Dynamic import worked:', typeof getDateRangePreset);
    });
  } catch (error2) {
    console.error('❌ Strategy 2 failed:', error2);
    
    // Strategy 3: Fallback local implementation
    getDateRangePreset = (key: string) => {
      console.log('🔧 Using fallback implementation for key:', key);
      const today = new Date();
      
      switch (key) {
        case 'today':
          return { from: today, to: today };
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return { from: yesterday, to: yesterday };
        case 'last7days':
          const week = new Date(today);
          week.setDate(week.getDate() - 6);
          return { from: week, to: today };
        case 'last30days':
          const month = new Date(today);
          month.setDate(month.getDate() - 29);
          return { from: month, to: today };
        default:
          return { from: today, to: today };
      }
    };
  }
}

try {
  const orderConstants = require('@/constants/orderConstants');
  DATE_RANGE_PRESETS = orderConstants.DATE_RANGE_PRESETS;
  console.log('✅ Order constants loaded:', DATE_RANGE_PRESETS);
} catch (error) {
  console.error('❌ Order constants failed:', error);
  // Fallback presets
  DATE_RANGE_PRESETS = [
    { label: "Hari Ini", key: 'today' },
    { label: "Kemarin", key: 'yesterday' },
    { label: "7 Hari Terakhir", key: 'last7days' },
    { label: "30 Hari Terakhir", key: 'last30days' },
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
    console.log('🚀 DatePresets: handlePresetClick called with key:', key);
    console.log('🔍 setDateRange type:', typeof setDateRange);
    console.log('🔍 setDateRange value:', setDateRange);
    console.log('🔍 getDateRangePreset type:', typeof getDateRangePreset);
    console.log('🔍 getDateRangePreset value:', getDateRangePreset);
    
    try {
      // Step 1: Validate setDateRange
      if (!setDateRange) {
        console.error('❌ setDateRange is null/undefined');
        return;
      }
      
      if (typeof setDateRange !== 'function') {
        console.error('❌ setDateRange is not a function:', {
          type: typeof setDateRange,
          value: setDateRange,
          constructor: setDateRange?.constructor?.name
        });
        return;
      }
      
      // Step 2: Validate getDateRangePreset
      if (!getDateRangePreset) {
        console.error('❌ getDateRangePreset is null/undefined');
        return;
      }
      
      if (typeof getDateRangePreset !== 'function') {
        console.error('❌ getDateRangePreset is not a function:', {
          type: typeof getDateRangePreset,
          value: getDateRangePreset,
          constructor: getDateRangePreset?.constructor?.name
        });
        return;
      }
      
      // Step 3: Try to call getDateRangePreset
      console.log('🔧 Calling getDateRangePreset with key:', key);
      const range = getDateRangePreset(key);
      console.log('✅ getDateRangePreset returned:', range);
      
      // Step 4: Validate range
      if (!range) {
        console.error('❌ getDateRangePreset returned null/undefined');
        return;
      }
      
      if (!range.from) {
        console.error('❌ Range missing from date:', range);
        return;
      }
      
      // Step 5: Try to call setDateRange
      console.log('🔧 Calling setDateRange with range:', range);
      setDateRange(range);
      console.log('✅ setDateRange called successfully');
      
      // Step 6: Optional callbacks
      if (setCurrentPage && typeof setCurrentPage === 'function') {
        console.log('🔧 Calling setCurrentPage(1)');
        setCurrentPage(1);
        console.log('✅ setCurrentPage called successfully');
      }
      
      if (onClose && typeof onClose === 'function') {
        console.log('🔧 Calling onClose()');
        onClose();
        console.log('✅ onClose called successfully');
      }
      
      console.log('🎉 handlePresetClick completed successfully');
      
    } catch (error) {
      console.error('💥 ERROR in handlePresetClick:', error);
      console.error('💥 Error stack:', error.stack);
      console.error('💥 Error name:', error.name);
      console.error('💥 Error message:', error.message);
      
      // Try to identify which function call failed
      console.log('🔍 Post-error debugging:');
      console.log('🔍 setDateRange still exists?', !!setDateRange);
      console.log('🔍 getDateRangePreset still exists?', !!getDateRangePreset);
      console.log('🔍 key value:', key);
    }
  }, [setDateRange, setCurrentPage, onClose]);

  // 🔧 DEBUG: Log component render
  console.log('🎨 DatePresets rendering with props:', {
    setDateRange: typeof setDateRange,
    onClose: typeof onClose,
    setCurrentPage: typeof setCurrentPage,
    presets: DATE_RANGE_PRESETS?.length
  });

  return (
    <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
      <div className="p-3">
        <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {DATE_RANGE_PRESETS?.map(({ label, key }: { label: string; key: string }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200 transition-colors"
              onClick={() => {
                console.log(`🎯 Button clicked for preset: ${key}`);
                handlePresetClick(key);
              }}
              type="button"
            >
              {label}
            </Button>
          )) || (
            <div className="text-sm text-gray-500">No presets available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatePresets;