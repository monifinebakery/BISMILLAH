// src/components/assets/components/AssetForm.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AssetFormData, AssetFormErrors } from '../types';
import { AssetFormFields } from './AssetFormFields';

interface AssetFormProps {
  formData: AssetFormData;
  errors: AssetFormErrors;
  onFieldChange: (field: keyof AssetFormData, value: any) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  mode: 'create' | 'edit';
}

export const AssetForm: React.FC<AssetFormProps> = ({
  formData,
  errors,
  onFieldChange,
  onSubmit,
  onCancel,
  isSubmitting,
  canSubmit,
  mode,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto pr-4 -mr-4">
        <AssetFormFields
          formData={formData}
          errors={errors}
          onFieldChange={onFieldChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-300 mt-4">
        <Button
          type="submit"
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            mode === 'edit' ? 'Update' : 'Simpan'
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-gray-300 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Batal
        </Button>
      </div>
    </form>
  );
};