// components/DateRangePicker.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';

// Types
export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isMobile?: boolean;
}

// Utility functions
const formatDateRange = (range: DateRange | undefined): string => {
  if (!range || !range.from) return '';
  
  try {
    const fromStr = range.from.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    const toStr = range.to.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    });
    
    return range.from.getTime() === range.to.getTime() 
      ? fromStr 
      : `${fromStr} - ${toStr}`;
  } catch (error) {
    console.warn('Error formatting date range:', error);
    return '';
  }
};

const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

const parseDate = (date: any): Date | null => {
  if (isValidDate(date)) return date;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isValidDate(parsed) ? parsed : null;
  }
  return null;
};

const getDatePresets = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);
  
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);
  
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: 'Hari Ini', range: { from: today, to: today } },
    { label: 'Kemarin', range: { from: yesterday, to: yesterday } },
    { label: '7 Hari Terakhir', range: { from: last7Days, to: today } },
    { label: '30 Hari Terakhir', range: { from: last30Days, to: today } },
    { label: 'Bulan Ini', range: { from: thisMonth, to: today } },
    { label: 'Bulan Lalu', range: { from: lastMonth, to: lastMonthEnd } },
  ];
};

// Date Presets Component
const DatePresets = React.memo<{
  setDateRange: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  onClose?: () => void;
}>(({ setDateRange, onPageChange, onClose }) => {
  const presets = getDatePresets();

  const handlePresetClick = useCallback((range: DateRange) => {
    try {
      setDateRange(range);
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error applying preset:', error);
    }
  }, [setDateRange, onPageChange, onClose]);

  return (
    <div className="flex flex-col space-y-1 p-4 bg-white min-w-[200px]">
      <div className="pb-2 mb-2 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">Pilihan Cepat</h4>
      </div>
      {presets.map(({ label, range }) => (
        <Button
          key={label}
          variant="ghost"
          className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-700 rounded-md py-2 px-3 text-gray-700 font-normal"
          onClick={() => handlePresetClick(range)}
          type="button"
        >
          {label}
        </Button>
      ))}
    </div>
  );
});

DatePresets.displayName = 'DatePresets';

// Main Component
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  onPageChange,
  placeholder = "Pilih rentang tanggal",
  className = "",
  disabled = false,
  isMobile = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle date range changes with validation
  const handleDateRangeChange = useCallback((newRange: any) => {
    try {
      console.log('DateRangePicker: Received range:', newRange);
      console.log('onDateRangeChange type:', typeof onDateRangeChange);
      
      // Check if onDateRangeChange is actually a function
      if (typeof onDateRangeChange !== 'function') {
        console.error('onDateRangeChange is not a function:', onDateRangeChange);
        return;
      }

      if (!newRange) {
        onDateRangeChange(undefined);
        return;
      }

      const fromDate = parseDate(newRange.from);
      const toDate = parseDate(newRange.to || newRange.from);

      if (!fromDate || !isValidDate(fromDate)) {
        console.error('Invalid from date:', newRange.from);
        return;
      }

      if (!toDate || !isValidDate(toDate)) {
        console.error('Invalid to date:', newRange.to);
        return;
      }

      const validatedRange: DateRange = {
        from: fromDate,
        to: toDate
      };

      onDateRangeChange(validatedRange);
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }

      // Auto-close on mobile when range is complete
      if (isMobile && newRange.from && newRange.to) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error updating date range:', error);
      console.error('Error stack:', error);
    }
  }, [onDateRangeChange, onPageChange, isMobile]);

  const handleReset = useCallback(() => {
    try {
      onDateRangeChange(undefined);
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('Error resetting date range:', error);
    }
  }, [onDateRangeChange, onPageChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Memoized display text
  const displayText = useMemo(() => {
    try {
      return formatDateRange(dateRange) || placeholder;
    } catch (error) {
      console.warn('Error formatting date range for display:', error);
      return placeholder;
    }
  }, [dateRange, placeholder]);

  // Memoized default month for calendar
  const defaultMonth = useMemo(() => {
    if (dateRange?.from && isValidDate(dateRange.from)) {
      return dateRange.from;
    }
    return new Date();
  }, [dateRange?.from]);

  // Common button props
  const buttonProps = {
    variant: "outline" as const,
    disabled,
    className: cn(
      "w-full justify-start text-left font-normal h-11 px-4 border-gray-300 rounded-lg shadow-sm",
      !dateRange && "text-muted-foreground",
      "hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500 transition-colors",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )
  };

  const buttonContent = (
    <>
      <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
      <span className="flex-1 truncate">{displayText}</span>
    </>
  );

  // Date validation for calendar
  const isDateDisabled = useCallback((date: Date) => {
    try {
      const now = new Date();
      const minDate = new Date('2020-01-01');
      return date > now || date < minDate;
    } catch (error) {
      console.warn('Date validation error:', error);
      return false;
    }
  }, []);

  // Calendar class names
  const calendarClassNames = {
    months: "flex flex-col sm:flex-row gap-4 justify-center",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: cn(
      "inline-flex items-center justify-center rounded-md text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100 h-8 w-8 hover:bg-accent hover:text-accent-foreground"
    ),
    day_selected: "bg-orange-500 text-primary-foreground hover:bg-orange-600 hover:text-primary-foreground focus:bg-orange-500 focus:text-primary-foreground",
    day_today: "bg-blue-50 text-blue-700 font-semibold border-2 border-blue-300",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-900",
    day_hidden: "invisible",
  };

  // Mobile: Dialog
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button {...buttonProps}>
            {buttonContent}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-[95vw] max-w-md p-0 bg-white rounded-xl shadow-xl">
          <DialogHeader className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Pilih Rentang Tanggal
              </DialogTitle>
              <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-gray-100"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col">
            {/* Date Presets */}
            <DatePresets 
              setDateRange={onDateRangeChange} 
              onPageChange={onPageChange}
              onClose={handleClose}
            />
            
            {/* Calendar */}
            <div className="border-t border-gray-200 p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={defaultMonth}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={1}
                locale={id}
                className="w-full"
                classNames={calendarClassNames}
                disabled={isDateDisabled}
              />
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-gray-600 hover:text-gray-800"
                  type="button"
                >
                  Reset
                </Button>
                <Button 
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={handleApply}
                  type="button"
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button {...buttonProps}>
          {buttonContent}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-auto p-0 flex bg-white shadow-xl rounded-xl border border-gray-200" 
        align="end"
        sideOffset={8}
      >
        {/* Date Presets */}
        <DatePresets 
          setDateRange={onDateRangeChange} 
          onPageChange={onPageChange}
          onClose={handleClose}
        />
        
        {/* Calendar */}
        <div className="border-l border-gray-200 p-4">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={defaultMonth}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            locale={id}
            className="w-full"
            classNames={calendarClassNames}
            disabled={isDateDisabled}
          />
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800"
              type="button"
            >
              Reset
            </Button>
            <Button 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleApply}
              type="button"
            >
              Terapkan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;