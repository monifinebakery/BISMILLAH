// src/components/recipe/components/RecipeForm/BasicInfoStep.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChefHat, 
  Users, 
  Tag, 
  FileText, 
  Image,
  Plus,
  Info
} from 'lucide-react';
import { RECIPE_CATEGORIES, type NewRecipe, type RecipeFormStepProps } from '../../types';

type BasicInfoStepProps = Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'>;

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
}) => {
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Get available categories including existing ones from data
  const availableCategories = [
    ...RECIPE_CATEGORIES,
    ...(data.kategoriResep && !RECIPE_CATEGORIES.includes(data.kategoriResep as string)
      ? [data.kategoriResep] 
      : []
    )
  ];

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
      onUpdate('kategoriResep', value);
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      onUpdate('kategoriResep', customCategory.trim());
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="text-center pb-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Informasi Dasar Resep
        </h2>
        <p className="text-gray-600">
          Mulai dengan menambahkan informasi dasar tentang resep Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label htmlFor="namaResep" className="text-sm font-medium text-gray-700">
              Nama Resep *
            </Label>
            <div className="relative">
              <ChefHat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="namaResep"
                type="text"
                value={data.namaResep}
                onChange={(e) => onUpdate('namaResep', e.target.value)}
                placeholder="Masukkan nama resep yang menarik"
                className={`pl-10 ${errors.namaResep ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.namaResep && (
              <p className="text-sm text-red-600">{errors.namaResep}</p>
            )}
            <p className="text-xs text-gray-500">
              Gunakan nama yang mudah diingat dan menggambarkan resep
            </p>
          </div>

          {/* Portions and Pieces */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Jumlah Porsi */}
            <div className="space-y-2">
              <Label htmlFor="jumlahPorsi" className="text-sm font-medium text-gray-700">
                Jumlah Porsi *
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="jumlahPorsi"
                  type="number"
                  min="1"
                  value={data.jumlahPorsi || ''}
                  onChange={(e) => onUpdate('jumlahPorsi', parseInt(e.target.value) || 1)}
                  placeholder="1"
                  className={`pl-10 ${errors.jumlahPorsi ? 'border-red-300 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.jumlahPorsi && (
                <p className="text-sm text-red-600">{errors.jumlahPorsi}</p>
              )}
            </div>

            {/* Pieces per Portion */}
            <div className="space-y-2">
              <Label htmlFor="jumlahPcsPerPorsi" className="text-sm font-medium text-gray-700">
                Pcs per Porsi
              </Label>
              <Input
                id="jumlahPcsPerPorsi"
                type="number"
                min="1"
                value={data.jumlahPcsPerPorsi || 1}
                onChange={(e) => onUpdate('jumlahPcsPerPorsi', parseInt(e.target.value) || 1)}
                placeholder="1"
                className={errors.jumlahPcsPerPorsi ? 'border-red-300 focus:border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.jumlahPcsPerPorsi && (
                <p className="text-sm text-red-600">{errors.jumlahPcsPerPorsi}</p>
              )}
              <p className="text-xs text-gray-500">
                Berapa potongan per porsi (misal: 1 porsi = 6 pcs donat)
              </p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Kategori Resep
            </Label>
            
            {!showCustomCategory ? (
              <div className="space-y-2">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select value={data.kategoriResep || ''} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Pilih kategori resep" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-orange-600 font-medium">
                        + Buat Kategori Baru
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Nama kategori baru"
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomCategorySubmit()}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCustomCategorySubmit}
                  disabled={!customCategory.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setCustomCategory('');
                  }}
                  size="sm"
                >
                  Batal
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Pilih kategori yang sesuai untuk memudahkan pencarian
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="deskripsi" className="text-sm font-medium text-gray-700">
              Deskripsi Resep
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="deskripsi"
                value={data.deskripsi || ''}
                onChange={(e) => onUpdate('deskripsi', e.target.value)}
                placeholder="Ceritakan tentang resep ini... karakteristik rasa, tekstur, atau keunikan lainnya"
                className="pl-10 min-h-[120px] resize-none"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Deskripsi akan membantu Anda mengingat detail resep
            </p>
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="fotoUrl" className="text-sm font-medium text-gray-700">
              URL Foto Resep
            </Label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fotoUrl"
                type="url"
                value={data.fotoUrl || ''}
                onChange={(e) => onUpdate('fotoUrl', e.target.value)}
                placeholder="https://example.com/foto-resep.jpg"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Opsional: Link foto untuk visualisasi resep
            </p>
          </div>

          {/* Preview Card */}
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium text-gray-900">Preview Resep</h4>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">
                    {data.namaResep || 'Belum diisi'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Kategori:</span>
                  <span className="font-medium">
                    {data.kategoriResep || 'Belum dipilih'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Porsi:</span>
                  <span className="font-medium">
                    {data.jumlahPorsi} porsi
                    {data.jumlahPcsPerPorsi > 1 && ` (${data.jumlahPcsPerPorsi} pcs/porsi)`}
                  </span>
                </div>
                
                {data.deskripsi && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-600 text-xs">Deskripsi:</span>
                    <p className="text-gray-800 text-xs mt-1 line-clamp-3">
                      {data.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips Section */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-orange-900 mb-2">
                Tips Mengisi Informasi Dasar
              </h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Gunakan nama yang spesifik dan mudah diingat</li>
                <li>• Sesuaikan jumlah porsi dengan kebutuhan produksi</li>
                <li>• Pilih kategori yang tepat untuk memudahkan pencarian</li>
                <li>• Deskripsi membantu mengingat karakteristik resep</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInfoStep;