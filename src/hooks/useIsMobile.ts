// src/hooks/useIsMobile.ts
// Mobile device detection hook

import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < breakpoint);
      }
    };

    // Check on mount
    checkIfMobile();

    // Add event listener for resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIfMobile);
      
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }
  }, [breakpoint]);

  return isMobile;
};
