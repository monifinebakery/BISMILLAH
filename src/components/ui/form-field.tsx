import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  name: string;
  value: any;
  onChange: ((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | ((value: string) => void);
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  icon?: LucideIcon;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'url';
}

interface NumberFieldProps extends BaseFieldProps {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  mobileOptimized?: boolean;
}

interface DateFieldProps extends BaseFieldProps {
  type: 'date';
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  onChange: (value: string) => void;
}

type FormFieldProps = 
  | TextFieldProps 
  | NumberFieldProps 
  | DateFieldProps 
  | TextareaFieldProps 
  | SelectFieldProps;

const FormField: React.FC<FormFieldProps> = (props) => {
  const {
    label,
    name,
    value,
    onChange,
    error,
    helpText,
    required = false,
    disabled = false,
    placeholder,
    className,
    icon: Icon,
    type
  } = props;

  const baseInputClassName = cn(
    error && 'border-red-500 focus-visible:border-red-500',
    'input-mobile-safe',
    Icon && 'pl-10'
  );

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        const textareaProps = props as TextareaFieldProps;
        return (
          <Textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
            placeholder={placeholder}
            disabled={disabled}
            rows={textareaProps.rows || 3}
            className={baseInputClassName}
          />
        );

      case 'select':
        const selectProps = props as SelectFieldProps;
        return (
          <Select 
            value={value || ''} 
            onValueChange={onChange as (value: string) => void}
            disabled={disabled}
          >
            <SelectTrigger className={cn(baseInputClassName, Icon && 'pl-10')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectProps.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-gray-500">{option.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        const numberProps = props as NumberFieldProps;
        const mobileAttrs = numberProps.mobileOptimized ? {
          inputMode: "decimal" as const,
          pattern: "[0-9]*"
        } : {};
        
        return (
          <Input
            id={name}
            name={name}
            type="number"
            value={value || ''}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            placeholder={placeholder}
            disabled={disabled}
            min={numberProps.min}
            max={numberProps.max}
            step={numberProps.step}
            className={baseInputClassName}
            mobileOptimized={numberProps.mobileOptimized}
            {...mobileAttrs}
          />
        );

      default:
        return (
          <Input
            id={name}
            name={name}
            type={type}
            value={value || ''}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClassName}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label 
        htmlFor={name} 
        className={cn(
          'text-sm font-medium text-gray-700 text-overflow-safe',
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}
      >
        {label}
      </Label>

      {/* Input Container */}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        )}
        {renderInput()}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1 text-overflow-safe">
          {error}
        </p>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-gray-500 text-xs mt-1 text-overflow-safe">
          {helpText}
        </p>
      )}
    </div>
  );
};

export { FormField };
export type { FormFieldProps };