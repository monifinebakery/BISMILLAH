// ProfitHeader.tsx - Header component for profit analysis page
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProfitHeaderProps {
  period: string;
  mode: 'monthly' | 'daily';
  setMode: (mode: 'monthly' | 'daily') => void;
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
  onRefresh: () => void;
  businessMetrics: any;
}

// Responsive Date Picker Component
const ResponsiveDatePicker: React.FC<{
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
}> = ({ dateRange, setDateRange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Pilih tanggal';
    if (!range.to) return formatDate(range.from, 'd MMM yyyy', { locale: id });
    return `${formatDate(range.from, 'd MMM', { locale: id })} - ${formatDate(range.to, 'd MMM yyyy', { locale: id })}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange?.from && "text-muted-foreground",
            "bg-white border border-gray-300 hover:bg-gray-50"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{formatDateRange(dateRange)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Pilih Periode</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(undefined)}
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              const today = new Date();
              setDateRange({
                from: subDays(today, 6),
                to: today,
              });
              setIsOpen(false);
            }}
          >
            7 Hari Terakhir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              const today = new Date();
              setDateRange({
                from: subDays(today, 29),
                to: today,
              });
              setIsOpen(false);
            }}
          >
            30 Hari Terakhir
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ProfitHeader: React.FC<ProfitHeaderProps> = ({ 
  period, 
  mode, 
  setMode, 
  dateRange, 
  setDateRange, 
  onRefresh, 
  businessMetrics 
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Analisis Profit
              </h1>
              <p className="text-white text-opacity-90">
                Pantau kesehatan bisnis kamu dengan mudah
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-3" />
        </div>

        <div className="flex md:hidden flex-col gap-3 mt-6" />

        {(businessMetrics || period) && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-white opacity-75 text-xs uppercase tracking-wide">Periode</span>
                <span className="font-bold text-lg">
                  {period}
                </span>
              </div>

              {businessMetrics && (
                <>
                  <div className="flex flex-col">
                    <span className="text-white opacity-75 text-xs uppercase tracking-wide">Omset</span>
                    <span className="font-bold text-lg">
                      {businessMetrics.revenue ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        notation: 'compact'
                      }).format(businessMetrics.revenue) : 'Rp0'}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-white opacity-75 text-xs uppercase tracking-wide">Untung Bersih</span>
                    <span className={`font-bold text-lg ${businessMetrics.netProfit > 0 ? 'text-green-200' : 'text-red-200'}`}>
                      {businessMetrics.netProfit ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        notation: 'compact'
                      }).format(businessMetrics.netProfit) : 'Rp0'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Date Range Controls */}
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={mode === 'monthly' ? 'default' : 'outline'}
                size="sm"
                className={mode === 'monthly' ? 'bg-white text-orange-600 hover:bg-gray-100' : 'bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30'}
                onClick={() => setMode('monthly')}
              >
                Bulanan
              </Button>
              <Button
                variant={mode === 'daily' ? 'default' : 'outline'}
                size="sm"
                className={mode === 'daily' ? 'bg-white text-orange-600 hover:bg-gray-100' : 'bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30'}
                onClick={() => setMode('daily')}
              >
                Custom
              </Button>
            </div>

            {mode === 'daily' && (
              <div className="w-full sm:w-auto">
                <ResponsiveDatePicker 
                  dateRange={dateRange} 
                  setDateRange={setDateRange} 
                />
              </div>
            )}

            <div className="sm:ml-auto" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfitHeader;
