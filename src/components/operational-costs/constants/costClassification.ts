// src/components/operational-costs/constants/costClassification.ts
// 🎯 Automatic Cost Classification Rules (Revision 5)
// Rule of thumb for detecting Overhead Pabrik vs Operasional costs

import { CostClassificationRule } from '../types/operationalCost.types';

// ====================================
// OVERHEAD PABRIK (HPP) KEYWORDS
// ====================================

export const HPP_KEYWORDS = [
  // Gas & Energy for Production
  'oven', 'proofer', 'gas', 'lpg', 'listrik produksi', 
  'gas oven', 'gas proofer', 'listrik oven', 'energy produksi',
  
  // Facility & Equipment
  'sewa dapur', 'penyusutan mixer', 'penyusutan oven', 'penyusutan proofer',
  'sewa kitchen', 'sewa pabrik', 'depresiasi alat produksi', 'maintenance oven',
  'maintenance mixer', 'peralatan produksi', 'alat masak',
  
  // Indirect Labor
  'supervisor produksi', 'supervisor qc', 'quality control', 'kepala produksi',
  'asisten produksi', 'checker produksi', 'indirect labor',
  
  // Production Support
  'kebersihan dapur', 'sanitasi produksi', 'kemasan produksi',
  'packaging indirect', 'utilities produksi'
];

// ====================================
// TKL (TENAGA KERJA LANGSUNG) KEYWORDS  
// ====================================

export const TKL_KEYWORDS = [
  // Direct Production Labor
  'koki', 'chef', 'tukang masak', 'baker', 'pastry chef',
  'operator produksi', 'staff produksi', 'pekerja produksi',
  'asisten koki', 'helper produksi', 'tukang potong', 'tukang adon',
  
  // Wages & Labor Costs
  'gaji harian', 'upah harian', 'borongan', 'piece rate',
  'lembur produksi', 'overtime produksi', 'shift produksi',
  'bonus produksi', 'insentif produksi',
  
  // Direct Labor Benefits
  'uang makan produksi', 'transport produksi', 'seragam produksi',
  'thr produksi', 'bpjs produksi', 'jamsostek produksi',
  
  // Production Team
  'tim produksi', 'crew produksi', 'team kitchen', 'staff kitchen',
  'pekerja langsung', 'tenaga kerja langsung', 'direct labor'
];

// ====================================
// OPERASIONAL (NON-HPP) KEYWORDS  
// ====================================

export const OPERASIONAL_KEYWORDS = [
  // Marketing & Advertising
  'marketing', 'iklan', 'promosi', 'advertising', 'social media',
  'facebook ads', 'instagram ads', 'google ads', 'banner', 'brosur',
  'event marketing', 'sponsorship', 'brand activation',
  
  // Administrative
  'admin', 'kasir', 'administrasi', 'administration', 'office',
  'sekretaris', 'receptionist', 'customer service', 'cs',
  
  // Technology & Communication
  'internet toko', 'wifi toko', 'internet cafe', 'software',
  'aplikasi', 'pos system', 'kasir digital', 'komputer toko',
  'laptop admin', 'printer admin',
  
  // Banking & Marketplace
  'biaya bank', 'bank charges', 'transfer fee', 'marketplace',
  'shopee', 'tokopedia', 'gojek', 'grab', 'commission fee',
  'payment gateway', 'ovo', 'dana', 'gopay',
  
  // Store Operations (Non-Production)
  'sewa toko', 'sewa etalase', 'display', 'showcase', 'counter',
  'meja kasir', 'kursi tamu', 'ac toko', 'lampu toko',
  
  // General Operations
  'keamanan toko', 'cleaning service toko', 'listrik toko',
  'air toko', 'telephone', 'telepon', 'transportasi admin',
  'bensin motor', 'ojek admin'
];

// ====================================
// CLASSIFICATION RULES
// ====================================

export const COST_CLASSIFICATION_RULES: CostClassificationRule[] = [
  {
    keywords: HPP_KEYWORDS,
    group: 'hpp',
    description: 'Overhead Pabrik (masuk HPP): Biaya produksi tidak langsung yang terkait dengan proses pembuatan produk'
  },
  {
    keywords: TKL_KEYWORDS,
    group: 'tkl',
    description: 'Tenaga Kerja Langsung (masuk HPP): Gaji dan biaya staf yang terlibat langsung dalam proses produksi'
  },
  {
    keywords: OPERASIONAL_KEYWORDS,
    group: 'operasional',
    description: 'Biaya Operasional (di luar HPP): Biaya untuk menjalankan bisnis yang tidak terkait langsung dengan produksi'
  }
];

