// src/components/layout/MobileLayout.tsx - Mobile Layout with Sidebar on Mobile
import React from 'react';
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import NotificationBell from "@/components/NotificationBell";
import MobileExportButton from "@/components/MobileExportButton";
import { AppError } from "@/components/loaders";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-svh flex w-full bg-white">
        {/* 📱 Sidebar as sheet on mobile */}
        <AppSidebar />

        {/* 📱 Main content inset */}
        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
          {/* 📱 Mobile Header with sidebar trigger and actions */}
          <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-2">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="flex items-center space-x-2">
              {isPaid && <PaymentStatusIndicator />}
              <NotificationBell />
              <MobileExportButton />
              {renderAutoLinkIndicator(true)}
              {renderOrderLinkButton(true)}
            </div>
          </header>

          {/* 📱 Main Content - proper scrolling */}
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 pb-4">
            <ErrorBoundary fallback={<AppError />}>
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>

      {/* 📱 Floating Payment Indicator */}
      {!isPaid && (
        <div className="fixed bottom-4 right-4 z-50">
          <PaymentStatusIndicator size="lg" />
        </div>
      )}
    </SidebarProvider>
  );
};
