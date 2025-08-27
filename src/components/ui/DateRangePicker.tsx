import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { id } from "date-fns/locale";

import {
  safeParseDate,
  isValidDate,
  formatDateForDisplay,
} from "@/utils/unifiedDateUtils";

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
  { label: "Hari Ini", key: "today" },
  { label: "7 Hari", key: "week" },
  { label: "30 Hari", key: "month" },
  { label: "Bulan Ini", key: "thisMonth" },
];

const getPreset = (key: string): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: today };
    }
    case "month": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: today };
    }
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: today };
    }
    default:
      return { from: today, to: today };
  }
};

const formatRange = (range?: DateRange) => {
  if (!range?.from) return "";
  const from = formatDateForDisplay(range.from);
  const to = formatDateForDisplay(range.to);
  return from === to ? from : `${from} - ${to}`;
};

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false
  );
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange = () => {},
  onPageChange,
  placeholder = "Pilih rentang tanggal",
  className = "",
  disabled = false,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDesktop = useIsDesktop();

  const handleCalendarChange = React.useCallback(
    (newRange: any) => {
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
    },
    [onDateRangeChange, onPageChange]
  );

  const handlePreset = React.useCallback(
    (key: string) => {
      const preset = getPreset(key);
      onDateRangeChange?.(preset);
      onPageChange?.(1);
      setIsOpen(false);
    },
    [onDateRangeChange, onPageChange]
  );

  const handleReset = React.useCallback(() => {
    onDateRangeChange?.(undefined);
    onPageChange?.(1);
  }, [onDateRangeChange, onPageChange]);

  const calendarRange = React.useMemo(() => {
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
    ),
  };

  const content = (
    <>
      <CalendarIcon className="mr-2 sm:mr-3 h-4 w-4 flex-shrink-0" />
      <span className="truncate">{displayText}</span>
    </>
  );

  const PresetButtons = () => (
    <div className="p-3 md:p-4 border-b border-gray-200">
      <h4 className="font-medium text-sm mb-2 md:mb-3 text-gray-700">
        Pilih Cepat
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 lg:gap-2">
        {PRESETS.map(({ label, key }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => handlePreset(key)}
            className="w-full justify-start text-xs lg:text-sm h-7 lg:h-8 px-2 lg:px-3 hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
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
        {/* gunakan dialog center pattern baru kalau sudah ada */}
        <DialogContent centerMode="overlay" className="dialog-overlay-center">
          <div className="dialog-panel">
            <DialogHeader className="dialog-header-pad">
              <DialogTitle>Pilih Rentang Tanggal</DialogTitle>
              <DialogDescription>
                Pilih rentang tanggal untuk memfilter data.
              </DialogDescription>
            </DialogHeader>

            <div className="dialog-body">
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
                  <Button onClick={() => setIsOpen(false)}>Terapkan</Button>
                </div>
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

      {/* ⬇️ Popover lebar fix: cukup buat sidebar + 2 kalender */}
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        avoidCollisions
        collisionPadding={16}
        className="p-0 w-[min(92vw,720px)] min-w-[360px] max-h-[90vh] overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row bg-white border rounded-lg shadow-lg overflow-hidden w-full">
          {/* Sidebar preset */}
          <div className="w-full lg:w-40 flex-shrink-0 bg-gray-50 border-b lg:border-b-0 lg:border-r">
            <PresetButtons />
          </div>

          {/* Kalender + aksi */}
          <div className="p-3 md:p-4 bg-white overflow-hidden flex-1">
            <div className="max-w-full overflow-x-auto">
              <Calendar
                mode="range"
                selected={calendarRange}
                onSelect={handleCalendarChange}
                numberOfMonths={isDesktop ? 2 : 1}
                locale={id}
                className="mx-auto"
              />
            </div>

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
