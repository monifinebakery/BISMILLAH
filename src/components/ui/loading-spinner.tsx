import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  /** Show loading text */
  showText?: boolean;
  /** Center the spinner */
  center?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text = 'Memuat...',
  showText = false,
  center = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const content = (
    <div className={cn(
      'flex items-center gap-2',
      showText && 'flex-col gap-3 text-center',
      className
    )}>
      <Loader2 
        className={cn(
          'animate-spin text-orange-500',
          sizeClasses[size]
        )} 
      />
      {showText && (
        <span className={cn(
          'text-gray-600 font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center min-h-32">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * Loading states untuk berbagai konteks
 */
const LoadingStates = {
  // Page loading (full screen)
  Page: (props?: Partial<LoadingSpinnerProps>) => (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner
        size="xl"
        showText
        text="Memuat halaman..."
        {...props}
      />
    </div>
  ),

  // Card/Section loading
  Card: (props?: Partial<LoadingSpinnerProps>) => (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner
        size="lg"
        showText
        text="Memuat data..."
        {...props}
      />
    </div>
  ),

  // Button loading (inline)
  Button: (props?: Partial<LoadingSpinnerProps>) => (
    <LoadingSpinner size="sm" {...props} />
  ),

  // Table loading
  Table: (props?: Partial<LoadingSpinnerProps>) => (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner
        size="lg"
        showText
        text="Memuat tabel..."
        {...props}
      />
    </div>
  ),

  // Form loading
  Form: (props?: Partial<LoadingSpinnerProps>) => (
    <div className="flex items-center justify-center py-6">
      <LoadingSpinner
        size="md"
        showText
        text="Menyimpan..."
        {...props}
      />
    </div>
  ),
};

export { LoadingSpinner, LoadingStates };
export type { LoadingSpinnerProps };