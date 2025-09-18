// src/components/supplier/SupplierFormNew.tsx
// Contoh refactor menggunakan shared components baru

import React from 'react';
import { FormField, ActionButtons } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSupplierForm } from './hooks/useSupplierForm';
import { ChefHat, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import type { Supplier } from '@/types/supplier';

interface SupplierFormProps {
  supplier: Supplier | null;
  onSuccess?: (supplier: Supplier) => void;
  onCancel?: () => void;
  className?: string;
}

const SupplierFormNew: React.FC<SupplierFormProps> = ({ 
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
    isEditing,
    isLoading
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
    <form onSubmit={onSubmit} className={cn("space-y-4 dialog-no-overflow", className)}>
      <div className="dialog-responsive-grid gap-y-3 sm:gap-y-4">
        
        {/* Nama Supplier - Required */}
        <div className="sm:col-span-2">
          <FormField
            type="text"
            name="nama"
            label="Nama Supplier"
            value={formData.nama}
            onChange={(e) => updateField('nama', e.target.value)}
            error={formErrors.nama}
            placeholder="Masukkan nama supplier"
            icon={ChefHat}
            required
            disabled={isLoading}
          />
        </div>
        
        {/* Nama Kontak - Required */}
        <div className="sm:col-span-2">
          <FormField
            type="text"
            name="kontak"
            label="Nama Kontak"
            value={formData.kontak}
            onChange={(e) => updateField('kontak', e.target.value)}
            error={formErrors.kontak}
            placeholder="Masukkan nama kontak"
            icon={User}
            required
            disabled={isLoading}
          />
        </div>
        
        {/* Email - Optional */}
        <div>
          <FormField
            type="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={formErrors.email}
            placeholder="email@contoh.com"
            icon={Mail}
            disabled={isLoading}
            helpText="Email tidak wajib diisi, namun jika diisi harap gunakan format yang benar"
          />
        </div>
        
        {/* Telepon - Optional */}
        <div>
          <FormField
            type="text"
            name="telepon"
            label="Telepon"
            value={formData.telepon}
            onChange={(e) => updateField('telepon', e.target.value)}
            error={formErrors.telepon}
            placeholder="08xx-xxxx-xxxx"
            icon={Phone}
            disabled={isLoading}
          />
        </div>
        
        {/* Alamat - Optional */}
        <div className="sm:col-span-2">
          <FormField
            type="text"
            name="alamat"
            label="Alamat"
            value={formData.alamat}
            onChange={(e) => updateField('alamat', e.target.value)}
            placeholder="Masukkan alamat lengkap"
            icon={MapPin}
            disabled={isLoading}
          />
        </div>
        
        {/* Catatan - Optional */}
        <div className="sm:col-span-2">
          <FormField
            type="textarea"
            name="catatan"
            label="Catatan"
            value={formData.catatan}
            onChange={(e) => updateField('catatan', e.target.value)}
            placeholder="Catatan tambahan tentang supplier"
            icon={FileText}
            disabled={isLoading}
            rows={2}
          />
        </div>
      </div>
      
      {/* Info Note */}
      <div className="bg-blue-50 p-3 rounded-lg mt-4 dialog-no-overflow">
        <p className="text-sm text-blue-700 text-overflow-safe">
          <span className="font-medium">Catatan:</span> Hanya Nama Supplier dan Nama Kontak yang wajib diisi. Field lainnya bersifat opsional.
        </p>
      </div>
      
      {/* Form Actions - Using shared component */}
      <ActionButtons
        onCancel={onReset}
        onSubmit={() => {}} // Form submission handled by form onSubmit
        submitText={isEditing ? 'Perbarui' : 'Simpan'}
        isLoading={isLoading}
        className="mt-6"
      />
    </form>
  );
};

export default SupplierFormNew;