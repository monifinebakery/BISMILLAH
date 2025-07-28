import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface RecipeBasicInfoProps {
  namaResep: string;
  onNamaResepChange: (value: string) => void;
  kategoriResep?: string;
  onKategoriResepChange: (value: string) => void;
  categories: string[];
  deskripsi?: string;
  onDeskripsiChange: (value: string) => void;
  jumlahPorsi: number;
  onJumlahPorsiChange: (value: number) => void;
  jumlahPcsPerPorsi?: number;
  onJumlahPcsPerPorsiChange: (value: number) => void;
  errors?: Record<string, string>;
}

export const RecipeBasicInfo: React.FC<RecipeBasicInfoProps> = ({
  namaResep,
  onNamaResepChange,
  kategoriResep,
  onKategoriResepChange,
  categories,
  deskripsi,
  onDeskripsiChange,
  jumlahPorsi,
  onJumlahPorsiChange,
  jumlahPcsPerPorsi,
  onJumlahPcsPerPorsiChange,
  errors = {}
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informasi Dasar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nama Resep */}
          <div className="space-y-2">
            <Label htmlFor="namaResep" className="text-sm font-medium">
              Nama Resep <span className="text-red-500">*</span>
            </Label>
            <Input
              id="namaResep"
              value={namaResep}
              onChange={(e) => onNamaResepChange(e.target.value)}
              placeholder="Contoh: Es Teh Manis"
              className={errors.namaResep ? 'border-red-500' : ''}
            />
            {errors.namaResep && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.namaResep}
              </div>
            )}
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label htmlFor="kategoriResep" className="text-sm font-medium">
              Kategori
            </Label>
            <Select value={kategoriResep || ''} onValueChange={onKategoriResepChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tanpa Kategori</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deskripsi */}
        <div className="space-y-2">
          <Label htmlFor="deskripsi" className="text-sm font-medium">
            Deskripsi
          </Label>
          <Textarea
            id="deskripsi"
            value={deskripsi || ''}
            onChange={(e) => onDeskripsiChange(e.target.value)}
            placeholder="Deskripsi singkat tentang resep ini..."
            rows={3}
            className={errors.deskripsi ? 'border-red-500' : ''}
          />
          {errors.deskripsi && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {errors.deskripsi}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jumlah Porsi */}
          <div className="space-y-2">
            <Label htmlFor="jumlahPorsi" className="text-sm font-medium">
              Jumlah Porsi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="jumlahPorsi"
              type="number"
              min="1"
              value={jumlahPorsi || ''}
              onChange={(e) => onJumlahPorsiChange(Number(e.target.value))}
              placeholder="1"
              className={errors.jumlahPorsi ? 'border-red-500' : ''}
            />
            {errors.jumlahPorsi && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.jumlahPorsi}
              </div>
            )}
          </div>

          {/* Jumlah Pcs per Porsi */}
          <div className="space-y-2">
            <Label htmlFor="jumlahPcsPerPorsi" className="text-sm font-medium">
              Jumlah Pcs per Porsi
            </Label>
            <Input
              id="jumlahPcsPerPorsi"
              type="number"
              min="1"
              value={jumlahPcsPerPorsi || ''}
              onChange={(e) => onJumlahPcsPerPorsiChange(Number(e.target.value))}
              placeholder="1"
              className={errors.jumlahPcsPerPorsi ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              Jika produk dijual per pcs (opsional)
            </p>
            {errors.jumlahPcsPerPorsi && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.jumlahPcsPerPorsi}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};