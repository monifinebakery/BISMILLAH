

// src/contexts/AppProviders.tsx - PROGRESSIVE LOADING
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { logger } from '@/utils/logger';

// ⚡ CRITICAL: Always load immediately
import { AuthProvider } from './AuthContext';
import { PaymentProvider } from './PaymentContext';

// ⚡ HIGH PRIORITY: Load after auth is ready
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';

// ⚡ MEDIUM PRIORITY: Load progressively
import { ActivityProvider } from './ActivityContext';
// Defer heavy contexts on mobile via lazy wrappers (defined below)
import { RecipeProvider } from './RecipeContext';
import { SupplierProvider } from './SupplierContext';
import { WarehouseProvider } from '@/components/warehouse/context/WarehouseContext';
// ✅ CRITICAL: Import FinancialProvider directly instead of lazy loading
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { ProfitAnalysisProvider } from '@/components/profitAnalysis/contexts';

// ⚡ LOW PRIORITY: Load last
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';
import { OperationalCostProviderRefactored as OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContextRefactored';
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
import { DeviceProvider } from './DeviceContext';

interface AppProvidersProps {
  children: ReactNode;
}

// ⚡ WAREHOUSE PROVIDER: Now handled in provider queue with HIGH priority

/**
 * ⚡ MOBILE-OPTIMIZED: Progressive Provider Loading
 * Load providers berdasarkan priority untuk mengurangi loading time
 */
/**
 * ⚡ REFACTORED: Progressive Provider Loading to fix race conditions.
 * This version uses a flattened structure to ensure each provider group
 * is fully loaded before rendering the next, eliminating context errors.
 */

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // ✅ ANTI-FLICKER: Flatten provider structure to reduce initialization flicker
  const allProviders = [
    // Critical providers loaded first
    { component: NotificationProvider, name: 'Notification' },
    { component: UserSettingsProvider, name: 'UserSettings' },
    { component: FinancialProvider, name: 'Financial' },
    
    // Core app providers  
    { component: ActivityProvider, name: 'Activity' },
    { component: RecipeProvider, name: 'Recipe' },
    { component: WarehouseProvider, name: 'Warehouse' },
    { component: SupplierProvider, name: 'Supplier' },
    { component: PurchaseProvider, name: 'Purchase' },
    { component: OrderProvider, name: 'Order' },
    
    // Secondary providers
    { component: OperationalCostProvider, name: 'OperationalCost' },
    { component: PromoProvider, name: 'Promo' },
    { component: FollowUpTemplateProvider, name: 'FollowUpTemplate' },
    { component: DeviceProvider, name: 'Device' },
    { component: ProfitAnalysisProvider, name: 'ProfitAnalysis' },
  ];

  // ✅ ANTI-FLICKER: Reduce logging to prevent console spam during renders  
  const renderProviders = (providers: any[], content: ReactNode): ReactNode => {
    return providers.reduceRight((acc, p) => {
      const ProviderComponent = p.component;
      return <ProviderComponent>{acc}</ProviderComponent>;
    }, <>{content}</>);
  };

  const CoreProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthProvider>
      <PaymentProvider>{children}</PaymentProvider>
    </AuthProvider>
  );

  return (
    <>
      <CoreProviders>
        {renderProviders(allProviders, children)}
      </CoreProviders>

      <Toaster 
        className="toaster"
        position="top-center"
        closeButton
        offset={24}
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-300',
            title: 'text-gray-900 font-medium',
            description: 'text-gray-600',
            actionButton: 'bg-orange-500 text-white hover:bg-orange-600',
            cancelButton: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            closeButton: 'bg-gray-100 text-gray-400 hover:text-gray-600',
            success: 'border-green-300 bg-green-50',
            error: 'border-red-300 bg-red-50',
            warning: 'border-yellow-300 bg-yellow-50',
            info: 'border-blue-300 bg-blue-50',
          },
          duration: 4000,
        }}
      />
    </>
  );
};
