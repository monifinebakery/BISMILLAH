// Lazy Context Provider for better performance
// Loads context providers only when needed

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback component
const ContextLoader = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-sm text-muted-foreground">
        {message || 'Memuat aplikasi...'}
      </p>
    </div>
  </div>
);

// Lazy load context providers
const AuthContextProvider = lazy(() => 
  import('./AuthContext').then(module => ({
    default: ({ children }: { children: React.ReactNode }) => {
      const { AuthProvider } = module;
      return <AuthProvider>{children}</AuthProvider>;
    }
  }))
);

const NotificationContextProvider = lazy(() =>
  import('./SimpleNotificationContext').then(module => ({
    default: ({ children }: { children: React.ReactNode }) => {
      const { SimpleNotificationProvider } = module;
      return <SimpleNotificationProvider>{children}</SimpleNotificationProvider>;
    }
  }))
);

const PaymentContextProvider = lazy(() =>
  import('./PaymentContext').then(module => ({
    default: ({ children }: { children: React.ReactNode }) => {
      const { PaymentProvider } = module;
      return <PaymentProvider>{children}</PaymentProvider>;
    }
  }))
);

const UserSettingsContextProvider = lazy(() =>
  import('./UserSettingsContext').then(module => ({
    default: ({ children }: { children: React.ReactNode }) => {
      const { UserSettingsProvider } = module;
      return <UserSettingsProvider>{children}</UserSettingsProvider>;
    }
  }))
);

const DeviceContextProvider = lazy(() =>
  import('./DeviceContext').then(module => ({
    default: ({ children }: { children: React.ReactNode }) => {
      const { DeviceProvider } = module;
      return <DeviceProvider>{children}</DeviceProvider>;
    }
  }))
);

// Core contexts that should load immediately
interface CoreContextProvidersProps {
  children: React.ReactNode;
}

export const CoreContextProviders: React.FC<CoreContextProvidersProps> = ({ children }) => {
  return (
    <Suspense fallback={<ContextLoader message="Memuat konteks utama..." />}>
      <AuthContextProvider>
        <NotificationContextProvider>
          <PaymentContextProvider>
            {children}
          </PaymentContextProvider>
        </NotificationContextProvider>
      </AuthContextProvider>
    </Suspense>
  );
};

// Optional contexts that can load later
interface OptionalContextProvidersProps {
  children: React.ReactNode;
}

export const OptionalContextProviders: React.FC<OptionalContextProvidersProps> = ({ children }) => {
  return (
    <Suspense fallback={children}>
      <UserSettingsContextProvider>
        <DeviceContextProvider>
          {children}
        </DeviceContextProvider>
      </UserSettingsContextProvider>
    </Suspense>
  );
};

// Complete context provider wrapper
interface LazyContextProviderProps {
  children: React.ReactNode;
  includeOptional?: boolean;
}

export const LazyContextProvider: React.FC<LazyContextProviderProps> = ({ 
  children, 
  includeOptional = true 
}) => {
  const content = includeOptional ? (
    <OptionalContextProviders>
      {children}
    </OptionalContextProviders>
  ) : children;

  return (
    <CoreContextProviders>
      {content}
    </CoreContextProviders>
  );
};

// Hook to preload contexts
export const usePreloadContexts = (contexts: string[] = []) => {
  React.useEffect(() => {
    const preloadPromises = contexts.map(context => {
      switch (context) {
        case 'auth':
          return import('./AuthContext');
        case 'notification':
          return import('./NotificationContext');
        case 'payment':
          return import('./PaymentContext');
        case 'settings':
          return import('./UserSettingsContext');
        case 'device':
          return import('./DeviceContext');
        case 'supplier':
          return import('./SupplierContext');
        case 'activity':
          return import('./ActivityContext');
        case 'template':
          return import('./FollowUpTemplateContext');
        default:
          return Promise.resolve();
      }
    });

    Promise.all(preloadPromises).catch(error => {
      console.warn('Failed to preload some contexts:', error);
    });
  }, [contexts]);
};

export default LazyContextProvider;
