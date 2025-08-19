// Custom hook for form state management and validation

import { useState } from 'react';
import { toast } from 'sonner';
import { useSupplier } from '@/contexts/SupplierContext';
import type { Supplier, SupplierFormData } from '@/types/supplier';

export const useSupplierForm = (
  supplier: Supplier | null,
  onSuccess?: (supplier: Supplier) => void
) => {
  const { addSupplier, updateSupplier } = useSupplier();
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState<SupplierFormData>({
    nama: supplier?.nama || '',
    kontak: supplier?.kontak || '',
    email: supplier?.email || '',
    telepon: supplier?.telepon || '',
    alamat: supplier?.alamat || '',
    catatan: supplier?.catatan || '',
  });

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.nama.trim()) {
      errors.nama = 'Nama supplier wajib diisi';
    }
    
    if (!formData.kontak.trim()) {
      errors.kontak = 'Nama kontak wajib diisi';
    }
    
    // Email validation only if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    // Validate phone number if provided
    if (formData.telepon.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.telepon)) {
      errors.telepon = 'Format nomor telepon tidak valid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!validateForm()) {
      toast.error('Mohon periksa kembali data yang diisi');
      return false;
    }

    // Clean data before saving
    const dataToSave = { 
      ...formData, 
      email: formData.email.trim() || null,
      telepon: formData.telepon.trim() || null,
      alamat: formData.alamat.trim() || null,
      catatan: formData.catatan.trim() || null 
    };
    
    const result = supplier
      ? await updateSupplier(supplier.id, dataToSave)
      : await addSupplier(dataToSave);

    if (result) {
      setFormErrors({});
      onSuccess?.(result);
      return true;
    }

    return false;
  };

  const resetForm = () => {
    setFormData({
      nama: supplier?.nama || '',
      kontak: supplier?.kontak || '',
      email: supplier?.email || '',
      telepon: supplier?.telepon || '',
      alamat: supplier?.alamat || '',
      catatan: supplier?.catatan || '',
    });
    setFormErrors({});
  };

  const updateField = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    formErrors,
    handleSubmit,
    resetForm,
    updateField,
    isEditing: !!supplier
  };
};