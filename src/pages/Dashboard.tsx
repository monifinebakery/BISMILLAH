// pages/Dashboard.tsx
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';

// 🚀 Lazy load heavy components
const StatsGrid = lazy(() => import('@/components/dashboard/StatsGrid'));
const QuickActions = lazy(() => import('@/components/dashboard/QuickActions'));
const BestSellingProducts = lazy(() => import('@/components/dashboard/BestSellingProducts'));
const CriticalStock = lazy(() => import('@/components/dashboard/CriticalStock'));
const RecentActivities = lazy(() => import('@/components/dashboard/RecentActivities'));
const WorstSellingProducts = lazy(() => import('@/components/dashboard/WorstSellingProducts'));

// 📦 Loading Component
const SectionLoader = ({ height = "h-32" }) => (
  <div className={`${height} bg-white rounded-lg shadow-md animate-pulse flex items-center justify-center`}>
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="text-gray-500">Memuat...</span>
    </div>
  </div>
);

// 🗓️ Helper function untuk inisialisasi date range
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  return {
    from: thirtyDaysAgo.toISOString().split('T')[0], // Format: YYYY-MM-DD
    to: today.toISOString().split('T')[0]
  };
};

// 👋 Helper function untuk greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat pagi! 🌅';
  if (hour < 17) return 'Selamat siang! ☀️';
  if (hour < 21) return 'Selamat sore! 🌇';
  return 'Selamat malam! 🌙';
};

const Dashboard = () => {
  // 🎛️ State Management - Fixed initialization
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  
  const [pagination, setPagination] = useState({
    products: 1,
    activities: 1
  });

  const isMobile = useIsMobile();

  // 🔄 Data Fetching dengan Custom Hook
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
  const greeting = useMemo(() => getGreeting(), []);

  // 📊 Dashboard Header Props
  const headerProps = useMemo(() => ({
    dateRange,
    setDateRange,
    greeting,
    isMobile
  }), [dateRange, greeting, isMobile]);

  // 📊 Computed values yang ringan
  const dashboardProps = useMemo(() => ({
    dateRange,
    setDateRange,
    pagination,
    setPagination,
    isMobile,
    ...stats
  }), [dateRange, pagination, isMobile, stats]);

  // 🛡️ Safe date range handler
  const handleDateRangeChange = (newRange: { from: string; to: string }) => {
    // Validate that both dates exist and are valid
    if (!newRange || !newRange.from || !newRange.to) {
      console.error('Invalid date range provided:', newRange);
      return;
    }

    // Validate date format (basic check)
    const fromDate = new Date(newRange.from);
    const toDate = new Date(newRange.to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      console.error('Invalid date format:', newRange);
      return;
    }

    console.log('Setting new date range:', newRange);
    setDateRange(newRange);
  };

  // ⚠️ Error State
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Terjadi Kesalahan</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  // 🔄 Loading state untuk initial load
  if (!dateRange || !dateRange.from || !dateRange.to) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        {/* 🏠 Header - Always loaded with all required props */}
        <DashboardHeader 
          dateRange={dateRange}
          setDateRange={handleDateRangeChange}
          greeting={greeting}
          isMobile={isMobile}
        />

        {/* 📊 Stats Grid - High priority, suspend dengan timeout singkat */}
        <Suspense fallback={<SectionLoader height="h-24" />}>
          <StatsGrid 
            stats={stats}
            isLoading={isLoading}
          />
        </Suspense>

        {/* ⚡ Quick Actions - Medium priority */}
        <Suspense fallback={<SectionLoader height="h-20" />}>
          <QuickActions />
        </Suspense>

        {/* 📈 Main Content Grid - Lower priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Suspense fallback={<SectionLoader height="h-64" />}>
              <BestSellingProducts
                products={bestSellingProducts}
                pagination={pagination.products}
                onPageChange={(page) => setPagination(prev => ({ ...prev, products: page }))}
                isLoading={isLoading}
              />
            </Suspense>

            <Suspense fallback={<SectionLoader height="h-48" />}>
              <CriticalStock
                items={criticalStock}
                isLoading={isLoading}
              />
            </Suspense>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Suspense fallback={<SectionLoader height="h-64" />}>
              <RecentActivities
                activities={recentActivities}
                pagination={pagination.activities}
                onPageChange={(page) => setPagination(prev => ({ ...prev, activities: page }))}
                isLoading={isLoading}
              />
            </Suspense>

            <Suspense fallback={<SectionLoader height="h-48" />}>
              <WorstSellingProducts
                products={worstSellingProducts}
                isLoading={isLoading}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;