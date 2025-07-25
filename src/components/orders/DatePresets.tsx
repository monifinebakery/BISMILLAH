// src/components/orders/components/DatePresets.tsx - FIXED VERSION
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '@/types/order';
import { getDateRangePreset } from '@/utils/dashboardUtils';
import { DATE_RANGE_PRESETS } from '@/constants/orderConstants';

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
  // 🔧 FIX: Create stable callback with comprehensive error handling
  const handlePresetClick = useCallback((key: string) => {
    try {
      console.log('DatePresets: Selecting preset:', key);
      
      // 🔧 FIX: Validate all required functions before proceeding
      if (!key || typeof key !== 'string') {
        console.error('DatePresets: Invalid preset key:', key);
        return;
      }
      
      if (!setDateRange || typeof setDateRange !== 'function') {
        console.error('DatePresets: setDateRange is not a function:', {
          setDateRange,
          type: typeof setDateRange,
          value: setDateRange
        });
        return;
      }
      
      // Generate date range safely
      let range: DateRange | undefined;
      try {
        range = getDateRangePreset(key);
        console.log('DatePresets: Generated range:', range);
      } catch (rangeError) {
        console.error('DatePresets: Error generating date range:', rangeError);
        return;
      }
      
      // Validate the generated range
      if (!range) {
        console.error('DatePresets: No range generated for key:', key);
        return;
      }
      
      if (!range.from) {
        console.error('DatePresets: Invalid range - missing from date:', range);
        return;
      }
      
      // Apply the date range
      try {
        setDateRange(range);
        console.log('DatePresets: Successfully set date range');
      } catch (setError) {
        console.error('DatePresets: Error setting date range:', setError);
        return;
      }
      
      // Reset to first page if function is provided and valid
      if (setCurrentPage) {
        if (typeof setCurrentPage === 'function') {
          try {
            setCurrentPage(1);
            console.log('DatePresets: Reset to page 1');
          } catch (pageError) {
            console.error('DatePresets: Error setting page:', pageError);
            // Don't return here - continue with closing dialog
          }
        } else {
          console.warn('DatePresets: setCurrentPage is not a function:', typeof setCurrentPage);
        }
      }
      
      // Close dialog if function is provided and valid
      if (onClose) {
        if (typeof onClose === 'function') {
          try {
            onClose();
            console.log('DatePresets: Closed dialog');
          } catch (closeError) {
            console.error('DatePresets: Error closing dialog:', closeError);
          }
        } else {
          console.warn('DatePresets: onClose is not a function:', typeof onClose);
        }
      }
      
    } catch (error) {
      console.error('DatePresets: Unexpected error in handlePresetClick:', error);
      // Don't crash the UI, just log the error
    }
  }, [setDateRange, setCurrentPage, onClose]);

  // 🔧 FIX: Validate DATE_RANGE_PRESETS before rendering
  const safePresets = React.useMemo(() => {
    try {
      if (!Array.isArray(DATE_RANGE_PRESETS)) {
        console.error('DatePresets: DATE_RANGE_PRESETS is not an array:', DATE_RANGE_PRESETS);
        return [];
      }
      
      return DATE_RANGE_PRESETS.filter(preset => {
        if (!preset || typeof preset !== 'object') {
          console.warn('DatePresets: Invalid preset object:', preset);
          return false;
        }
        
        if (!preset.key || !preset.label) {
          console.warn('DatePresets: Preset missing key or label:', preset);
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('DatePresets: Error validating presets:', error);
      return [];
    }
  }, []);

  // 🔧 FIX: Early return if no valid presets
  if (safePresets.length === 0) {
    return (
      <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
        <div className="p-3">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
          <p className="text-xs text-gray-500">Preset tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
      <div className="p-3">
        <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {safePresets.map(({ label, key }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200 transition-colors"
              onClick={() => handlePresetClick(key)}
              type="button" // Prevent form submission
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatePresets;