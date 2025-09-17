// src/components/promoCalculator/components/steps/PromoBasicInfoStep.tsx
// Step 1: Basic information form

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import type { PromoFormStepProps } from '../../types/promo.types';

export const PromoBasicInfoStep: React.FC<PromoFormStepProps> = ({
  formData,
  stepErrors,
  onInputChange,
  onSelectChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-orange-500" />
          Informasi Dasar Promo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="namaPromo" className="text-base font-medium">
            Nama Promo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="namaPromo"
            value={formData.namaPromo}
            onChange={onInputChange}
            placeholder="Contoh: Diskon Akhir Tahun 25%"
            className={`mt-1 ${
              stepErrors?.some(error => error.includes('Nama promo')) 
                ? 'border-red-500 focus:border-red-500' 
                : formData.namaPromo.length >= 3 
                ? 'border-green-500' 
                : ''
            }`}
          />
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-1">💡 Panduan Tipe Promo:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>Diskon:</strong> Potongan harga dalam persen atau nominal</li>
              <li>• <strong>BOGO:</strong> Beli sejumlah produk, gratis sejumlah produk</li>
              <li>• <strong>Bundle:</strong> Paket produk dengan harga khusus</li>
            </ul>
          </div>
        </div>

        <div>
          <Label htmlFor="tipePromo" className="text-base font-medium">
            Tipe Promo <span className="text-red-500">*</span>
            <div className="group relative inline-block ml-2">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Pilih jenis promo yang ingin dibuat
              </div>
            </div>
          </Label>
          <Select
            value={formData.tipePromo}
            onValueChange={(value) => onSelectChange('tipePromo', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih tipe promo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">
                <div className="flex flex-col">
                  <span className="font-medium">Diskon Persentase</span>
                  <span className="text-sm text-gray-500">Potongan harga dalam persen</span>
                </div>
              </SelectItem>
              <SelectItem value="bogo">
                <div className="flex flex-col">
                  <span className="font-medium">Buy One Get One</span>
                  <span className="text-sm text-gray-500">Beli sejumlah, dapat gratis</span>
                </div>
              </SelectItem>
              <SelectItem value="bundle">
                <div className="flex flex-col">
                  <span className="font-medium">Paket Bundle</span>
                  <span className="text-sm text-gray-500">Harga khusus untuk paket produk</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deskripsi" className="text-base font-medium flex items-center gap-2">
            Deskripsi Promo
            <div className="group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Jelaskan syarat, ketentuan, dan detail promo
              </div>
            </div>
          </Label>
          <Textarea
            id="deskripsi"
            value={formData.deskripsi}
            onChange={onInputChange}
            placeholder="Contoh: Berlaku untuk pembelian minimal 2 item, tidak dapat digabung dengan promo lain..."
            rows={4}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            💡 Tip: Semakin jelas deskripsi, semakin mudah customer memahami promo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tanggalMulai" className="text-base font-medium">
              Tanggal Mulai
            </Label>
            <Input
              id="tanggalMulai"
              type="date"
              value={formData.tanggalMulai}
              onChange={onInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tanggalSelesai" className="text-base font-medium">
              Tanggal Selesai
            </Label>
            <Input
              id="tanggalSelesai"
              type="date"
              value={formData.tanggalSelesai}
              onChange={onInputChange}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};