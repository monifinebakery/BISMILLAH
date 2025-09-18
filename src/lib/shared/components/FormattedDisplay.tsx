// src/lib/shared/components/FormattedDisplay.tsx
// Reusable components untuk menampilkan data terformat

import React from 'react';
import { 
  formatCurrency, 
  formatCompactCurrency,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  formatStatusBadge,
  getValueColor,
  formatTruncatedText
} from '../formatters';

// ==================== CURRENCY DISPLAY COMPONENTS ====================

interface CurrencyDisplayProps {
  value: number | null | undefined;
  compact?: boolean;
  compactThreshold?: number;
  className?: string;
  'data-testid'?: string;
}

/**
 * Display formatted currency with optional compact mode
 */
export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  compact = false,
  compactThreshold = 1000,
  className = '',
  'data-testid': testId
}) => {
  const formattedValue = compact
    ? formatCompactCurrency(value, { threshold: compactThreshold })
    : formatCurrency(value);

  return (
    <span className={className} data-testid={testId}>
      {formattedValue}
    </span>
  );
};

// ==================== PERCENTAGE DISPLAY ====================

interface PercentageDisplayProps {
  value: number | null | undefined;
  decimals?: number;
  showSign?: boolean;
  colorized?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Display formatted percentage with optional colorization
 */
export const PercentageDisplay: React.FC<PercentageDisplayProps> = ({
  value,
  decimals = 1,
  showSign = false,
  colorized = false,
  className = '',
  'data-testid': testId
}) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return <span className={className} data-testid={testId}>-</span>;
  }

  const formattedValue = formatPercentage(value, decimals);
  const sign = showSign && value > 0 ? '+' : '';
  
  let colorClass = '';
  if (colorized) {
    colorClass = getValueColor(value * 100); // Convert to percentage for color ranges
  }
  
  return (
    <span 
      className={`${className} ${colorClass}`.trim()} 
      data-testid={testId}
    >
      {sign}{formattedValue}
    </span>
  );
};

// ==================== STATUS BADGE COMPONENT ====================

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
  className?: string;
  'data-testid'?: string;
}

/**
 * Display status as a styled badge
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  variant = 'default',
  className = '',
  'data-testid': testId
}) => {
  const { text, className: statusClass } = formatStatusBadge(status);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const variantClasses = {
    default: 'border',
    outline: 'border-2 bg-transparent',
    solid: 'border-transparent'
  };
  
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${statusClass} ${className}`.trim()}
      data-testid={testId}
    >
      {text}
    </span>
  );
};

// ==================== DATE DISPLAY COMPONENTS ====================

interface DateDisplayProps {
  date: Date | string | null | undefined;
  style?: 'short' | 'medium' | 'long' | 'full';
  relative?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Display formatted date with optional relative time
 */
export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  style = 'medium',
  relative = false,
  className = '',
  'data-testid': testId
}) => {
  if (!date) {
    return <span className={className} data-testid={testId}>-</span>;
  }
  
  const formattedDate = relative 
    ? formatRelativeTime(date)
    : formatDate(date, style);
  
  return (
    <span className={className} data-testid={testId}>
      {formattedDate}
    </span>
  );
};

// ==================== TEXT DISPLAY COMPONENTS ====================

interface TruncatedTextProps {
  text: string;
  maxLength?: number | { sm?: number; md?: number; lg?: number };
  tooltip?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Display truncated text with optional tooltip
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLength = 50,
  tooltip = true,
  className = '',
  'data-testid': testId
}) => {
  const truncatedText = formatTruncatedText(text, maxLength);
  const isTruncated = text.length !== truncatedText.length;
  
  const content = (
    <span className={className} data-testid={testId}>
      {truncatedText}
    </span>
  );
  
  if (tooltip && isTruncated) {
    return (
      <span title={text}>
        {content}
      </span>
    );
  }
  
  return content;
};

// ==================== VALUE DISPLAY WITH COLOR ====================

interface ColorizedValueProps {
  value: number;
  formatter?: (value: number) => string;
  ranges?: {
    excellent?: number;
    good?: number;
    warning?: number;
  };
  className?: string;
  'data-testid'?: string;
}

/**
 * Display value with color based on ranges
 */
export const ColorizedValue: React.FC<ColorizedValueProps> = ({
  value,
  formatter = (v) => v.toString(),
  ranges,
  className = '',
  'data-testid': testId
}) => {
  const colorClass = getValueColor(value, ranges);
  const formattedValue = formatter(value);
  
  return (
    <span 
      className={`${className} ${colorClass}`.trim()} 
      data-testid={testId}
    >
      {formattedValue}
    </span>
  );
};

// ==================== COMPOSITE STAT CARD ====================

interface StatCardProps {
  label: string;
  value: number | string;
  formatter?: 'currency' | 'percentage' | 'number' | 'custom';
  customFormatter?: (value: any) => string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  compact?: boolean;
  colorized?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Reusable stat card component with formatting
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  formatter = 'number',
  customFormatter,
  trend,
  icon,
  compact = false,
  colorized = false,
  className = '',
  'data-testid': testId
}) => {
  const formatValue = (val: number | string) => {
    if (customFormatter) {
      return customFormatter(val);
    }
    
    if (typeof val === 'string') {
      return val;
    }
    
    switch (formatter) {
      case 'currency':
        return compact ? formatCompactCurrency(val) : formatCurrency(val);
      case 'percentage':
        return formatPercentage(val);
      case 'number':
        return val.toLocaleString('id-ID');
      default:
        return val.toString();
    }
  };
  
  const formattedValue = formatValue(value);
  const valueColorClass = colorized && typeof value === 'number' 
    ? getValueColor(value) 
    : '';
  
  return (
    <div 
      className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`.trim()}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <p className={`text-2xl font-bold ${valueColorClass || 'text-gray-900'}`}>
              {formattedValue}
            </p>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        </div>
        
        {icon && (
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center ml-4 flex-shrink-0">
            <div className="text-orange-600 w-6 h-6 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== EXPORTS ====================

export {
  // Individual components
  CurrencyDisplay,
  PercentageDisplay,
  StatusBadge,
  DateDisplay,
  TruncatedText,
  ColorizedValue,
  StatCard
};

// Grouped export for easy importing
export const FormattedDisplayComponents = {
  Currency: CurrencyDisplay,
  Percentage: PercentageDisplay,
  Status: StatusBadge,
  Date: DateDisplay,
  Text: TruncatedText,
  ColorizedValue,
  StatCard
};

export default FormattedDisplayComponents;