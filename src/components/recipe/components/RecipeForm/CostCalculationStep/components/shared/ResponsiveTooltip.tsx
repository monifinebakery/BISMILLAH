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

  // ✅ Mobile version with proper modal
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
            if (e.key === 'Escape') {
              hideTooltip();
            }
          }}
        >
          {children}
        </div>
        
        {showTooltip && (
          <>
            {/* ✅ Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug('Overlay clicked, hiding tooltip');
                hideTooltip();
              }}
            />
            
            {/* ✅ Mobile Modal - Fixed dimensions and positioning */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200 mx-4">
                {/* ✅ Fixed width container with proper padding */}
                <div className="w-80 max-w-[90vw] max-h-[70vh] overflow-y-auto">
                  {/* ✅ Content area with consistent spacing */}
                  <div className="p-5 text-sm leading-relaxed">
                    {content}
                  </div>
                  
                  {/* ✅ Bottom action area */}
                  <div className="border-t border-gray-700 p-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        logger.debug('Close button clicked');
                        hideTooltip();
                      }}
                      className="w-full bg-gray-800 text-gray-200 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 active:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ✅ Desktop version with smart positioning
  return (
    <div className="group relative inline-block">
      <div className={className}>
        {children}
      </div>
      
      {/* ✅ Desktop tooltip with smart positioning */}
      <div 
        className={`absolute z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform group-hover:scale-100 scale-95 ${
          side === 'top' ? 'bottom-full mb-2' :
          side === 'bottom' ? 'top-full mt-2' :
          side === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
          side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
          'bottom-full mb-2'
        } ${
          align === 'start' ? 'left-0' :
          align === 'end' ? 'right-0' :
          side === 'left' || side === 'right' ? '' :
          'left-1/2 -translate-x-1/2'
        }`}
      >
        {/* ✅ Tooltip container with fixed dimensions */}
        <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
          {/* ✅ Fixed width container for square-ish appearance */}
          <div className="w-80 max-w-[85vw] p-4 text-sm leading-relaxed">
            {content}
          </div>
          
          {/* ✅ Arrow pointer with proper positioning */}
          {side === 'top' && (
            <div className={`absolute top-full ${
              align === 'start' ? 'left-4' :
              align === 'end' ? 'right-4' :
              'left-1/2 -translate-x-1/2'
            }`}>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
            </div>
          )}
          
          {side === 'bottom' && (
            <div className={`absolute bottom-full ${
              align === 'start' ? 'left-4' :
              align === 'end' ? 'right-4' :
              'left-1/2 -translate-x-1/2'
            }`}>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900"></div>
            </div>
          )}
          
          {side === 'left' && (
            <div className="absolute left-full top-1/2 -translate-y-1/2">
              <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent border-l-gray-900"></div>
            </div>
          )}
          
          {side === 'right' && (
            <div className="absolute right-full top-1/2 -translate-y-1/2">
              <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};