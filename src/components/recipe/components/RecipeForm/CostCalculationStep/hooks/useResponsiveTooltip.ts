// src/components/recipe/components/RecipeForm/CostCalculationStep/hooks/useResponsiveTooltip.ts

import { useState, useEffect, useCallback } from 'react';

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
      const isMobileDevice = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Toggle tooltip visibility
  const toggleTooltip = useCallback(() => {
    setShowTooltip(prev => !prev);
  }, []);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Show tooltip for a specific duration
  const showTooltipTemporary = useCallback((duration: number = 3000) => {
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, duration);
  }, []);

  // Close tooltip when clicking outside (for mobile)
  useEffect(() => {
    if (!isMobile || !showTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      // This would be handled by the overlay in the component
      // but we can add logic here if needed
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobile, showTooltip]);

  return {
    isMobile,
    showTooltip,
    toggleTooltip,
    hideTooltip,
    showTooltipTemporary,
  };
};