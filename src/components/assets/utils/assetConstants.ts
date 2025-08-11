// src/components/assets/utils/assetConstants.ts

import { AssetCategory, AssetCondition } from '../types';

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: 'Peralatan', label: 'Peralatan' },
  { value: 'Kendaraan', label: 'Kendaraan' },
  { value: 'Bangunan', label: 'Bangunan' },
  { value: 'Mesin', label: 'Mesin' },
  { value: 'Lain-lain', label: 'Lain-lain' },
];

export const ASSET_CONDITIONS: { value: AssetCondition; label: string }[] = [
  { value: 'Baik', label: 'Baik' },
  { value: 'Rusak Ringan', label: 'Rusak Ringan' },
  { value: 'Rusak Berat', label: 'Rusak Berat' },
];

export const CONDITION_COLORS: Record<AssetCondition, string> = {
  'Baik': 'bg-green-100 text-green-800',
  'Rusak Ringan': 'bg-yellow-100 text-yellow-800',
  'Rusak Berat': 'bg-red-100 text-red-800',
};

export const CATEGORY_ICONS: Record<AssetCategory, string> = {
  'Peralatan': 'package',
  'Kendaraan': 'car',
  'Bangunan': 'building',
  'Mesin': 'cpu',
  'Lain-lain': 'more-horizontal',
};

export const FORM_VALIDATION_RULES = {
  nama: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  kategori: {
    required: true,
  },
  nilaiAwal: {
    required: true,
    min: 0,
  },
  nilaiSaatIni: {
    required: true,
    min: 0,
  },
  tanggalPembelian: {
    required: true,
  },
  kondisi: {
    required: true,
  },
  lokasi: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  deskripsi: {
    required: false,
    maxLength: 1000,
  },
  depresiasi: {
    required: false,
    min: 0,
    max: 100,
  },
} as const;

export const DEFAULT_FORM_DATA = {
  nama: '',
  kategori: '' as AssetCategory | '',
  nilaiAwal: '' as number | '',
  nilaiSaatIni: '' as number | '',
  tanggalPembelian: null,
  kondisi: '' as AssetCondition | '',
  lokasi: '',
  deskripsi: '',
  depresiasi: '' as number | '',
};

export const QUERY_KEYS = {
  ASSETS: ['assets'] as const,
  ASSET_LIST: ['assets', 'list'] as const,
  ASSET_DETAIL: (id: string) => ['assets', 'detail', id] as const,
  ASSET_STATISTICS: ['assets', 'statistics'] as const,
} as const;

export const MUTATION_KEYS = {
  CREATE_ASSET: 'createAsset',
  UPDATE_ASSET: 'updateAsset',
  DELETE_ASSET: 'deleteAsset',
} as const;