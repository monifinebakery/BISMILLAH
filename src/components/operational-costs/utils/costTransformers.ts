// src/components/operational-costs/utils/costTransformers.ts

import { OperationalCost, CostFormData, AllocationSettings, AllocationFormData, CostSummary } from '../types';

/**
 * Transform API response to OperationalCost model
 */
export const transformApiToCost = (apiData: any): OperationalCost => {
  return {
    id: apiData.id,
    user_id: apiData.user_id,
    nama_biaya: apiData.nama_biaya || '',
    jumlah_per_bulan: Number(apiData.jumlah_per_bulan) || 0,
    jenis: apiData.jenis || 'tetap',
    status: apiData.status || 'aktif',
    group: apiData.group as 'hpp' | 'operasional' || 'operasional', // New: Dual-mode support
    deskripsi: apiData.deskripsi || undefined,
    cost_category: apiData.cost_category as 'fixed' | 'variable' | 'other' || 'other',
    created_at: apiData.created_at,
    updated_at: apiData.updated_at,
  };
};

/**
 * Transform OperationalCost to form data
 */
export const transformCostToForm = (cost: OperationalCost): CostFormData => {
  return {
    nama_biaya: cost.nama_biaya,
    jumlah_per_bulan: cost.jumlah_per_bulan,
    jenis: cost.jenis,
    status: cost.status,
    group: cost.group, // Include group in form data
    deskripsi: cost.deskripsi,
  };
};

/**
 * Transform form data to API payload
 */
export const transformFormToCostPayload = (formData: CostFormData) => {
  return {
    nama_biaya: formData.nama_biaya.trim(),
    jumlah_per_bulan: Number(formData.jumlah_per_bulan),
    jenis: formData.jenis,
    status: formData.status,
    group: formData.group, // Include group in payload
    deskripsi: formData.deskripsi || null,
  };
};

/**
 * Transform API response to AllocationSettings model
 */
export const transformApiToAllocation = (apiData: any): AllocationSettings => {
  return {
    id: apiData.id,
    user_id: apiData.user_id,
    metode: apiData.metode || 'per_unit',
    nilai: Number(apiData.nilai) || 1000,
    created_at: apiData.created_at,
    updated_at: apiData.updated_at,
  };
};

/**
 * Transform AllocationSettings to form data
 */
export const transformAllocationToForm = (settings: AllocationSettings): AllocationFormData => {
  return {
    metode: settings.metode,
    nilai: settings.nilai,
  };
};

/**
 * Transform form data to allocation API payload
 */
export const transformFormToAllocationPayload = (formData: AllocationFormData) => {
  return {
    metode: formData.metode,
    nilai: Number(formData.nilai),
  };
};

/**
 * Transform costs array to summary data with dual-mode support
 */
export const transformCostsToSummary = (costs: OperationalCost[]): CostSummary => {
  const activeCosts = costs.filter(cost => cost.status === 'aktif');
  const inactiveCosts = costs.filter(cost => cost.status === 'nonaktif');
  
  const totalBiayaAktif = activeCosts.reduce(
    (sum, cost) => sum + Number(cost.jumlah_per_bulan), 
    0
  );
  
  const totalBiayaTetap = activeCosts
    .filter(cost => cost.jenis === 'tetap')
    .reduce((sum, cost) => sum + Number(cost.jumlah_per_bulan), 0);
    
  const totalBiayaVariabel = activeCosts
    .filter(cost => cost.jenis === 'variabel')
    .reduce((sum, cost) => sum + Number(cost.jumlah_per_bulan), 0);

  // New: Dual-mode summaries
  const hppCosts = activeCosts.filter(cost => cost.group === 'hpp');
  const operasionalCosts = activeCosts.filter(cost => cost.group === 'operasional');
  
  const totalHppGroup = hppCosts.reduce(
    (sum, cost) => sum + Number(cost.jumlah_per_bulan), 0
  );
  
  const totalOperasionalGroup = operasionalCosts.reduce(
    (sum, cost) => sum + Number(cost.jumlah_per_bulan), 0
  );

  return {
    total_biaya_aktif: totalBiayaAktif,
    total_biaya_tetap: totalBiayaTetap,
    total_biaya_variabel: totalBiayaVariabel,
    jumlah_biaya_aktif: activeCosts.length,
    jumlah_biaya_nonaktif: inactiveCosts.length,
    // New dual-mode properties
    total_hpp_group: totalHppGroup,
    total_operasional_group: totalOperasionalGroup,
    jumlah_hpp_aktif: hppCosts.length,
    jumlah_operasional_aktif: operasionalCosts.length,
  };
};

/**
 * Transform costs for table display
 */
