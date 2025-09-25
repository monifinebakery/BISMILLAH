// src/components/ui/CurrencyInput.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSafeCurrency } from '@/hooks/useSafeCurrency';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  prefix?: string;
  thousandSeparator?: string;
  allowNegative?: boolean;
  onValueChange?: (formattedValue: string, value: number) => void;
  debounceMs?: number;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({
    className,
    value = 0,
    onChange,
    prefix,
    thousandSeparator = '.',
    allowNegative = false,
    onValueChange,
    placeholder,
    disabled,
    debounceMs = 300,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { formatCurrency } = useSafeCurrency();

    const defaultPrefix = useMemo(() => {
      try {
        const formatted = formatCurrency?.(0) ?? '';
        const match = formatted.match(/^[^0-9-]+/);
        if (match && match[0].trim().length > 0) {
          return match[0];
        }
      } catch (error) {
        console.warn('CurrencyInput: unable to derive prefix from context', error);
      }
      return 'Rp ';
    }, [formatCurrency]);

    const effectivePrefix = prefix ?? defaultPrefix;

    const escapeRegex = useCallback(
      (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      []
    );

    const formatNumber = useCallback((num: number | string): string => {
      if (num === '' || num === null || num === undefined) {
        return '';
      }

      const numValue = typeof num === 'string' ? parseFloat(num) || 0 : num;
      if (numValue === 0) {
        return '';
      }

      return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    }, []);

    const parseNumber = useCallback((str: string): number => {
      if (!str) {
        return 0;
      }

      let cleanStr = str;

      if (effectivePrefix) {
        cleanStr = cleanStr.replace(new RegExp(`^${escapeRegex(effectivePrefix)}`), '');
      }

      if (thousandSeparator) {
        cleanStr = cleanStr.replace(new RegExp(escapeRegex(thousandSeparator), 'g'), '');
      }

      cleanStr = cleanStr
        .replace(/[^0-9,-]/g, '')
        .replace(',', '.');

      const num = parseFloat(cleanStr) || 0;
      return allowNegative ? num : Math.max(0, num);
    }, [allowNegative, effectivePrefix, escapeRegex, thousandSeparator]);

    const emitChange = useCallback((nextValue: number) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        onChange(nextValue);
      }, debounceMs);
    }, [debounceMs, onChange]);

    useEffect(() => {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0);
      
      if (!isFocused) {
        setDisplayValue(formatNumber(numValue));
      }
    }, [value, isFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseNumber(inputValue);
      
      setDisplayValue(inputValue.replace(effectivePrefix, ''));
      
      // Use debounced onChange while typing for better performance
      emitChange(numericValue);
      
      if (onValueChange) {
        onValueChange(inputValue, numericValue);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Show raw number for editing
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0);
      if (numValue === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(numValue.toString());
      }
      
      // Select all text for easy editing
      setTimeout(() => {
        e.target.select();
      }, 0);
      
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      const numericValue = parseNumber(displayValue);
      onChange(numericValue);

      setDisplayValue(formatNumber(numericValue));
      
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey) ||
          (e.keyCode === 67 && e.ctrlKey) ||
          (e.keyCode === 86 && e.ctrlKey) ||
          (e.keyCode === 88 && e.ctrlKey) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
        return;
      }
      
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
      
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    // Combine refs
    const combinedRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const formattedPlaceholder = placeholder ? 
      (placeholder.includes(effectivePrefix) ? placeholder : `${effectivePrefix}${placeholder}`) : 
      `${effectivePrefix}0`;

    return (
      <div className="relative">
        {!isFocused && displayValue && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none z-10 text-sm">
            {effectivePrefix}
          </span>
        )}
        <input
          {...props}
          ref={combinedRef}
          type="text"
          inputMode="numeric"
          value={isFocused ? displayValue : displayValue ? `${effectivePrefix}${displayValue}` : ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={formattedPlaceholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50",
            !isFocused && displayValue ? "pl-8" : "",
            className
          )}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
