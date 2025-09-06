// src/hooks/usePreloading.ts
import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { safeDom } from '@/utils/browserApiSafeWrappers';

interface PreloadOptions {
  priority?: 'high' | 'low';
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
}

interface PrefetchOptions {
  priority?: 'high' | 'low';
  timeout?: number;
  retries?: number;
}

interface PreloadedResource {
  url: string;
  type: string;
  status: 'loading' | 'loaded' | 'error';
  timestamp: number;
}

/**
 * Hook untuk preloading resources (CSS, JS, images, fonts)
 */
export const useResourcePreloader = () => {
  const [preloadedResources, setPreloadedResources] = useState<Map<string, PreloadedResource>>(new Map());
  const preloadCache = useRef<Set<string>>(new Set());

  const preloadResource = useCallback((url: string, options: PreloadOptions = {}) => {
    // Skip jika sudah di-preload
    if (preloadCache.current.has(url)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      // Cek apakah resource sudah ada di cache browser
      if (safeDom.querySelector(`link[href="${url}"]`) || safeDom.querySelector(`script[src="${url}"]`)) {
        preloadCache.current.add(url);
        resolve();
        return;
      }

      const link = safeDom.createElement('link') as HTMLLinkElement;
      link.rel = 'preload';
      link.href = url;
      
      if (options.as) {
        link.as = options.as;
      }
      
      if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin;
      }
      
      if (options.integrity) {
        link.integrity = options.integrity;
      }

      // Set priority jika didukung browser
      if ('fetchPriority' in link && options.priority) {
        (link as any).fetchPriority = options.priority;
      }

      // Update state
      setPreloadedResources(prev => new Map(prev.set(url, {
        url,
        type: options.as || 'unknown',
        status: 'loading',
        timestamp: Date.now()
      })));

      link.onload = () => {
        preloadCache.current.add(url);
        setPreloadedResources(prev => {
          const updated = new Map(prev);
          const resource = updated.get(url);
          if (resource) {
            updated.set(url, { ...resource, status: 'loaded' });
          }
          return updated;
        });
        resolve();
      };

      link.onerror = () => {
        setPreloadedResources(prev => {
          const updated = new Map(prev);
          const resource = updated.get(url);
          if (resource) {
            updated.set(url, { ...resource, status: 'error' });
          }
          return updated;
        });
        reject(new Error(`Failed to preload ${url}`));
      };

      document.head.appendChild(link);
    });
  }, []);

  const preloadImage = useCallback((src: string, options: Omit<PreloadOptions, 'as'> = {}) => {
    return preloadResource(src, { ...options, as: 'image' });
  }, [preloadResource]);

  const preloadFont = useCallback((src: string, options: Omit<PreloadOptions, 'as'> = {}) => {
    return preloadResource(src, { ...options, as: 'font', crossOrigin: 'anonymous' });
  }, [preloadResource]);

  const preloadScript = useCallback((src: string, options: Omit<PreloadOptions, 'as'> = {}) => {
    return preloadResource(src, { ...options, as: 'script' });
  }, [preloadResource]);

  const preloadStyle = useCallback((src: string, options: Omit<PreloadOptions, 'as'> = {}) => {
    return preloadResource(src, { ...options, as: 'style' });
  }, [preloadResource]);

  const getPreloadStatus = useCallback((url: string) => {
    return preloadedResources.get(url);
  }, [preloadedResources]);

  const clearPreloadCache = useCallback(() => {
    preloadCache.current.clear();
    setPreloadedResources(new Map());
  }, []);

  return {
    preloadResource,
    preloadImage,
    preloadFont,
    preloadScript,
    preloadStyle,
    getPreloadStatus,
    clearPreloadCache,
    preloadedResources: Array.from(preloadedResources.values())
  };
};

/**
 * Hook untuk prefetching data dan pages
 */
export const useDataPrefetcher = () => {
  const [prefetchCache, setPrefetchCache] = useState<Map<string, any>>(new Map());
  const [prefetchStatus, setPrefetchStatus] = useState<Map<string, 'loading' | 'loaded' | 'error'>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>, options: PrefetchOptions = {}) => {
    // Skip jika sudah ada di cache
    if (prefetchCache.has(key)) {
      return prefetchCache.get(key);
    }

    // Skip jika sedang loading
    if (prefetchStatus.get(key) === 'loading') {
      return null;
    }

    const controller = new AbortController();
    abortControllers.current.set(key, controller);

    setPrefetchStatus(prev => new Map(prev.set(key, 'loading')));

    try {
      // Timeout handling
      const timeoutPromise = options.timeout ? 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Prefetch timeout')), options.timeout)
        ) : null;

      const fetchPromise = fetcher();
      const result = timeoutPromise ? 
        await Promise.race([fetchPromise, timeoutPromise]) : 
        await fetchPromise;

      setPrefetchCache(prev => new Map(prev.set(key, result)));
      setPrefetchStatus(prev => new Map(prev.set(key, 'loaded')));
      abortControllers.current.delete(key);

      return result;
    } catch (error) {
      setPrefetchStatus(prev => new Map(prev.set(key, 'error')));
      abortControllers.current.delete(key);

      // Retry logic
      if (options.retries && options.retries > 0) {
        setTimeout(() => {
          prefetchData(key, fetcher, { ...options, retries: options.retries! - 1 });
        }, 1000);
      }

      throw error;
    }
  }, [prefetchCache, prefetchStatus]);

  const getCachedData = useCallback((key: string) => {
    return prefetchCache.get(key);
  }, [prefetchCache]);

  const getPrefetchStatus = useCallback((key: string) => {
    return prefetchStatus.get(key);
  }, [prefetchStatus]);

  const cancelPrefetch = useCallback((key: string) => {
    const controller = abortControllers.current.get(key);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(key);
      setPrefetchStatus(prev => {
        const updated = new Map(prev);
        updated.delete(key);
        return updated;
      });
    }
  }, []);

  const clearPrefetchCache = useCallback(() => {
    // Cancel all ongoing requests
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    
    setPrefetchCache(new Map());
    setPrefetchStatus(new Map());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
    };
  }, []);

  return {
    prefetchData,
    getCachedData,
    getPrefetchStatus,
    cancelPrefetch,
    clearPrefetchCache,
    prefetchCache: Array.from(prefetchCache.entries()),
    prefetchStatus: Array.from(prefetchStatus.entries())
  };
};

