// src/components/assets/types/form.ts

import { AssetCategory, AssetCondition } from './asset';

export interface AssetFormData {
  nama: string;
  kategori: AssetCategory | '';
  nilaiAwal: number | '';
  nilaiSaatIni: number | '';
  tanggalPembelian: Date | null;
  kondisi: AssetCondition | '';
  lokasi: string;
  deskripsi: string;
  depresiasi: number | '';
}

export interface AssetFormErrors {
  nama?: string;
  kategori?: string;
  nilaiAwal?: string;
  nilaiSaatIni?: string;
  tanggalPembelian?: string;
  kondisi?: string;
  lokasi?: string;
  deskripsi?: string;
  depresiasi?: string;
}

export interface AssetFormState {
  data: AssetFormData;
  errors: AssetFormErrors;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface AssetFormMode {
  mode: 'create' | 'edit';
  assetId?: string;
}

export interface AssetFormActions {
  updateField: (field: keyof AssetFormData, value: any) => void;
  setErrors: (errors: AssetFormErrors) => void;
  clearErrors: () => void;
  resetForm: () => void;
  setFormData: (data: Partial<AssetFormData>) => void;
  validateForm: () => boolean;
  validateField: (field: keyof AssetFormData) => string | undefined;
}

export interface AssetFormConfig {
  initialData?: Partial<AssetFormData>;
  mode: 'create' | 'edit';
  assetId?: string;
  onSubmit: (data: AssetFormData) => Promise<void>;
  onCancel?: () => void;
}