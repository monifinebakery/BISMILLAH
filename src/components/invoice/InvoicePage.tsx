// src/components/invoice/InvoicePage.tsx
import React, { Suspense, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  useOrderQuery,
  useInvoiceForm,
  useInvoiceCalculations,
  useInvoiceImage
} from './hooks';
import { InvoiceActions } from './components';
import { InvoiceTemplate } from './templates';

// Loading Component
const InvoiceLoading: React.FC<{ orderId?: string }> = ({ orderId }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Memuat data pesanan...</p>
      {orderId && <p className="text-sm text-gray-500 mt-1">Order ID: {orderId}</p>}
    </div>
  </div>
);

// Error Component
const InvoiceError: React.FC<{ error: Error; onBack: () => void; onRetry: () => void }> = ({ 
  error, 
  onBack, 
  onRetry 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-red-800 text-xl font-semibold mb-3">Gagal Memuat Pesanan</h2>
      <p className="text-red-600 mb-6 leading-relaxed">
        {error?.message || 'Terjadi kesalahan saat memuat data pesanan'}
      </p>
      <div className="space-y-2">
        <button 
          onClick={onBack}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Kembali
        </button>
        <button 
          onClick={onRetry}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  </div>
);

// Main Invoice Page Component
const InvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  // ✅ Fetch order data using React Query
  const {
    data: orderData,
    isLoading,
    error,
    isError,
    refetch
  } = useOrderQuery(orderId);

  // ✅ Form management
  const {
    // Form state
    invoiceNumber,
    setInvoiceNumber,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    customer,
    setCustomer,
    items,
    setItems,
    discount,
    setDiscount,
    tax,
    setTax,
    shipping,
    setShipping,
    notes,
    setNotes,
    paymentInstructions,
    setPaymentInstructions,
    status,
    setStatus,

    // Item handlers
    handleItemChange,
    addItem,
    removeItem,

    // Form actions
    getFormData,

    // Validation
    errors
  } = useInvoiceForm({ orderData });

  // ✅ Calculations
  const calculations = useInvoiceCalculations(items, discount, tax, shipping);

  // ✅ Download image functionality
  const { handleDownloadImage } = useInvoiceImage();

  // ✅ Handle form data changes
  const handleDataChange = (changes: any) => {
    Object.entries(changes).forEach(([key, value]) => {
      switch (key) {
        case 'invoiceNumber':
          setInvoiceNumber(value as string);
          break;
        case 'issueDate':
          setIssueDate(value as Date);
          break;
        case 'dueDate':
          setDueDate(value as Date);
          break;
        case 'customer':
          setCustomer(value as any);
          break;
        case 'items':
          setItems(value as any);
          break;
        case 'discount':
          setDiscount(value as any);
          break;
        case 'tax':
          setTax(value as any);
          break;
        case 'shipping':
          setShipping(value as number);
          break;
        case 'notes':
          setNotes(value as string);
          break;
        case 'paymentInstructions':
          setPaymentInstructions(value as string);
          break;
        case 'status':
          setStatus(value as any);
          break;
      }
    });
  };

  // ✅ Error handling
  useEffect(() => {
    if (isError && error) {
      logger.error('InvoicePage: Error loading order data:', error);
      toast.error('Gagal memuat data pesanan: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [isError, error]);

  // ✅ Success message when order data loads
  useEffect(() => {
    if (orderData) {
      logger.context('InvoicePage', 'Order data loaded successfully:', orderData.nomorPesanan);
      toast.success('Data pesanan berhasil dimuat');
    }
  }, [orderData]);

  // ✅ Validation feedback
  useEffect(() => {
    if (errors.length > 0) {
      const firstError = errors[0];
      toast.error(firstError.message);
    }
  }, [errors]);

  // ✅ Navigation handlers
  const handleBack = () => navigate(-1);
  const handleRetry = () => {
    refetch();
  };

  // ✅ Loading state
  if (isLoading) {
    return <InvoiceLoading orderId={orderId} />;
  }

  // ✅ Error state
  if (isError && orderId) {
    return (
      <InvoiceError 
        error={error as Error} 
        onBack={handleBack} 
        onRetry={handleRetry} 
      />
    );
  }

  // ✅ Main render
  return (
    <>
      {/* CSS untuk print dan export */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { margin: 0; padding: 0; }
          .invoice-content { box-shadow: none !important; border: none !important; }
        }
        @page {
          size: A4;
          margin: 16mm;
        }
        
        /* Export specific styles */
        #invoice-content {
          background-color: white !important;
          color: black !important;
        }
        #invoice-content * {
          background-color: transparent !important;
          color: inherit !important;
        }
        #invoice-content .bg-white {
          background-color: white !important;
        }
        #invoice-content .text-white {
          color: black !important;
        }
        
        /* Export mode - hide form inputs and show static text */
        .export-mode input,
        .export-mode select,
        .export-mode button,
        .export-mode textarea {
          display: none !important;
        }
        .export-mode .export-text {
          display: block !important;
        }
        .export-text {
          display: none;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Action Header */}
          <InvoiceActions
            onBack={handleBack}
            onDownload={handleDownloadImage}
            orderId={orderId}
            orderNumber={orderData?.nomorPesanan}
          />

          {/* Invoice Template */}
          <Suspense fallback={<InvoiceLoading />}>
            <InvoiceTemplate
              data={getFormData()}
              onDataChange={handleDataChange}
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onBack={handleBack}
              orderId={orderId}
              orderNumber={orderData?.nomorPesanan}
            />
          </Suspense>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="print:hidden bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-800 font-semibold mb-2">Validasi Error:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error instanceof Error ? error.message : String(error)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InvoicePage;