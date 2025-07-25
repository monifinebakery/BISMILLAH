// src/components/orders/components/DatePresets.tsx (FIXED VERSION)
import React from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '../types';
import { getDateRangePreset } from '@/utils/dashboardUtils';
import { DATE_RANGE_PRESETS } from '../constants/orderConstants';

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
  const handlePresetClick = (key: string) => {
    try {
      console.log('Selecting date preset:', key);
      
      // Validate that setDateRange is a function
      if (typeof setDateRange !== 'function') {
        console.error('setDateRange is not a function:', setDateRange);
        return;
      }
      
      const range = getDateRangePreset(key);
      console.log('Generated date range:', range);
      
      // Validate the generated range
      if (!range || !range.from) {
        console.error('Invalid date range generated:', range);
        return;
      }
      
      setDateRange(range);
      
      // Reset to first page if function is provided
      if (setCurrentPage && typeof setCurrentPage === 'function') {
        setCurrentPage(1);
      }
      
      // Close dialog if function is provided
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error selecting preset:', error);
      // Don't crash the UI, just log the error
    }
  };

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