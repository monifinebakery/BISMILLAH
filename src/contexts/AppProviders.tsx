// Removed external skeleton imports to keep bundle lean


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
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';
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
  // Define providers to compose immediately (no staged loading, no overlays)
  const criticalProviders = [
    { component: NotificationProvider, name: 'Notification', priority: 'critical' as const },
    { component: UserSettingsProvider, name: 'UserSettings', priority: 'critical' as const },
    { component: FinancialProvider, name: 'Financial', priority: 'critical' as const },
  ];

  const highProviders = [
    { component: ActivityProvider, name: 'Activity', priority: 'high' as const },
    { component: RecipeProvider, name: 'Recipe', priority: 'high' as const },
    { component: WarehouseProvider, name: 'Warehouse', priority: 'high' as const },
    { component: SupplierProvider, name: 'Supplier', priority: 'high' as const },
    { component: PurchaseProvider, name: 'Purchase', priority: 'high' as const },
  ];

  const mediumProviders = [
    { component: OrderProvider, name: 'Order', priority: 'medium' as const },
  ];

  const lowProviders = [
    { component: OperationalCostProvider, name: 'OperationalCost', priority: 'low' as const },
    { component: PromoProvider, name: 'Promo', priority: 'low' as const },
    { component: FollowUpTemplateProvider, name: 'FollowUpTemplate', priority: 'low' as const },
    { component: DeviceProvider, name: 'Device', priority: 'low' as const },
    { component: ProfitAnalysisProvider, name: 'ProfitAnalysis', priority: 'low' as const },
  ];

  const renderProviders = (providers: any[], content: ReactNode): ReactNode => {
    logger.debug('AppProviders: Rendering providers:', {
      providerNames: providers.map(p => p.name),
    });
    return providers.reduceRight((acc, p) => {
      const ProviderComponent = p.component;
      logger.debug(`AppProviders: Wrapping content with ${p.name}Provider`);
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
        {renderProviders(
          criticalProviders,
          renderProviders(
            highProviders,
            renderProviders(
              mediumProviders,
              renderProviders(lowProviders, children)
            )
          )
        )}
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
