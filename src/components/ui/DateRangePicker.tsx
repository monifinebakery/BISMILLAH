// components/DateRangePicker.tsx - FINAL FIXED VERSION
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';

// 🔧 FIX: Use exact imports from your existing files
import { DateRange } from '@/types/order';
import { DATE_RANGE_PRESETS } from '@/components/orders/constants/orderConstants';
import { 
  safeParseDate, 
  isValidDate, 
  formatDateRange, 
  getDateRangePreset 
} from '@/utils/unifiedDateUtils';

interface DateRangePickerProps {
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isMobile?: boolean;
}

// 🔧 FIX: Inline DatePresets using your existing utilities
const DatePresets = React.memo<{
  setDateRange: (range: DateRange | undefined) => void;
  onClose?: () => void;
  setCurrentPage?: (page: number) => void;
}>(({ setDateRange, onClose, setCurrentPage }) => {

  const handlePresetClick = (key: string) => {
    console.log('🔧 PRESET: Starting preset selection for key:', key);
    
    try {
      // Layer 1: Validate callback
      if (!setDateRange || typeof setDateRange !== 'function') {
        console.error('🔧 PRESET: setDateRange is not a function:', typeof setDateRange);
        return;
      }
      
      // Layer 2: Use your existing getDateRangePreset utility
      let range: { from: Date; to: Date };
      
      try {
        range = getDateRangePreset(key);
        console.log('🔧 PRESET: Generated range using unifiedDateUtils:', range);
      } catch (rangeError) {
        console.error('🔧 PRESET: getDateRangePreset failed:', rangeError);
        // Emergency fallback
        const now = new Date();
        range = { from: now, to: now };
      }
      
      // Layer 3: Validate generated range
      if (!range || !range.from || !range.to) {
        console.error('🔧 PRESET: Invalid range from getDateRangePreset:', range);
        const now = new Date();
        range = { from: now, to: now };
      }
      
      // Layer 4: Validate dates using your utility
      if (!isValidDate(range.from) || !isValidDate(range.to)) {
        console.error('🔧 PRESET: Range validation failed:', range);
        const now = new Date();
        range = { from: now, to: now };
      }
      
      console.log('🔧 PRESET: Final validated range:', {
        from: range.from.toISOString(),
        to: range.to.toISOString()
      });
      
      // Layer 5: Set the range (compatible with your DateRange type)
      try {
        setDateRange(range);
        console.log('🔧 PRESET: Successfully set date range');
      } catch (setError) {
        console.error('🔧 PRESET: Error calling setDateRange:', setError);
        return;
      }
      
      // Layer 6: Optional page reset
      if (setCurrentPage && typeof setCurrentPage === 'function') {
        try {
          setCurrentPage(1);
          console.log('🔧 PRESET: Reset to page 1');
        } catch (pageError) {
          console.warn('🔧 PRESET: Could not reset page:', pageError);
        }
      }
      
      // Layer 7: Optional dialog close
      if (onClose && typeof onClose === 'function') {
        try {
          onClose();
          console.log('🔧 PRESET: Closed dialog');
        } catch (closeError) {
          console.warn('🔧 PRESET: Could not close dialog:', closeError);
        }
      }
      
      console.log('🔧 PRESET: Preset selection completed successfully for:', key);
      
    } catch (error) {
      console.error('🔧 PRESET: Critical error in handlePresetClick:', error);
      console.error('🔧 PRESET: Error stack:', error?.stack);
      
      // Emergency fallback
      try {
        const emergencyRange = { from: new Date(), to: new Date() };
        if (setDateRange && typeof setDateRange === 'function') {
          setDateRange(emergencyRange);
          console.log('🔧 PRESET: Emergency fallback successful');
        }
      } catch (emergencyError) {
        console.error('🔧 PRESET: Emergency fallback failed:', emergencyError);
      }
    }
  };

  try {
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
                  console.log('🔧 BUTTON: Clicked preset button:', key);
                  handlePresetClick(key);
                }}
                type="button"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('🔧 RENDER: Error rendering DatePresets:', renderError);
    
    return (
      <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
        <div className="p-3">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
          <div className="text-sm text-red-600">
            Error loading date presets. Please refresh the page.
          </div>
        </div>
      </div>
    );
  }
});

DatePresets.displayName = 'DatePresets';

// 🔧 FIX: Convert DateRange to Calendar-compatible format
const convertToCalendarRange = (range: DateRange | undefined) => {
  if (!range) return undefined;
  
  const fromDate = safeParseDate(range.from);
  const toDate = safeParseDate(range.to);
  
  if (!fromDate || !isValidDate(fromDate)) return undefined;
  
  return {
    from: fromDate,
    to: (toDate && isValidDate(toDate)) ? toDate : fromDate
  };
};

