// src/components/operational-costs/constants/allocationMethods.ts

export const METODE_ALOKASI = {
  PER_UNIT: 'per_unit' as const,
  PERSENTASE: 'persentase' as const,
} as const;

export const METODE_ALOKASI_OPTIONS = [
  {
    value: METODE_ALOKASI.PER_UNIT,
    label: 'Per Unit Produksi',
    description: 'Overhead = Total Biaya ÷ Estimasi Produksi per Bulan',
    example: 'Jika total biaya Rp 10.000.000 dan estimasi produksi 1.000 unit, maka overhead = Rp 10.000 per unit',
    inputLabel: 'Estimasi Produksi per Bulan (unit)',
    inputPlaceholder: 'Contoh: 1000',
  },
  {
    value: METODE_ALOKASI.PERSENTASE,
    label: 'Persentase dari Material',
    description: 'Overhead = Persentase × Biaya Material',
    example: 'Jika persentase 25% dan biaya material Rp 50.000, maka overhead = Rp 12.500',
    inputLabel: 'Persentase Overhead (%)',
    inputPlaceholder: 'Contoh: 25',
  },
];

export const DEFAULT_ALLOCATION_VALUES = {
  PER_UNIT: 1000, // Default estimasi 1000 unit per bulan
  PERSENTASE: 25, // Default 25% dari biaya material
};

export const VALIDATION_RULES = {
  MIN_NILAI: 0.01,
  MAX_NILAI_UNIT: 1000000, // Max 1 juta unit
  MAX_NILAI_PERSENTASE: 1000, // Max 1000%
};