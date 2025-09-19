// src/hooks/use-mobile.ts

import { useState, useEffect } from 'react';
import { safeDom } from '@/utils/browserApiSafeWrappers';


/**
 * Custom hook untuk mendeteksi apakah layar saat ini dianggap sebagai mobile.
 * @param {number} [maxWidth=768] - Lebar maksimal dalam piksel untuk dianggap mobile. Defaultnya adalah 768px (ukuran tablet potret).
 * @returns {boolean} - Mengembalikan `true` jika lebar layar kurang dari atau sama dengan maxWidth, `false` jika lebih besar.
 */
export const useIsMobile = (maxWidth: number = 768): boolean => {
  // Initialize from window on first render to avoid desktop/mobile flip
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= maxWidth;
    }
    return false;
  });

  useEffect(() => {
    // Prefer matchMedia for more accurate breakpoint tracking
    const mql = typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${maxWidth}px)`)
      : null;

    const updateFromMql = () => {
      if (!mql) return;
      setIsMobile(mql.matches);
    };

    // Fallback resize handler
    const handleResize = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };

    // Initial sync
    if (mql) {
      updateFromMql();
      // Modern browsers
      try {
        mql.addEventListener('change', updateFromMql);
      } catch {
        // Safari <14 fallback
        // @ts-ignore
        mql.addListener(updateFromMql);
      }
    } else {
      handleResize();
    }

    // Also listen to resize as a fallback (covers zoom/orientation edge cases)
    safeDom.addEventListener(window, 'resize', handleResize, undefined);

    return () => {
      if (mql) {
        try {
          mql.removeEventListener('change', updateFromMql);
        } catch {
          // @ts-ignore
          mql.removeListener(updateFromMql);
        }
      }
      safeDom.removeEventListener(window, 'resize', handleResize, undefined);
    };
  }, [maxWidth]);

  return isMobile;
};
