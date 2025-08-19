// src/components/supplier/SupplierForm.tsx
// Reusable form component for supplier data

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupplierForm } from './hooks/useSupplierForm';
import type { Supplier } from '@/types/supplier';

interface SupplierFormProps {
  supplier: Supplier | null;
  onSuccess?: (supplier: Supplier) => void;
  onCancel?: () => void;
  className?: string;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ 
  supplier, 
  onSuccess, 
  onCancel,
  className 
}) => {
  const {
    formData,
    formErrors,
    handleSubmit,
    resetForm,
    updateField,
    isEditing
  } = useSupplierForm(supplier, onSuccess);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  const onReset = () => {
    resetForm();
    onCancel?.();
  };

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {/* Nama Supplier - Required */}
        <div className="md:col-span-2">
          <Label htmlFor="nama" className="font-medium">
            Nama Supplier <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nama"
            value={formData.nama}
            onChange={(e) => updateField('nama', e.target.value)}
            placeholder="Masukkan nama supplier"
            required
            className={cn("mt-1", formErrors.nama && "border-red-500")}
          />
          {formErrors.nama && (
            <p className="text-red-500 text-sm mt-1">{formErrors.nama}</p>
          )}
        </div>
        
        {/* Nama Kontak - Required */}
        <div className="md:col-span-2">
          <Label htmlFor="kontak" className="font-medium">
            Nama Kontak <span className="text-red-500">*</span>
          </Label>
          <Input
            id="kontak"
            value={formData.kontak}
            onChange={(e) => updateField('kontak', e.target.value)}
            placeholder="Masukkan nama kontak"
            required
            className={cn("mt-1", formErrors.kontak && "border-red-500")}
          />
          {formErrors.kontak && (
            <p className="text-red-500 text-sm mt-1">{formErrors.kontak}</p>
          )}
        </div>
        
        {/* Email - Optional */}
        <div>
          <Label htmlFor="email" className="font-medium">
            Email <span className="text-gray-400 text-sm">(opsional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="email@contoh.com"
            className={cn("mt-1", formErrors.email && "border-red-500")}
          />
          {formErrors.email && (
            <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Email tidak wajib diisi, namun jika diisi harap gunakan format yang benar
          </p>
        </div>
        
        {/* Telepon - Optional */}
        <div>
          <Label htmlFor="telepon" className="font-medium">
            Telepon <span className="text-gray-400 text-sm">(opsional)</span>
          </Label>
          <Input
            id="telepon"
            type="tel"
            value={formData.telepon}
            onChange={(e) => updateField('telepon', e.target.value)}
            placeholder="08xx-xxxx-xxxx"
            className={cn("mt-1", formErrors.telepon && "border-red-500")}
          />
          {formErrors.telepon && (
            <p className="text-red-500 text-sm mt-1">{formErrors.telepon}</p>
          )}
        </div>
        
        {/* Alamat - Optional */}
        <div className="md:col-span-2">
          <Label htmlFor="alamat" className="font-medium">
            Alamat <span className="text-gray-400 text-sm">(opsional)</span>
          </Label>
          <Input
            id="alamat"
            value={formData.alamat}
            onChange={(e) => updateField('alamat', e.target.value)}
            placeholder="Masukkan alamat lengkap"
            className="mt-1"
          />
        </div>
        
        {/* Catatan - Optional */}
        <div className="md:col-span-2">
          <Label htmlFor="catatan" className="font-medium">
            Catatan <span className="text-gray-400 text-sm">(opsional)</span>
          </Label>
          <Input
            id="catatan"
            value={formData.catatan}
            onChange={(e) => updateField('catatan', e.target.value)}
            placeholder="Catatan tambahan tentang supplier"
            className="mt-1"
          />
        </div>
      </div>
      
      {/* Info Note */}
      <div className="bg-blue-50 p-3 rounded-lg mt-4">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Catatan:</span> Hanya Nama Supplier dan Nama Kontak yang wajib diisi. Field lainnya bersifat opsional.
        </p>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onReset}>
          Batal
        </Button>
        <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
          {isEditing ? 'Perbarui' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;