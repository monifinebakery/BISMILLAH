// src/components/orders/components/DateRangePicker.tsx (FIXED VERSION)
import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { id } from 'date-fns/locale';
import { DateRange } from '@/types/order';
import { formatDateRange } from '@/utils/dashboardUtils';
import { isValidDate } from '@/utils/dateUtils';
import { parseDate } from '@/utils/dashboardUtils';
import DatePresets from './DatePresets';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  onPageChange,
  placeholder = "Pilih rentang tanggal",
  className = "",
  disabled = false
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    try {
      console.log('DateRangePicker: Handling date range change:', newRange);
      
      // Validate the new range
      if (newRange && newRange.from) {
        const fromDate = parseDate(newRange.from);
        const toDate = newRange.to ? parseDate(newRange.to) : null;
        
        if (!fromDate || !isValidDate(fromDate)) {
          console.error('Invalid from date:', newRange.from);
          return;
        }
        
        if (newRange.to && (!toDate || !isValidDate(toDate))) {
          console.error('Invalid to date:', newRange.to);
          return;
        }
        
        // Create validated range
        const validatedRange: DateRange = {
          from: fromDate,
          to: toDate || fromDate
        };
        
        onDateRangeChange(validatedRange);
      } else {
        onDateRangeChange(newRange);
      }
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('Error updating date range:', error);
    }
  };

  const handleReset = () => {
    try {
      onDateRangeChange(undefined);
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('Error resetting date range:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  // Get display text safely
  const getDisplayText = () => {
    try {
      return formatDateRange(dateRange) || placeholder;
    } catch (error) {
      console.warn('Error formatting date range for display:', error);
      return placeholder;
    }
  };

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
          {/* Date Presets */}
          <div className="md:w-64 flex-shrink-0">
            <DatePresets 
              setDateRange={onDateRangeChange} 
              setCurrentPage={onPageChange}
              onClose={isMobile ? undefined : handleClose}
            />
          </div>
          
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
                  console.warn('Date validation error:', error);
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