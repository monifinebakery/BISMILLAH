// components/dashboard/DashboardHeader.tsx - Simplified Clean Version

import React from 'react';
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { formatDateRange, parseDate, safeParseDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { Calendar, BarChart3, Clock } from 'lucide-react';
import DateRangePicker from '@/components/ui/DateRangePicker';

interface Props {
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  greeting: string;
  isMobile: boolean;
}

const DashboardHeader: React.FC<Props> = ({ 
  dateRange, 
  setDateRange, 
  greeting, 
  isMobile 
}) => {
  // 🕐 Get current time and date for mobile
  const currentDateTime = React.useMemo(() => {
    const result = UnifiedDateHandler.parseDate(new Date());
    const now = result.isValid && result.date ? result.date : new Date();
    const time = now.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const date = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return { time, date };
  }, []);

  return (
    <div className="w-full">
      {/* 🌟 Content Container - Simplified */}
      <div className="w-full bg-gradient-to-br from-blue-50 via-white to-slate-50 border-[1.5px] border-blue-200 dark:border-blue-700 rounded-2xl p-6 sm:p-8 mb-8">
        
        {/* 🏠 Main Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* 👋 Title & Greeting Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-slate-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                Dashboard
              </h1>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-lg text-gray-700 font-medium">
                {greeting}
              </p>
              {/* 📅🕐 Date & Time - Mobile Only */}
              <div className="flex flex-col gap-1 sm:hidden">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{currentDateTime.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{currentDateTime.time}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 📅 Date Range Picker Section */}
          <div className="w-full lg:w-auto">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Pilih Periode Analisis
              </label>
              
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={(range) => {
                  if (range && range.from && range.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;