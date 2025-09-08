// src/components/profitAnalysis/components/ErrorDisplay.tsx
// User-friendly error display for profit analysis

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Info,
  RefreshCw 
} from 'lucide-react';
import { translateProfitError, TranslatedError } from '../utils/errorTranslator';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  variant = 'inline'
}) => {
  if (!error) return null;

  const translatedError: TranslatedError = translateProfitError(error);

  const getIcon = () => {
    switch (translatedError.severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getAlertVariant = (): "default" | "destructive" => {
    return translatedError.severity === 'critical' || translatedError.severity === 'high' 
      ? 'destructive' 
      : 'default';
  };

  const getContainerClasses = () => {
    const base = className;
    
    switch (variant) {
      case 'card':
        return `${base} p-6 border rounded-lg`;
      case 'banner':
        return `${base} p-4 border-l-4 border-orange-500 bg-orange-50`;
      default:
        return base;
    }
  };

  const getBorderColorClass = () => {
    switch (translatedError.severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-orange-200 bg-orange-50';
    }
  };

  if (variant === 'card') {
    return (
      <div className={`${getContainerClasses()} ${getBorderColorClass()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {translatedError.message}
            </h3>
            {translatedError.description && (
              <p className="text-gray-600 mb-4">
                {translatedError.description}
              </p>
            )}
            <div className="flex space-x-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{translatedError.actionable?.text || 'Coba Lagi'}</span>
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                >
                  Tutup
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert variant={getAlertVariant()} className={`${getContainerClasses()} ${getBorderColorClass()}`}>
      {getIcon()}
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <strong className="font-semibold">{translatedError.message}</strong>
            {translatedError.description && (
              <p className="text-sm mt-1 opacity-90">
                {translatedError.description}
              </p>
            )}
          </div>
          
          {(onRetry || onDismiss) && (
            <div className="flex space-x-2 pt-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{translatedError.actionable?.text || 'Coba Lagi'}</span>
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                >
                  Tutup
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