// 🔧 FIX: Convert Calendar range back to DateRange format
const convertFromCalendarRange = (calendarRange: any): DateRange | undefined => {
  if (!calendarRange || !calendarRange.from) return undefined;
  
  const fromDate = safeParseDate(calendarRange.from);
  const toDate = safeParseDate(calendarRange.to || calendarRange.from);
  
  if (!fromDate || !isValidDate(fromDate)) return undefined;
  if (!toDate || !isValidDate(toDate)) return undefined;
  
  return {
    from: fromDate,
    to: toDate
  };
};

// Main Component
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange = () => {
    console.warn('🔧 DATERANGEPICKER: onDateRangeChange not provided - using default no-op function');
  },
  onPageChange,
  placeholder = "Pilih rentang tanggal",
  className = "",
  disabled = false,
  isMobile = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 🔧 FIX: Extra validation layer for props
  React.useEffect(() => {
    if (!onDateRangeChange || typeof onDateRangeChange !== 'function') {
      console.error('🔧 DATERANGEPICKER: Critical - onDateRangeChange prop is missing or not a function!');
      console.error('🔧 DATERANGEPICKER: Received onDateRangeChange:', onDateRangeChange);
      console.error('🔧 DATERANGEPICKER: Type:', typeof onDateRangeChange);
    }
  }, [onDateRangeChange]);

  // 🔧 FIX: Safe Calendar range handler with comprehensive validation
  const handleCalendarRangeChange = useCallback((newRange: any) => {
    try {
      console.log('🔧 CALENDAR: Received range from Calendar component:', newRange);
      console.log('🔧 CALENDAR: onDateRangeChange type:', typeof onDateRangeChange);
      console.log('🔧 CALENDAR: onDateRangeChange value:', onDateRangeChange);
      
      // Layer 1: Validate callback function exists and is callable
      if (!onDateRangeChange) {
        console.error('🔧 CALENDAR: onDateRangeChange is null/undefined!');
        console.error('🔧 CALENDAR: This means the parent component did not pass onDateRangeChange prop');
        return;
      }
      
      if (typeof onDateRangeChange !== 'function') {
        console.error('🔧 CALENDAR: onDateRangeChange is not a function:', onDateRangeChange);
        console.error('🔧 CALENDAR: Received type:', typeof onDateRangeChange);
        console.error('🔧 CALENDAR: This means the parent component passed wrong prop type');
        return;
      }

      // Layer 2: Handle undefined/null range
      if (!newRange) {
        console.log('🔧 CALENDAR: Clearing date range (received null/undefined)');
        try {
          onDateRangeChange(undefined);
          console.log('🔧 CALENDAR: Successfully cleared range');
        } catch (callError) {
          console.error('🔧 CALENDAR: Error calling onDateRangeChange with undefined:', callError);
        }
        return;
      }

      // Layer 3: Convert Calendar range format to DateRange format
      const convertedRange = convertFromCalendarRange(newRange);
      console.log('🔧 CALENDAR: Converted range:', convertedRange);
      
      if (!convertedRange) {
        console.warn('🔧 CALENDAR: Could not convert Calendar range, clearing');
        try {
          onDateRangeChange(undefined);
          console.log('🔧 CALENDAR: Successfully cleared range after conversion failure');
        } catch (callError) {
          console.error('🔧 CALENDAR: Error calling onDateRangeChange after conversion failure:', callError);
        }
        return;
      }

      // Layer 4: Additional validation using your utilities
      if (!isValidDate(convertedRange.from) || !isValidDate(convertedRange.to)) {
        console.error('🔧 CALENDAR: Converted range failed validation:', convertedRange);
        try {
          onDateRangeChange(undefined);
          console.log('🔧 CALENDAR: Successfully cleared range after validation failure');
        } catch (callError) {
          console.error('🔧 CALENDAR: Error calling onDateRangeChange after validation failure:', callError);
        }
        return;
      }

      // Layer 5: Apply the range
      try {
        onDateRangeChange(convertedRange);
        console.log('🔧 CALENDAR: Successfully applied converted range');
      } catch (callError) {
        console.error('🔧 CALENDAR: Error calling onDateRangeChange with converted range:', callError);
        return;
      }
      
      // Layer 6: Reset page if callback provided
      if (onPageChange && typeof onPageChange === 'function') {
        try {
          onPageChange(1);
          console.log('🔧 CALENDAR: Reset page to 1');
        } catch (pageError) {
          console.warn('🔧 CALENDAR: Could not reset page:', pageError);
        }
      }

      // Layer 7: Auto-close on mobile when range is complete
      if (isMobile && newRange.from && newRange.to) {
        setIsOpen(false);
        console.log('🔧 CALENDAR: Auto-closed mobile dialog');
      }
      
    } catch (error) {
      console.error('🔧 CALENDAR: Critical error in handleCalendarRangeChange:', error);
      console.error('🔧 CALENDAR: Error name:', error?.name);
      console.error('🔧 CALENDAR: Error message:', error?.message);
      console.error('🔧 CALENDAR: Error stack:', error?.stack);
      
      // Emergency fallback
      try {
        console.log('🔧 CALENDAR: Attempting emergency fallback...');
        if (onDateRangeChange && typeof onDateRangeChange === 'function') {
          onDateRangeChange(undefined);
          console.log('🔧 CALENDAR: Emergency fallback completed');
        } else {
          console.error('🔧 CALENDAR: Cannot perform emergency fallback - onDateRangeChange invalid');
        }
      } catch (fallbackError) {
        console.error('🔧 CALENDAR: Emergency fallback also failed:', fallbackError);
      }
    }
  }, [onDateRangeChange, onPageChange, isMobile]);

  // 🔧 FIX: Safe handler for DatePresets component
  const handlePresetDateRange = useCallback((range: DateRange | undefined) => {
    try {
      console.log('🔧 PRESET_HANDLER: Received preset range:', range);
      console.log('🔧 PRESET_HANDLER: onDateRangeChange type:', typeof onDateRangeChange);
      console.log('🔧 PRESET_HANDLER: onDateRangeChange value:', onDateRangeChange);
      
      if (!onDateRangeChange) {
        console.error('🔧 PRESET_HANDLER: onDateRangeChange is null/undefined!');
        return;
      }
      
      if (typeof onDateRangeChange !== 'function') {
        console.error('🔧 PRESET_HANDLER: onDateRangeChange is not a function');
        return;
      }

      // Validate preset range using your utilities
      if (range && (!isValidDate(range.from) || !isValidDate(range.to))) {
        console.error('🔧 PRESET_HANDLER: Invalid preset range:', range);
        try {
          onDateRangeChange(undefined);
          console.log('🔧 PRESET_HANDLER: Cleared invalid range');
        } catch (callError) {
          console.error('🔧 PRESET_HANDLER: Error clearing invalid range:', callError);
        }
        return;
      }

      try {
        onDateRangeChange(range);
        console.log('🔧 PRESET_HANDLER: Successfully applied preset range');
      } catch (callError) {
        console.error('🔧 PRESET_HANDLER: Error calling onDateRangeChange:', callError);
        return;
      }
      
      if (onPageChange && typeof onPageChange === 'function') {
        try {
          onPageChange(1);
          console.log('🔧 PRESET_HANDLER: Reset page to 1');
        } catch (pageError) {
          console.warn('🔧 PRESET_HANDLER: Could not reset page:', pageError);
        }
      }
      
    } catch (error) {
      console.error('🔧 PRESET_HANDLER: Error in preset handler:', error);
    }
  }, [onDateRangeChange, onPageChange]);

  const handleReset = useCallback(() => {
    try {
      console.log('🔧 RESET: Starting reset process');
      console.log('🔧 RESET: onDateRangeChange type:', typeof onDateRangeChange);
      console.log('🔧 RESET: onDateRangeChange value:', onDateRangeChange);
      
      if (!onDateRangeChange) {
        console.error('🔧 RESET: onDateRangeChange is null/undefined!');
        return;
      }
      
      if (typeof onDateRangeChange !== 'function') {
        console.error('🔧 RESET: onDateRangeChange is not a function');
        return;
      }
      
      try {
        onDateRangeChange(undefined);
        console.log('🔧 RESET: Successfully reset date range');
      } catch (callError) {
        console.error('🔧 RESET: Error calling onDateRangeChange:', callError);
        return;
      }
      
      if (onPageChange && typeof onPageChange === 'function') {
        try {
          onPageChange(1);
          console.log('🔧 RESET: Reset page to 1');
        } catch (pageError) {
          console.warn('🔧 RESET: Could not reset page:', pageError);
        }
      }
      
    } catch (error) {
      console.error('🔧 RESET: Error resetting:', error);
    }
  }, [onDateRangeChange, onPageChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 🔧 FIX: Memoized conversions using your utilities
  const calendarRange = useMemo(() => {
    return convertToCalendarRange(dateRange);
  }, [dateRange]);

  // 🔧 FIX: Memoized display text using your formatDateRange utility
  const displayText = useMemo(() => {
    try {
      const formatted = formatDateRange(dateRange);
      return formatted || placeholder;
    } catch (error) {
      console.warn('🔧 DISPLAY: Error formatting display text:', error);
      return placeholder;
    }
  }, [dateRange, placeholder]);

  // Memoized default month for calendar
  const defaultMonth = useMemo(() => {
    if (dateRange?.from) {
      const parsed = safeParseDate(dateRange.from);
      if (parsed && isValidDate(parsed)) return parsed;
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
      console.warn('🔧 VALIDATION: Date validation error:', error);
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
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Pilih Rentang Tanggal
            </DialogTitle>
            {/* 🔧 FIX: Remove manual close button - DialogClose handles this automatically */}
          </DialogHeader>
          
          <div className="flex flex-col">
            {/* Date Presets */}
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
                onSelect={handleCalendarRangeChange}
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
            onSelect={handleCalendarRangeChange}
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