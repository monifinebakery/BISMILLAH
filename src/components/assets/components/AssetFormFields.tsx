// src/components/assets/components/AssetFormFields.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { DollarSign, Calendar, MapPin, FileText, Package } from 'lucide-react';
import { AssetFormData, AssetFormErrors, AssetCategory, AssetCondition } from '../types';
import {
  ASSET_CATEGORIES,
  ASSET_CONDITIONS,
  formatDateToYYYYMMDD,
  getInputValue,
  safeParseDate,
} from '../utils';

interface AssetFormFieldsProps {
  formData: AssetFormData;
  errors: AssetFormErrors;
  onFieldChange: (field: keyof AssetFormData, value: any) => void;
  disabled?: boolean;
}

export const AssetFormFields: React.FC<AssetFormFieldsProps> = ({
  formData,
  errors,
  onFieldChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Asset Name Field */}
      <AssetNameField
        value={formData.nama}
        error={errors.nama}
        onChange={(value) => onFieldChange('nama', value)}
        disabled={disabled}
        category={formData.kategori}
      />

      {/* Category Field */}
      <AssetCategoryField
        value={formData.kategori}
        error={errors.kategori}
        onChange={(value) => onFieldChange('kategori', value)}
        disabled={disabled}
      />

      {/* Value Fields (Grid) */}
      <div className="grid grid-cols-2 gap-4">
        <AssetValueField
          id="nilaiAwal"
          label="Harga Beli *"
          value={formData.nilaiAwal}
          error={errors.nilaiAwal}
          onChange={(value) => onFieldChange('nilaiAwal', value)}
          disabled={disabled}
          placeholder="Contoh: 5000000"
          helpText="Berapa harga saat membeli aset ini?"
        />
        
        <AssetValueField
          id="nilaiSaatIni"
          label="Nilai Sekarang *"
          value={formData.nilaiSaatIni}
          error={errors.nilaiSaatIni}
          onChange={(value) => onFieldChange('nilaiSaatIni', value)}
          disabled={disabled}
          placeholder={formData.nilaiAwal ? `Contoh: ${Math.floor(Number(formData.nilaiAwal) * 0.85)}` : "Berapa nilai jika dijual sekarang?"}
          helpText="Perkiraan harga jika aset ini dijual hari ini"
        />
      </div>

      {/* Purchase Date Field */}
      <AssetDateField
        value={formData.tanggalPembelian}
        error={errors.tanggalPembelian}
        onChange={(value) => onFieldChange('tanggalPembelian', value)}
        disabled={disabled}
      />

      {/* Depreciation Field */}
      <AssetDepreciationField
        value={formData.depresiasi}
        error={errors.depresiasi}
        onChange={(value) => onFieldChange('depresiasi', value)}
        disabled={disabled}
      />

      {/* Condition and Location (Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AssetConditionField
          value={formData.kondisi}
          error={errors.kondisi}
          onChange={(value) => onFieldChange('kondisi', value)}
          disabled={disabled}
        />
        
        <AssetLocationField
          value={formData.lokasi}
          error={errors.lokasi}
          onChange={(value) => onFieldChange('lokasi', value)}
          disabled={disabled}
        />
      </div>

      {/* Description Field */}
      <AssetDescriptionField
        value={formData.deskripsi}
        error={errors.deskripsi}
        onChange={(value) => onFieldChange('deskripsi', value)}
        disabled={disabled}
      />
    </div>
  );
};

// Individual Field Components

interface FieldProps {
  value: any;
  error?: string;
  onChange: (value: any) => void;
  disabled?: boolean;
}

interface NameFieldProps extends FieldProps {
  category?: string;
}

const getPlaceholderByCategory = (category: string): string => {
  switch (category) {
    case 'Peralatan':
      return 'Contoh: Stand Mixer, Oven Listrik, Kompor Gas';
    case 'Kendaraan':
      return 'Contoh: Honda Beat, Toyota Avanza';
    case 'Bangunan':
      return 'Contoh: Toko Depan, Gudang Belakang';
    case 'Mesin':
      return 'Contoh: Mesin Jahit, Mesin Potong';
    default:
      return 'Contoh: Stand Mixer 10L, Motor Honda Beat';
  }
};

