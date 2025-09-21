// src/components/promoCalculator/components/steps/PromoSettingsStep.tsx
// Step 2: Promo settings and configuration

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Info } from 'lucide-react';
import type { PromoFormStepProps } from '../../types/promo.types';

export const PromoSettingsStep: React.FC<PromoFormStepProps> = ({
  formData,
  stepErrors,
  onInputChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-500" />
          Pengaturan Promo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Harga Dasar */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">Informasi Harga Dasar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hargaProduk" className="text-base font-medium">
                Harga Jual Normal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hargaProduk"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.hargaProduk}
                onChange={(e) => onInputChange(e)}
                placeholder="50000"
                className={`mt-1 ${
                  stepErrors?.some(error => error.includes('Harga produk')) 
                    ? 'border-red-500 focus:border-red-500' 
                    : formData.hargaProduk && parseFloat(formData.hargaProduk) > 0 
                    ? 'border-green-500' 
                    : ''
                }`}
              />
              <p className="text-sm text-gray-500 mt-1">
                Harga jual produk sebelum promo
              </p>
            </div>
            <div>
              <Label htmlFor="hpp" className="text-base font-medium flex items-center gap-2">
                HPP (Harga Pokok Penjualan) <span className="text-red-500">*</span>
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Biaya produksi + operasional per unit
                  </div>
                </div>
              </Label>
              <Input
                id="hpp"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.hpp}
                onChange={onInputChange}
                placeholder="30000"
                className={`mt-1 ${
                  stepErrors?.some(error => error.includes('HPP')) 
                    ? 'border-red-500 focus:border-red-500' 
                    : formData.hpp && parseFloat(formData.hpp) > 0 && formData.hargaProduk && parseFloat(formData.hpp) < parseFloat(formData.hargaProduk)
                    ? 'border-green-500' 
                    : ''
                }`}
              />
              <p className="text-sm text-gray-500 mt-1">
                💡 HPP harus lebih kecil dari harga jual untuk mendapat profit
              </p>
            </div>
          </div>
        </div>

        {/* Pengaturan Spesifik Tipe Promo */}
        {formData.tipePromo === 'discount' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-3">Pengaturan Diskon</h3>
            <div>
              <Label htmlFor="nilaiDiskon" className="text-base font-medium">
                Persentase Diskon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nilaiDiskon"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.nilaiDiskon}
                onChange={onInputChange}
                placeholder="25"
                min="0"
                max="100"
                className={`mt-1 ${
                  stepErrors?.some(error => error.includes('Nilai diskon')) 
                    ? 'border-red-500 focus:border-red-500' 
                    : formData.nilaiDiskon && parseFloat(formData.nilaiDiskon) > 0 && parseFloat(formData.nilaiDiskon) <= 100
                    ? 'border-green-500' 
                    : ''
                }`}
              />
              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⚠️ Diskon terlalu besar dapat mengurangi profit secara signifikan
                </p>
              </div>
            </div>
          </div>
        )}

        {formData.tipePromo === 'bogo' && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-3">Pengaturan Buy One Get One</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beli" className="text-base font-medium">
                    Jumlah Beli <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="beli"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.beli}
                    onChange={onInputChange}
                    placeholder="2"
                    min="1"
                    className={`mt-1 ${
                      stepErrors?.some(error => error.includes('Jumlah beli')) 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.beli && parseInt(formData.beli) > 0
                        ? 'border-green-500' 
                        : ''
                    }`}
                  />
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-800">
                      💡 Contoh: Beli 2 Gratis 1 = customer beli 2, dapat 1 gratis
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="gratis" className="text-base font-medium">
                    Jumlah Gratis <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gratis"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.gratis}
                    onChange={onInputChange}
                    placeholder="1"
                    min="1"
                    className={`mt-1 ${
                      stepErrors?.some(error => error.includes('Jumlah gratis')) 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.gratis && parseInt(formData.gratis) > 0
                        ? 'border-green-500' 
                        : ''
                    }`}
                  />
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-800">
                      💡 Produk gratis yang akan diberikan kepada customer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.tipePromo === 'bundle' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-3">Pengaturan Bundle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hargaNormal" className="text-base font-medium">
                  Harga Normal Total <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hargaNormal"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.hargaNormal}
                  onChange={onInputChange}
                  placeholder="100000"
                  className={`mt-1 ${
                    stepErrors?.some(error => error.includes('Harga normal')) 
                      ? 'border-red-500 focus:border-red-500' 
                      : formData.hargaNormal && parseFloat(formData.hargaNormal) > 0
                      ? 'border-green-500' 
                      : ''
                  }`}
                />
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    💡 Total harga jika customer beli produk satu per satu
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="hargaBundle" className="text-base font-medium">
                  Harga Bundle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hargaBundle"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.hargaBundle}
                  onChange={onInputChange}
                  placeholder="80000"
                  className={`mt-1 ${
                    stepErrors?.some(error => error.includes('Harga bundle')) 
                      ? 'border-red-500 focus:border-red-500' 
                      : formData.hargaBundle && parseFloat(formData.hargaBundle) > 0 && formData.hargaNormal && parseFloat(formData.hargaBundle) < parseFloat(formData.hargaNormal)
                      ? 'border-green-500' 
                      : ''
                  }`}
                />
                <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="text-xs text-orange-800">
                    ⚡ Harga bundle harus lebih murah dari harga normal
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
