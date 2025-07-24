// components/index.ts - Components Exports
import React from 'react'; // Impor React diperlukan untuk JSX dan typing

// 🍽️ Product Selection Components
export { default as ProductSelection } from './ProductSelection';
// Asumsi tipe-tipe ini diekspor dari file types terpusat
// export type { ProductSelectionProps } from '../types'; 

// 🎯 Promo Configuration Components
export { default as PromoConfiguration } from './PromoConfiguration';
// export type { PromoConfigurationProps } from '../types';

// 📝 Dynamic Promo Forms
export { default as PromoTypeForm } from './PromoTypeForm';

// 📊 Calculation Results
export { default as CalculationResults } from './CalculationResults';
// export type { CalculationResultsProps } from '../types';

// 📋 History Table
export { default as PromoHistoryTable } from './PromoHistoryTable';
// export type { PromoHistoryTableProps } from '../types';

// 📄 Pagination Controls
export { default as PaginationControls, CompactPaginationControls, PaginationSummary } from './PaginationControls';
// export type { PaginationControlsProps } from '../types';

// 🎭 Loading & Error States
export {
  LoadingSpinner,
  Skeleton,
  ErrorState,
  EmptyState,
  Progress,
  StatusBadge,
  LoadingOverlay,
  PromoCardSkeleton,
  TableSkeleton,
  TimeoutState,
  PerformanceIndicator
} from './LoadingStates';

// 🎯 Re-export default loading states
export { default as LoadingStates } from './LoadingStates';

// 🔧 Component utilities and helpers
export const ComponentUtils = {
  // Format helpers for components
  formatPromoLabel: (type: string): string => {
    const labels: Record<string, string> = {
      'discount_percent': 'Diskon Persentase',
      'discount_rp': 'Diskon Rupiah',
      'bogo': 'Beli X Gratis Y'
    };
    return labels[type] || type;
  },

  // Margin color helper
  getMarginColorClass: (marginPercent: number): string => {
    if (marginPercent < 0) return 'text-red-600 bg-red-50 border-red-200';
    if (marginPercent < 0.1) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (marginPercent < 0.2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  },

  // Status color helper
  getStatusColorClass: (status: string): string => {
    const statusColors: Record<string, string> = {
      'active': 'text-green-600 bg-green-100',
      'inactive': 'text-gray-600 bg-gray-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'error': 'text-red-600 bg-red-100'
    };
    return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-100';
  },

  // Responsive breakpoint helper
  getResponsiveClasses: (breakpoint: 'sm' | 'md' | 'lg' | 'xl'): string => {
    const classes = {
      sm: 'block sm:hidden',
      md: 'hidden sm:block md:hidden',
      lg: 'hidden md:block lg:hidden',
      xl: 'hidden lg:block'
    };
    return classes[breakpoint];
  },

  // Animation helper
  getAnimationClasses: (type: 'fadeIn' | 'slideIn' | 'scaleIn'): string => {
    const animations = {
      fadeIn: 'animate-fade-in',
      slideIn: 'animate-slide-in',
      scaleIn: 'animate-scale-in'
    };
    return animations[type];
  }
};

// 🎨 Theme and style constants
export const ComponentTheme = {
  colors: {
    primary: 'orange-600',
    secondary: 'gray-600',
    success: 'green-600',
    warning: 'yellow-600',
    error: 'red-600',
    info: 'blue-600'
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
};

// 🎯 Component variants
export const ComponentVariants = {
  button: {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  },
  
  card: {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    elevated: 'bg-white border border-gray-200 rounded-lg shadow-md',
    highlighted: 'bg-orange-50 border border-orange-200 rounded-lg shadow-sm',
    error: 'bg-red-50 border border-red-200 rounded-lg shadow-sm'
  },
  
  input: {
    default: 'border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent',
    error: 'border border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-transparent',
    success: 'border border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent'
  },
  
  badge: {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-orange-100 text-orange-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
};

// 🔧 Component props helpers
export const createComponentProps = {
  // Helper untuk membuat props dengan default values
  withDefaults: <T extends object>(
    props: T,
    defaults: Partial<T>
  ): T => ({
    ...defaults,
    ...props
  }),

  // Helper untuk conditional classes
  classNames: (...classes: (string | undefined | null | boolean)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  // Helper untuk merge refs
  mergeRefs: <T = any>(
    ...refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
  ): React.RefCallback<T> => {
    return (value) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(value);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = value;
        }
      });
    };
  }
};

