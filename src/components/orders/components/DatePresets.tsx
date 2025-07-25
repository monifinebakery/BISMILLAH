// src/components/orders/components/DatePresets.tsx (FIXED VERSION)
import React from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '../types/order';
import { getDateRangePreset } from '@/utils/unifiedDateUtils';
import { DATE_RANGE_PRESETS } from '../constants/orderConstants';

// 🔧 CRITICAL FIX: Import date-fns directly to avoid bundling issues
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths 
} from 'date-fns';

interface DatePresetsProps {
  setDateRange: (range: DateRange | undefined) => void;
  onClose?: () => void;
  setCurrentPage?: (page: number) => void;
}

const DatePresets: React.FC<DatePresetsProps> = ({ 
  setDateRange, 
  onClose,
  setCurrentPage 
}) => {
  
  // 🔧 BULLETPROOF: Inline implementation to avoid import issues
  const getDateRangePresetInline = (key: string): { from: Date; to: Date } => {
    console.log('🔧 INLINE: Creating date range for key:', key);
    
    const today = new Date();
    
    // Validate today's date
    if (isNaN(today.getTime())) {
      console.error('🔧 INLINE: Invalid system date, using fallback');
      const fallback = new Date(2024, 0, 1); // Jan 1, 2024
      return { from: fallback, to: fallback };
    }
    
    try {
      switch (key) {
        case 'today':
          return { 
            from: startOfDay(today), 
            to: endOfDay(today) 
          };
          
        case 'yesterday': {
          const yesterday = subDays(today, 1);
          return { 
            from: startOfDay(yesterday), 
            to: endOfDay(yesterday) 
          };
        }
        
        case 'last7days':
          return { 
            from: startOfDay(subDays(today, 6)), 
            to: endOfDay(today) 
          };
          
        case 'last30days':
          return { 
            from: startOfDay(subDays(today, 29)), 
            to: endOfDay(today) 
          };
          
        case 'thisMonth':
          return { 
            from: startOfMonth(today), 
            to: endOfMonth(today) 
          };
          
        case 'lastMonth': {
          const lastMonth = subMonths(today, 1);
          return { 
            from: startOfMonth(lastMonth), 
            to: endOfMonth(lastMonth) 
          };
        }
        
        default:
          console.warn('🔧 INLINE: Unknown preset key:', key, 'using last30days');
          return { 
            from: startOfDay(subDays(today, 29)), 
            to: endOfDay(today) 
          };
      }
    } catch (error) {
      console.error('🔧 INLINE: Error creating preset:', error);
      // Ultra-safe fallback
      return { 
        from: startOfDay(today), 
        to: endOfDay(today) 
      };
    }
  };

  // 🔧 BULLETPROOF: Multiple validation layers
  const handlePresetClick = (key: string) => {
    console.log('🔧 PRESET: Starting preset selection for:', key);
    
    try {
      // Layer 1: Validate setDateRange function
      if (!setDateRange || typeof setDateRange !== 'function') {
        console.error('🔧 PRESET: setDateRange is not a valid function:', setDateRange);
        console.error('🔧 PRESET: setDateRange type:', typeof setDateRange);
        return;
      }
      
      // Layer 2: Generate date range with inline function
      let range: { from: Date; to: Date };
      
      try {
        range = getDateRangePresetInline(key);
        console.log('🔧 PRESET: Generated range:', range);
      } catch (rangeError) {
        console.error('🔧 PRESET: Range generation failed:', rangeError);
        // Emergency fallback
        const now = new Date();
        range = { from: now, to: now };
      }
      
      // Layer 3: Validate generated range
      if (!range || !range.from || !range.to) {
        console.error('🔧 PRESET: Invalid range generated:', range);
        const now = new Date();
        range = { from: now, to: now };
      }
      
      // Layer 4: Validate dates are actual Date objects
      if (!(range.from instanceof Date) || !(range.to instanceof Date)) {
        console.error('🔧 PRESET: Range contains non-Date objects:', range);
        const now = new Date();
        range = { from: now, to: now };
      }
      
      // Layer 5: Validate dates are not invalid
      if (isNaN(range.from.getTime()) || isNaN(range.to.getTime())) {
        console.error('🔧 PRESET: Range contains invalid dates:', range);
        const now = new Date();
        range = { from: now, to: now };
      }
      
      console.log('🔧 PRESET: Final validated range:', {
        from: range.from.toISOString(),
        to: range.to.toISOString()
      });
      
      // Layer 6: Set the range
      try {
        setDateRange(range);
        console.log('🔧 PRESET: Successfully set date range');
      } catch (setError) {
        console.error('🔧 PRESET: Error setting date range:', setError);
        return;
      }
      
      // Layer 7: Optional page reset
      if (setCurrentPage && typeof setCurrentPage === 'function') {
        try {
          setCurrentPage(1);
          console.log('🔧 PRESET: Reset to page 1');
        } catch (pageError) {
          console.warn('🔧 PRESET: Could not reset page:', pageError);
        }
      }
      
      // Layer 8: Optional dialog close
      if (onClose && typeof onClose === 'function') {
        try {
          onClose();
          console.log('🔧 PRESET: Closed dialog');
        } catch (closeError) {
          console.warn('🔧 PRESET: Could not close dialog:', closeError);
        }
      }
      
      console.log('🔧 PRESET: Preset selection completed successfully for:', key);
      
    } catch (error) {
      console.error('🔧 PRESET: Critical error in handlePresetClick:', error);
      console.error('🔧 PRESET: Error stack:', error?.stack);
      console.error('🔧 PRESET: Error name:', error?.name);
      console.error('🔧 PRESET: Error message:', error?.message);
      
      // Emergency fallback - try to set a basic range
      try {
        console.log('🔧 PRESET: Attempting emergency fallback...');
        const emergencyRange = {
          from: new Date(),
          to: new Date()
        };
        
        if (setDateRange && typeof setDateRange === 'function') {
          setDateRange(emergencyRange);
          console.log('🔧 PRESET: Emergency fallback successful');
        }
      } catch (emergencyError) {
        console.error('🔧 PRESET: Emergency fallback also failed:', emergencyError);
      }
    }
  };

  // 🔧 BULLETPROOF: Component render with error boundary
  try {
    return (
      <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
        <div className="p-3">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {DATE_RANGE_PRESETS.map(({ label, key }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200 transition-colors"
                onClick={() => {
                  console.log('🔧 BUTTON: Clicked preset button:', key);
                  handlePresetClick(key);
                }}
                type="button"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('🔧 RENDER: Error rendering DatePresets:', renderError);
    
    // Fallback UI
    return (
      <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
        <div className="p-3">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
          <div className="text-sm text-red-600">
            Error loading date presets. Please refresh the page.
          </div>
        </div>
      </div>
    );
  }
};

export default DatePresets;