import { Recipe, NewRecipe } from '@/types/recipe';

export interface BahanResep {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

export interface RecipeFormData extends Partial<NewRecipe> {
  bahanResep: BahanResep[];
}

export interface RecipeFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: Record<string, string>;
}

export interface RecipeCalculationState {
  totalHpp: number;
  hppPerPorsi: number;
  hppPerPcs?: number;
  profitPerPorsi: number;
  profitPerPcs?: number;
  marginPercentage: number;
  recommendedPricePerPorsi: number;
  recommendedPricePerPcs?: number;
  isValid: boolean;
  errors: string[];
}

export interface RecipeFormStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isValid: boolean;
  component: React.ComponentType<any>;
}

export interface RecipeFormActions {
  updateField: (field: keyof NewRecipe, value: any) => void;
  addIngredient: () => void;
  updateIngredient: (index: number, field: keyof BahanResep, value: any) => void;
  removeIngredient: (index: number) => void;
  validateForm: () => boolean;
  handleSubmit: () => Promise<boolean>;
  handleCancel: () => void;
  resetForm: () => void;
}

export interface RecipeFormState {
  formData: RecipeFormData;
  validation: RecipeFormValidation;
  calculation: RecipeCalculationState;
  isDirty: boolean;
  isSubmitting: boolean;
  currentStep: number;
}