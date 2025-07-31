// src/components/purchase/components/DataWarningBanner.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, X, Users, Package } from 'lucide-react';
import { DataWarningBannerProps } from '../types/purchase.types';

const DataWarningBanner: React.FC<DataWarningBannerProps> = ({
  missingSuppliers,
  missingBahanBaku,
  onDismiss,
}) => {
  if (!missingSuppliers && !missingBahanBaku) {
    return null;
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-start justify-between w-full">
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 mb-2">
            Data Belum Lengkap
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            Untuk pengalaman yang optimal dalam mengelola pembelian, sebaiknya lengkapi data berikut:
          </p>
          
          <ul className="space-y-2 text-sm text-amber-700">
            {missingSuppliers && (
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>
                  <a 
                    href="/supplier" 
                    className="font-medium underline hover:text-amber-800 transition-colors"
                  >
                    Data Supplier
                  </a>
                  {' '}- untuk mencatat pembelian dari vendor/pemasok
                </span>
              </li>
            )}
            {missingBahanBaku && (
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 flex-shrink-0" />
                <span>
                  <a 
                    href="/gudang" 
                    className="font-medium underline hover:text-amber-800 transition-colors"
                  >
                    Data Bahan Baku
                  </a>
                  {' '}- untuk mengelola stok yang dibeli
                </span>
              </li>
            )}
          </ul>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {missingSuppliers && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/supplier'}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Users className="h-3 w-3 mr-1" />
                Tambah Supplier
              </Button>
            )}
            {missingBahanBaku && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/gudang'}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Package className="h-3 w-3 mr-1" />
                Tambah Bahan Baku
              </Button>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-4 flex-shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup peringatan</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DataWarningBanner;