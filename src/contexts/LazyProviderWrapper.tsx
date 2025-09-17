// src/contexts/LazyProviderWrapper.tsx - MOBILE-OPTIMIZED LAZY PROVIDER LOADING
import React, { ReactNode, Suspense, lazy, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface LazyProviderWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: 'high' | 'medium' | 'low';
  delay?: number;
}

// ⚡ MOBILE DETECTION untuk optimasi loading strategy
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * LazyProviderWrapper - Wrapper untuk loading provider secara lazy
 * Mengurangi initial bundle size dan loading time
 */
export const LazyProviderWrapper: React.FC<LazyProviderWrapperProps> = ({ 
  children, 
  fallback = null, 
  priority = 'medium',
  delay = 0 
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // ⚡ MOBILE: Priority-based loading delays
    const getLoadDelay = () => {
      const baseMobileDelay = isMobile ? 50 : 0; // Base delay untuk mobile
      
      switch (priority) {
        case 'high':
          return baseMobileDelay;
        case 'medium':
          return baseMobileDelay + 100;
        case 'low':
          return baseMobileDelay + 300;
        default:
          return baseMobileDelay + 100;
      }
    };

    const loadDelay = delay || getLoadDelay();
    
    const timer = setTimeout(() => {
      setShouldLoad(true);
      logger.debug(`LazyProviderWrapper: Loading ${priority} priority provider after ${loadDelay}ms`);
    }, loadDelay);

    return () => clearTimeout(timer);
  }, [priority, delay]);

  if (!shouldLoad) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
};

/**
 * Progressive Provider Component untuk staged loading
 */
interface ProgressiveProvidersProps {
  children: ReactNode;
  stage: 1 | 2 | 3 | 4;
}

export const ProgressiveProviders: React.FC<ProgressiveProvidersProps> = ({ children, stage }) => {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    // ⚡ MOBILE: Faster progression untuk mobile
    const stageDelay = isMobile ? 80 : 100;
    
    if (currentStage < stage) {
      const timer = setTimeout(() => {
        setCurrentStage(prev => prev + 1);
        logger.debug(`ProgressiveProviders: Advanced to stage ${currentStage + 1} (mobile: ${isMobile})`);
      }, stageDelay);

      return () => clearTimeout(timer);
    }
  }, [currentStage, stage]);

  if (currentStage < stage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* ⚡ MOBILE: Smaller progress indicator */}
          <div className={`${
            isMobile ? 'w-6 h-6' : 'w-8 h-8'
          } border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2`}></div>
          <p className={`${
            isMobile ? 'text-xs' : 'text-sm'
          } text-gray-600`}>
            Memuat komponen... ({currentStage}/{stage})
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Lazy Dynamic Provider untuk provider yang bisa di-import dinamically
 */
interface DynamicProviderProps {
  providerPath: string;
  providerName: string;
  children: ReactNode;
  fallbackProvider?: React.ComponentType<{ children: ReactNode }>;
}

export const LazyDynamicProvider: React.FC<DynamicProviderProps> = ({ 
  providerPath, 
  providerName, 
  children, 
  fallbackProvider 
}) => {
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // ⚡ MOBILE: Faster timeout untuk mobile
    const importTimeout = isMobile ? 3000 : 5000;
    
    Promise.race([
      import(providerPath).then(module => module[providerName]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Import timeout')), importTimeout)
      )
    ])
      .then((ImportedProvider: any) => {
        if (mounted) {
          setProvider(() => ImportedProvider);
          logger.debug(`LazyDynamicProvider: Successfully loaded ${providerName} (mobile: ${isMobile})`);
        }
      })
      .catch(error => {
        if (mounted) {
          logger.error(`LazyDynamicProvider: Failed to load ${providerName}:`, error);
          setError(error.message);
          
          // Fallback to provided fallback provider
          if (fallbackProvider) {
            setProvider(() => fallbackProvider);
          } else {
            // Ultimate fallback: passthrough component
            setProvider(() => ({ children }: { children: ReactNode }) => <>{children}</>);
          }
        }
      });

    return () => { mounted = false; };
  }, [providerPath, providerName, fallbackProvider]);

  // Loading state
  if (!Provider) {
    return (
      <div className={`${
        isMobile ? 'text-xs py-2' : 'text-sm py-4'
      } text-center text-gray-500`}>
        Loading {providerName}...
      </div>
    );
  }

  // Error handling with fallback
  if (error && !fallbackProvider) {
    logger.warn(`LazyDynamicProvider: Using passthrough for ${providerName} due to error:`, error);
  }

  return <Provider>{children}</Provider>;
};

/**
 * Mobile-Optimized Provider Queue untuk sequential loading
 */
interface ProviderQueueItem {
  component: React.ComponentType<{ children: ReactNode }>;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface MobileProviderQueueProps {
  providers: ProviderQueueItem[];
  children: ReactNode;
}

export const MobileProviderQueue: React.FC<MobileProviderQueueProps> = ({ providers, children }) => {
  const [loadedProviders, setLoadedProviders] = useState<ProviderQueueItem[]>([]);
  
  useEffect(() => {
    // ⚡ MOBILE: Sort by priority dan load sequentially
    const sortedProviders = [...providers].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    let currentIndex = 0;
    
    const loadNextProvider = () => {
      if (currentIndex < sortedProviders.length) {
        const provider = sortedProviders[currentIndex];
        setLoadedProviders(prev => [...prev, provider]);
        
        logger.debug(`MobileProviderQueue: Loaded ${provider.name} (${provider.priority}) - ${currentIndex + 1}/${sortedProviders.length}`);
        
        currentIndex++;
        
        // ⚡ MOBILE: Faster loading untuk critical, slower untuk low priority
        const delay = {
          critical: 0,
          high: isMobile ? 30 : 50,
          medium: isMobile ? 80 : 100,
          low: isMobile ? 150 : 200
        }[provider.priority];
        
        setTimeout(loadNextProvider, delay);
      }
    };

    loadNextProvider();
  }, [providers]);

  // Render providers in loaded order
  const renderWithProviders = (content: ReactNode): ReactNode => {
    return loadedProviders.reduceRight((acc, provider) => {
      const ProviderComponent = provider.component;
      return <ProviderComponent>{acc}</ProviderComponent>;
    }, content);
  };

  return <>{renderWithProviders(children)}</>;
};