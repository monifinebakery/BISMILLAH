// Smart Defaults for Operational Costs UX Enhancement
// Provides intelligent field pre-filling based on cost name patterns

export interface SmartSuggestion {
  jenis: 'tetap' | 'variabel';
  group: 'hpp' | 'operasional';
  estimatedAmount?: number;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CostTemplate {
  name: string;
  jenis: 'tetap' | 'variabel';
  group: 'hpp' | 'operasional';
  estimatedAmount: number;
  description: string;
  category: string;
}

// Common cost templates by business type
export const COST_TEMPLATES: Record<string, CostTemplate[]> = {
  general: [
    {
      name: 'Sewa Tempat',
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 2000000,
      description: 'Biaya sewa bulanan tempat usaha',
      category: 'Overhead'
    },
    {
      name: 'Listrik',
      jenis: 'tetap',
      group: 'hpp',
      estimatedAmount: 500000,
      description: 'Biaya listrik untuk operasional',
      category: 'Utilities'
    },
    {
      name: 'Gas LPG',
      jenis: 'variabel',
      group: 'hpp',
      estimatedAmount: 300000,
      description: 'Biaya gas untuk produksi',
      category: 'Production'
    },
    {
      name: 'Internet & Telepon',
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 200000,
      description: 'Biaya komunikasi dan internet',
      category: 'Communication'
    },
    {
      name: 'Marketing Digital',
      jenis: 'variabel',
      group: 'operasional',
      estimatedAmount: 1000000,
      description: 'Biaya promosi online (FB, IG, Google)',
      category: 'Marketing'
    }
  ],
  restaurant: [
    {
      name: 'Gaji Koki',
      jenis: 'tetap',
      group: 'hpp',
      estimatedAmount: 3000000,
      description: 'Gaji chef dan asisten koki',
      category: 'Labor'
    },
    {
      name: 'Gas Kompor Industrial',
      jenis: 'variabel',
      group: 'hpp',
      estimatedAmount: 800000,
      description: 'Biaya gas untuk dapur',
      category: 'Production'
    },
    {
      name: 'Cleaning Service',
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 400000,
      description: 'Biaya kebersihan resto',
      category: 'Maintenance'
    }
  ],
  bakery: [
    {
      name: 'Oven Listrik',
      jenis: 'tetap',
      group: 'hpp',
      estimatedAmount: 600000,
      description: 'Biaya listrik khusus oven',
      category: 'Production Equipment'
    },
    {
      name: 'Packaging',
      jenis: 'variabel',
      group: 'hpp',
      estimatedAmount: 500000,
      description: 'Biaya kemasan roti dan kue',
      category: 'Materials'
    }
  ],
  online_shop: [
    {
      name: 'Kurir & Ekspedisi',
      jenis: 'variabel',
      group: 'operasional',
      estimatedAmount: 800000,
      description: 'Biaya pengiriman produk',
      category: 'Logistics'
    },
    {
      name: 'Marketplace Fee',
      jenis: 'variabel',
      group: 'operasional',
      estimatedAmount: 600000,
      description: 'Biaya platform e-commerce',
      category: 'Sales Channel'
    },
    {
      name: 'Customer Service',
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 1500000,
      description: 'Gaji admin CS dan packing',
      category: 'Support'
    }
  ]
};

// Smart suggestion logic based on cost name
export const generateSmartSuggestion = (costName: string): SmartSuggestion | null => {
  const name = costName.toLowerCase().trim();
  
  if (!name || name.length < 3) {
    return null;
  }

  // High confidence suggestions
  if (name.includes('sewa')) {
    return {
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 2000000,
      explanation: 'Biaya sewa biasanya tetap setiap bulan dan masuk kategori operasional',
      confidence: 'high'
    };
  }

  if (name.includes('gaji') || name.includes('upah')) {
    if (name.includes('koki') || name.includes('produksi') || name.includes('chef')) {
      return {
        jenis: 'tetap',
        group: 'hpp',
        estimatedAmount: 2500000,
        explanation: 'Gaji tenaga kerja produksi langsung masuk ke overhead pabrik (HPP)',
        confidence: 'high'
      };
    } else {
      return {
        jenis: 'tetap',
        group: 'operasional',
        estimatedAmount: 1500000,
        explanation: 'Gaji staf non-produksi masuk kategori operasional',
        confidence: 'high'
      };
    }
  }

  if (name.includes('listrik')) {
    if (name.includes('oven') || name.includes('mesin') || name.includes('produksi')) {
      return {
        jenis: 'tetap',
        group: 'hpp',
        estimatedAmount: 600000,
        explanation: 'Listrik untuk peralatan produksi masuk ke overhead pabrik',
        confidence: 'high'
      };
    } else {
      return {
        jenis: 'tetap',
        group: 'operasional',
        estimatedAmount: 400000,
        explanation: 'Listrik umum masuk kategori operasional',
        confidence: 'medium'
      };
    }
  }

  if (name.includes('gas')) {
    return {
      jenis: 'variabel',
      group: 'hpp',
      estimatedAmount: 400000,
      explanation: 'Biaya gas untuk produksi bersifat variabel dan masuk HPP',
      confidence: 'high'
    };
  }

  // Medium confidence suggestions
  if (name.includes('marketing') || name.includes('iklan') || name.includes('promosi')) {
    return {
      jenis: 'variabel',
      group: 'operasional',
      estimatedAmount: 1000000,
      explanation: 'Biaya marketing bersifat variabel dan untuk analisis BEP',
      confidence: 'medium'
    };
  }

  if (name.includes('internet') || name.includes('telepon') || name.includes('komunikasi')) {
    return {
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 200000,
      explanation: 'Biaya komunikasi biasanya tetap dan masuk operasional',
      confidence: 'medium'
    };
  }

  if (name.includes('transport') || name.includes('bensin') || name.includes('kurir')) {
    return {
      jenis: 'variabel',
      group: 'operasional',
      estimatedAmount: 500000,
      explanation: 'Biaya transportasi bersifat variabel dan masuk operasional',
      confidence: 'medium'
    };
  }

  if (name.includes('kemasan') || name.includes('packaging') || name.includes('box')) {
    return {
      jenis: 'variabel',
      group: 'hpp',
      estimatedAmount: 400000,
      explanation: 'Biaya kemasan bersifat variabel dan masuk ke HPP',
      confidence: 'medium'
    };
    }

  if (name.includes('cleaning') || name.includes('kebersihan') || name.includes('sanitasi')) {
    return {
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 300000,
      explanation: 'Biaya kebersihan biasanya tetap dan masuk operasional',
      confidence: 'medium'
    };
  }

  // Low confidence suggestions (fallback)
  if (name.length > 5) {
    return {
      jenis: 'tetap',
      group: 'operasional',
      estimatedAmount: 500000,
      explanation: 'Berdasarkan nama, kemungkinan biaya operasional tetap',
      confidence: 'low'
    };
  }

  return null;
};

// Get templates for specific business type
export const getTemplatesForBusiness = (businessType: string): CostTemplate[] => {
  return [...(COST_TEMPLATES.general || []), ...(COST_TEMPLATES[businessType] || [])];
};

// Format currency for display
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Confidence level colors for UI
export const getConfidenceColor = (confidence: 'high' | 'medium' | 'low'): string => {
  switch (confidence) {
    case 'high': return 'text-green-600 bg-green-50 border-green-200';
    case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
