// src/components/layout/MobileLayout.tsx - Mobile Layout
import React from 'react';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import MobileExportButton from "@/components/MobileExportButton";
import { AppError } from "@/components/loaders";

interface MobileLayoutProps {
  isPaid: boolean;
  renderOrderLinkButton: (isMobile?: boolean) => React.ReactNode;
  renderAutoLinkIndicator: (isMobile?: boolean) => React.ReactNode;
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  isPaid,
  renderOrderLinkButton,
  renderAutoLinkIndicator,
  children
}) => {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background overflow-x-hidden md:hidden">
      {/* ✅ Mobile Header - Safe area aware */}
      <header className="sticky top-0 z-40 flex h-12 xs:h-14 items-center gap-2 xs:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 xs:px-4 safe-area-top">
        <div className="flex-1 min-w-0">
          <h1 className="text-base xs:text-lg font-bold text-primary truncate">HPP App</h1>
        </div>
        <div className="flex items-center space-x-1 xs:space-x-2 flex-shrink-0">
          {isPaid && <PaymentStatusIndicator className="hidden xs:flex" />}
          <NotificationBell />
          <MobileExportButton className="hidden xs:flex" />
          {renderAutoLinkIndicator(true)}
          {renderOrderLinkButton(true)}
        </div>
      </header>

      {/* ✅ Main Content - Mobile optimized */}
      <main className="flex-1 overflow-auto pb-16 xs:pb-18 safe-area-bottom">
        <ErrorBoundary fallback={() => <AppError />}>
          <div className="container-responsive px-3 xs:px-4 py-4 xs:py-6 max-w-full">
            {children}
          </div>
        </ErrorBoundary>
      </main>

      {/* ✅ Bottom Navigation */}
      <BottomTabBar />

      {/* ✅ Floating Payment Indicator - Responsive positioning */}
      {!isPaid && (
        <div className="fixed bottom-16 xs:bottom-20 right-3 xs:right-4 z-40">
          <PaymentStatusIndicator size="lg" className="shadow-lg" />
        </div>
      )}
    </div>
  );
};