// src/components/invoice/components/PaymentInstructions.tsx
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PaymentInstructionsProps {
  paymentInstructions: string;
  setPaymentInstructions: (instructions: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  className?: string;
}

export const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
  paymentInstructions,
  setPaymentInstructions,
  notes,
  setNotes,
  className = ''
}) => {
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Payment Instructions */}
      <div>
        <Label className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 block">
          Instruksi Pembayaran
        </Label>
        <Textarea 
          value={paymentInstructions} 
          onChange={e => setPaymentInstructions(e.target.value)} 
          className="text-gray-700 border-gray-300 focus:border-blue-500 text-xs sm:text-sm"
          rows={4}
        />
        <div className="export-text text-gray-700 text-sm whitespace-pre-line">
          {paymentInstructions}
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <Label className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 block">
          Catatan Tambahan
        </Label>
        <Textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          className="text-gray-700 border-gray-300 focus:border-blue-500 text-xs sm:text-sm"
          rows={3}
        />
        <div className="export-text text-gray-700 text-sm whitespace-pre-line">
          {notes}
        </div>
      </div>
    </div>
  );
};