/**
 * Hook untuk route prefetching (React Router)
 */
export const useRoutePrefetcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefetchedRoutes = useRef<Set<string>>(new Set());
  const prefetchedComponents = useRef<Map<string, Promise<any>>>(new Map());

  const prefetchRoute = useCallback((href: string, options?: { priority?: boolean }) => {
    if (prefetchedRoutes.current.has(href)) {
      return;
    }

    try {
      // Untuk React Router, kita bisa prefetch dengan membuat link element
      const link = safeDom.createElement('link') as HTMLLinkElement;
      link.rel = 'prefetch';
      link.href = href;
      if (options?.priority) {
        link.rel = 'preload';
      }
      document.head.appendChild(link);
      
      prefetchedRoutes.current.add(href);
    } catch (error) {
      console.warn(`Failed to prefetch route: ${href}`, error);
    }
  }, []);

  const prefetchComponent = useCallback(async (href: string, componentLoader: () => Promise<any>) => {
    if (prefetchedComponents.current.has(href)) {
      return prefetchedComponents.current.get(href);
    }

    try {
      const componentPromise = componentLoader();
      prefetchedComponents.current.set(href, componentPromise);
      await componentPromise;
      return componentPromise;
    } catch (error) {
      prefetchedComponents.current.delete(href);
      console.warn(`Failed to prefetch component for route: ${href}`, error);
      throw error;
    }
  }, []);

  const prefetchRoutes = useCallback((routes: string[], options?: { priority?: boolean }) => {
    routes.forEach(route => prefetchRoute(route, options));
  }, [prefetchRoute]);

  const isPrefetched = useCallback((href: string) => {
    return prefetchedRoutes.current.has(href);
  }, []);

  const clearRoutePrefetchCache = useCallback(() => {
    prefetchedRoutes.current.clear();
  }, []);

  return {
    prefetchRoute,
    prefetchComponent,
    prefetchRoutes,
    isPrefetched,
    clearRoutePrefetchCache,
    prefetchedRoutes: Array.from(prefetchedRoutes.current),
    prefetchedComponents: Array.from(prefetchedComponents.current.keys())
  };
};

/**
 * Hook untuk intelligent preloading berdasarkan user behavior
 */
export const useIntelligentPreloader = () => {
  const { preloadResource } = useResourcePreloader();
  const { prefetchData } = useDataPrefetcher();
  const { prefetchRoute } = useRoutePrefetcher();
  const [hoverIntents, setHoverIntents] = useState<Map<string, number>>(new Map());
  const hoverTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleLinkHover = useCallback((href: string, delay: number = 300) => {
    // Clear existing timeout
    const existingTimeout = hoverTimeouts.current.get(href);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      prefetchRoute(href);
      setHoverIntents(prev => new Map(prev.set(href, Date.now())));
    }, delay);

    hoverTimeouts.current.set(href, timeout);
  }, [prefetchRoute]);

  const handleLinkLeave = useCallback((href: string) => {
    const timeout = hoverTimeouts.current.get(href);
    if (timeout) {
      clearTimeout(timeout);
      hoverTimeouts.current.delete(href);
    }
  }, []);

  const preloadOnViewport = useCallback((element: HTMLElement, resources: string[]) => {
    if (!('IntersectionObserver' in window)) {
      // Fallback untuk browser lama
      resources.forEach(resource => preloadResource(resource));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            resources.forEach(resource => preloadResource(resource));
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [preloadResource]);

  const preloadOnIdle = useCallback((callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      // Fallback
      setTimeout(callback, 1);
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      hoverTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    handleLinkHover,
    handleLinkLeave,
    preloadOnViewport,
    preloadOnIdle,
    hoverIntents: Array.from(hoverIntents.entries())
  };
};

/**
 * Hook utama yang menggabungkan semua preloading strategies
 */
export const usePreloading = () => {
  const resourcePreloader = useResourcePreloader();
  const dataPrefetcher = useDataPrefetcher();
  const routePrefetcher = useRoutePrefetcher();
  const intelligentPreloader = useIntelligentPreloader();

  const clearAllCaches = useCallback(() => {
    resourcePreloader.clearPreloadCache();
    dataPrefetcher.clearPrefetchCache();
    routePrefetcher.clearRoutePrefetchCache();
  }, [resourcePreloader, dataPrefetcher, routePrefetcher]);

  return {
    ...resourcePreloader,
    ...dataPrefetcher,
    ...routePrefetcher,
    ...intelligentPreloader,
    clearAllCaches
  };
};