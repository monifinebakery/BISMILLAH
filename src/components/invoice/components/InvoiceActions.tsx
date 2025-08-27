// src/components/invoice/components/InvoiceActions.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Download } from 'lucide-react';

interface InvoiceActionsProps {
  onBack?: () => void;
  onDownload: () => void;
  orderId?: string;
  orderNumber?: string;
  className?: string;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  onBack,
  onDownload,
  orderId,
  orderNumber,
  className = ''
}) => {
  return (
    <Card className={`print:hidden border border-gray-500 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button
                variant="secondary"
                size="icon"
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <FileText className="h-8 w-8" />
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {orderId ? 'Invoice dari Pesanan' : 'Invoice Generator'}
              </CardTitle>
              {orderId && (
                <div className="text-blue-100 text-xs sm:text-sm space-y-1">
                  <p>Order ID: {orderId}</p>
                  {orderNumber && (
                    <p>Pesanan: {orderNumber}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={onDownload}
              className="bg-white text-orange-600 hover:bg-gray-400 text-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Gambar
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};