// src/utils/performance/componentOptimizations.tsx
// 🚀 ADVANCED REACT COMPONENT PERFORMANCE OPTIMIZATIONS
// React.memo, Memoization, Debounced Validation

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useState, 
  useEffect, 
  useRef, 
  forwardRef,
  ComponentType,
  PropsWithChildren,
  ReactElement
} from 'react';
// Native debounce implementation to avoid lodash-es dependency
import { logger } from '@/utils/logger';

// ===========================================
// 🛠️ NATIVE UTILITY FUNCTIONS
// ===========================================

/**
 * Native debounce implementation
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// ===========================================
// 🧠 SMART REACT.MEMO WRAPPERS
// ===========================================

/**
 * Enhanced React.memo with deep comparison for specific props
 */
export const createSmartMemo = <T extends Record<string, any>>(
  Component: ComponentType<T>,
  deepCompareProps: (keyof T)[] = [],
  displayName?: string
) => {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    // Quick shallow comparison first
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    for (const key of prevKeys) {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];
      
      // Deep comparison for specified props
      if (deepCompareProps.includes(key as keyof T)) {
        if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
          return false;
        }
      } else {
        // Shallow comparison for other props
        if (prevValue !== nextValue) return false;
      }
    }
    
    return true;
  });
  
  MemoizedComponent.displayName = displayName || `SmartMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * Memoize heavy table rows
 */
export const MemoizedTableRow = memo(({ 
  item, 
  index, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  columns,
  actions 
}: {
  item: any;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  columns: Array<{ key: string; render: (item: any) => React.ReactNode }>;
  actions?: Array<{ label: string; onClick: (item: any) => void }>;
}) => {
  const handleSelect = useCallback(() => onSelect(item.id), [item.id, onSelect]);
  const handleEdit = useCallback(() => onEdit(item), [item, onEdit]);
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);
  
  return (
    <tr className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="rounded"
        />
      </td>
      {columns.map((column) => (
        <td key={`${item.id}-${column.key}`} className="px-4 py-2">
          {column.render(item)}
        </td>
      ))}
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button onClick={handleEdit} className="text-blue-600 hover:text-blue-800">
            Edit
          </button>
          <button onClick={handleDelete} className="text-red-600 hover:text-red-800">
            Delete
          </button>
          {actions?.map((action, idx) => (
            <button
              key={idx}
              onClick={() => action.onClick(item)}
              className="text-gray-600 hover:text-gray-800"
            >
              {action.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for table row
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item.updated_at === nextProps.item.updated_at
  );
});

MemoizedTableRow.displayName = 'MemoizedTableRow';

/**
 * Memoized form field for heavy validations
 */
export const MemoizedFormField = memo(({
  name,
  label,
  value,
  error,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = ''
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-1
        `}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.disabled === nextProps.disabled
  );
});

MemoizedFormField.displayName = 'MemoizedFormField';


// ===========================================
// ⏰ DEBOUNCED VALIDATION HOOKS
// ===========================================

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface UseFormValidationOptions {
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useFormValidation = (
  initialValues: Record<string, string>,
  rules: Record<string, ValidationRule>,
  options: UseFormValidationOptions = {}
) => {
  const {
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true
  } = options;
  
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  
  // Validation function
  const validateField = useCallback((name: string, value: string): string | null => {
    const rule = rules[name];
    if (!rule) return null;
    
    // Required validation
    if (rule.required && (!value || value.trim() === '')) {
      return `${name} is required`;
    }
    
    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${name} must be no more than ${rule.maxLength} characters`;
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${name} format is invalid`;
    }
    
    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }
    
    return null;
  }, [rules]);
  
  // Debounced validation
  const debouncedValidation = useMemo(
    () => debounce((name: string, value: string) => {
      setIsValidating(true);
      
      // Simulate async validation delay
      setTimeout(() => {
        const error = validateField(name, value);
        setErrors(prev => ({
          ...prev,
          [name]: error || ''
        }));
        setIsValidating(false);
      }, 50);
    }, debounceMs),
    [validateField, debounceMs]
  );
  
  const setValue = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (validateOnChange) {
      debouncedValidation(name, value);
    }
  }, [validateOnChange, debouncedValidation]);
  
  const setTouchedField = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const value = values[name];
      debouncedValidation(name, value);
    }
  }, [validateOnBlur, values, debouncedValidation]);
  
  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(rules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
      }
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  }, [rules, values, validateField]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, [initialValues]);
  
  return {
    values,
    errors,
    touched,
    isValidating,
    setValue,
    setTouchedField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0 && !isValidating
  };
};

// ===========================================
// 🔧 PERFORMANCE MONITORING HOOKS
// ===========================================

export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (import.meta.env.DEV) {
      logger.debug(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
};

export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previousProps = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        logger.debug(`🔍 [Why-did-you-update] ${name}:`, changedProps);
      }
    }
    
    previousProps.current = props;
  });
};

// ===========================================
// 📊 USAGE EXAMPLES & PATTERNS
// ===========================================

/*
// Example 1: Smart memoization for table rows
const OptimizedPurchaseTable = createSmartMemo(PurchaseTable, ['purchases', 'filters'], 'OptimizedPurchaseTable');

// Example 2: Memoized table components
const MemoizedTable = createSmartMemo(PurchaseTable, ['purchases'], 'MemoizedPurchaseTable');

// Example 3: Debounced form validation
const { values, errors, setValue, setTouchedField, validateAll } = useFormValidation(
  { email: '', password: '' },
  {
    email: { required: true, pattern: /^\S+@\S+\.\S+$/ },
    password: { required: true, minLength: 8 }
  },
  { debounceMs: 500 }
);

// Example 4: Performance monitoring
const renderCount = useRenderCount('PurchaseTable');
useWhyDidYouUpdate('PurchaseTable', { purchases, filters, sortConfig });
*/

export default {
  createSmartMemo,
  MemoizedTableRow,
  MemoizedFormField,
  useFormValidation,
  useRenderCount,
  useWhyDidYouUpdate,
};
