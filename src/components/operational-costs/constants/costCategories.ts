// src/components/operational-costs/constants/costCategories.ts

export const JENIS_BIAYA = {
  TETAP: 'tetap' as const,
  VARIABEL: 'variabel' as const,
} as const;

export const STATUS_BIAYA = {
  AKTIF: 'aktif' as const,
  NONAKTIF: 'nonaktif' as const,
} as const;

export const JENIS_BIAYA_OPTIONS = [
  { value: JENIS_BIAYA.TETAP, label: 'Tetap', description: 'Biaya yang tidak berubah terhadap volume produksi' },
  { value: JENIS_BIAYA.VARIABEL, label: 'Variabel', description: 'Biaya yang berubah seiring volume produksi' },
];

export const STATUS_BIAYA_OPTIONS = [
  { value: STATUS_BIAYA.AKTIF, label: 'Aktif', color: 'green' },
  { value: STATUS_BIAYA.NONAKTIF, label: 'Non Aktif', color: 'gray' },
];

export const DEFAULT_COST_NAMES = [
  'Gaji Karyawan',
  'Listrik Pabrik',
  'Sewa Gedung',
  'Pemeliharaan Mesin',
  'Bahan Bakar',
  'Air',
  'Telepon & Internet',
  'Asuransi',
  'Pajak Bumi Bangunan',
  'Biaya Administrasi',
  'Biaya Keamanan',
  'Biaya Kebersihan',
  'Depresiasi Mesin',
  'Biaya Kualitas',
  'Biaya Pengiriman',
];