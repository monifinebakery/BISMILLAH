// src/hooks/use-ipad-sidebar.ts
import { useState, useEffect } from 'react';

export function useIsPad() {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    const checkIsIPad = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // iPad breakpoints: 641px - 1024px
      const isTabletSize = width >= 641 && width <= 1024;
      
      // Additional iPad detection using user agent and touch
      const userAgent = navigator.userAgent.toLowerCase();
      const isIPadUserAgent = userAgent.includes('ipad') || 
                             (userAgent.includes('macintosh') && 'ontouchend' in document);
      
      // Combine size and touch detection
      const isIPad = isTabletSize || isIPadUserAgent;
      
      setIsIPad(isIPad);
    };

    checkIsIPad();
    
    // Listen for resize events
    window.addEventListener('resize', checkIsIPad);
    
    return () => {
      window.removeEventListener('resize', checkIsIPad);
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
    } else {
      setIsOverlayMode(false);
    }
  }, [isIPad]);

  return {
    isIPad,
    isOverlayMode,
    shouldDefaultCollapse: isIPad,
    shouldUseOverlay: isIPad,
  };
}
