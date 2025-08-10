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
      <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
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
}; ''
              }`}
              min="0"
              disabled={isSubmitting}
            />
            {errors.nilaiSaatIni && (
              <p className="text-red-500 text-xs mt-1">{errors.nilaiSaatIni}</p>
            )}
          </div>
        </div>

        {/* Tanggal Pembelian */}
        <div>
          <Label htmlFor="tanggalPembelian" className="text-gray-700">
            Tanggal Pembelian *
          </Label>
          <Input
            id="tanggalPembelian"
            type="date"
            value={formatDateToYYYYMMDD(formData.tanggalPembelian)}
            onChange={(e) => onFieldChange('tanggalPembelian', safeParseDate(e.target.value))}
            className={`border-orange-200 focus:border-orange-400 ${
              errors.tanggalPembelian ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          {errors.tanggalPembelian && (
            <p className="text-red-500 text-xs mt-1">{errors.tanggalPembelian}</p>
          )}
        </div>

        {/* Depresiasi */}
        <div>
          <Label htmlFor="depresiasi" className="text-gray-700">
            Depresiasi (%)
          </Label>
          <Input
            id="depresiasi"
            type="number"
            value={getInputValue(formData.depresiasi)}
            onChange={(e) => onFieldChange('depresiasi', e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="0"
            className={`border-orange-200 focus:border-orange-400 ${
              errors.depresiasi ? 'border-red-500' : ''
            }`}
            min="0"
            max="100"
            step="0.1"
            disabled={isSubmitting}
          />
          {errors.depresiasi && (
            <p className="text-red-500 text-xs mt-1">{errors.depresiasi}</p>
          )}
        </div>

        {/* Kondisi & Lokasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kondisi" className="text-gray-700">
              Kondisi *
            </Label>
            <Select
              value={getInputValue(formData.kondisi) as string}
              onValueChange={(value) => onFieldChange('kondisi', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`border-orange-200 focus:border-orange-400 ${
                errors.kondisi ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Pilih kondisi" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CONDITIONS.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.kondisi && (
              <p className="text-red-500 text-xs mt-1">{errors.kondisi}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lokasi" className="text-gray-700">
              Lokasi *
            </Label>
            <Input
              id="lokasi"
              value={getInputValue(formData.lokasi)}
              onChange={(e) => onFieldChange('lokasi', e.target.value)}
              placeholder="Masukkan lokasi aset"
              className={`border-orange-200 focus:border-orange-400 ${
                errors.lokasi ? 'border-red-500' : ''
              }`}
              disabled={isSubmitting}
            />
            {errors.lokasi && (
              <p className="text-red-500 text-xs mt-1">{errors.lokasi}</p>
            )}
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <Label htmlFor="deskripsi" className="text-gray-700">
            Deskripsi
          </Label>
          <Textarea
            id="deskripsi"
            value={getInputValue(formData.deskripsi)}
            onChange={(e) => onFieldChange('deskripsi', e.target.value)}
            placeholder="Masukkan deskripsi aset"
            rows={3}
            className={`border-orange-200 focus:border-orange-400 ${
              errors.deskripsi ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          {errors.deskripsi && (
            <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
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