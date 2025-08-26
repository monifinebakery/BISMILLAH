// src/components/operational-costs/utils/costValidation.ts

import { CostFormData, AllocationFormData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

/**
 * Validate cost form data
 */
export const validateCostForm = (data: CostFormData): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate nama_biaya
  if (!data.nama_biaya?.trim()) {
    errors.nama_biaya = 'Nama biaya wajib diisi';
  } else if (data.nama_biaya.trim().length < 3) {
    errors.nama_biaya = 'Nama biaya minimal 3 karakter';
  } else if (data.nama_biaya.trim().length > 255) {
    errors.nama_biaya = 'Nama biaya maksimal 255 karakter';
  }

  // Validate jumlah_per_bulan (minimum Rp 1.000)
  if (!data.jumlah_per_bulan || data.jumlah_per_bulan < 1000) {
    errors.jumlah_per_bulan = 'Jumlah biaya terlalu kecil. Minimal Rp 1.000 untuk pencatatan yang akurat';
  } else if (data.jumlah_per_bulan > 999999999999) {
    errors.jumlah_per_bulan = 'Jumlah biaya terlalu besar';
  } else if (data.jumlah_per_bulan > 100000000) {
    warnings.push('Jumlah biaya cukup besar, pastikan nilai sudah benar');
  }

  // Validate jenis
  if (!data.jenis || !['tetap', 'variabel'].includes(data.jenis)) {
    errors.jenis = 'Jenis biaya harus dipilih (tetap atau variabel)';
  }

  // Validate status
  if (!data.status || !['aktif', 'nonaktif'].includes(data.status)) {
    errors.status = 'Status biaya harus dipilih (aktif atau nonaktif)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate allocation form data
 */
export const validateAllocationForm = (data: AllocationFormData): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate metode
  if (!data.metode || !['per_unit', 'persentase'].includes(data.metode)) {
    errors.metode = 'Metode alokasi harus dipilih';
  }

  // Validate nilai
  if (!data.nilai || data.nilai <= 0) {
    errors.nilai = 'Nilai harus lebih besar dari 0';
  } else {
    if (data.metode === 'per_unit') {
      if (data.nilai > 1000000) {
        warnings.push('Estimasi produksi sangat tinggi, pastikan nilai sudah benar');
      } else if (data.nilai < 10) {
        warnings.push('Estimasi produksi sangat rendah, pastikan nilai sudah benar');
      }
    } else if (data.metode === 'persentase') {
      if (data.nilai > 1000) {
        errors.nilai = 'Persentase tidak boleh lebih dari 1000%';
      } else if (data.nilai > 100) {
        warnings.push('Persentase overhead di atas 100% cukup tinggi');
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate cost name uniqueness
 */
export const validateCostNameUniqueness = (
  name: string,
  existingNames: string[],
  excludeId?: string
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const normalizedName = name.trim().toLowerCase();
  const isDuplicate = existingNames.some(existingName => 
    existingName.toLowerCase() === normalizedName
  );

  if (isDuplicate) {
    errors.nama_biaya = 'Nama biaya sudah digunakan, silakan gunakan nama lain';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: [],
  };
};

/**
 * Validate bulk cost data
 */
export const validateBulkCosts = (costs: CostFormData[]): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!costs || costs.length === 0) {
    errors.bulk = 'Tidak ada data biaya untuk divalidasi';
    return { isValid: false, errors, warnings };
  }

  const nameMap = new Map<string, number>();
  let hasErrors = false;

  costs.forEach((cost, index) => {
    const validation = validateCostForm(cost);
    
    if (!validation.isValid) {
      hasErrors = true;
      errors[`row_${index}`] = `Baris ${index + 1}: ${Object.values(validation.errors).join(', ')}`;
    }

    // Check for duplicate names within the batch
    const normalizedName = cost.nama_biaya?.trim().toLowerCase();
    if (normalizedName) {
      const existingIndex = nameMap.get(normalizedName);
      if (existingIndex !== undefined) {
        hasErrors = true;
        errors[`duplicate_${index}`] = `Baris ${index + 1} dan ${existingIndex + 1}: Nama biaya duplikat`;
      } else {
        nameMap.set(normalizedName, index);
      }
    }

    warnings.push(...validation.warnings);
  });

  return {
    isValid: !hasErrors,
    errors,
    warnings,
  };
};

/**
 * Sanitize cost form data
 */
export const sanitizeCostForm = (data: CostFormData): CostFormData => {
  return {
    nama_biaya: data.nama_biaya?.trim() || '',
    jumlah_per_bulan: Math.max(0, Number(data.jumlah_per_bulan) || 0),
    jenis: data.jenis || 'tetap',
    status: data.status || 'aktif',
    group: data.group || 'operasional',
    deskripsi: data.deskripsi || undefined,
  };
};

/**
 * Sanitize allocation form data
 */
export const sanitizeAllocationForm = (data: AllocationFormData): AllocationFormData => {
  return {
    metode: data.metode || 'per_unit',
    nilai: Math.max(0, Number(data.nilai) || 0),
  };
};

/**
 * Validate material cost for percentage method
 */
export const validateMaterialCostForPercentage = (
  materialCost: number,
  isPercentageMethod: boolean
): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (isPercentageMethod) {
    if (!materialCost || materialCost <= 0) {
      warnings.push('Biaya material diperlukan untuk perhitungan overhead dengan metode persentase');
    } else if (materialCost > 999999999) {
      errors.material_cost = 'Biaya material terlalu besar';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate cost allocation calculation
 */
export const validateCostAllocation = (
  totalCosts: number,
  allocationValue: number,
  method: 'per_unit' | 'persentase'
): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (totalCosts <= 0) {
    warnings.push('Tidak ada biaya aktif untuk dialokasikan');
  }

  if (method === 'per_unit' && allocationValue <= 0) {
    errors.allocation = 'Estimasi produksi harus lebih besar dari 0';
  }

  if (method === 'persentase' && allocationValue <= 0) {
    errors.allocation = 'Persentase harus lebih besar dari 0';
  }

  const overheadResult = method === 'per_unit' 
    ? totalCosts / allocationValue 
    : 0; // For percentage, we need material cost

  if (method === 'per_unit' && overheadResult > 1000000) {
    warnings.push('Overhead per unit sangat tinggi, periksa kembali pengaturan alokasi');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};
