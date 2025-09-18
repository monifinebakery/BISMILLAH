// src/components/promoCalculator/components/steps/PromoStatusStep.tsx
// Step 3: Status and confirmation

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';
import type { PromoFormStepProps } from '../../types/promo.types';

interface PromoStatusStepProps extends PromoFormStepProps {
  // Empty for now, can be extended if needed
}

export const PromoStatusStep: React.FC<PromoStatusStepProps> = ({
  formData,
  stepErrors,
  onSelectChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-orange-500" />
          Status dan Konfirmasi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="status" className="text-base font-medium">
            Status Promo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.status || ''}
            onValueChange={(value) => {
              if (typeof onSelectChange === 'function') {
                onSelectChange('status', value);
              }
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">
                <div className="flex flex-col">
                  <span className="font-medium">Draft</span>
                  <span className="text-sm text-gray-500">Promo belum aktif, masih bisa diedit</span>
                </div>
              </SelectItem>
              <SelectItem value="aktif">
                <div className="flex flex-col">
                  <span className="font-medium">Aktif</span>
                  <span className="text-sm text-gray-500">Promo langsung berjalan</span>
                </div>
              </SelectItem>
              <SelectItem value="nonaktif">
                <div className="flex flex-col">
                  <span className="font-medium">Nonaktif</span>
                  <span className="text-sm text-gray-500">Promo tidak berjalan</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview Ringkasan */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Ringkasan Promo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nama:</span>
              <span className="font-medium">{formData.namaPromo || 'Belum diisi'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipe:</span>
              <span className="font-medium">
                {formData.tipePromo === 'discount' && 'Diskon Persentase'}
                {formData.tipePromo === 'bogo' && 'Buy One Get One'}
                {formData.tipePromo === 'bundle' && 'Paket Bundle'}
                {!formData.tipePromo && 'Belum dipilih'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Harga Normal:</span>
              <span className="font-medium">
                {formData.hargaProduk ? `Rp ${parseInt(formData.hargaProduk).toLocaleString('id-ID')}` : 'Belum diisi'}
              </span>
            </div>
            {formData.tipePromo === 'discount' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Diskon:</span>
                <span className="font-medium">{formData.nilaiDiskon || '0'}%</span>
              </div>
            )}
            {formData.tipePromo === 'bogo' && (
              <div className="flex justify-between">
                <span className="text-gray-600">BOGO:</span>
                <span className="font-medium">Beli {formData.beli || '1'} Gratis {formData.gratis || '1'}</span>
              </div>
            )}
            {formData.tipePromo === 'bundle' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Normal Bundle:</span>
                  <span className="font-medium">
                    {formData.hargaNormal ? `Rp ${parseInt(formData.hargaNormal).toLocaleString('id-ID')}` : 'Belum diisi'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Bundle:</span>
                  <span className="font-medium">
                    {formData.hargaBundle ? `Rp ${parseInt(formData.hargaBundle).toLocaleString('id-ID')}` : 'Belum diisi'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
