// src/components/invoice/components/AutoGenerateButton.tsx
// Button component for auto-generating invoices from orders
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Wand2, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoiceFromOrder } from '../api/invoiceManagement';
import { useNavigate } from 'react-router-dom';

interface AutoGenerateButtonProps {
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  totalAmount?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showOrderInfo?: boolean;
}

export const AutoGenerateButton: React.FC<AutoGenerateButtonProps> = ({
  orderId,
  orderNumber,
  customerName,
  totalAmount,
  className = '',
  size = 'default',
  variant = 'default',
  showOrderInfo = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerateInvoice = async () => {
    if (!orderId) {
      toast.error('Order ID tidak valid');
      return;
    }

    setIsGenerating(true);
    try {
      toast.loading('Membuat invoice otomatis...', { id: 'generate-invoice' });
      
      const invoice = await generateInvoiceFromOrder(orderId);
      
      toast.success(
        `Invoice ${invoice.invoiceNumber} berhasil dibuat!`,
        { id: 'generate-invoice' }
      );

      // Navigate to the generated invoice
      setTimeout(() => {
        navigate(`/invoice/${orderId}?invoice_id=${invoice.id}`);
      }, 1500);

    } catch (error) {
      toast.error(
        `Gagal membuat invoice: ${error instanceof Error ? error.message : String(error)}`,
        { id: 'generate-invoice' }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!showOrderInfo) {
    // Simple button mode
    return (
      <Button
        onClick={handleGenerateInvoice}
        disabled={isGenerating}
        size={size}
        variant={variant}
        className={className}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Membuat...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Buat Invoice
          </>
        )}
      </Button>
    );
  }

  // Card mode with order information
  return (
    <Card className={`border-dashed border-2 hover:border-solid transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Generate Invoice</CardTitle>
          </div>
          <Badge variant="outline">Otomatis</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Order Info */}
        <div className="text-sm text-gray-600 space-y-1">
          {orderNumber && (
            <div className="flex justify-between">
              <span>Pesanan:</span>
              <span className="font-medium">{orderNumber}</span>
            </div>
          )}
          {customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-medium">{customerName}</span>
            </div>
          )}
          {totalAmount && (
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-medium">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            className="flex-1"
            size={size}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Membuat...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Buat Invoice
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size={size}
            onClick={() => navigate(`/invoice/${orderId}`)}
            className="px-3"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Tips */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 Invoice akan dibuat otomatis dengan data dari pesanan ini
        </div>
      </CardContent>
    </Card>
  );
};
