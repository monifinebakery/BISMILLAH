// src/hooks/use-ipad-sidebar.ts
import { useState, useEffect } from 'react';
import { safeDom } from '@/utils/browserApiSafeWrappers';


export function useIsPad() {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    const checkIsIPad = () => {
      const width = window.innerWidth;
      
      // iPad breakpoints: 768px - 1023px (matches Tailwind md breakpoint)
      const isTabletSize = width >= 768 && width <= 1023;
      
      // Additional iPad detection using user agent and touch
      const userAgent = navigator.userAgent.toLowerCase();
      const isIPadUserAgent = userAgent.includes('ipad') || 
                             (userAgent.includes('macintosh') && 'ontouchend' in document);
      
      // Combine size and touch detection - prioritize size for consistency
      const isIPad = isTabletSize || (isIPadUserAgent && width >= 768 && width <= 1200);
      
      setIsIPad(isIPad);
    };

    checkIsIPad();
    
    // Listen for resize events
    safeDom.addEventListener(safeDom, window, 'resize', checkIsIPad);
    
    return () => {
      safeDom.removeEventListener(safeDom, window, 'resize', checkIsIPad);
    };
  }, []);

  return isIPad;
}

export function useIPadSidebar() {
  const isIPad = useIsPad();
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  useEffect(() => {
    if (isIPad) {
      // Set overlay mode for iPad
      setIsOverlayMode(true);
      console.log('🔄 iPad detected, enabling sidebar overlay mode');
    } else {
      setIsOverlayMode(false);
    }
  }, [isIPad]);

  return {
    isIPad,
    isOverlayMode,
    shouldDefaultCollapse: isIPad, // Sidebar should start collapsed on iPad
    shouldUseOverlay: isIPad,     // Use overlay behavior on iPad
    isTabletBreakpoint: isIPad,   // Helper for responsive design
  };
}
