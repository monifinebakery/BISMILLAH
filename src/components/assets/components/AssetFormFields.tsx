// src/components/assets/components/AssetFormFields.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AssetFormData, AssetFormErrors, AssetCategory, AssetCondition } from '../types';
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from '../utils';
import { formatDateToYYYYMMDD, getInputValue, safeParseDate } from '../utils';

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
          label="Nilai Awal *"
          value={formData.nilaiAwal}
          error={errors.nilaiAwal}
          onChange={(value) => onFieldChange('nilaiAwal', value)}
          disabled={disabled}
          placeholder="0"
        />
        
        <AssetValueField
          id="nilaiSaatIni"
          label="Nilai Sekarang *"
          value={formData.nilaiSaatIni}
          error={errors.nilaiSaatIni}
          onChange={(value) => onFieldChange('nilaiSaatIni', value)}
          disabled={disabled}
          placeholder="0"
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

const AssetNameField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <Label htmlFor="nama" className="text-gray-700">
      Nama Aset *
    </Label>
    <Input
      id="nama"
      value={getInputValue(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Masukkan nama aset"
      className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
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
        <SelectValue placeholder="Pilih kategori" />
      </SelectTrigger>
      <SelectContent>
        {ASSET_CATEGORIES.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
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
}

const AssetValueField: React.FC<ValueFieldProps> = ({ 
  id, 
  label, 
  value, 
  error, 
  onChange, 
  disabled, 
  placeholder 
}) => (
  <div>
    <Label htmlFor={id} className="text-gray-700">
      {label}
    </Label>
    <Input
      id={id}
      type="number"
      value={getInputValue(value)}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      placeholder={placeholder}
      className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}
      min="0"
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const AssetDateField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <Label htmlFor="tanggalPembelian" className="text-gray-700">
      Tanggal Pembelian *
    </Label>
    <Input
      id="tanggalPembelian"
      type="date"
      value={formatDateToYYYYMMDD(value)}
      onChange={(e) => onChange(safeParseDate(e.target.value))}
      className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const AssetDepreciationField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <Label htmlFor="depresiasi" className="text-gray-700">
      Depresiasi (%)
    </Label>
    <Input
      id="depresiasi"
      type="number"
      value={getInputValue(value)}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
      placeholder="0"
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
      Opsional: Persentase penyusutan nilai aset
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
  <div>
    <Label htmlFor="lokasi" className="text-gray-700">
      Lokasi *
    </Label>
    <Input
      id="lokasi"
      value={getInputValue(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Masukkan lokasi aset"
      className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const AssetDescriptionField: React.FC<FieldProps> = ({ value, error, onChange, disabled }) => (
  <div>
    <Label htmlFor="deskripsi" className="text-gray-700">
      Deskripsi
    </Label>
    <Textarea
      id="deskripsi"
      value={getInputValue(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Masukkan deskripsi aset"
      rows={3}
      className={`border-orange-200 focus:border-orange-400 ${
        error ? 'border-red-500' : ''
      }`}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    <p className="text-xs text-gray-500 mt-1">
      Opsional: Deskripsi detail tentang aset
    </p>
  </div>
);