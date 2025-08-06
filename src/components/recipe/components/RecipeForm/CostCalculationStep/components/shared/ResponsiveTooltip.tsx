// src/components/recipe/components/RecipeForm/CostCalculationStep/components/shared/ResponsiveTooltip.tsx

import React from 'react';
import { useResponsiveTooltip } from '../../hooks/useResponsiveTooltip';
import { logger } from '@/utils/logger';

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

   logger.debug('ResponsiveTooltip render:', { isMobile, showTooltip });

  // Mobile version
  if (isMobile) {
    return (
      <div className="relative">
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            logger.debug('Mobile tooltip clicked');
            toggleTooltip();
          }}
          className={`cursor-pointer ${className}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleTooltip();
            }
          }}
        >
          {children}
        </div>
        
        {showTooltip && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Overlay clicked, hiding tooltip'); // Debug log
                hideTooltip();
              }}
            />
            
            {/* Mobile Tooltip Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-xs w-11/12">
              <div className="bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200">
                {content}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Close button clicked'); // Debug log
                    hideTooltip();
                  }}
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

  // Desktop version
  return (
    <div className="group relative">
      <div className={className}>
        {children}
      </div>
      
      <div className="absolute z-50 hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2">
        <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 max-w-xs animate-in fade-in-0 zoom-in-95 duration-200">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
};