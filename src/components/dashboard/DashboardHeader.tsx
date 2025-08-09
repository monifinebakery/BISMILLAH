// components/dashboard/DashboardHeader.tsx - Enhanced Beautiful Design

import React, { lazy, Suspense } from 'react';
import { formatDateRange, parseDate } from '@/utils/unifiedDateUtils';
import { Calendar, BarChart3, TrendingUp, Clock } from 'lucide-react';

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

  // 🕐 Get current time for enhanced greeting
  const currentTime = React.useMemo(() => {
    return new Date().toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // 📊 Calculate period duration
  const periodDuration = React.useMemo(() => {
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [dateRange]);

  return (
    <div className="relative">
      {/* 🎨 Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 rounded-2xl"></div>
      
      {/* 🌟 Content Container */}
      <div className="relative bg-white/80 backdrop-blur-sm border-2 border-orange-100 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        
        {/* ✨ Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100 to-transparent rounded-2xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-100 to-transparent rounded-2xl opacity-30"></div>
        
        {/* 📋 Header Content */}
        <div className="relative z-10">
          
          {/* 🏠 Main Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            
            {/* 👋 Title & Greeting Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-lg text-gray-700 font-medium">
                  {greeting}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{currentTime}</span>
                </div>
              </div>
            </div>
            
            {/* 📅 Date Range Picker Section */}
            <div className="w-full lg:w-auto">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Pilih Periode Analisis
                </label>
                
                <Suspense 
                  fallback={
                    <div className="w-full lg:w-[320px] h-12 bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse rounded-xl border-2 border-gray-200 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                        <span className="text-gray-500 text-sm">Memuat kalender...</span>
                      </div>
                    </div>
                  }
                >
                  <div className="relative">
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      isMobile={isMobile}
                    />
                    {/* ✨ Subtle glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-200 to-red-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  </div>
                </Suspense>
              </div>
            </div>
          </div>
          
          {/* 📊 Period Info & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 📅 Current Period */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Periode Aktif
                  </p>
                  <p className="text-sm font-semibold text-blue-900">
                    {displayRange}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 📈 Duration */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                    Durasi Analisis
                  </p>
                  <p className="text-sm font-semibold text-green-900">
                    {periodDuration} hari
                  </p>
                </div>
              </div>
            </div>
            
            {/* 🎯 Quick Status */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                    Status Data
                  </p>
                  <p className="text-sm font-semibold text-purple-900">
                    Siap Dianalisis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 🌊 Animated Border */}
        <div className="absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-200 via-red-200 to-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;