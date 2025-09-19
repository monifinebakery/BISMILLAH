// src/components/recipe/components/BasicInfoSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { NewRecipe } from '../types';

interface BasicInfoSectionProps {
  formData: NewRecipe;
  totalPcsProduced: number;
  onInputChange: (field: keyof NewRecipe, value: string | number) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  totalPcsProduced,
  onInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Informasi Dasar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="namaResep">Nama Resep *</Label>
            <Input
              id="namaResep"
              value={formData.namaResep}
              onChange={(e) => onInputChange('namaResep', e.target.value)}
              placeholder="Masukkan nama resep"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="kategoriResep">Kategori</Label>
            <Input
              id="kategoriResep"
              value={formData.kategoriResep || ''}
              onChange={(e) => onInputChange('kategoriResep', e.target.value)}
              placeholder="Kategori resep (opsional)"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jumlahPorsi">Jumlah Porsi *</Label>
            <Input
              id="jumlahPorsi"
              type="number"
              min="1"
              value={formData.jumlahPorsi || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string during editing
                onInputChange('jumlahPorsi', value === '' ? '' : parseInt(value) || 1);
              }}
              onBlur={(e) => {
                // Ensure we have at least 1 when user finishes editing
                if (!e.target.value || parseInt(e.target.value) < 1) {
                  onInputChange('jumlahPorsi', 1);
                }
              }}
              required
              mobileOptimized
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1 sm:hidden">
              Gunakan nama yang mudah diingat dan menggambarkan resep
            </p>
          </div>
          
          <div>
            <Label htmlFor="jumlahPcsPerPorsi">
              Pcs per Porsi *
              <span className="text-xs text-gray-500 ml-1 hidden sm:inline">(untuk kalkulasi HPP per pcs)</span>
            </Label>
            <Input
              id="jumlahPcsPerPorsi"
              type="number"
              min="1"
              value={formData.jumlahPcsPerPorsi || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string during editing, default to 1 only on blur or if explicitly set to 0
                onInputChange('jumlahPcsPerPorsi', value === '' ? '' : parseInt(value) || 1);
              }}
              onBlur={(e) => {
                // Ensure we have at least 1 when user finishes editing
                if (!e.target.value || parseInt(e.target.value) < 1) {
                  onInputChange('jumlahPcsPerPorsi', 1);
                }
              }}
              mobileOptimized
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              <span className="sm:hidden">Berapa potongan per porsi (misal: 1 porsi = 6 pcs donat)</span>
              <span className="hidden sm:inline">Total produksi: {totalPcsProduced} pcs</span>
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="deskripsi">Deskripsi</Label>
          <Textarea
            id="deskripsi"
            value={formData.deskripsi || ''}
            onChange={(e) => onInputChange('deskripsi', e.target.value)}
            placeholder="Deskripsi resep (opsional)"
            className="mt-1"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};