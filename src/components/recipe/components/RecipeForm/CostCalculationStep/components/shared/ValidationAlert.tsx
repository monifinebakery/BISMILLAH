// src/components/recipe/components/RecipeForm/CostCalculationStep/components/shared/ValidationAlert.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react';
import type { ValidationErrors } from '../../utils/types';

interface ValidationAlertProps {
  errors?: ValidationErrors;
  additionalErrors?: string[];
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  className?: string;
}

export const ValidationAlert: React.FC<ValidationAlertProps> = ({
  errors = {},
  additionalErrors = [],
  type = 'error',
  title,
  className = ""
}) => {
  const errorMessages = [
    ...Object.values(errors).filter(Boolean),
    ...additionalErrors
  ];

  if (errorMessages.length === 0) return null;

  const getAlertConfig = () => {
    switch (type) {
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          Icon: AlertCircle,
          defaultTitle: 'Perbaiki kesalahan berikut:'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          Icon: AlertCircle,
          defaultTitle: 'Perhatian:'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          textColor: 'text-green-700',
          Icon: CheckCircle,
          defaultTitle: 'Berhasil:'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700',
          Icon: Info,
          defaultTitle: 'Informasi:'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          textColor: 'text-gray-700',
          Icon: Info,
          defaultTitle: 'Pemberitahuan:'
        };
    }
  };

  const config = getAlertConfig();
  const { bgColor, borderColor, iconColor, titleColor, textColor, Icon, defaultTitle } = config;

  return (
    <Card className={`${borderColor} ${bgColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <p className={`${titleColor} font-medium mb-2`}>
              {title || defaultTitle}
            </p>
            
            {errorMessages.length === 1 ? (
              <p className={`text-sm ${textColor}`}>
                {errorMessages[0]}
              </p>
            ) : (
              <ul className={`text-sm ${textColor} space-y-1`}>
                {errorMessages.map((message, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-current mt-1">•</span>
                    <span className="flex-1">{message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Specific validation alert for cost calculation
interface CostValidationAlertProps {
  validationErrors: ValidationErrors;
  overheadError?: string | null;
  className?: string;
}

export const CostValidationAlert: React.FC<CostValidationAlertProps> = ({
  validationErrors,
  overheadError,
  className
}) => {
  const additionalErrors = overheadError ? [`Overhead: ${overheadError}`] : [];
  
  return (
    <ValidationAlert
      errors={validationErrors}
      additionalErrors={additionalErrors}
      type="error"
      title="Perbaiki kesalahan berikut:"
      className={className}
    />
  );
};