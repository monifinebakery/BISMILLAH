// src/components/operational-costs/types/operationalCost.types.ts

export interface OperationalCost {
  id: string;
  user_id: string;
  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: 'tetap' | 'variabel';
  status: 'aktif' | 'nonaktif';
  group: 'hpp' | 'operasional' | 'tkl'; // New: Triple-mode cost group
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
  group?: 'hpp' | 'operasional' | 'tkl'; // New: Triple-mode cost group (optional for backward compatibility)
  deskripsi?: string;
  tanggal?: string; // NEW: Date field for cost tracking (YYYY-MM-DD format)
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
  // New: Dual-mode summaries
  total_hpp_group: number;
  total_operasional_group: number;
  jumlah_hpp_aktif: number;
  jumlah_operasional_aktif: number;
}

export interface CostFilters {
  jenis?: 'tetap' | 'variabel';
  status?: 'aktif' | 'nonaktif';
  group?: 'hpp' | 'operasional' | 'tkl'; // New: Filter by cost group
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

// ====================================
// NEW: Dual-Mode Calculator Types
// ====================================

export interface DualModeCalculatorData {
  costs: OperationalCost[];
  selectedGroup: 'hpp' | 'operasional' | 'tkl';
  targetOutputMonthly: number; // Target produksi per bulan
}

export interface DualModeCalculationResult {
  group: 'hpp' | 'operasional' | 'tkl';
  totalCosts: number;
  targetOutput: number;
  costPerUnit: number; // Biaya per pcs
  isValid: boolean;
  validationErrors: string[];
}

// ====================================
// NEW: App Settings Types
// ====================================

export interface AppSettings {
  id: string;
  user_id: string;
  target_output_monthly: number; // Target produksi bulanan
  overhead_per_pcs: number; // Hasil kalkulator kelompok HPP
  operasional_per_pcs: number; // Hasil kalkulator kelompok Operasional
  // ✅ NEW: TKL (Tenaga Kerja Langsung) auto-calculation settings
  tkl_tarif_per_jam?: number;      // Tarif TKL per jam (Rp/hour)
  tkl_jam_per_batch?: number;      // Estimasi jam kerja per batch produksi
  tkl_auto_calculate?: boolean;    // Enable/disable auto TKL calculation
  created_at: string;
  updated_at: string;
}

export interface AppSettingsFormData {
  target_output_monthly: number;
  overhead_per_pcs?: number;
  operasional_per_pcs?: number;
  // ✅ NEW: TKL auto-calculation form fields
  tkl_tarif_per_jam?: number;
  tkl_jam_per_batch?: number;
  tkl_auto_calculate?: boolean;
}

// ====================================
// NEW: Cost Classification Types
// ====================================

export interface CostClassificationRule {
  keywords: string[];
  group: 'hpp' | 'operasional' | 'tkl';
  description: string;
}

export interface ClassificationSuggestion {
  suggested_group: 'hpp' | 'operasional' | 'tkl' | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  matched_keywords: string[];
}
