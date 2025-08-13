// src/components/financial/profit-analysis/utils/exportHelpers.ts
// ✅ HELPER FUNCTIONS UNTUK EXPORT

import { DatePeriod } from '../types/profitAnalysis';

export const prepareExportData = (profitData: any, period: DatePeriod) => {
  return {
    // Summary data
    ringkasan: {
      periode: period.label,
      tanggal_analisis: new Date().toLocaleDateString('id-ID'),
      pendapatan: profitData.profitMarginData.revenue,
      hpp: profitData.profitMarginData.cogs,
      opex: profitData.profitMarginData.opex,
      laba_kotor: profitData.profitMarginData.grossProfit,
      laba_bersih: profitData.profitMarginData.netProfit,
      margin_kotor_persen: profitData.profitMarginData.grossMargin,
      margin_bersih_persen: profitData.profitMarginData.netMargin
    },

    // COGS breakdown
    rincian_hpp: {
      biaya_material: profitData.cogsBreakdown.totalMaterialCost,
      biaya_tenaga_kerja: profitData.cogsBreakdown.totalDirectLaborCost,
      overhead_manufaktur: profitData.cogsBreakdown.manufacturingOverhead,
      total_hpp: profitData.cogsBreakdown.totalCOGS,
      metode_alokasi: profitData.cogsBreakdown.overheadAllocationMethod
    },

    // OPEX breakdown
    rincian_opex: {
      biaya_administrasi: profitData.opexBreakdown.totalAdministrative,
      biaya_penjualan: profitData.opexBreakdown.totalSelling,
      biaya_umum: profitData.opexBreakdown.totalGeneral,
      total_opex: profitData.opexBreakdown.totalOPEX
    },

    // Insights
    insights: profitData.insights.map((insight: any) => ({
      tipe: insight.type,
      kategori: insight.category,
      judul: insight.title,
      pesan: insight.message,
      rekomendasi: insight.recommendation || '',
      dampak: insight.impact
    })),

    // Ratios & Analysis
    analisis_rasio: {
      rasio_hpp_pendapatan: ((profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100),
      rasio_opex_pendapatan: ((profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100),
      rasio_material: ((profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100),
      rasio_tenaga_kerja: ((profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100),
      efisiensi_hpp: (profitData.profitMarginData.revenue / profitData.profitMarginData.cogs),
      efisiensi_opex: (profitData.profitMarginData.revenue / profitData.profitMarginData.opex)
    },

    // Benchmarks
    patokan_industri: {
      status_margin_kotor: getMarginStatus(profitData.profitMarginData.grossMargin, 'gross'),
      status_margin_bersih: getMarginStatus(profitData.profitMarginData.netMargin, 'net'),
      target_margin_kotor: "25%+",
      target_margin_bersih: "10%+",
      target_rasio_hpp: "<70%",
      target_rasio_opex: "<20%"
    }
  };
};

export const generateExportFilename = (format: string, period: DatePeriod): string => {
  const dateStr = period.label.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  return `Analisis_Profit_Margin_${dateStr}_${timestamp}.${format}`;
};