// src/components/layout/MobileLayout.tsx - Mobile Layout
import React from 'react';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import MobileExportButton from "@/components/MobileExportButton";
import { AppError } from "@/components/loaders";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";

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
    <div className="h-[100svh] flex flex-col bg-white overflow-hidden">
      {/* 📱 Mobile Header */}
      <header className="flex-none h-12 flex items-center gap-4 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 z-40">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-primary">HPP App</h1>
        </div>
        <div className="flex items-center space-x-2">
          {/* PWA Install Button (hide on iOS; tutorial is in Settings) */}
          {(() => {
            if (typeof navigator === 'undefined') return null;
            const ua = navigator.userAgent || '';
            const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
            return !isIOS ? <PWAInstallButton showNetworkStatus={false} /> : null;
          })()}
          {isPaid && <PaymentStatusIndicator />}
          <NotificationBell />
          <MobileExportButton />
          {renderAutoLinkIndicator(true)}
          {renderOrderLinkButton(true)}
        </div>
      </header>

      {/* 📱 Main Content - Constrained height with proper scrolling */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 pb-20">
        <ErrorBoundary fallback={<AppError />}>
          {children}
        </ErrorBoundary>
      </main>

      {/* 📱 Bottom Navigation - Fixed at bottom */}
      <BottomTabBar />

      {/* 📱 Floating Payment Indicator */}
      {!isPaid && (
        <div className="fixed bottom-20 right-4 z-50">
          <PaymentStatusIndicator size="lg" />
        </div>
      )}
    </div>
  );
};