// ====================================
// CLASSIFICATION FUNCTIONS
// ====================================

/**
 * Classify cost based on name using keyword matching
 */
export const classifyCostByKeywords = (costName: string): {
  suggested_group: 'hpp' | 'operasional' | 'tkl' | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  matched_keywords: string[];
} => {
  const lowercaseName = costName.toLowerCase();
  
  // Check HPP keywords
  const hppMatches = HPP_KEYWORDS.filter(keyword => 
    lowercaseName.includes(keyword.toLowerCase())
  );
  
  // ✅ NEW: Check TKL keywords
  const tklMatches = TKL_KEYWORDS.filter(keyword => 
    lowercaseName.includes(keyword.toLowerCase())
  );
  
  // Check OPERASIONAL keywords  
  const operasionalMatches = OPERASIONAL_KEYWORDS.filter(keyword => 
    lowercaseName.includes(keyword.toLowerCase())
  );
  
  // ✅ NEW: Determine classification with TKL priority
  const allMatches = [
    { group: 'tkl', matches: tklMatches, label: 'Tenaga Kerja Langsung' },
    { group: 'hpp', matches: hppMatches, label: 'Overhead Pabrik' },
    { group: 'operasional', matches: operasionalMatches, label: 'Biaya Operasional' }
  ];
  
  // Find the group with the most matches
  const bestMatch = allMatches.reduce((best, current) => 
    current.matches.length > best.matches.length ? current : best
  );
  
  // TKL gets priority if there are matches (labor costs are specific)
  if (tklMatches.length > 0) {
    const confidence = tklMatches.length >= 2 ? 'high' : 'medium';
    return {
      suggested_group: 'tkl' as const,
      confidence,
      reason: `Cocok dengan kata kunci ${bestMatch.label}: ${tklMatches.join(', ')}`,
      matched_keywords: tklMatches
    };
  } else if (bestMatch.matches.length > 0) {
    const confidence = bestMatch.matches.length >= 2 ? 'high' : 'medium';
    return {
      suggested_group: bestMatch.group as 'hpp' | 'operasional',
      confidence,
      reason: `Cocok dengan kata kunci ${bestMatch.label}: ${bestMatch.matches.join(', ')}`,
      matched_keywords: bestMatch.matches
    };
  } else if (allMatches.some(m => m.matches.length > 0)) {
    // Ambiguous case
    const ambiguousMatches = allMatches.filter(m => m.matches.length > 0);
    return {
      suggested_group: null,
      confidence: 'low',
      reason: `Ambiguous: cocok dengan beberapa kategori (${ambiguousMatches.map(m => `${m.label}: ${m.matches.join(', ')}`).join(', ')})`,
      matched_keywords: ambiguousMatches.flatMap(m => m.matches)
    };
  }
  
  // No matches found
  return {
    suggested_group: null,
    confidence: 'low',
    reason: 'Tidak ditemukan kata kunci yang cocok. Silakan pilih kategori secara manual.',
    matched_keywords: []
  };
};

/**
 * Get user-friendly group labels in Indonesian
 */
export const getCostGroupLabel = (group: 'hpp' | 'operasional' | 'tkl'): string => {
  const labels = {
    'hpp': 'Biaya Produksi - Overhead (masuk HPP)',
    'tkl': 'Biaya Produksi - TKL (masuk HPP)',
    'operasional': 'Biaya Operasional (di luar HPP)'
  };
  return labels[group];
};

/**
 * Get group descriptions for UI tooltips
 */
export const getCostGroupDescription = (group: 'hpp' | 'operasional' | 'tkl'): string => {
  const descriptions = {
    'hpp': 'Biaya produksi tidak langsung (overhead), seperti gas oven, sewa dapur, listrik produksi, dan peralatan. Biaya ini masuk ke HPP produk.',
    'tkl': 'Biaya produksi langsung untuk tenaga kerja, seperti gaji koki, helper produksi, dan lembur. Biaya ini masuk ke HPP produk.',
    'operasional': 'Biaya untuk menjalankan operasional bisnis yang tidak terkait langsung dengan produksi, seperti marketing, administrasi, dan marketplace. Biaya ini tidak menambah HPP, tetapi digunakan untuk analisis BEP dan pricing.'
  };
  return descriptions[group];
};
