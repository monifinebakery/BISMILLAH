// src/components/shared/filters/DateRangeFilter.tsx - Reusable Date Range Filter
import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { DateRange } from './types';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handleStartChange = (start: string) => {
    onChange({ ...value, start });
  };

  const handleEndChange = (end: string) => {
    onChange({ ...value, end });
  };

  const handleClear = () => {
    onChange({});
  };

  const hasValue = value.start || value.end;

  return (
    <div className="flex flex-col space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Rentang Tanggal
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Label>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="date"
            value={value.start || ''}
            onChange={(e) => handleStartChange(e.target.value)}
            disabled={disabled}
            placeholder="Tanggal mulai"
          />
        </div>
        
        <div className="flex-1">
          <Input
            type="date"
            value={value.end || ''}
            onChange={(e) => handleEndChange(e.target.value)}
            disabled={disabled}
            placeholder="Tanggal akhir"
            min={value.start}
          />
        </div>
      </div>
    </div>
  );
};