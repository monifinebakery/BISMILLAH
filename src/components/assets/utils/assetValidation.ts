// src/components/assets/utils/assetValidation.ts

import { AssetFormData, AssetFormErrors } from '../types';
import { FORM_VALIDATION_RULES, ASSET_CATEGORIES, ASSET_CONDITIONS } from './assetConstants';

/**
 * Validate individual form field
 */
export const validateField = (field: keyof AssetFormData, value: any): string | undefined => {
  const rules = FORM_VALIDATION_RULES[field];
  
  switch (field) {
    case 'nama':
      if (rules.required && (!value || String(value).trim() === '')) {
        return 'Nama aset wajib diisi';
      }
      if (String(value).trim().length > rules.maxLength) {
        return `Nama aset maksimal ${rules.maxLength} karakter`;
      }
      break;
      
    case 'kategori':
      if (rules.required && !value) {
        return 'Kategori aset wajib dipilih';
      }
      if (value && !ASSET_CATEGORIES.some(cat => cat.value === value)) {
        return 'Kategori tidak valid';
      }
      break;
      
    case 'nilaiAwal':
      if (rules.required && (value === '' || value === null || value === undefined)) {
        return 'Nilai awal wajib diisi';
      }
      if (value !== '' && value !== null && value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Nilai awal harus berupa angka';
        }
        if (numValue < rules.min) {
          return `Nilai awal minimal ${rules.min}`;
        }
      }
      break;
      
    case 'nilaiSaatIni':
      if (rules.required && (value === '' || value === null || value === undefined)) {
        return 'Nilai sekarang wajib diisi';
      }
      if (value !== '' && value !== null && value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Nilai sekarang harus berupa angka';
        }
        if (numValue < rules.min) {
          return `Nilai sekarang minimal ${rules.min}`;
        }
      }
      break;
      
    case 'tanggalPembelian':
      if (rules.required && !value) {
        return 'Tanggal pembelian wajib diisi';
      }
      if (value && !(value instanceof Date)) {
        return 'Format tanggal tidak valid';
      }
      if (value instanceof Date && isNaN(value.getTime())) {
        return 'Tanggal tidak valid';
      }
      if (value instanceof Date && value > new Date()) {
        return 'Tanggal pembelian tidak boleh di masa depan';
      }
      break;
      
    case 'kondisi':
      if (rules.required && !value) {
        return 'Kondisi aset wajib dipilih';
      }
      if (value && !ASSET_CONDITIONS.some(cond => cond.value === value)) {
        return 'Kondisi tidak valid';
      }
      break;
      
    case 'lokasi':
      if (rules.required && (!value || String(value).trim() === '')) {
        return 'Lokasi aset wajib diisi';
      }
      if (String(value).trim().length > rules.maxLength) {
        return `Lokasi aset maksimal ${rules.maxLength} karakter`;
      }
      break;
      
    case 'deskripsi':
      if (value && String(value).length > rules.maxLength) {
        return `Deskripsi maksimal ${rules.maxLength} karakter`;
      }
      break;
      
    case 'depresiasi':
      // Depresiasi is optional, so null, undefined, and empty string are all valid
      if (value !== '' && value !== null && value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Depresiasi harus berupa angka';
        }
        if (numValue < rules.min) {
          return `Depresiasi minimal ${rules.min}%`;
        }
        if (numValue > rules.max) {
          return `Depresiasi maksimal ${rules.max}%`;
        }
      }
      break;
      
    default:
      break;
  }
  
  return undefined;
};

/**
 * Validate entire form data
 */
export const validateForm = (formData: AssetFormData): AssetFormErrors => {
  const errors: AssetFormErrors = {};
  
  // Validate each field
  (Object.keys(formData) as Array<keyof AssetFormData>).forEach(field => {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  // Cross-field validations
  if (formData.nilaiAwal !== '' && formData.nilaiSaatIni !== '' && 
      typeof formData.nilaiAwal === 'number' && typeof formData.nilaiSaatIni === 'number') {
    if (formData.nilaiSaatIni > formData.nilaiAwal) {
      errors.nilaiSaatIni = 'Nilai sekarang tidak boleh lebih besar dari nilai awal';
    }
  }
  
  return errors;
};

/**
 * Check if form is valid (no errors)
 */
export const isFormValid = (errors: AssetFormErrors): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Check if form has required fields filled
 */
export const hasRequiredFields = (formData: AssetFormData): boolean => {
  const requiredFields: Array<keyof AssetFormData> = [
    'nama', 'kategori', 'nilaiAwal', 'nilaiSaatIni', 'tanggalPembelian', 'kondisi', 'lokasi'
  ];
  
  return requiredFields.every(field => {
    const value = formData[field];
    if (field === 'tanggalPembelian') {
      return value instanceof Date && !isNaN(value.getTime());
    }
    return value !== '' && value !== null && value !== undefined;
  });
};

/**
 * Sanitize form data before submission
 */
export const sanitizeFormData = (formData: AssetFormData): AssetFormData => {
  return {
    ...formData,
    nama: String(formData.nama).trim(),
    lokasi: String(formData.lokasi).trim(),
    deskripsi: String(formData.deskripsi).trim(),
  };
};

/**
 * Check if form data has changed from initial state
 */
export const hasFormChanged = (
  currentData: AssetFormData, 
  initialData: AssetFormData
): boolean => {
  const fields: Array<keyof AssetFormData> = [
    'nama', 'kategori', 'nilaiAwal', 'nilaiSaatIni', 'tanggalPembelian', 
    'kondisi', 'lokasi', 'deskripsi', 'depresiasi'
  ];
  
  return fields.some(field => {
    const current = currentData[field];
    const initial = initialData[field];
    
    if (field === 'tanggalPembelian') {
      const currentTime = current instanceof Date ? current.getTime() : null;
      const initialTime = initial instanceof Date ? initial.getTime() : null;
      return currentTime !== initialTime;
    }
    
    return current !== initial;
  });
};