// components/DateRangePicker.tsx - FIXED VERSION
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';

// 🔧 FIX: Use the exact same DateRange type from your types/order.ts
import { DateRange } from '@/types/order';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isMobile?: boolean;
}

// 🔧 FIX: Use your existing DatePresets component
import DatePresets from '@/components/orders/DatePresets';

// 🔧 FIX: Utility functions that match your existing utils
const formatDateRange = (range: DateRange | undefined): string => {
  if (!range || !range.from) return '';
  
  try {
    const fromDate = parseDate(range.from);
    const toDate = parseDate(range.to || range.from);
    
    if (!fromDate) return '';
    
    const fromStr = fromDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    if (!toDate || fromDate.getTime() === toDate.getTime()) {
      return fromStr;
    }
    
    const toStr = toDate.toLocaleDateString('id-ID', {
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
    
    return `${fromStr} - ${toStr}`;
  } catch (error) {
    console.warn('Error formatting date range:', error);
    return '';
  }
};

const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

const parseDate = (date: Date | string | undefined | null): Date | null => {
  if (!date) return null;
  
  if (isValidDate(date)) return date;
  
  if (typeof date === 'string') {
    try {
      const parsed = new Date(date);
      return isValidDate(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Error parsing date string:', date, error);
      return null;
    }
  }
  
  return null;
};

// 🔧 FIX: Convert your DateRange to Calendar-compatible format
const convertToCalendarRange = (range: DateRange | undefined) => {
  if (!range) return undefined;
  
  const fromDate = parseDate(range.from);
  const toDate = parseDate(range.to);
  
  if (!fromDate) return undefined;
  
  return {
    from: fromDate,
    to: toDate || fromDate
  };
};

// 🔧 FIX: Convert Calendar range back to your DateRange format
const convertFromCalendarRange = (calendarRange: any): DateRange | undefined => {
  if (!calendarRange || !calendarRange.from) return undefined;
  
  const fromDate = parseDate(calendarRange.from);
  const toDate = parseDate(calendarRange.to || calendarRange.from);
  
  if (!fromDate) return undefined;
  
  return {
    from: fromDate,
    to: toDate || fromDate
  };
};

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

  // 🔧 FIX: Enhanced callback with proper validation and type conversion
  const handleDateRangeChange = useCallback((newRange: any) => {
    try {
      console.log('🔧 DateRangePicker: Received range from Calendar:', newRange);
      console.log('🔧 DateRangePicker: onDateRangeChange type:', typeof onDateRangeChange);
      
      // Layer 1: Validate the callback function
      if (!onDateRangeChange || typeof onDateRangeChange !== 'function') {
        console.error('🔧 DateRangePicker: onDateRangeChange is not a function:', onDateRangeChange);
        return;
      }

      // Layer 2: Handle undefined/null range
      if (!newRange) {
        console.log('🔧 DateRangePicker: Setting undefined range');
        onDateRangeChange(undefined);
        return;
      }

      // Layer 3: Convert Calendar range to your DateRange format
      const convertedRange = convertFromCalendarRange(newRange);
      console.log('🔧 DateRangePicker: Converted range:', convertedRange);
      
      if (!convertedRange) {
        console.warn('🔧 DateRangePicker: Could not convert range, setting undefined');
        onDateRangeChange(undefined);
        return;
      }

      // Layer 4: Apply the range
      onDateRangeChange(convertedRange);
      console.log('🔧 DateRangePicker: Successfully applied range');
      
      // Layer 5: Reset page if callback provided
      if (onPageChange && typeof onPageChange === 'function') {
        try {
          onPageChange(1);
        } catch (pageError) {
          console.warn('🔧 DateRangePicker: Could not reset page:', pageError);
        }
      }

      // Layer 6: Auto-close on mobile when range is complete
      if (isMobile && newRange.from && newRange.to) {
        setIsOpen(false);
      }
      
    } catch (error) {
      console.error('🔧 DateRangePicker: Critical error in handleDateRangeChange:', error);
      console.error('🔧 DateRangePicker: Error stack:', error?.stack);
      
      // Emergency fallback
      try {
        onDateRangeChange(undefined);
      } catch (fallbackError) {
        console.error('🔧 DateRangePicker: Even fallback failed:', fallbackError);
      }
    }
  }, [onDateRangeChange, onPageChange, isMobile]);

  // 🔧 FIX: Safe handler for DatePresets component
  const handlePresetDateRange = useCallback((range: DateRange | undefined) => {
    try {
      console.log('🔧 DateRangePicker: Received preset range:', range);
      
      if (!onDateRangeChange || typeof onDateRangeChange !== 'function') {
        console.error('🔧 DateRangePicker: onDateRangeChange is not a function for preset');
        return;
      }

      onDateRangeChange(range);
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
      
    } catch (error) {
      console.error('🔧 DateRangePicker: Error in preset handler:', error);
    }
  }, [onDateRangeChange, onPageChange]);

  const handleReset = useCallback(() => {
    try {
      if (!onDateRangeChange || typeof onDateRangeChange !== 'function') {
        console.error('🔧 DateRangePicker: onDateRangeChange is not a function for reset');
        return;
      }
      
      onDateRangeChange(undefined);
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('🔧 DateRangePicker: Error resetting:', error);
    }
  }, [onDateRangeChange, onPageChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 🔧 FIX: Memoized conversions for Calendar component
  const calendarRange = useMemo(() => {
    return convertToCalendarRange(dateRange);
  }, [dateRange]);

  // Memoized display text
  const displayText = useMemo(() => {
    try {
      return formatDateRange(dateRange) || placeholder;
    } catch (error) {
      console.warn('🔧 DateRangePicker: Error formatting display text:', error);
      return placeholder;
    }
  }, [dateRange, placeholder]);

  // Memoized default month for calendar
  const defaultMonth = useMemo(() => {
    if (dateRange?.from) {
      const parsed = parseDate(dateRange.from);
      if (parsed) return parsed;
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
      console.warn('🔧 DateRangePicker: Date validation error:', error);
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
            {/* Date Presets - 🔧 FIX: Use your existing component with safe handler */}
            <DatePresets 
              setDateRange={handlePresetDateRange}
              setCurrentPage={onPageChange}
              onClose={handleClose}
            />
            
            {/* Calendar */}
            <div className="border-t border-gray-200 p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={defaultMonth}
                selected={calendarRange}
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
        {/* Date Presets - 🔧 FIX: Use your existing component with safe handler */}
        <DatePresets 
          setDateRange={handlePresetDateRange}
          setCurrentPage={onPageChange}
          onClose={handleClose}
        />
        
        {/* Calendar */}
        <div className="border-l border-gray-200 p-4">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={defaultMonth}
            selected={calendarRange}
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