const AssetNameField: React.FC<NameFieldProps> = ({ value, error, onChange, disabled, category }) => (
  <FormField
    label="Nama Aset"
    type="text"
    value={getInputValue(value)}
    onChange={(e) => onChange(e.target.value)}
    placeholder={getPlaceholderByCategory(category || '')}
    disabled={disabled}
    error={error}
    required
    icon={Package}
    helpText="Tulis nama spesifik beserta merk/model jika ada"
  />
);

const AssetCategoryField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <Label htmlFor="kategori" className="text-gray-700">
      Kategori *
    </Label>
    <Select
      value={getInputValue(value) as string}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}>
        <SelectValue placeholder="Pilih kategori aset" />
      </SelectTrigger>
      <SelectContent>
        {ASSET_CATEGORIES.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            <div className="flex flex-col">
              <span className="font-medium">{category.label}</span>
              <span className="text-xs text-gray-500">{category.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

interface ValueFieldProps extends FieldProps {
  id: string;
  label: string;
  placeholder?: string;
  helpText?: string;
}

const AssetValueField: React.FC<ValueFieldProps> = ({ 
  id, 
  label, 
  value, 
  error, 
  onChange, 
  disabled, 
  placeholder,
  helpText 
}) => (
  <FormField
    label={label}
    type="number"
    value={getInputValue(value)}
    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
    placeholder={placeholder}
    disabled={disabled}
    error={error}
    min="0"
    icon={DollarSign}
    helpText={helpText}
    required={label.includes('*')}
  />
);

const AssetDateField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <FormField
    label="Tanggal Pembelian"
    type="date"
    value={formatDateToYYYYMMDD(value)}
    onChange={(e) => onChange(safeParseDate(e.target.value))}
    disabled={disabled}
    error={error}
    required
    icon={Calendar}
  />
);

const AssetDepreciationField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <div className="flex items-center gap-2">
      <Label htmlFor="depresiasi" className="text-gray-700">
        Penyusutan Nilai (%)
      </Label>
      <div className="group relative">
        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9,9h1.5a1.5,1.5,0,0,1,1.5,1.5v0a1.5,1.5,0,0,1-1.5,1.5H9"></path>
          <line x1="12" y1="17" x2="12" y2="17"></line>
        </svg>
        <div className="invisible group-hover:visible absolute bottom-6 left-0 w-64 p-3 text-xs bg-gray-800 text-white rounded shadow-lg z-10">
          <div className="font-semibold mb-1">Contoh Penyusutan:</div>
          <div>• Motor: 20-25% per tahun</div>
          <div>• Mesin produksi: 10-15% per tahun</div>
          <div>• Peralatan: 15-20% per tahun</div>
          <div className="mt-1 text-gray-300">Kosongkan jika tidak yakin</div>
        </div>
      </div>
    </div>
    <Input
      id="depresiasi"
      type="number"
      value={getInputValue(value)}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder="Contoh: 15 (untuk 15% per tahun)"
      className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}
      min="0"
      max="100"
      step="0.1"
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    <p className="text-xs text-gray-500 mt-1">
      <span className="text-orange-600">Opsional:</span> Berapa persen nilai aset berkurang per tahun?
      <br />
      <span className="text-gray-400">Tips: Jika beli seharga 1jt, setelah 1 tahun bernilai 850rb = penyusutan 15%</span>
    </p>
  </div>
);

const AssetConditionField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <Label htmlFor="kondisi" className="text-gray-700">
      Kondisi *
    </Label>
    <Select
      value={getInputValue(value) as string}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
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
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const AssetLocationField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <FormField
    label="Lokasi"
    type="text"
    value={getInputValue(value)}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Masukkan lokasi aset"
    disabled={disabled}
    error={error}
    required
    icon={MapPin}
  />
);

const AssetDescriptionField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <FormField
    label="Deskripsi"
    type="textarea"
    value={getInputValue(value)}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Masukkan deskripsi aset"
    rows={3}
    disabled={disabled}
    error={error}
    icon={FileText}
    helpText="Opsional: Deskripsi detail tentang aset"
  />
);
