// src/components/orders/components/DateRangePicker.tsx - UNIFIED VERSION
import React, { useState, useCallback } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { id } from 'date-fns/locale';
import { DateRange } from '@/types/order'; // Use consistent type
import { formatDateRange, parseDate, isValidDate } from '@/utils/dashboardUtils';
import DatePresets from './DatePresets';

// 🔧 FIX: Unified interface that supports both prop patterns
interface DateRangePickerProps {
  // Core props - support both naming patterns
  dateRange?: DateRange | undefined;
  value?: DateRange | undefined;
  
  // Handler props - support both naming patterns  
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onChange?: (range: DateRange | undefined) => void;
  
  // Optional props
  onPageChange?: (page: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  
  // Additional props from OrdersFilters
  showPresets?: boolean;
  autoClose?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  // Support both prop patterns
  dateRange: dateRangeProp,
  value: valueProp,
  onDateRangeChange: onDateRangeChangeProp,
  onChange: onChangeProp,
  
  onPageChange,
  placeholder = "Pilih rentang tanggal",
  className = "",
  disabled = false,
  showPresets = true,
  autoClose = false
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // 🔧 FIX: Determine actual values and handlers
  const dateRange = dateRangeProp || valueProp;
  const onDateRangeChange = onDateRangeChangeProp || onChangeProp;

  // 🔧 FIX: Enhanced validation for the handler
  const validateHandler = useCallback(() => {
    if (!onDateRangeChange) {
      console.error('DateRangePicker: No change handler provided. Please provide either onDateRangeChange or onChange prop.');
      return false;
    }
    
    if (typeof onDateRangeChange !== 'function') {
      console.error('DateRangePicker: Change handler is not a function:', {
        onDateRangeChange,
        type: typeof onDateRangeChange,
        onDateRangeChangeProp: typeof onDateRangeChangeProp,
        onChangeProp: typeof onChangeProp
      });
      return false;
    }
    
    return true;
  }, [onDateRangeChange, onDateRangeChangeProp, onChangeProp]);

  // 🔧 FIX: Safe date range change handler
  const handleDateRangeChange = useCallback((newRange: DateRange | undefined) => {
    try {
      console.log('DateRangePicker: Handling date range change:', {
        newRange,
        hasHandler: !!onDateRangeChange,
        handlerType: typeof onDateRangeChange
      });
      
      // Validate handler before proceeding
      if (!validateHandler()) {
        return;
      }
      
      // Validate the new range if provided
      if (newRange && newRange.from) {
        const fromDate = parseDate(newRange.from);
        const toDate = newRange.to ? parseDate(newRange.to) : null;
        
        if (!fromDate || !isValidDate(fromDate)) {
          console.error('DateRangePicker: Invalid from date:', newRange.from);
          return;
        }
        
        if (newRange.to && (!toDate || !isValidDate(toDate))) {
          console.error('DateRangePicker: Invalid to date:', newRange.to);
          // Use only from date if to date is invalid
          const validatedRange: DateRange = {
            from: fromDate,
            to: undefined
          };
          onDateRangeChange!(validatedRange);
          return;
        }
        
        // Create validated range
        const validatedRange: DateRange = {
          from: fromDate,
          to: toDate || fromDate
        };
        
        onDateRangeChange!(validatedRange);
      } else {
        onDateRangeChange!(newRange);
      }
      
      // Handle page change safely
      if (onPageChange && typeof onPageChange === 'function') {
        try {
          onPageChange(1);
        } catch (pageError) {
          console.error('DateRangePicker: Error changing page:', pageError);
        }
      }
      
      // Auto close if enabled
      if (autoClose) {
        setIsOpen(false);
      }
      
    } catch (error) {
      console.error('DateRangePicker: Error updating date range:', error);
    }
  }, [onDateRangeChange, onPageChange, autoClose, validateHandler]);

  // 🔧 FIX: Safe reset handler
  const handleReset = useCallback(() => {
    try {
      if (validateHandler()) {
        onDateRangeChange!(undefined);
        if (onPageChange && typeof onPageChange === 'function') {
          onPageChange(1);
        }
      }
    } catch (error) {
      console.error('DateRangePicker: Error resetting date range:', error);
    }
  }, [onDateRangeChange, onPageChange, validateHandler]);

  // 🔧 FIX: Safe close handler
  const handleClose = useCallback(() => {
    try {
      setIsOpen(false);
    } catch (error) {
      console.error('DateRangePicker: Error closing dialog:', error);
    }
  }, []);

  // 🔧 FIX: Safe apply handler
  const handleApply = useCallback(() => {
    try {
      setIsOpen(false);
    } catch (error) {
      console.error('DateRangePicker: Error applying selection:', error);
    }
  }, []);

  // 🔧 FIX: Safe page change handler for DatePresets
  const handlePageChange = useCallback((page: number) => {
    try {
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(page);
      }
    } catch (error) {
      console.error('DateRangePicker: Error in page change handler:', error);
    }
  }, [onPageChange]);

  // 🔧 FIX: Safe display text generation
  const getDisplayText = useCallback(() => {
    try {
      if (!dateRange) return placeholder;
      
      const formatted = formatDateRange(dateRange);
      
      // Additional safety check for error messages
      if (formatted && (
        formatted.includes('tidak valid') || 
        formatted.includes('Error') ||
        formatted === 'Pilih rentang tanggal'
      )) {
        return placeholder;
      }
      
      return formatted || placeholder;
    } catch (error) {
      console.warn('DateRangePicker: Error formatting display text:', error);
      return placeholder;
    }
  }, [dateRange, placeholder]);

  // 🔧 FIX: Early validation render
  if (!onDateRangeChange && !onChangeProp && !onDateRangeChangeProp) {
    console.error('DateRangePicker: No change handler provided');
    return (
      <Button
        variant="outline"
        disabled={true}
        className={cn(
          "w-full justify-start text-left font-normal h-11 px-4 border-gray-300 rounded-lg",
          "text-red-500 border-red-300",
          className
        )}
      >
        <CalendarIcon className="mr-3 h-4 w-4" />
        Error: No handler provided
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 px-4 border-gray-300 rounded-lg shadow-sm",
            !dateRange && "text-muted-foreground",
            "hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500 transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
          <span className="flex-1 truncate">
            {getDisplayText()}
          </span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-4xl p-0 bg-white rounded-xl shadow-xl">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
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
        
        <div className="flex flex-col md:flex-row">
          {/* Date Presets - Only show if enabled */}
          {showPresets && (
            <div className="md:w-64 flex-shrink-0">
              <DatePresets 
                setDateRange={handleDateRangeChange}
                setCurrentPage={handlePageChange}
                onClose={isMobile ? undefined : handleClose}
              />
            </div>
          )}
          
          {/* Calendar */}
          <div className="flex-1 p-6">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={
                dateRange?.from && isValidDate(dateRange.from) 
                  ? parseDate(dateRange.from) || new Date()
                  : new Date()
              }
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={isMobile ? 1 : 2}
              locale={id}
              className="w-full"
              classNames={{
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
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              disabled={(date) => {
                try {
                  const now = new Date();
                  const minDate = new Date('2020-01-01');
                  return date > now || date < minDate;
                } catch (error) {
                  console.warn('DateRangePicker: Date validation error:', error);
                  return false;
                }
              }}
            />
            
            {/* Quick Action Buttons */}
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
};

export default DateRangePicker;