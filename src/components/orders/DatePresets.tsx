// src/components/orders/components/DatePresets.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '../types';
import { getDateRangePreset } from '../utils';
import { DATE_RANGE_PRESETS } from '../constants/orderConstants';

interface DatePresetsProps {
  setDateRange: (range: DateRange) => void;
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
      const range = getDateRangePreset(key);
      setDateRange(range);
      if (setCurrentPage) {
        setCurrentPage(1);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error setting date range preset:', error);
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
              className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200"
              onClick={() => handlePresetClick(key)}
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