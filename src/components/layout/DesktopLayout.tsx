// src/components/layout/DesktopLayout.tsx - Desktop Layout
import React from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import { AppError } from "@/components/loaders";

interface DesktopLayoutProps {
  isPaid: boolean;
  renderOrderLinkButton: (isMobile?: boolean) => React.ReactNode;
  renderAutoLinkIndicator: (isMobile?: boolean) => React.ReactNode;
  children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  isPaid,
  renderOrderLinkButton,
  renderAutoLinkIndicator,
  children
}) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* ✅ Sidebar */}
        <AppSidebar />
        
        {/* ✅ Main Content Area */}
        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
          {/* ✅ Desktop Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <PaymentStatusIndicator />
              <DateTimeDisplay />
              <NotificationBell />
              {renderAutoLinkIndicator(false)}
              {renderOrderLinkButton(false)}
            </div>
          </header>
          
          {/* ✅ Main Content */}
          <main className="flex-1 w-full min-w-0 overflow-auto p-2 sm:p-4 md:p-6">
            <ErrorBoundary fallback={() => <AppError />}>
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};