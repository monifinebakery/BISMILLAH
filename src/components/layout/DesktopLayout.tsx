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
  const handleBackdropClick = React.useCallback(() => {
    if (isIPad && open) {
      setOpen(false);
    }
  }, [isIPad, open, setOpen]);

  // Close sidebar on Escape key for iPad
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isIPad && open) {
        setOpen(false);
      }
    };

    if (isIPad && open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isIPad, open, setOpen]);

  // Debug log
  React.useEffect(() => {
    if (isIPad && shouldUseOverlay) {
      console.log('🔄 iPad overlay mode active, sidebar open:', open);
    }
  }, [isIPad, shouldUseOverlay, open]);

  return <>{children}</>;
};

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  isPaid,
  renderOrderLinkButton,
  renderAutoLinkIndicator,
  children
}) => {
  const { shouldDefaultCollapse } = useIPadSidebar();
  
  return (
    <SidebarProvider defaultOpen={!shouldDefaultCollapse}>
      <IPadOverlayWrapper>
        <div className="min-h-screen flex w-full bg-white">
          {/* ✅ Sidebar */}
          <AppSidebar />
          
          {/* ✅ Main Content Area */}
          <SidebarInset className={cn(
            "flex-1 w-full min-w-0 flex flex-col",
            // Prevent content shift on iPad
            "sidebar-content-no-shift"
          )}>
          {/* ✅ Desktop Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white/95 backdrop-blur px-4 sm:px-6 w-full">
            <SidebarTrigger className="-ml-1 flex-shrink-0 !relative !static !z-auto" />
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
