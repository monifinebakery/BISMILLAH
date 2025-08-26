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
  suggested_group: 'hpp' | 'operasional' | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  matched_keywords: string[];
} => {
  const lowercaseName = costName.toLowerCase();
  
  // Check HPP keywords
  const hppMatches = HPP_KEYWORDS.filter(keyword => 
    lowercaseName.includes(keyword.toLowerCase())
  );
  
  // Check OPERASIONAL keywords  
  const operasionalMatches = OPERASIONAL_KEYWORDS.filter(keyword => 
    lowercaseName.includes(keyword.toLowerCase())
  );
  
  // Determine classification
  if (hppMatches.length > operasionalMatches.length) {
    const confidence = hppMatches.length >= 2 ? 'high' : 'medium';
    return {
      suggested_group: 'hpp',
      confidence,
      reason: `Cocok dengan kata kunci Overhead Pabrik: ${hppMatches.join(', ')}`,
      matched_keywords: hppMatches
    };
  } else if (operasionalMatches.length > hppMatches.length) {
    const confidence = operasionalMatches.length >= 2 ? 'high' : 'medium';
    return {
      suggested_group: 'operasional',
      confidence,
      reason: `Cocok dengan kata kunci Biaya Operasional: ${operasionalMatches.join(', ')}`,
      matched_keywords: operasionalMatches
    };
  } else if (hppMatches.length > 0 && operasionalMatches.length > 0) {
    // Ambiguous case
    return {
      suggested_group: null,
      confidence: 'low',
      reason: `Ambiguous: cocok dengan kedua kategori (HPP: ${hppMatches.join(', ')}, Operasional: ${operasionalMatches.join(', ')})`,
      matched_keywords: [...hppMatches, ...operasionalMatches]
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
export const getCostGroupLabel = (group: 'hpp' | 'operasional'): string => {
  const labels = {
    'hpp': 'Overhead Pabrik (masuk HPP)',
    'operasional': 'Biaya Operasional (di luar HPP)'
  };
  return labels[group];
};

/**
 * Get group descriptions for UI tooltips
 */
export const getCostGroupDescription = (group: 'hpp' | 'operasional'): string => {
  const descriptions = {
    'hpp': 'Biaya tidak langsung yang terkait dengan proses produksi, seperti gas oven, sewa dapur, dan supervisi produksi. Biaya ini akan ditambahkan ke HPP produk.',
    'operasional': 'Biaya untuk menjalankan operasional bisnis yang tidak terkait langsung dengan produksi, seperti marketing, administrasi, dan marketplace. Biaya ini tidak menambah HPP, tetapi digunakan untuk analisis BEP dan pricing.'
  };
  return descriptions[group];
};