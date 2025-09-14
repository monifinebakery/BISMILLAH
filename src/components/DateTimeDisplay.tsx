// components/ui/DateTimeDisplay.tsx - ENHANCED VERSION
// Optimized performance & consistent with our fixes

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { isValidDate } from '@/utils/unifiedDateUtils';

interface DateTimeDisplayProps {
  className?: string;
  variant?: 'full' | 'compact' | 'time-only';
  updateInterval?: number;
  timezone?: string;
  showSeconds?: boolean;
  format?: '12h' | '24h';
}

const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({
  className,
  variant = 'full',
  updateInterval = 1000,
  timezone = 'Asia/Jakarta',
  showSeconds = true,
  format = '24h'
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef<boolean>(true);

  // 🔧 FIX: Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 🔧 FIX: Safe date formatting with error handling
  const formatDateTime = useCallback((date: Date): string => {
    try {
      if (!isValidDate(date)) {
        console.warn('DateTimeDisplay: Invalid date provided:', date);
        return 'Invalid Date';
      }

      // Base options for Indonesian locale
      const baseOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
      };

      // Configure options based on variant
      switch (variant) {
        case 'full':
          return new Intl.DateTimeFormat('id-ID', {
            ...baseOptions,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...(showSeconds && { second: '2-digit' }),
            hour12: format === '12h',
          }).format(date);

        case 'compact':
          return new Intl.DateTimeFormat('id-ID', {
            ...baseOptions,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...(showSeconds && { second: '2-digit' }),
            hour12: format === '12h',
          }).format(date);

        case 'time-only':
          return new Intl.DateTimeFormat('id-ID', {
            ...baseOptions,
            hour: '2-digit',
            minute: '2-digit',
            ...(showSeconds && { second: '2-digit' }),
            hour12: format === '12h',
          }).format(date);

        default:
          return new Intl.DateTimeFormat('id-ID', {
            ...baseOptions,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: format === '12h',
          }).format(date);
      }
    } catch (error) {
      console.error('DateTimeDisplay: Error formatting date:', error);
      return 'Format Error';
    }
  }, [variant, timezone, showSeconds, format]);

  // 🔧 FIX: Mobile-friendly time format
  const formatMobileTime = useCallback((date: Date): string => {
    try {
      if (!isValidDate(date)) {
        return '--:--';
      }

      return new Intl.DateTimeFormat('id-ID', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === '12h',
      }).format(date);
    } catch (error) {
      console.error('DateTimeDisplay: Error formatting mobile time:', error);
      return '--:--';
    }
  }, [timezone, format]);

  // 🔧 FIX: Optimized timer with cleanup
  useEffect(() => {
    if (!isClient) return;

    const updateDateTime = () => {
      if (isMountedRef.current) {
        const now = new Date();
        if (isValidDate(now)) {
          setCurrentDateTime(now);
        }
      }
    };

    // Initial update
    updateDateTime();

    // Set up interval
    intervalRef.current = setInterval(updateDateTime, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isClient, updateInterval]);

  // 🔧 FIX: Memoized formatted values for performance
  const formattedDateTime = useMemo(() => {
    if (!isClient) return '';
    return formatDateTime(currentDateTime);
  }, [isClient, currentDateTime, formatDateTime]);

  const formattedMobileTime = useMemo(() => {
    if (!isClient) return '';
    return formatMobileTime(currentDateTime);
  }, [isClient, currentDateTime, formatMobileTime]);

  // 🔧 FIX: Loading state during hydration menggunakan skeleton
  if (!isClient) {
    return (
      <div
        className={cn(
          "flex items-center space-x-2 text-sm text-muted-foreground",
          className
        )}
      >
        <Clock className="h-4 w-4" />
        <Skeleton variant="text" className="hidden sm:inline w-24" />
        <Skeleton variant="text" className="sm:hidden w-12" />
      </div>
    );
  }

  // 🔧 FIX: Error state
  if (!isValidDate(currentDateTime)) {
    return (
      <div className={cn(
        "flex items-center space-x-2 text-sm text-red-500",
        className
      )}>
        <Clock className="h-4 w-4" />
        <span className="hidden sm:inline">Error: Invalid Time</span>
        <span className="sm:hidden">ERR</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center space-x-2 text-sm text-muted-foreground transition-colors",
      "hover:text-foreground",
      className
    )}>
      <Clock className="h-4 w-4 flex-shrink-0" />
      
      {/* Desktop/Tablet View */}
      <span 
        className="hidden sm:inline font-medium"
        title={`Last updated: ${formattedDateTime}`}
      >
        {formattedDateTime}
      </span>
      
      {/* Mobile View */}
      <span 
        className="sm:hidden font-mono font-medium"
        title={`Current time: ${formattedDateTime}`}
      >
        {formattedMobileTime}
      </span>
    </div>
  );
};

// 🔧 FIX: Add predefined variants for common use cases
export const DateTimeDisplayVariants = {
  Header: (props: Partial<DateTimeDisplayProps>) => (
    <DateTimeDisplay 
      variant="full" 
      showSeconds={true} 
      {...props} 
    />
  ),
  
  Compact: (props: Partial<DateTimeDisplayProps>) => (
    <DateTimeDisplay 
      variant="compact" 
      showSeconds={false} 
      {...props} 
    />
  ),
  
  TimeOnly: (props: Partial<DateTimeDisplayProps>) => (
    <DateTimeDisplay 
      variant="time-only" 
      showSeconds={true} 
      updateInterval={1000}
      {...props} 
    />
  ),
  
  Dashboard: (props: Partial<DateTimeDisplayProps>) => (
    <DateTimeDisplay 
      variant="compact" 
      showSeconds={false}
      updateInterval={60000} // Update every minute for dashboard
      {...props} 
    />
  ),
};

// 🔧 FIX: Hook for getting current time (reusable)
export const useCurrentTime = (updateInterval: number = 1000) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const timer = setInterval(() => {
      const now = new Date();
      if (isValidDate(now)) {
        setCurrentTime(now);
      }
    }, updateInterval);

    return () => clearInterval(timer);
  }, [isClient, updateInterval]);

  return { currentTime, isClient };
};

export default DateTimeDisplay;