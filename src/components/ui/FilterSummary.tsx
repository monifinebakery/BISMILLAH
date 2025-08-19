// src/components/ui/FilterSummary.tsx
// 🏷️ FILTER SUMMARY COMPONENT - Shows active filters with badges

import React from 'react';
import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterItem {
  key: string;
  label: string;
  value: string;
  type: 'search' | 'status' | 'date' | 'category' | 'custom';
}

export interface FilterSummaryProps {
  filters: FilterItem[];
  onRemoveFilter: (filterKey: string) => void;
  onClearAll: () => void;
  className?: string;
  showClearAll?: boolean;
  showIcon?: boolean;
  variant?: 'default' | 'compact' | 'card';
  color?: 'orange' | 'blue' | 'green' | 'purple';
}

// 🎨 Filter Badge Component
const FilterBadge: React.FC<{
  filter: FilterItem;
  onRemove: (key: string) => void;
  color: string;
}> = ({ filter, onRemove, color }) => {
  const colorClasses = {
    orange: {
      badge: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-150',
      button: 'text-orange-600 hover:text-orange-800 hover:bg-orange-200'
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-150',
      button: 'text-blue-600 hover:text-blue-800 hover:bg-blue-200'
    },
    green: {
      badge: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-150',
      button: 'text-green-600 hover:text-green-800 hover:bg-green-200'
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-150',
      button: 'text-purple-600 hover:text-purple-800 hover:bg-purple-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.orange;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "flex items-center gap-2 px-3 py-1 text-sm font-medium transition-colors duration-200",
        colors.badge
      )}
    >
      <span className="truncate max-w-48">
        <span className="font-semibold">{filter.label}:</span>{' '}
        <span className="font-normal">{filter.value}</span>
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(filter.key);
        }}
        className={cn(
          "ml-1 rounded-full p-0.5 transition-colors duration-200 hover:scale-110",
          colors.button
        )}
        aria-label={`Remove ${filter.label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
};

// 🏷️ Main FilterSummary Component
export const FilterSummary: React.FC<FilterSummaryProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  className,
  showClearAll = true,
  showIcon = true,
  variant = 'default',
  color = 'orange'
}) => {
  // Don't render if no filters
  if (!filters || filters.length === 0) {
    return null;
  }

  const colorClasses = {
    orange: {
      container: 'bg-orange-50 border-orange-200',
      text: 'text-orange-800',
      button: 'text-orange-700 hover:text-orange-900 hover:bg-orange-100'
    },
    blue: {
      container: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800', 
      button: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
    },
    green: {
      container: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      button: 'text-green-700 hover:text-green-900 hover:bg-green-100'
    },
    purple: {
      container: 'bg-purple-50 border-purple-200',
      text: 'text-purple-800',
      button: 'text-purple-700 hover:text-purple-900 hover:bg-purple-100'
    }
  };

  const colors = colorClasses[color];

  // 🎨 Variant Styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'p-2 rounded-md',
          content: 'gap-1',
          text: 'text-xs'
        };
      case 'card':
        return {
          container: 'p-4 rounded-lg border',
          content: 'gap-3',
          text: 'text-sm'
        };
      default:
        return {
          container: 'p-3 rounded-lg',
          content: 'gap-2',
          text: 'text-sm'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div 
      className={cn(
        "border transition-all duration-200",
        colors.container,
        variantStyles.container,
        className
      )}
    >
      <div className={cn("flex flex-wrap items-center", variantStyles.content)}>
        {/* Filter Icon & Label */}
        <div className={cn("flex items-center gap-2 font-medium", colors.text, variantStyles.text)}>
          {showIcon && <Filter className="h-4 w-4" />}
          <span>
            {variant === 'compact' ? 'Filter:' : 'Filter aktif:'}
          </span>
        </div>

        {/* Filter Badges */}
        <div className={cn("flex flex-wrap items-center", variantStyles.content)}>
          {filters.map((filter) => (
            <FilterBadge
              key={filter.key}
              filter={filter}
              onRemove={onRemoveFilter}
              color={color}
            />
          ))}
        </div>

        {/* Clear All Button */}
        {showClearAll && filters.length > 1 && (
          <Button
            variant="ghost"
            size={variant === 'compact' ? 'sm' : 'sm'}
            onClick={onClearAll}
            className={cn(
              "h-6 px-2 transition-colors duration-200",
              colors.button,
              variantStyles.text
            )}
          >
            <X className="h-3 w-3 mr-1" />
            {variant === 'compact' ? 'Clear' : 'Clear All'}
          </Button>
        )}
      </div>

      {/* Optional: Filter Count for many filters */}
      {filters.length > 5 && (
        <div className={cn("mt-2 pt-2 border-t border-current border-opacity-20", variantStyles.text)}>
          <span className={cn("font-medium", colors.text)}>
            Total {filters.length} filter aktif
          </span>
        </div>
      )}
    </div>
  );
};

// 🎯 Helper function to create filter items
export const createFilterItem = (
  key: string,
  label: string, 
  value: string,
  type: FilterItem['type'] = 'custom'
): FilterItem => ({
  key,
  label,
  value,
  type
});

// 🎯 Helper function to create common filter items
export const createCommonFilters = (filterData: {
  searchTerm?: string;
  statusFilter?: string;
  statusLabel?: string;
  dateRangeText?: string;
  categoryFilter?: string;
  categoryLabel?: string;
}): FilterItem[] => {
  const filters: FilterItem[] = [];

  if (filterData.searchTerm) {
    filters.push(createFilterItem('search', 'Pencarian', filterData.searchTerm, 'search'));
  }

  if (filterData.statusFilter && filterData.statusFilter !== 'all') {
    filters.push(createFilterItem('status', 'Status', filterData.statusLabel || filterData.statusFilter, 'status'));
  }

  if (filterData.dateRangeText) {
    filters.push(createFilterItem('date', 'Tanggal', filterData.dateRangeText, 'date'));
  }

  if (filterData.categoryFilter && filterData.categoryFilter !== 'all') {
    filters.push(createFilterItem('category', 'Kategori', filterData.categoryLabel || filterData.categoryFilter, 'category'));
  }

  return filters;
};

export default FilterSummary;