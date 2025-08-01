// src/components/recipe/components/RecipeForm/CostCalculationStep/components/shared/ResponsiveTooltip.tsx

import React from 'react';
import { useResponsiveTooltip } from '../../hooks/useResponsiveTooltip';

interface ResponsiveTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export const ResponsiveTooltip: React.FC<ResponsiveTooltipProps> = ({
  children,
  content,
  className = "",
  side = 'top',
  align = 'center'
}) => {
  const { isMobile, showTooltip, toggleTooltip, hideTooltip } = useResponsiveTooltip();

  if (isMobile) {
    return (
      <div className="relative">
        <div 
          onClick={toggleTooltip}
          className={`cursor-pointer ${className}`}
        >
          {children}
        </div>
        
        {showTooltip && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={hideTooltip}
            />
            
            {/* Mobile Tooltip Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-xs w-11/12">
              <div className="bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200">
                {content}
                <button
                  onClick={hideTooltip}
                  className="mt-3 w-full bg-gray-800 text-gray-200 py-2 px-3 rounded text-xs hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
                >
                  Tutup
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop tooltip
  const getTooltipPosition = () => {
    const baseClasses = "absolute z-50 hidden group-hover:block";
    
    switch (side) {
      case 'top':
        return `${baseClasses} bottom-full mb-2 ${
          align === 'start' ? 'left-0' : 
          align === 'end' ? 'right-0' : 
          'left-1/2 transform -translate-x-1/2'
        }`;
      case 'bottom':
        return `${baseClasses} top-full mt-2 ${
          align === 'start' ? 'left-0' : 
          align === 'end' ? 'right-0' : 
          'left-1/2 transform -translate-x-1/2'
        }`;
      case 'left':
        return `${baseClasses} right-full mr-2 ${
          align === 'start' ? 'top-0' : 
          align === 'end' ? 'bottom-0' : 
          'top-1/2 transform -translate-y-1/2'
        }`;
      case 'right':
        return `${baseClasses} left-full ml-2 ${
          align === 'start' ? 'top-0' : 
          align === 'end' ? 'bottom-0' : 
          'top-1/2 transform -translate-y-1/2'
        }`;
      default:
        return `${baseClasses} bottom-full mb-2 left-1/2 transform -translate-x-1/2`;
    }
  };

  const getArrowPosition = () => {
    switch (side) {
      case 'top':
        return `absolute top-full ${
          align === 'start' ? 'left-2' : 
          align === 'end' ? 'right-2' : 
          'left-1/2 transform -translate-x-1/2'
        }`;
      case 'bottom':
        return `absolute bottom-full ${
          align === 'start' ? 'left-2' : 
          align === 'end' ?