// 📱 Responsive helpers
export const ResponsiveHelpers = {
  // Breakpoint detection
  useResponsive: () => {
    const [breakpoint, setBreakpoint] = React.useState('md');
    
    React.useEffect(() => {
      const updateBreakpoint = () => {
        const width = window.innerWidth;
        if (width < 640) setBreakpoint('sm');
        else if (width < 768) setBreakpoint('md');
        else if (width < 1024) setBreakpoint('lg');
        else setBreakpoint('xl');
      };
      
      updateBreakpoint();
      window.addEventListener('resize', updateBreakpoint);
      return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);
    
    return breakpoint;
  },

  // Mobile detection
  isMobile: (): boolean => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  },

  // Get responsive classes
  getResponsiveClass: (
    base: string,
    responsive: Record<string, string>
  ): string => {
    const classes = [base];
    Object.entries(responsive).forEach(([breakpoint, className]) => {
      classes.push(`${breakpoint}:${className}`);
    });
    return classes.join(' ');
  }
};

// 🎭 Animation helpers
export const AnimationHelpers = {
  // Fade in animation
  fadeIn: 'animate-in fade-in duration-200',
  
  // Slide animations
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in duration-200',
  scaleOut: 'animate-out zoom-out duration-200',
  
  // Bounce animation
  bounce: 'animate-bounce',
  
  // Pulse animation
  pulse: 'animate-pulse',
  
  // Spin animation
  spin: 'animate-spin'
};

// 🔒 Accessibility helpers
export const AccessibilityHelpers = {
  // ARIA labels
  getAriaLabel: (action: string, target?: string): string => {
    return target ? `${action} ${target}` : action;
  },

  // Focus management
  focusProps: {
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (e.target as HTMLElement).click();
      }
    }
  },

  // Screen reader helpers
  srOnly: 'sr-only',
  notSrOnly: 'not-sr-only'
};

// 🧪 Development helpers
export const DevHelpers = {
  // Debug props
  debugProps: (props: any, componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${componentName} props:`, props);
    }
  },

  // Performance measurement
  measureRender: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      return () => {
        const end = performance.now();
        console.log(`⚡ ${componentName} render time: ${(end - start).toFixed(2)}ms`);
      };
    }
    return () => {};
  },

  // Component validation
  validateProps: (props: any, required: string[], componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      required.forEach(prop => {
        if (props[prop] === undefined || props[prop] === null) {
          console.warn(`⚠️ ${componentName}: Required prop '${prop}' is missing`);
        }
      });
    }
  }
};

// 🎯 Component composition helpers
export const CompositionHelpers = {
  // Create compound component
  createCompound: <T extends Record<string, React.ComponentType<any>>>(
    components: T
  ) => {
    const compound = components[Object.keys(components)[0]] as any;
    Object.keys(components).forEach(key => {
      compound[key] = components[key];
    });
    return compound;
  },

  // Higher-order component wrapper
  withProps: <P extends object>(defaultProps: Partial<P>) => 
    // FIX: Tambahkan koma setelah C extends ...
    <C extends React.ComponentType<P>,>(Component: C) => {
      const WrappedComponent = (props: P) => (
        <Component {...defaultProps} {...props} />
      );
      WrappedComponent.displayName = `withProps(${Component.displayName || Component.name})`;
      return WrappedComponent;
    }
};

// 📊 Performance monitoring
export const PerformanceMonitor = {
  // Component render tracker
  trackRender: (componentName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${componentName}-render-start`);
      
      return () => {
        performance.mark(`${componentName}-render-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      };
    }
    return () => {};
  },

  // Memory usage tracker
  trackMemory: (componentName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory;
      console.log(`💾 ${componentName} memory:`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      });
    }
  }
};
