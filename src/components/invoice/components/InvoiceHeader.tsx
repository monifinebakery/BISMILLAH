// src/components/invoice/components/InvoiceHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatDateForInput } from '../utils';
import { StatusBadge } from './StatusBadge';
import type { InvoiceStatus } from '../types';

interface InvoiceHeaderProps {
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  issueDate: Date;
  setIssueDate: (date: Date) => void;
  dueDate: Date;
  setDueDate: (date: Date) => void;
  status: InvoiceStatus;
  setStatus: (status: InvoiceStatus) => void;
  onBack?: () => void;
  orderId?: string;
  orderNumber?: string;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  invoiceNumber,
  setInvoiceNumber,
  issueDate,
  setIssueDate,
  dueDate,
  setDueDate,
  status,
  setStatus,
  onBack,
  orderId,
  orderNumber
}) => {
  const { settings } = useUserSettings();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8 mb-6 sm:mb-8 pb-4 sm:pb-8 border-b-2 border-gray-500">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-4">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {settings.businessName || 'Nama Bisnis Anda'}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              {settings.ownerName || 'Nama Pemilik'}
            </p>
          </div>
        </div>
        
        <div className="mt-2 space-y-1 text-xs sm:text-sm text-gray-500">
          <p>{settings.address || 'Alamat Bisnis'}</p>
          <p>{settings.phone || 'Telepon Bisnis'}</p>
          <p>{settings.email || 'Email Bisnis'}</p>
        </div>

        {orderId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Order ID:</span> {orderId}
            </p>
            {orderNumber && (
              <p className="text-sm text-blue-700">
                <span className="font-medium">Pesanan:</span> {orderNumber}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end">
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-4">
          INVOICE
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 min-w-[280px]">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
            <Label className="text-gray-600 font-medium">No. Invoice:</Label>
            <div>
              <Input 
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)} 
                className="text-right font-mono bg-transparent border-none p-0 h-auto"
              />
              <span className="export-text text-right font-mono text-sm block">{invoiceNumber}</span>
            </div>
            
            <Label className="text-gray-600 font-medium">Tanggal:</Label>
            <div>
              <Input 
                type="date" 
                value={formatDateForInput(issueDate)} 
                onChange={e => setIssueDate(new Date(e.target.value))} 
                className="text-right bg-transparent border-none p-0 h-auto"
              />
              <span className="export-text text-right text-sm block">
                {issueDate.toLocaleDateString('id-ID')}
              </span>
            </div>
            
            <Label className="text-gray-600 font-medium">Jatuh Tempo:</Label>
            <div>
              <Input 
                type="date" 
                value={formatDateForInput(dueDate)} 
                onChange={e => setDueDate(new Date(e.target.value))} 
                className="text-right bg-transparent border-none p-0 h-auto"
              />
              <span className="export-text text-right text-sm block">
                {dueDate.toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <Label className="text-gray-600 font-medium mb-2 block">Status:</Label>
            <Select value={status} onValueChange={(value: InvoiceStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BELUM LUNAS">BELUM LUNAS</SelectItem>
                <SelectItem value="LUNAS">LUNAS</SelectItem>
                <SelectItem value="JATUH TEMPO">JATUH TEMPO</SelectItem>
              </SelectContent>
            </Select>
            <div className="export-text block">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};