// src/components/invoice/templates/InvoiceTemplate.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  InvoiceHeader, 
  CustomerInfo, 
  ItemsTable, 
  TotalsSection, 
  PaymentInstructions 
} from '../components';
import { useInvoiceCalculations } from '../hooks';
import type { InvoiceData, InvoiceItem } from '../types';

interface InvoiceTemplateProps {
  data: InvoiceData;
  onDataChange: (data: Partial<InvoiceData>) => void;
  onItemChange: (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => void;
  onAddItem: () => void;
  onRemoveItem: (id: number) => void;
  onBack?: () => void;
  orderId?: string;
  orderNumber?: string;
  className?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  data,
  onDataChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onBack,
  orderId,
  orderNumber,
  className = ''
}) => {
  const calculations = useInvoiceCalculations(data.items, data.discount, data.tax, data.shipping);

  return (
    <Card 
      className={`border-2 border-gray-300 overflow-hidden invoice-content ${className}`} 
      id="invoice-content"
      style={{ backgroundColor: 'white', color: 'black' }}
    >
      <div className="bg-white p-4 sm:p-8" style={{ backgroundColor: 'white', color: 'black' }}>
        {/* Invoice Header */}
        <InvoiceHeader
          invoiceNumber={data.invoiceNumber}
          setInvoiceNumber={(value) => onDataChange({ invoiceNumber: value })}
          issueDate={data.issueDate}
          setIssueDate={(date) => onDataChange({ issueDate: date })}
          dueDate={data.dueDate}
          setDueDate={(date) => onDataChange({ dueDate: date })}
          status={data.status}
          setStatus={(status) => onDataChange({ status })}
          onBack={onBack}
          orderId={orderId}
          orderNumber={orderNumber}
        />

        {/* Customer and Status Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <CustomerInfo
            customer={data.customer}
            setCustomer={(customer) => onDataChange({ customer })}
          />
        </div>

        {/* Items Table */}
        <ItemsTable
          items={data.items}
          onItemChange={onItemChange}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />

        {/* Bottom Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {/* Payment Instructions & Notes */}
          <PaymentInstructions
            paymentInstructions={data.paymentInstructions}
            setPaymentInstructions={(instructions) => onDataChange({ paymentInstructions: instructions })}
            notes={data.notes}
            setNotes={(notes) => onDataChange({ notes })}
          />
          
          {/* Totals */}
          <TotalsSection
            calculations={calculations}
            discount={data.discount}
            setDiscount={(discount) => onDataChange({ discount })}
            tax={data.tax}
            setTax={(tax) => onDataChange({ tax })}
            shipping={data.shipping}
            setShipping={(shipping) => onDataChange({ shipping })}
          />
        </div>
      </div>
    </Card>
  );
};