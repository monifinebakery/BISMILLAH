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
    <div className="min-h-screen flex flex-col bg-background">
      {/* ✅ Mobile Header */}
      <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-primary">HPP App</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isPaid && <PaymentStatusIndicator />}
          <NotificationBell />
          <MobileExportButton />
          {renderAutoLinkIndicator(true)}
          {renderOrderLinkButton(true)}
        </div>
      </header>

      {/* ✅ Main Content */}
      <main className="flex-1 overflow-auto pb-16 p-2 sm:p-4">
        <ErrorBoundary fallback={() => <AppError />}>
          {children}
        </ErrorBoundary>
      </main>

      {/* ✅ Bottom Navigation */}
      <BottomTabBar />

      {/* ✅ Floating Payment Indicator */}
      {!isPaid && (
        <div className="fixed bottom-20 right-4 z-50">
          <PaymentStatusIndicator size="lg" />
        </div>
      )}
    </div>
  );
};