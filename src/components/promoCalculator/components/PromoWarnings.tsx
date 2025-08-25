import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const PromoWarnings = ({ warnings = [], className = '' }: any) => {
  if (!warnings || warnings.length === 0) return null;

  const getWarningIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getWarningStyle = (type, severity) => {
    if (type === 'error' || severity === 'high') {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (type === 'warning' || severity === 'medium') {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border flex items-start space-x-2 ${getWarningStyle(warning.type, warning.severity)}`}
        >
          {getWarningIcon(warning.type)}
          <p className="text-sm font-medium">{warning.message}</p>
        </div>
      ))}
    </div>
  );
};

export default PromoWarnings;