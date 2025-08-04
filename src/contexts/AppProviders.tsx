// contexts/AppProviders.tsx - Optimized Dependencies (9 → 6 dependencies)
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// ✅ CORE FOUNDATION (Layer 1) - Essential system contexts
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';

// ✅ BUSINESS CORE (Layer 2) - Essential business contexts
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { PaymentProvider } from './PaymentContext';

// ✅ CONSOLIDATED PROVIDERS (Layer 3) - Group related providers
import { BusinessDataProviders } from './BusinessDataProviders';

// ❌ REMOVED: Individual imports to reduce dependencies
// These are now handled by BusinessDataProviders:
// - ActivityProvider, BahanBakuProvider, SupplierProvider, RecipeProvider
// - AssetProvider, PurchaseProvider, OrderProvider, OperationalCostProvider
// - PromoProvider, FollowUpTemplateProvider

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * ✅ OPTIMIZED AppProviders - Reduced from 12 nested providers to 6
 * 
 * New Architecture:
 * Layer 1: Foundation (Auth, Notifications, Settings)
 * Layer 2: Financial & Payment
 * Layer 3: Business Data (Consolidated)
 * 
 * Dependencies reduced from 9 to 6 by consolidating related providers
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* Layer 1: Foundation - Core system services */}
      <AuthProvider>
        <NotificationProvider>
          <UserSettingsProvider>
            
            {/* Layer 2: Financial Core - Business financial logic */}
            <FinancialProvider>
              <PaymentProvider>
                
                {/* Layer 3: Business Data - All business entities consolidated */}
                <BusinessDataProviders>
                  {children}
                </BusinessDataProviders>
                
              </PaymentProvider>
            </FinancialProvider>
            
          </UserSettingsProvider>
        </NotificationProvider>
      </AuthProvider>
      
      {/* Global UI - Enhanced notifications */}
      <Toaster 
        position={isMobile ? 'top-center' : 'top-right'}
        closeButton
        offset={isMobile ? 24 : 16}
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
            title: 'text-gray-900 font-medium',
            description: 'text-gray-600',
            actionButton: 'bg-orange-500 text-white hover:bg-orange-600',
            cancelButton: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            closeButton: 'bg-gray-100 text-gray-400 hover:text-gray-600',
            success: 'border-green-200 bg-green-50',
            error: 'border-red-200 bg-red-50',
            warning: 'border-orange-200 bg-orange-50',
            info: 'border-blue-200 bg-blue-50',
          },
          duration: 4000,
        }}
      />
    </>
  );
};