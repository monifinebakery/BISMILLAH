// src/components/recipe/components/RecipeForm/CostCalculationStep/hooks/useResponsiveTooltip.ts

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface UseResponsiveTooltipReturn {
  isMobile: boolean;
  showTooltip: boolean;
  toggleTooltip: () => void;
  hideTooltip: () => void;
  showTooltipTemporary: (duration?: number) => void;
}

export const useResponsiveTooltip = (): UseResponsiveTooltipReturn => {
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      // More comprehensive mobile detection
      const isMobileDevice = window.innerWidth < 768 || 
                           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           'ontouchstart' in window;
      setIsMobile(isMobileDevice);
      logger.debug('Mobile detection:', isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Toggle tooltip visibility
  const toggleTooltip = useCallback(() => {
    logger.debug('Toggle tooltip clicked, current state:', showTooltip);
    setShowTooltip(prev => !prev);
  }, [showTooltip]);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    logger.debug('Hide tooltip called');
    setShowTooltip(false);
  }, []);

  // Show tooltip for a specific duration
  const showTooltipTemporary = useCallback((duration: number = 3000) => {
    logger.debug('Show tooltip temporary:', duration);
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, duration);
  }, []);

  // Close tooltip when clicking outside or pressing Escape (for mobile)
  useEffect(() => {
    if (!showTooltip) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showTooltip]);

  logger.debug('useResponsiveTooltip state:', { isMobile, showTooltip });

  return {
    isMobile,
    showTooltip,
    toggleTooltip,
    hideTooltip,
    showTooltipTemporary,
  };
};