export const transformCostsForTable = (costs: OperationalCost[]) => {
  return costs.map(cost => ({
    id: cost.id,
    nama_biaya: cost.nama_biaya,
    jumlah_per_bulan: cost.jumlah_per_bulan,
    jumlah_formatted: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cost.jumlah_per_bulan),
    jenis: cost.jenis,
    jenis_label: cost.jenis === 'tetap' ? 'Tetap' : 'Variabel',
    status: cost.status,
    status_label: cost.status === 'aktif' ? 'Aktif' : 'Non Aktif',
    group: cost.group,
    group_label: cost.group === 'hpp' ? 'Overhead Pabrik (HPP)' : 'Biaya Operasional',
    created_at: cost.created_at,
    created_at_formatted: new Date(cost.created_at).toLocaleDateString('id-ID'),
    updated_at: cost.updated_at,
  }));
};

/**
 * Transform costs for export
 */
export const transformCostsForExport = (costs: OperationalCost[]) => {
  return costs.map(cost => ({
    'Nama Biaya': cost.nama_biaya,
    'Jumlah per Bulan': cost.jumlah_per_bulan,
    'Jenis': cost.jenis === 'tetap' ? 'Tetap' : 'Variabel',
    'Status': cost.status === 'aktif' ? 'Aktif' : 'Non Aktif',
    'Kelompok': cost.group === 'hpp' ? 'Overhead Pabrik (HPP)' : 'Biaya Operasional',
    'Tanggal Dibuat': new Date(cost.created_at).toLocaleDateString('id-ID'),
    'Terakhir Update': new Date(cost.updated_at).toLocaleDateString('id-ID'),
  }));
};

/**
 * Transform costs for chart data
 */
export const transformCostsForChart = (costs: OperationalCost[]) => {
  const activeCosts = costs.filter(cost => cost.status === 'aktif');
  
  // Group by type
  const byType = activeCosts.reduce((acc, cost) => {
    const type = cost.jenis === 'tetap' ? 'Biaya Tetap' : 'Biaya Variabel';
    acc[type] = (acc[type] || 0) + Number(cost.jumlah_per_bulan);
    return acc;
  }, {} as Record<string, number>);

  // Transform to chart format
  return Object.entries(byType).map(([name, value]) => ({
    name,
    value,
    percentage: 0, // Will be calculated by chart component
  }));
};

/**
 * Transform allocation settings for display
 */
export const transformAllocationForDisplay = (
  settings: AllocationSettings,
  totalCosts: number = 0
) => {
  const metodeName = settings.metode === 'per_unit' ? 'Per Unit Produksi' : 'Persentase dari Material';
  const nilaiFormatted = settings.metode === 'per_unit' 
    ? `${settings.nilai.toLocaleString('id-ID')} unit/bulan`
    : `${settings.nilai}%`;

  let overheadExample = '';
  if (settings.metode === 'per_unit' && settings.nilai > 0) {
    const overhead = totalCosts / settings.nilai;
    overheadExample = `≈ ${new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(overhead)}/unit`;
  } else if (settings.metode === 'persentase') {
    overheadExample = `${settings.nilai}% dari biaya material`;
  }

  return {
    metode_name: metodeName,
    nilai_formatted: nilaiFormatted,
    overhead_example: overheadExample,
    description: settings.metode === 'per_unit' 
      ? 'Overhead dihitung dengan membagi total biaya dengan estimasi produksi'
      : 'Overhead dihitung sebagai persentase dari biaya material',
  };
};

/**
 * Transform bulk import data
 */
export const transformBulkImportData = (importData: any[]): CostFormData[] => {
  return importData.map(row => ({
    nama_biaya: String(row['Nama Biaya'] || row.nama_biaya || '').trim(),
    jumlah_per_bulan: Number(row['Jumlah per Bulan'] || row.jumlah_per_bulan || 0),
    jenis: (String(row['Jenis'] || row.jenis || 'tetap').toLowerCase() === 'variabel') 
      ? 'variabel' : 'tetap',
    status: (String(row['Status'] || row.status || 'aktif').toLowerCase() === 'nonaktif') 
      ? 'nonaktif' : 'aktif',
    group: (String(row['Kelompok'] || row.group || 'operasional').toLowerCase() === 'hpp') 
      ? 'hpp' : 'operasional',
  }));
};

/**
 * Transform cost history for trend analysis
 */
export const transformCostHistory = (
  currentCosts: OperationalCost[],
  previousCosts: OperationalCost[] = []
) => {
  const current = transformCostsToSummary(currentCosts);
  const previous = transformCostsToSummary(previousCosts);
  
  const totalChange = current.total_biaya_aktif - previous.total_biaya_aktif;
  const totalChangePercentage = previous.total_biaya_aktif > 0 
    ? (totalChange / previous.total_biaya_aktif) * 100 
    : 0;

  return {
    current,
    previous,
    changes: {
      total_amount: totalChange,
      total_percentage: totalChangePercentage,
      count_change: current.jumlah_biaya_aktif - previous.jumlah_biaya_aktif,
      trend: totalChange > 0 ? 'increase' : totalChange < 0 ? 'decrease' : 'stable',
    },
  };
};