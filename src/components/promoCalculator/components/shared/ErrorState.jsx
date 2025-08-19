import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorState = ({ error, onRetry }) => (
  <div className="text-center py-12 space-y-4">
    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
    <p className="text-gray-600">{error?.message || 'Terjadi kesalahan'}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        Coba Lagi
      </Button>
    )}
  </div>
);

export default ErrorState;
