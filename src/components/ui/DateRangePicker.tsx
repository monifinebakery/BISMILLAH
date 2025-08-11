// components/ui/DateRangePicker.tsx - COMPACT VERSION
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';

// ✅ Use new order management structure
import { safeParseDate, isValidDate, formatDateForDisplay } from '@/components/orders/utils';

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
      "w-full justify-start text-left font-normal h-11 px-4",
      !dateRange && "text-muted-foreground",
      className
    )
  };

  const content = (
    <>
      <CalendarIcon className="mr-3 h-4 w-4" />
      <span className="truncate">{displayText}</span>
    </>
  );

  // Quick presets component
  const PresetButtons = () => (
    <div className="p-3 border-b">
      <h4 className="font-medium text-sm mb-2">Pilih Cepat</h4>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map(({ label, key }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => handlePreset(key)}
            className="text-xs"
          >
            {label}
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
        <DialogContent className="w-[95vw] max-w-md p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Pilih Rentang Tanggal</DialogTitle>
          </DialogHeader>
          <PresetButtons />
          <div className="p-4">
            <Calendar
              mode="range"
              selected={calendarRange}
              onSelect={handleCalendarChange}
              numberOfMonths={1}
              locale={id}
            />
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Terapkan
              </Button>
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
      <PopoverContent className="w-auto p-0 flex" align="end">
        <div className="w-48">
          <PresetButtons />
        </div>
        <div className="border-l p-4">
          <Calendar
            mode="range"
            selected={calendarRange}
            onSelect={handleCalendarChange}
            numberOfMonths={2}
            locale={id}
          />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;