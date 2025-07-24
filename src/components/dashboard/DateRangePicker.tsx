// components/dashboard/DateRangePicker.tsx
import React, { useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { formatDateRange, parseDate, toISOString, getDatePresets } from '@/utils/dashboardUtils';
import { id } from 'date-fns/locale';

interface Props {
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  isMobile: boolean;
}

// 📋 Date Presets Component - Memoized for performance
const DatePresets = React.memo<{
  setDateRange: (range: any) => void;
  onClose?: () => void;
}>(({ setDateRange, onClose = () => {} }) => {
  const presets = getDatePresets();

  const handlePresetClick = useCallback((range: any) => {
    setDateRange(range);
    onClose();
  }, [setDateRange, onClose]);

  return (
    <div className="flex flex-col space-y-1 p-3 bg-white">
      <div className="pb-2 mb-2 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">Pilihan Cepat</h4>
      </div>
      {presets.map(({ label, range }) => (
        <Button
          key={label}
          variant="ghost"
          className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-700 rounded-md py-2 px-3 text-gray-700 font-normal"
          onClick={() => handlePresetClick(range)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
});

DatePresets.displayName = 'DatePresets';

const DateRangePicker: React.FC<Props> = ({ dateRange, setDateRange, isMobile }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 📅 Convert ISO strings to Date objects for Calendar
  const calendarDate = React.useMemo(() => {
    const fromDate = parseDate(dateRange.from);
    const toDate = parseDate(dateRange.to);
    return { from: fromDate, to: toDate };
  }, [dateRange]);

  // 🎯 Handle calendar selection
  const handleCalendarSelect = useCallback((range: any) => {
    if (!range) return;
    
    try {
      const fromISO = toISOString(range.from);
      const toISO = toISOString(range.to || range.from);
      
      if (fromISO && toISO) {
        setDateRange({ from: fromISO, to: toISO });
        if (isMobile) {
          setIsCalendarOpen(false);
        }
      }
    } catch (error) {
      console.warn('Calendar selection error:', error);
    }
  }, [setDateRange, isMobile]);

  // 📱 Format display text
  const displayText = formatDateRange(calendarDate.from, calendarDate.to);

  // 🎨 Common button props
  const buttonProps = {
    variant: "outline" as const,
    className: "w-full sm:w-[320px] justify-between text-left font-medium bg-white border-gray-300 hover:bg-gray-50 transition-colors rounded-lg shadow-sm py-2.5 px-4"
  };

  const buttonContent = (
    <div className="flex items-center">
      <CalendarIcon className="mr-3 h-5 w-5 text-gray-500" />
      <span className="text-gray-700">{displayText}</span>
    </div>
  );

  // 📱 Mobile: Dialog
  if (isMobile) {
    return (
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogTrigger asChild>
          <Button {...buttonProps}>
            {buttonContent}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-[420px] p-0 bg-white rounded-xl">
          <DialogTitle className="sr-only">Pilih Rentang Tanggal</DialogTitle>
          <div className="flex flex-col">
            {/* 📋 Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih Rentang Tanggal</h3>
              <p className="text-sm text-gray-600 mt-1">Pilih periode untuk melihat data</p>
            </div>
            
            {/* 🗓️ Presets */}
            <DatePresets 
              setDateRange={setDateRange} 
              onClose={() => setIsCalendarOpen(false)} 
            />
            
            {/* 📅 Calendar */}
            <div className="border-t border-gray-200">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={calendarDate.from}
                selected={calendarDate}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                locale={id}
                className="p-3"
                classNames={{
                  day: "w-10 h-10 text-sm font-medium",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                  day_today: "border-2 border-blue-300 bg-blue-50",
                  day_range_middle: "bg-blue-100 text-blue-900",
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 🖥️ Desktop: Popover
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button {...buttonProps}>
          {buttonContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 flex bg-white shadow-xl rounded-xl border border-gray-200" 
        align="end"
      >
        {/* 🗓️ Presets */}
        <DatePresets setDateRange={setDateRange} />
        
        {/* 📅 Calendar */}
        <div className="border-l border-gray-200">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={calendarDate.from}
            selected={calendarDate}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={id}
            className="p-3"
            classNames={{
              day: "w-9 h-9 text-sm font-medium",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700",
              day_today: "border-2 border-blue-300 bg-blue-50",
              day_range_middle: "bg-blue-100 text-blue-900",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;