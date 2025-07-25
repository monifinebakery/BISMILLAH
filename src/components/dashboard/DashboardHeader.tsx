// components/dashboard/DashboardHeader.tsx
import React, { lazy, Suspense } from 'react';
import { formatDateRange, parseDate } from '@/utils/unifiedDateUtils';

// 🚀 Lazy load DateRangePicker (heavy component)
const DateRangePicker = lazy(() => import('@/components/ui/DateRangePicker'));

interface Props {
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  greeting: string;
  isMobile: boolean;
}

const DashboardHeader: React.FC<Props> = ({ 
  dateRange, 
  setDateRange, 
  greeting, 
  isMobile 
}) => {
  // 📅 Convert ISO strings to Date objects for display
  const displayRange = React.useMemo(() => {
    const from = parseDate(dateRange.from);
    const to = parseDate(dateRange.to);
    return formatDateRange(from, to);
  }, [dateRange]);

  return (
    <div className="flex flex-col space-y-4 mb-6">
      {/* 🏠 Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-md text-gray-600 mt-1">
            {greeting}
          </p>
        </div>
        
        {/* 📅 Date Range Picker with Suspense */}
        <div className="w-full sm:w-auto">
          <Suspense 
            fallback={
              <div className="w-full sm:w-[320px] h-10 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Memuat kalender...</span>
              </div>
            }
          >
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isMobile={isMobile}
            />
          </Suspense>
        </div>
      </div>
      
      {/* 📊 Period Info */}
      <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
        <span className="font-medium">Periode yang dipilih:</span> {displayRange}
      </div>
    </div>
  );
};

export default DashboardHeader;