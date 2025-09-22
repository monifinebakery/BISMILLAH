// pages/Dashboard.tsx - Updated to use new trends data

import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';
// 🔧 IMPROVED: Import centralized date normalization
import { normalizeDateForDatabase } from '@/utils/dateNormalization';
import { getDateRangePreset, safeParseDate, isValidDate } from '@/utils/unifiedDateUtils';

// 🚀 Lazy load heavy components
const StatsGrid = lazy(() => import('@/components/dashboard/StatsGrid'));
const QuickActions = lazy(() => import('@/components/dashboard/QuickActions'));
const BestSellingProducts = lazy(() => import('@/components/dashboard/BestSellingProducts'));
const CriticalStock = lazy(() => import('@/components/dashboard/CriticalStock'));
const RecentActivities = lazy(() => import('@/components/dashboard/RecentActivities'));
const WorstSellingProducts = lazy(() => import('@/components/dashboard/WorstSellingProducts'));

// ✅ Simple Loading Component
const SectionLoader = ({ className = "" }) => (
  <div className={`${className} flex items-center justify-center p-8`}>
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

// 🗓️ Helper function untuk inisialisasi date range dengan centralized normalization
const getDefaultDateRange = () => {
  try {
    const preset = getDateRangePreset('last30days');
    return {
      from: preset.from,
      to: preset.to
    };
  } catch (error) {
    logger.error('Dashboard - Error getting default date range:', error);
    // Fallback to safe date creation
    const today = safeParseDate(new Date());
    const thirtyDaysAgo = safeParseDate(new Date());
    if (today && thirtyDaysAgo) {
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return {
        from: thirtyDaysAgo,
        to: today
      };
    }
    // Ultimate fallback
     const fallbackFrom = safeParseDate('2025-01-01');
     const fallbackTo = safeParseDate('2025-12-31');
     return {
       from: normalizeDateForDatabase(fallbackFrom || new Date('2025-01-01')),
       to: normalizeDateForDatabase(fallbackTo || new Date('2025-12-31'))
     };
  }
};

// 👋 Helper function untuk greeting dengan ownerName - menggunakan safe date parsing
const getGreeting = (ownerName?: string) => {
  try {
    const now = safeParseDate(new Date());
    if (!now || !isValidDate(now)) {
      const name = ownerName && ownerName !== 'Nama Anda' ? `kak ${ownerName}` : 'kak';
      return `Selamat datang, ${name}! 👋`;
    }
    
    const hour = now.getHours();
    const name = ownerName && ownerName !== 'Nama Anda' ? `kak ${ownerName}` : 'kak';

    if (hour >= 4 && hour < 11) return `Selamat pagi, ${name}! 🌅`;
    if (hour >= 11 && hour < 15) return `Selamat siang, ${name}! ☀️`;
    if (hour >= 15 && hour < 19) return `Selamat sore, ${name}! 🌇`;
    return `Selamat malam, ${name}! 🌙`;
  } catch (error) {
    logger.error('Dashboard - Error getting greeting:', error);
    const name = ownerName && ownerName !== 'Nama Anda' ? `kak ${ownerName}` : 'kak';
    return `Selamat datang, ${name}! 👋`;
  }
};

const Dashboard = () => {
  // 🎛️ State Management
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [pagination, setPagination] = useState({
    products: 1,
    activities: 1,
    worstProducts: 1
  });
  // 👤 Get settings from context
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const { ownerName } = settings;
  const isMobile = useIsMobile();
  const isSettingsLoading = settingsLoading;

  // Debug logging for settings
  React.useEffect(() => {
    logger.debug('Dashboard - Settings loaded:', { 
      settings, 
      ownerName, 
      settingsLoading 
    });
  }, [settings, ownerName, settingsLoading]);

  // 🔄 Data Fetching with Trends
  const {
    stats,
    bestSellingProducts,
    worstSellingProducts,
    criticalStock,
    recentActivities,
    isLoading,
    error
  } = useDashboardData(dateRange);

  // 👋 Greeting message
  const greeting = useMemo(
    () => getGreeting(!isSettingsLoading ? ownerName : undefined),
    [isSettingsLoading, ownerName]
  );

  // 🛡️ Safe date range handler - menggunakan unified date utils
  const handleDateRangeChange = (newRange: { from: Date; to: Date }) => {
    if (!newRange || !newRange.from || !newRange.to) {
      logger.error('Dashboard - Invalid date range provided:', newRange);
      return;
    }

    const fromDate = safeParseDate(newRange.from);
    const toDate = safeParseDate(newRange.to);
    
    if (!fromDate || !toDate || !isValidDate(fromDate) || !isValidDate(toDate)) {
      logger.error('Dashboard - Invalid date format:', newRange);
      return;
    }

    // Keep as Date objects for useDashboardData
    setDateRange({
      from: fromDate,
      to: toDate
    });
  };

  // ⚠️ Error State
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-red-800 text-xl font-semibold mb-3">Terjadi Kesalahan</h2>
          <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Muat Ulang Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 🔄 Loading state - Wait for both dateRange and settings to load
  if (!dateRange || !dateRange.from || !dateRange.to) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memuat Dashboard</h2>
          <p className="text-gray-500">Sedang menyiapkan data untuk Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container-safe max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          
          {/* 🏠 Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <DashboardHeader 
                dateRange={dateRange}
                setDateRange={handleDateRangeChange}
                greeting={greeting}
                isMobile={isMobile}
              />
              
            </div>

            {/* 📊 Stats Grid with Trends */}
            <Suspense fallback={null}>
              <div className="mb-6">
                <StatsGrid 
                  stats={stats}
                  isLoading={isLoading}
                />
              </div>
            </Suspense>

            {/* ⚡ Quick Actions */}
            <Suspense fallback={null}>
              <QuickActions />
            </Suspense>
          </div>

          {/* 📈 Main Content Grid - iPad Optimized */}
          <div className="space-y-6 md:space-y-8">
            
            {/* First Row: Best Selling + Recent Activities - iPad Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2">
                <Suspense fallback={null}>
                  <BestSellingProducts
                    products={bestSellingProducts}
                    pagination={pagination.products}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, products: page }))}
                    isLoading={isLoading}
                  />
                </Suspense>
              </div>

              <div className="lg:col-span-1">
                <Suspense fallback={null}>
                  <RecentActivities
                    activities={recentActivities}
                    pagination={pagination.activities}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, activities: page }))}
                    isLoading={isLoading}
                  />
                </Suspense>
              </div>
            </div>

            {/* Second Row: Critical Stock + Worst Selling - iPad Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <Suspense fallback={null}>
                  <CriticalStock
                    items={criticalStock}
                    isLoading={isLoading}
                  />
                </Suspense>
              </div>

              <div>
                <Suspense fallback={null}>
                  <WorstSellingProducts
                    products={worstSellingProducts}
                    pagination={pagination.worstProducts}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, worstProducts: page }))}
                    isLoading={isLoading}
                  />
                </Suspense>
              </div>
            </div>
          </div>

          {/* 📱 Mobile Bottom Spacer */}
          <div className="h-8 sm:h-0" aria-hidden="true"></div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;