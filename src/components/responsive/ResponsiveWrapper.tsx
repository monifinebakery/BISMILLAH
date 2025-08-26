// src/components/responsive/ResponsiveWrapper.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Layout mode untuk responsive wrapper
   * - container: Gunakan container responsive dengan max-width
   * - full: Full width tanpa container
   * - card: Card layout dengan padding dan border
   */
  variant?: 'container' | 'full' | 'card';
  /**
   * Responsive spacing
   */
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const spacingClasses = {
  none: '',
  xs: 'p-2 xs:p-3',
  sm: 'p-3 xs:p-4 md:p-6',
  md: 'p-4 xs:p-6 md:p-8 lg:p-10',
  lg: 'p-6 xs:p-8 md:p-10 lg:p-12',
  xl: 'p-8 xs:p-10 md:p-12 lg:p-16'
};

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  className = '',
  variant = 'container',
  spacing = 'md'
}) => {
  const baseClasses = 'w-full';
  
  const variantClasses = {
    container: 'container-responsive',
    full: 'w-full',
    card: 'bg-card border border-border rounded-lg shadow-sm'
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveWrapper;
