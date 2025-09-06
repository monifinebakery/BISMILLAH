import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { safePerformance, safeDom } from '@/utils/browserApiSafeWrappers';
import { safeDom } from '@/utils/browserApiSafeWrappers';


interface VirtualScrollingOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  data: any[];
}

interface VirtualScrollingResult {
  startIndex: number;
  endIndex: number;
  visibleItems: any[];
  totalHeight: number;
  offsetY: number;
  scrollElementRef: React.RefObject<HTMLDivElement>;
  isScrolling: boolean;
}

export const useVirtualScrolling = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  data
}: VirtualScrollingOptions): VirtualScrollingResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate virtual items
  const virtualItems = useMemo(() => {
    if (data.length === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        visibleItems: [],
        totalHeight: 0,
        offsetY: 0
      };
    }

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(data.length - 1, startIndex + visibleCount + overscan * 2);
    const visibleItems = data.slice(startIndex, endIndex + 1);
    const totalHeight = data.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY
    };
  }, [data, containerHeight, itemHeight, scrollTop, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Attach scroll handler
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    safeDom.addEventListener(element, 'scroll', handleScroll as any);
    return () => {
      safeDom.removeEventListener(element, 'scroll', handleScroll as any);
    };
  }, [handleScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...virtualItems,
    scrollElementRef,
    isScrolling
  };
};

// Hook untuk optimasi performa virtual scrolling
export const useVirtualScrollingPerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollFPS: 0,
    memoryUsage: 0,
    visibleItemCount: 0
  });

  const measureRenderTime = useCallback((callback: () => void) => {
    const start = safePerformance.now();
    callback();
    const end = safePerformance.now();
    
    setMetrics(prev => ({
      ...prev,
      renderTime: end - start
    }));
  }, []);

  const trackScrollFPS = useCallback(() => {
    let frameCount = 0;
    let lastTime = safePerformance.now();
    
    const countFrames = () => {
      frameCount++;
      const currentTime = safePerformance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          scrollFPS: frameCount
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };
    
    requestAnimationFrame(countFrames);
  }, []);

  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);

  const updateVisibleItemCount = useCallback((count: number) => {
    setMetrics(prev => ({
      ...prev,
      visibleItemCount: count
    }));
  }, []);

  return {
    metrics,
    measureRenderTime,
    trackScrollFPS,
    updateMemoryUsage,
    updateVisibleItemCount
  };
};

// Utility untuk mengoptimalkan rendering item
export const optimizeVirtualItem = <T>(item: T, index: number, isVisible: boolean) => {
  // Hanya render item yang visible
  if (!isVisible) {
    return null;
  }

  // Implementasi lazy loading untuk item yang kompleks
  return {
    item,
    index,
    shouldRender: true,
    key: `virtual-item-${index}`
  };
};

// Hook untuk virtual scrolling dengan infinite loading
export const useInfiniteVirtualScrolling = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  data,
  hasNextPage = false,
  loadMore
}: VirtualScrollingOptions & {
  hasNextPage?: boolean;
  loadMore?: () => void;
}) => {
  const virtualScrolling = useVirtualScrolling({
    itemHeight,
    containerHeight,
    overscan,
    data
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Check if we need to load more data
  useEffect(() => {
    const { endIndex } = virtualScrolling;
    const threshold = data.length - 10; // Load more when 10 items from end

    if (endIndex >= threshold && hasNextPage && !isLoadingMore && loadMore) {
      setIsLoadingMore(true);
      loadMore();
      
      // Reset loading state after a delay
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  }, [virtualScrolling.endIndex, data.length, hasNextPage, isLoadingMore, loadMore]);

  return {
    ...virtualScrolling,
    isLoadingMore,
    hasNextPage
  };
};