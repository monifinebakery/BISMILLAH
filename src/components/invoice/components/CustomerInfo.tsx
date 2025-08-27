// src/components/invoice/components/CustomerInfo.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Customer } from '../types';

interface CustomerInfoProps {
  customer: Customer;
  setCustomer: (customer: Customer) => void;
  className?: string;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ 
  customer, 
  setCustomer, 
  className = '' 
}) => {
  const updateCustomer = (field: keyof Customer, value: string) => {
    setCustomer({ ...customer, [field]: value });
  };

  return (
    <div className={className}>
      <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
        Ditagihkan Kepada:
      </h3>
      
      <div className="space-y-3">
        <div>
          <Input 
            placeholder="Nama Pelanggan" 
            value={customer.name} 
            onChange={e => updateCustomer('name', e.target.value)} 
            className="font-bold text-base sm:text-lg border-gray-500 focus:border-blue-500"
          />
          <div className="export-text font-bold text-lg">{customer.name}</div>
        </div>
        
        <div>
          <Textarea 
            placeholder="Alamat Pelanggan" 
            value={customer.address} 
            onChange={e => updateCustomer('address', e.target.value)} 
            className="text-gray-600 border-gray-500 focus:border-blue-500"
            rows={3}
          />
          <div className="export-text text-gray-600 whitespace-pre-line">
            {customer.address}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-gray-600 mb-1 block">Telepon</Label>
            <Input 
              placeholder="Telepon" 
              value={customer.phone} 
              onChange={e => updateCustomer('phone', e.target.value)} 
              className="text-gray-600 border-gray-500 focus:border-blue-500"
            />
            <div className="export-text text-gray-600">{customer.phone}</div>
          </div>
          
          <div>
            <Label className="text-sm text-gray-600 mb-1 block">Email</Label>
            <Input 
              placeholder="Email" 
              type="email"
              value={customer.email} 
              onChange={e => updateCustomer('email', e.target.value)} 
              className="text-gray-600 border-gray-500 focus:border-blue-500"
            />
            <div className="export-text text-gray-600">{customer.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};