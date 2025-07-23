// src/components/ui/DateRangePicker.tsx
// 📅 REUSABLE DATE RANGE PICKER COMPONENT

import React from 'react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import { id } from 'date-fns/locale';

export interface DatePreset {
  label: string;
  range: DateRange;
  key: string;
}

export interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  presets?: DatePreset[];
  disabled?: (date: Date) => boolean;
  className?: string;
  maxDate?: Date;
  minDate?: Date;
  numberOfMonths?: number;
  showPresets?: boolean;
  autoClose?: boolean;
}

// 🗓️ Default Date Presets
const getDefaultPresets = (): DatePreset[] => {
  const today = new Date();
  
  return [
    {
      key: 'today',
      label: "Hari Ini",
      range: {
        from: startOfDay(today),
        to: endOfDay(today)
      }
    },
    {
      key: 'yesterday', 
      label: "Kemarin",
      range: {
        from: startOfDay(subDays(today, 1)),
        to: endOfDay(subDays(today, 1))
      }
    },
    {
      key: 'last7days',
      label: "7 Hari Terakhir",
      range: {
        from: startOfDay(subDays(today, 6)),
        to: endOfDay(today)
      }
    },
    {
      key: 'last30days',
      label: "30 Hari Terakhir", 
      range: {
        from: startOfDay(subDays(today, 29)),
        to: endOfDay(today)
      }
    },
    {
      key: 'thisMonth',
      label: "Bulan Ini",
      range: {
        from: startOfMonth(today),
        to: endOfMonth(today)
      }
    },
    {
      key: 'lastMonth',
      label: "Bulan Lalu",
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1))
      }
    }
  ];
};

// 📋 Date Presets Component
const DatePresets: React.FC<{
  presets: DatePreset[];
  onPresetSelect: (range: DateRange) => void;
  onClose?: () => void;
}> = ({ presets, onPresetSelect, onClose }) => {
  return (
    <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
      <div className="p-4">
        <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.key}
              variant="ghost"
              size="sm"
              className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200 transition-all duration-200"
              onClick={() => {
                try {
                  onPresetSelect(preset.range);
                  if (onClose) onClose();
                } catch (error) {
                  console.error('Error selecting preset:', error);
                }
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 🎨 Main DateRangePicker Component
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal",
  presets,
  disabled,
  className,
  maxDate = new Date(),
  minDate = new Date('2020-01-01'),
  numberOfMonths,
  showPresets = true,
  autoClose = false
}) => {
  const isMobile = useIsMobile();
  const effectivePresets = presets || getDefaultPresets();
  const effectiveNumberOfMonths = numberOfMonths || (isMobile ? 1 : 2);

  // 📝 Format Date Range for Display
  const formatDateRange = () => {
    if (!value?.from) return placeholder;
    
    try {
      if (value.to && value.from !== value.to) {
        return `${format(value.from, "d MMM yyyy", { locale: id })} - ${format(value.to, "d MMM yyyy", { locale: id })}`;
      } else {
        return format(value.from, "d MMMM yyyy", { locale: id });
      }
    } catch (error) {
      console.error('Error formatting date range:', error);
      return "Tanggal tidak valid";
    }
  };

  // 🎯 Handle Preset Selection
  const handlePresetSelect = (range: DateRange) => {
    onChange(range);
  };

  // 🎯 Handle Calendar Selection
  const handleCalendarSelect = (newRange: DateRange | undefined) => {
    try {
      onChange(newRange);
    } catch (error) {
      console.error('Error updating date range:', error);
    }
  };

  // 🧹 Handle Reset
  const handleReset = () => {
    onChange(undefined);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-11 px-4 border-gray-300 rounded-lg shadow-sm",
            !value && "text-muted-foreground",
            "hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500 transition-colors",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="flex-1 truncate">
            {formatDateRange()}
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
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row">
          {/* Date Presets Sidebar */}
          {showPresets && (
            <div className="md:w-64 flex-shrink-0">
              <DatePresets 
                presets={effectivePresets}
                onPresetSelect={handlePresetSelect}
                onClose={autoClose ? () => {
                  document.querySelector('[data-state="open"] button')?.click();
                } : undefined}
              />
            </div>
          )}
          
          {/* Calendar Section */}
          <div className="flex-1 p-6">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from || new Date()}
              selected={value}
              onSelect={handleCalendarSelect}
              numberOfMonths={effectiveNumberOfMonths}
              locale={id}
              className="w-full"
              classNames={{
                months: "flex flex-col sm:flex-row gap-4 justify-center",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium",
                  "ring-offset-background transition-colors focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50 border border-input",
                  "bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: cn(
                  "text-center text-sm p-0 relative",
                  "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md",
                  "last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                ),
                day: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-normal",
                  "ring-offset-background transition-colors focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100",
                  "h-8 w-8 hover:bg-accent hover:text-accent-foreground"
                ),
                day_selected: "bg-orange-500 text-primary-foreground hover:bg-orange-600 hover:text-primary-foreground focus:bg-orange-500 focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              disabled={disabled || ((date) => date > maxDate || date < minDate)}
            />
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-gray-600 hover:text-gray-800"
              >
                Reset
              </Button>
              <DialogClose asChild>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Terapkan
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateRangePicker;