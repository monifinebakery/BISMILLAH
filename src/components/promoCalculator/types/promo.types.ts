// src/components/promoCalculator/types/promo.types.ts
// Types and interfaces for PromoFullCalculator components

export interface PromoCalculationResult {
  finalPrice: number;
  promoMargin: number;
  savings: number;
  profit: number;
}

export interface PromoFormData {
  namaPromo: string;
  tipePromo: string;
  status: string;
  deskripsi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  hargaProduk: string;
  hpp: string;
  nilaiDiskon: string;
  resepUtama: string;
  resepGratis: string;
  beli: string;
  gratis: string;
  hargaNormal: string;
  hargaBundle: string;
}

export interface PromoStep {
  id: number;
  title: string;
  description: string;
}

export interface PromoValidationError {
  [stepId: number]: string[];
}

export interface PromoDataForOrder {
  kodePromo: string;
  tipePromo: string;
  totalDiskon: number;
  hargaSetelahDiskon: number;
  calculatedAt: string;
  saved?: boolean;
}

export type PromoType = 'discount' | 'bogo' | 'bundle';
export type PromoStatus = 'draft' | 'aktif' | 'nonaktif';

// Props interfaces for components
export interface PromoWizardProps {
  steps: PromoStep[];
  currentStep: number;
  completedSteps: number[];
  stepErrors: PromoValidationError;
  onStepClick: (step: number) => void;
}

export interface PromoFormStepProps {
  formData: PromoFormData;
  stepErrors: string[];
  onInputChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
    value?: string
  ) => void;
  onSelectChange?: (name: string, value: string) => void;
}

export interface PromoCalculationDisplayProps {
  calculationResult: PromoCalculationResult;
}

export interface PromoNavigationProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepErrors: PromoValidationError;
  isCalculating: boolean;
  isSaving: boolean;
  calculationResult: PromoCalculationResult | null;
  onPrevStep: () => void;
  onNextStep: () => void;
  onCalculate: () => void;
  onSave: () => void;
}

// Query keys
export const PROMO_QUERY_KEYS = {
  all: ['promos'] as const,
  detail: (id: string) => [...PROMO_QUERY_KEYS.all, 'detail', id] as const,
} as const;