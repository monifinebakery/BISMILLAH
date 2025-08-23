// src/components/operational-costs/types/operationalCost.types.ts

export interface OperationalCost {
  id: string;
  user_id: string;
  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: 'tetap' | 'variabel';
  status: 'aktif' | 'nonaktif';
  deskripsi?: string;
  cost_category: 'fixed' | 'variable' | 'other'; // Generated column
  created_at: string;
  updated_at: string;
}

export interface AllocationSettings {
  id: string;
  user_id: string;
  metode: 'per_unit' | 'persentase';
  nilai: number; // estimasi produksi per bulan atau persentase
  created_at: string;
  updated_at: string;
}

export interface CostFormData {
  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: 'tetap' | 'variabel';
  status: 'aktif' | 'nonaktif';
  deskripsi?: string;
  // Note: cost_category is not included as it's a generated column
}

export interface AllocationFormData {
  metode: 'per_unit' | 'persentase';
  nilai: number;
}

export interface CostSummary {
  total_biaya_aktif: number;
  total_biaya_tetap: number;
  total_biaya_variabel: number;
  jumlah_biaya_aktif: number;
  jumlah_biaya_nonaktif: number;
}

export interface CostFilters {
  jenis?: 'tetap' | 'variabel';
  status?: 'aktif' | 'nonaktif';
  search?: string;
}

export interface OverheadCalculation {
  total_costs: number;
  overhead_per_unit: number;
  metode: 'per_unit' | 'persentase';
  nilai_basis: number;
  material_cost?: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CostListResponse {
  data: OperationalCost[];
  total: number;
  page: number;
  limit: number;
}