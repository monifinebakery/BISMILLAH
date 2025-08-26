// src/components/responsive/index.ts
export { default as ResponsiveWrapper } from './ResponsiveWrapper';

// Hook untuk responsive utilities (jika diperlukan di masa depan)
export { useIsMobile } from '@/hooks/use-mobile';

// Responsive utility classes constants
export const RESPONSIVE_BREAKPOINTS = {
  xs: '320px',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

export const MOBILE_FIRST_CLASSES = {
  hide: {
    mobile: 'block md:hidden',
    tablet: 'hidden md:block lg:hidden', 
    desktop: 'hidden lg:block',
    mobileTablet: 'block lg:hidden',
    tabletDesktop: 'hidden md:block'
  },
  text: {
    responsive: {
      xs: 'text-xs sm:text-sm',
      sm: 'text-sm sm:text-base',
      base: 'text-sm sm:text-base md:text-lg',
      lg: 'text-lg sm:text-xl md:text-2xl',
      xl: 'text-xl sm:text-2xl md:text-3xl'
    }
  },
  spacing: {
    responsive: 'space-y-4 md:space-y-6 lg:space-y-8',
    container: 'px-4 py-6 md:px-6 md:py-8 lg:px-8'
  }
} as const;
