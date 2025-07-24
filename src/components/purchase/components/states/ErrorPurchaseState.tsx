import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorPurchaseStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  className?: string;
}

const ErrorPurchaseState: React.FC<ErrorPurchaseStateProps> = ({
  title = 'Terjadi Kesalahan',
  message = 'Maaf, terjadi kesalahan saat memuat data pembelian.',
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  className = '',
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const errorMessage = error instanceof Error ? error.message : String(error || '');
  const errorStack = error instanceof Error ? error.stack : '';

  const handleReportError = () => {
    // In a real app, this would send error report to logging service
    console.error('Error reported:', { title, message, error });
    alert('Error telah dilaporkan. Terima kasih!');
  };

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {/* Error Icon */}
      <div className="relative mb-8">
        <div className="bg-red-100 rounded-full p-6 mb-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-2 animate-pulse">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      </div>

      {/* Error Content */}
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Error Details */}
        {(showDetails || errorMessage) && (
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-gray-500 hover:text-gray-700 mb-3"
            >
              <Bug className="h-4 w-4 mr-2" />
              {showErrorDetails ? 'Sembunyikan' : 'Tampilkan'} Detail Error
            </Button>
            
            {showErrorDetails && errorMessage && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Detail Error:
                </div>
                <div className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded border break-all">
                  {errorMessage}
                </div>
                {errorStack && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {errorStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
          )}
          
          {onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          )}
        </div>

        {/* Report Error */}
        <div className="mt-6">
          <Button
            onClick={handleReportError}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Bug className="h-4 w-4 mr-2" />
            Laporkan Error
          </Button>
        </div>
      </div>

      {/* Troubleshooting Tips */}
      <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-lg">
        <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          Langkah Pemecahan Masalah:
        </h4>
        <ul className="text-sm text-yellow-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">1.</span>
            <span>Periksa koneksi internet Anda</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">2.</span>
            <span>Refresh halaman atau coba lagi dalam beberapa menit</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">3.</span>
            <span>Pastikan browser Anda sudah up-to-date</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">4.</span>
            <span>Jika masalah berlanjut, hubungi administrator sistem</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorPurchaseState;