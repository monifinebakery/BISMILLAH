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
      <div className="min-h-screen min-h-[100dvh] flex w-full bg-background overflow-x-hidden">
        {/* ✅ Sidebar - Hidden on mobile */}
        <AppSidebar />
        
        {/* ✅ Main Content Area - Responsive */}
        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col md:ml-0">
          {/* ✅ Desktop Header - Responsive */}
          <header className="sticky top-0 z-40 flex h-12 md:h-14 items-center gap-2 md:gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6 w-full safe-area-top">
            <SidebarTrigger className="-ml-1 hidden md:flex" />
            
            {/* Mobile header content */}
            <div className="flex-1 md:hidden">
              <h1 className="text-lg font-bold text-primary truncate">HPP App</h1>
            </div>
            
            {/* Desktop spacer */}
            <div className="flex-1 hidden md:block" />
            
            {/* Header actions - responsive */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <PaymentStatusIndicator className="hidden sm:flex" />
              <DateTimeDisplay className="hidden lg:flex" />
              <NotificationBell />
              {renderAutoLinkIndicator(false)}
              {renderOrderLinkButton(false)}
            </div>
          </header>
          
          {/* ✅ Main Content - Responsive padding */}
          <main className="flex-1 w-full min-w-0 overflow-auto p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
            <ErrorBoundary fallback={() => <AppError />}>
              <div className="container-responsive max-w-full">
                {children}
              </div>
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};