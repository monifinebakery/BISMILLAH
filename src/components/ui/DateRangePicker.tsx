// components/ui/DateRangePicker.tsx - COMPACT VERSION
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';

// ✅ Use unified date utilities for consistency
import { safeParseDate, isValidDate, formatDateForDisplay } from '@/utils/unifiedDateUtils';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isMobile?: boolean;
}

// Quick presets
const PRESETS = [
  { label: 'Hari Ini', key: 'today' },
  { label: '7 Hari', key: 'week' },
  { label: '30 Hari', key: 'month' },
  { label: 'Bulan Ini', key: 'thisMonth' }
];

// Simple preset generator
const getPreset = (key: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (key) {
    case 'today': return { from: today, to: today };
    case 'week': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: today };
    }
    case 'month': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: today };
    }
    case 'thisMonth': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: today };
    }
    default: return { from: today, to: today };
  }
};

// Simple format function
const formatRange = (range?: DateRange) => {
  if (!range?.from) return '';
  const from = formatDateForDisplay(range.from);
  const to = formatDateForDisplay(range.to);
  return from === to ? from : `${from} - ${to}`;
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange = () => {},
  onPageChange,
  placeholder = "Pilih rentang tanggal",
  className = "",
  disabled = false,
  isMobile = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if desktop on mount - improved breakpoint detection
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // Use md breakpoint to match CSS
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle calendar changes
  const handleCalendarChange = useCallback((newRange: any) => {
    if (!onDateRangeChange) return;
    
    if (!newRange) {
      onDateRangeChange(undefined);
      return;
    }

    const from = safeParseDate(newRange.from);
    const to = safeParseDate(newRange.to || newRange.from);
    
    if (from && to && isValidDate(from) && isValidDate(to)) {
      onDateRangeChange({ from, to });
      onPageChange?.(1);
    }
  }, [onDateRangeChange, onPageChange]);

  // Handle preset selection
  const handlePreset = useCallback((key: string) => {
    const preset = getPreset(key);
    onDateRangeChange?.(preset);
    onPageChange?.(1);
    setIsOpen(false);
  }, [onDateRangeChange, onPageChange]);

  // Reset
  const handleReset = useCallback(() => {
    onDateRangeChange?.(undefined);
    onPageChange?.(1);
  }, [onDateRangeChange, onPageChange]);

  // Convert for calendar
  const calendarRange = useMemo(() => {
    if (!dateRange?.from) return undefined;
    const from = safeParseDate(dateRange.from);
    const to = safeParseDate(dateRange.to);
    return from && to ? { from, to } : undefined;
  }, [dateRange]);

  const displayText = formatRange(dateRange) || placeholder;

  const buttonProps = {
    variant: "outline" as const,
    disabled,
    className: cn(
      "w-full justify-start text-left font-normal input-mobile-safe px-3 sm:px-4",
      !dateRange && "text-muted-foreground",
      className
    )
  };

  const content = (
    <>
      <CalendarIcon className="mr-2 sm:mr-3 h-4 w-4 flex-shrink-0" />
      <span className="truncate text-overflow-safe">{displayText}</span>
    </>
  );

  // Quick presets component
  const PresetButtons = () => (
    <div className="p-3 border-b border-gray-500 dialog-no-overflow">
      <h4 className="font-medium text-sm mb-2 text-overflow-safe">Pilih Cepat</h4>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map(({ label, key }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => handlePreset(key)}
            className="text-xs input-mobile-safe"
          >
            <span className="text-overflow-safe">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button {...buttonProps}>{content}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pilih Rentang Tanggal</DialogTitle>
            <DialogDescription>
              Pilih rentang tanggal untuk memfilter data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PresetButtons />
            <div className="space-y-3">
              <Calendar
                mode="range"
                selected={calendarRange}
                onSelect={handleCalendarChange}
                numberOfMonths={1}
                locale={id}
                className="mx-auto"
              />
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button {...buttonProps}>{content}</Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-auto max-w-[95vw] max-h-[90vh] md:max-w-[650px]"
        align="start"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <div className="flex flex-col md:flex-row bg-white border rounded-lg shadow-lg overflow-hidden max-w-full min-w-[320px] md:min-w-[580px]">
          {/* Preset buttons sidebar */}
          <div className="w-full md:w-40 flex-shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r">
            <div className="p-3 md:p-4">
              <h4 className="font-medium text-sm mb-2 md:mb-3 text-gray-700">Pilih Cepat</h4>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1 md:gap-2">
                {PRESETS.map(({ label, key }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreset(key)}
                    className="w-full justify-start text-xs md:text-sm h-7 md:h-8 px-2 md:px-3 hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Calendar section */}
          <div className="p-3 md:p-4 bg-white overflow-hidden flex-1">
            <div className="max-w-full overflow-x-auto">
              <Calendar
                mode="range"
                selected={calendarRange}
                onSelect={handleCalendarChange}
                numberOfMonths={isDesktop && window.innerWidth >= 768 ? 2 : 1}
                locale={id}
                className="mx-auto"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 md:gap-3 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={handleReset} 
                size="sm"
                className="flex-1 text-sm h-8 md:h-9 hover:bg-gray-50"
              >
                Reset
              </Button>
              <Button 
                onClick={() => setIsOpen(false)} 
                size="sm"
                className="flex-1 text-sm h-8 md:h-9 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;