// src/components/layout/DesktopLayout.tsx - Desktop Layout
import React from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import PWAInstallButton, { PWAStatus } from "@/components/pwa/PWAInstallButton";
import { AppError } from "@/components/loaders";
import { useIPadSidebar } from "@/hooks/use-ipad-sidebar";
import { cn } from "@/lib/utils";

interface DesktopLayoutProps {
  isPaid: boolean;
  renderOrderLinkButton: (isMobile?: boolean) => React.ReactNode;
  renderAutoLinkIndicator: (isMobile?: boolean) => React.ReactNode;
  children: React.ReactNode;
}

// iPad Overlay Wrapper Component
const IPadOverlayWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isIPad, shouldUseOverlay } = useIPadSidebar();
  const { open, setOpen } = useSidebar();

  // Close sidebar when clicking backdrop on iPad
  const handleBackdropClick = () => {
    if (isIPad && open) {
      setOpen(false);
    }
  };

  if (!isIPad || !shouldUseOverlay) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Backdrop for iPad overlay mode */}
      {open && (
        <div 
          className="sidebar-overlay-backdrop" 
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );
};

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  isPaid,
  renderOrderLinkButton,
  renderAutoLinkIndicator,
  children
}) => {
  return (
    <SidebarProvider>
      <IPadOverlayWrapper>
        <div className="min-h-screen flex w-full bg-background">
          {/* ✅ Sidebar */}
          <AppSidebar />
          
          {/* ✅ Main Content Area */}
          <SidebarInset className={cn(
            "flex-1 w-full min-w-0 flex flex-col",
            // Prevent content shift on iPad
            "sidebar-content-no-shift"
          )}>
          {/* ✅ Desktop Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <PWAInstallButton className="" showNetworkStatus={false} />
              <PaymentStatusIndicator />
              <DateTimeDisplay />
              <NotificationBell />
              {renderAutoLinkIndicator(false)}
              {renderOrderLinkButton(false)}
            </div>
          </header>
          
          {/* ✅ Main Content */}
          <main className="flex-1 w-full min-w-0 overflow-auto p-2 sm:p-4 md:p-6">
            <ErrorBoundary fallback={<AppError />}>
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
        </div>
        
        {/* PWA Debug Status - Only in development */}
        <PWAStatus />
      </IPadOverlayWrapper>
    </SidebarProvider>
  );
};
