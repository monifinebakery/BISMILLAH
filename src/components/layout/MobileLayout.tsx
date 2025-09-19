// src/components/layout/MobileLayout.tsx - Simple Mobile Layout with Bottom Navigation
import React from 'react';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import NotificationBell from "@/components/NotificationBell";
import MobileExportButton from "@/components/MobileExportButton";
import { AppError } from "@/components/loaders";
import BottomTabBar from "@/components/BottomTabBar";
import { TrendingUp } from "lucide-react";

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* 📱 Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white px-4 w-full">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">HPP by Monifine</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isPaid && <PaymentStatusIndicator />}
          <NotificationBell />
          <MobileExportButton />
          {renderAutoLinkIndicator(true)}
          {renderOrderLinkButton(true)}
        </div>
      </header>

      {/* 📱 Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <ErrorBoundary fallback={<AppError />}>
          {children}
        </ErrorBoundary>
      </main>

      {/* 📱 Bottom Navigation */}
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
