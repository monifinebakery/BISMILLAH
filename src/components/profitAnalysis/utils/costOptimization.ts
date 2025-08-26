import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from './config/profitConfig';

// Types untuk Cost Optimization
export interface IngredientCost {
  id: string;
  name: string;
  category: 'protein' | 'vegetables' | 'grains' | 'dairy' | 'spices' | 'beverages' | 'packaging' | 'other';
  unitCost: number;
  unitType: 'kg' | 'liter' | 'piece' | 'gram';
  monthlyUsage: number;
  totalMonthlyCost: number;
  wastePercentage: number;
  supplierName: string;
  lastUpdated: Date;
}

export interface CostOptimizationOpportunity {
  id: string;
  type: 'waste_reduction' | 'supplier_change' | 'portion_control' | 'menu_engineering' | 'bulk_purchasing' | 'seasonal_sourcing';
  title: string;
  description: string;
  affectedIngredients: string[];
  currentMonthlyCost: number;
  potentialSavings: number;
  savingsPercentage: number;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  priority: 'high' | 'medium' | 'low';
  actionSteps: string[];
  kpiToTrack: string[];
  riskLevel: 'low' | 'medium' | 'high';
  estimatedROI: number;
}

export interface WasteAnalysis {
  ingredientId: string;
  ingredientName: string;
  wasteAmount: number;
  wasteCost: number;
  wastePercentage: number;
  wasteReasons: string[];
  reductionPotential: number;
  recommendedActions: string[];
}

export interface SupplierComparison {
  ingredientId: string;
  ingredientName: string;
  currentSupplier: {
    name: string;
    unitCost: number;
    quality: number;
    reliability: number;
  };
  alternativeSuppliers: Array<{
    name: string;
    unitCost: number;
    quality: number;
    reliability: number;
    potentialSavings: number;
    riskAssessment: string;
  }>;
  recommendation: string;
}

export interface CostOptimizationResult {
  totalMonthlyCost: number;
  totalPotentialSavings: number;
  savingsPercentage: number;
  topWasteItems: WasteAnalysis[];
  optimizationOpportunities: CostOptimizationOpportunity[];
  supplierRecommendations: SupplierComparison[];
  costBreakdown: {
    byCategory: Record<string, number>;
    bySupplier: Record<string, number>;
    wasteByCategory: Record<string, number>;
  };
  insights: string[];
  quickWins: CostOptimizationOpportunity[];
  longTermStrategies: CostOptimizationOpportunity[];
}

// Konstanta untuk benchmark industri
const INDUSTRY_WASTE_BENCHMARKS = {
  [BusinessType.FNB_RESTAURANT]: {
    protein: { acceptable: 5, good: 3, excellent: 1 },
    vegetables: { acceptable: 15, good: 10, excellent: 5 },
    grains: { acceptable: 3, good: 2, excellent: 1 },
    dairy: { acceptable: 8, good: 5, excellent: 2 },
    overall: { acceptable: 8, good: 5, excellent: 3 }
  },
  [BusinessType.FNB_FASTFOOD]: {
    protein: { acceptable: 3, good: 2, excellent: 1 },
    vegetables: { acceptable: 10, good: 7, excellent: 3 },
    grains: { acceptable: 2, good: 1, excellent: 0.5 },
    dairy: { acceptable: 5, good: 3, excellent: 1 },
    overall: { acceptable: 5, good: 3, excellent: 2 }
  },
  [BusinessType.FNB_STREETFOOD]: {
    protein: { acceptable: 8, good: 5, excellent: 2 },
    vegetables: { acceptable: 20, good: 15, excellent: 8 },
    grains: { acceptable: 5, good: 3, excellent: 1 },
    dairy: { acceptable: 10, good: 7, excellent: 3 },
    overall: { acceptable: 10, good: 7, excellent: 4 }
  }
};

const COST_OPTIMIZATION_STRATEGIES = {
  waste_reduction: {
    title: 'Pengurangan Limbah',
    description: 'Mengurangi pemborosan bahan baku melalui kontrol porsi dan penyimpanan yang lebih baik',
    averageROI: 300,
    implementationTime: 'short_term'
  },
  supplier_change: {
    title: 'Pergantian Supplier',
    description: 'Beralih ke supplier dengan harga lebih kompetitif tanpa mengorbankan kualitas',
    averageROI: 150,
    implementationTime: 'medium_term'
  },
  portion_control: {
    title: 'Kontrol Porsi',
    description: 'Standardisasi porsi untuk mengurangi over-serving dan waste',
    averageROI: 200,
    implementationTime: 'immediate'
  },
  menu_engineering: {
    title: 'Menu Engineering',
    description: 'Optimasi menu untuk fokus pada item dengan margin tinggi dan biaya rendah',
    averageROI: 250,
    implementationTime: 'medium_term'
  },
  bulk_purchasing: {
    title: 'Pembelian Bulk',
    description: 'Pembelian dalam jumlah besar untuk mendapatkan diskon volume',
    averageROI: 120,
    implementationTime: 'short_term'
  },
  seasonal_sourcing: {
    title: 'Sourcing Musiman',
    description: 'Memanfaatkan bahan baku musiman untuk mendapatkan harga terbaik',
    averageROI: 180,
    implementationTime: 'long_term'
  }
};

// Fungsi untuk menganalisis waste bahan baku
export function analyzeIngredientWaste(
  ingredients: IngredientCost[],
  businessType: BusinessType
): WasteAnalysis[] {
  const benchmarks = INDUSTRY_WASTE_BENCHMARKS[businessType as keyof typeof INDUSTRY_WASTE_BENCHMARKS] || INDUSTRY_WASTE_BENCHMARKS[BusinessType.FNB_RESTAURANT];
  
  return ingredients
    .filter(ingredient => ingredient.wastePercentage > 0)
    .map(ingredient => {
      const categoryBenchmark = benchmarks[ingredient.category as keyof typeof benchmarks] || benchmarks.overall;
      const wasteAmount = (ingredient.monthlyUsage * ingredient.wastePercentage) / 100;
      const wasteCost = wasteAmount * ingredient.unitCost;
      
      let reductionPotential = 0;
      let recommendedActions: string[] = [];
      let wasteReasons: string[] = [];
      
      if (ingredient.wastePercentage > categoryBenchmark.acceptable) {
        reductionPotential = Math.min(
          ingredient.wastePercentage - categoryBenchmark.good,
          ingredient.wastePercentage * 0.7
        );
        
        wasteReasons = [
          'Penyimpanan tidak optimal',
          'Kontrol porsi kurang ketat',
          'Perencanaan menu tidak efisien',
          'Kualitas bahan baku tidak konsisten'
        ];
        
        recommendedActions = [
          'Implementasi sistem FIFO (First In, First Out)',
          'Pelatihan staff untuk kontrol porsi',
          'Review dan optimasi resep',
          'Evaluasi supplier dan kualitas bahan'
        ];
        
        if (ingredient.wastePercentage > categoryBenchmark.acceptable * 2) {
          recommendedActions.push(
            'Audit mendalam proses operasional',
            'Konsultasi dengan ahli food cost management'
          );
        }
      }
      
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        wasteAmount,
        wasteCost,
        wastePercentage: ingredient.wastePercentage,
        wasteReasons,
        reductionPotential,
        recommendedActions
      };
    })
    .sort((a, b) => b.wasteCost - a.wasteCost);
}

// Fungsi untuk mengidentifikasi peluang optimasi biaya
export function identifyCostOptimizationOpportunities(
  ingredients: IngredientCost[],
  wasteAnalysis: WasteAnalysis[],
  businessType: BusinessType
): CostOptimizationOpportunity[] {
  const opportunities: CostOptimizationOpportunity[] = [];
  
  // 1. Waste Reduction Opportunities
  const highWasteItems = wasteAnalysis.filter(item => item.reductionPotential > 5);
  if (highWasteItems.length > 0) {
    const totalWasteCost = highWasteItems.reduce((sum, item) => sum + item.wasteCost, 0);
    const potentialSavings = highWasteItems.reduce((sum, item) => 
      sum + (item.wasteCost * item.reductionPotential / item.wastePercentage), 0
    );
    
    opportunities.push({
      id: 'waste-reduction-high-impact',
      type: 'waste_reduction',
      title: 'Pengurangan Limbah Bahan Utama',
      description: `Fokus pada ${highWasteItems.length} bahan dengan tingkat waste tertinggi`,
      affectedIngredients: highWasteItems.map(item => item.ingredientId),
      currentMonthlyCost: totalWasteCost,
      potentialSavings,
      savingsPercentage: (potentialSavings / totalWasteCost) * 100,
      implementationDifficulty: 'medium',
      timeToImplement: 'short_term',
      priority: 'high',
      actionSteps: [
        'Audit proses penyimpanan dan handling',
        'Implementasi sistem tracking waste harian',
        'Pelatihan staff tentang best practices',
        'Review dan standardisasi porsi'
      ],
      kpiToTrack: ['waste_percentage', 'cost_per_portion', 'inventory_turnover'],
      riskLevel: 'low',
      estimatedROI: COST_OPTIMIZATION_STRATEGIES.waste_reduction.averageROI
    });
  }
  
  // 2. Portion Control Opportunities
  const expensiveIngredients = ingredients
    .filter(ing => ing.totalMonthlyCost > 5000000) // > 5 juta per bulan
    .sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost)
    .slice(0, 5);
    
  if (expensiveIngredients.length > 0) {
    const totalCost = expensiveIngredients.reduce((sum, ing) => sum + ing.totalMonthlyCost, 0);
    const potentialSavings = totalCost * 0.15; // Estimasi 15% savings dari portion control
    
    opportunities.push({
      id: 'portion-control-expensive',
      type: 'portion_control',
      title: 'Kontrol Porsi Bahan Mahal',
      description: 'Standardisasi porsi untuk bahan dengan biaya tertinggi',
      affectedIngredients: expensiveIngredients.map(ing => ing.id),
      currentMonthlyCost: totalCost,
      potentialSavings,
      savingsPercentage: 15,
      implementationDifficulty: 'easy',
      timeToImplement: 'immediate',
      priority: 'high',
      actionSteps: [
        'Buat standar porsi untuk setiap menu',
        'Sediakan alat ukur yang tepat',
        'Pelatihan staff kitchen',
        'Monitoring dan evaluasi berkala'
      ],
      kpiToTrack: ['portion_consistency', 'cost_per_dish', 'customer_satisfaction'],
      riskLevel: 'low',
      estimatedROI: COST_OPTIMIZATION_STRATEGIES.portion_control.averageROI
    });
  }
  
  // 3. Bulk Purchasing Opportunities
  const bulkCandidates = ingredients.filter(ing => 
    ing.monthlyUsage > 100 && // Usage tinggi
    ing.category !== 'dairy' && // Bukan produk mudah rusak
    ing.category !== 'vegetables'
  );
  
  if (bulkCandidates.length > 0) {
    const totalCost = bulkCandidates.reduce((sum, ing) => sum + ing.totalMonthlyCost, 0);
    const potentialSavings = totalCost * 0.12; // Estimasi 12% savings dari bulk purchasing
    
    opportunities.push({
      id: 'bulk-purchasing',
      type: 'bulk_purchasing',
      title: 'Pembelian Bulk Bahan Tahan Lama',
      description: 'Pembelian dalam jumlah besar untuk bahan dengan usage tinggi',
      affectedIngredients: bulkCandidates.map(ing => ing.id),
      currentMonthlyCost: totalCost,
      potentialSavings,
      savingsPercentage: 12,
      implementationDifficulty: 'medium',
      timeToImplement: 'short_term',
      priority: 'medium',
      actionSteps: [
        'Analisis kapasitas penyimpanan',
        'Negosiasi dengan supplier untuk bulk discount',
        'Evaluasi cash flow impact',
        'Implementasi sistem inventory management'
      ],
      kpiToTrack: ['inventory_turnover', 'storage_cost', 'cash_flow'],
      riskLevel: 'medium',
      estimatedROI: COST_OPTIMIZATION_STRATEGIES.bulk_purchasing.averageROI
    });
  }
  
  // 4. Menu Engineering Opportunities
  const lowMarginIngredients = ingredients.filter(ing => {
    // Simulasi: bahan dengan cost tinggi tapi mungkin margin rendah
    const estimatedMargin = 100 - ((ing.unitCost / (ing.unitCost * 3)) * 100); // Asumsi selling price 3x cost
    return estimatedMargin < 60 && ing.totalMonthlyCost > 2000000;
  });
  
  if (lowMarginIngredients.length > 0) {
    const totalCost = lowMarginIngredients.reduce((sum, ing) => sum + ing.totalMonthlyCost, 0);
    const potentialSavings = totalCost * 0.20; // Estimasi 20% improvement dari menu engineering
    
    opportunities.push({
      id: 'menu-engineering',
      type: 'menu_engineering',
      title: 'Optimasi Menu Low-Margin',
      description: 'Review dan optimasi menu items dengan margin rendah',
      affectedIngredients: lowMarginIngredients.map(ing => ing.id),
      currentMonthlyCost: totalCost,
      potentialSavings,
      savingsPercentage: 20,
      implementationDifficulty: 'hard',
      timeToImplement: 'medium_term',
      priority: 'medium',
      actionSteps: [
        'Analisis profitabilitas per menu item',
        'Identifikasi menu dengan margin rendah',
        'Redesign resep atau ganti bahan',
        'Test market untuk menu baru'
      ],
      kpiToTrack: ['menu_profitability', 'customer_preference', 'overall_margin'],
      riskLevel: 'medium',
      estimatedROI: COST_OPTIMIZATION_STRATEGIES.menu_engineering.averageROI
    });
  }
  
  return opportunities.sort((a, b) => {
    // Sort by priority and potential savings
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityWeight[a.priority];
    const bPriority = priorityWeight[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return b.potentialSavings - a.potentialSavings;
  });
}

// Fungsi untuk membuat rekomendasi supplier
export function generateSupplierRecommendations(
  ingredients: IngredientCost[]
): SupplierComparison[] {
  // Simulasi data supplier alternatif
  const alternativeSuppliers = [
    { name: 'Supplier A', discountRange: [5, 15], qualityScore: 85, reliabilityScore: 90 },
    { name: 'Supplier B', discountRange: [8, 20], qualityScore: 80, reliabilityScore: 85 },
    { name: 'Supplier C', discountRange: [3, 12], qualityScore: 90, reliabilityScore: 95 },
    { name: 'Supplier D', discountRange: [10, 25], qualityScore: 75, reliabilityScore: 80 }
  ];
  
  return ingredients
    .filter(ing => ing.totalMonthlyCost > 1000000) // Focus on high-cost ingredients
    .slice(0, 10) // Limit to top 10
    .map(ingredient => {
      const alternatives = alternativeSuppliers.map(supplier => {
        const discount = supplier.discountRange[0] + 
          Math.random() * (supplier.discountRange[1] - supplier.discountRange[0]);
        const newUnitCost = ingredient.unitCost * (1 - discount / 100);
        const potentialSavings = (ingredient.unitCost - newUnitCost) * ingredient.monthlyUsage;
        
        let riskAssessment = 'Low Risk';
        if (supplier.qualityScore < 80 || supplier.reliabilityScore < 85) {
          riskAssessment = 'Medium Risk';
        }
        if (supplier.qualityScore < 75 || supplier.reliabilityScore < 80) {
          riskAssessment = 'High Risk';
        }
        
        return {
          name: supplier.name,
          unitCost: newUnitCost,
          quality: supplier.qualityScore,
          reliability: supplier.reliabilityScore,
          potentialSavings,
          riskAssessment
        };
      }).sort((a, b) => b.potentialSavings - a.potentialSavings);
      
      const bestAlternative = alternatives[0];
      let recommendation = 'Pertahankan supplier saat ini';
      
      if (bestAlternative.potentialSavings > ingredient.totalMonthlyCost * 0.1) {
        if (bestAlternative.quality >= 80 && bestAlternative.reliability >= 85) {
          recommendation = `Pertimbangkan beralih ke ${bestAlternative.name} untuk penghematan signifikan`;
        } else {
          recommendation = `Evaluasi lebih lanjut ${bestAlternative.name} - potensi penghematan tinggi tapi perlu verifikasi kualitas`;
        }
      }
      
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        currentSupplier: {
          name: ingredient.supplierName,
          unitCost: ingredient.unitCost,
          quality: 85, // Asumsi
          reliability: 90 // Asumsi
        },
        alternativeSuppliers: alternatives.slice(0, 3),
        recommendation
      };
    });
}

// Fungsi untuk menghasilkan insights
export function generateCostOptimizationInsights(
  ingredients: IngredientCost[],
  wasteAnalysis: WasteAnalysis[],
  opportunities: CostOptimizationOpportunity[]
): string[] {
  const insights: string[] = [];
  
  const totalMonthlyCost = ingredients.reduce((sum, ing) => sum + ing.totalMonthlyCost, 0);
  const totalWasteCost = wasteAnalysis.reduce((sum, waste) => sum + waste.wasteCost, 0);
  const wastePercentage = (totalWasteCost / totalMonthlyCost) * 100;
  
  // Insight tentang waste
  if (wastePercentage > 8) {
    insights.push(
      `Tingkat waste ${wastePercentage.toFixed(1)}% masih di atas standar industri (5-8%). ` +
      `Fokus pada pengurangan waste dapat menghemat hingga ${((totalWasteCost * 0.5) / 1000000).toFixed(1)} juta per bulan.`
    );
  } else if (wastePercentage < 3) {
    insights.push(
      `Tingkat waste ${wastePercentage.toFixed(1)}% sudah sangat baik dan di bawah standar industri. ` +
      `Pertahankan praktik operasional saat ini.`
    );
  }
  
  // Insight tentang kategori bahan termahal
  const costByCategory = ingredients.reduce((acc, ing) => {
    acc[ing.category] = (acc[ing.category] || 0) + ing.totalMonthlyCost;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategory = Object.entries(costByCategory)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topCategory) {
    const categoryPercentage = (topCategory[1] / totalMonthlyCost) * 100;
    insights.push(
      `Kategori ${topCategory[0]} menyumbang ${categoryPercentage.toFixed(1)}% dari total biaya bahan. ` +
      `Fokus optimasi pada kategori ini dapat memberikan dampak terbesar.`
    );
  }
  
  // Insight tentang peluang quick wins
  const quickWins = opportunities.filter(opp => 
    opp.timeToImplement === 'immediate' && opp.implementationDifficulty === 'easy'
  );
  
  if (quickWins.length > 0) {
    const quickWinSavings = quickWins.reduce((sum, opp) => sum + opp.potentialSavings, 0);
    insights.push(
      `Terdapat ${quickWins.length} peluang quick wins yang dapat menghemat ` +
      `${(quickWinSavings / 1000000).toFixed(1)} juta per bulan dengan implementasi mudah.`
    );
  }
  
  // Insight tentang ROI tertinggi
  const highROIOpportunities = opportunities.filter(opp => opp.estimatedROI > 200);
  if (highROIOpportunities.length > 0) {
    insights.push(
      `${highROIOpportunities.length} strategi optimasi memiliki ROI di atas 200%, ` +
      `menunjukkan potensi return investasi yang sangat menarik.`
    );
  }
  
  return insights;
}

// Fungsi utama untuk analisis optimasi biaya
export function performCostOptimizationAnalysis(
  ingredients: IngredientCost[],
  businessType: BusinessType
): CostOptimizationResult {
  const wasteAnalysis = analyzeIngredientWaste(ingredients, businessType);
  const opportunities = identifyCostOptimizationOpportunities(ingredients, wasteAnalysis, businessType);
  const supplierRecommendations = generateSupplierRecommendations(ingredients);
  
  const totalMonthlyCost = ingredients.reduce((sum, ing) => sum + ing.totalMonthlyCost, 0);
  const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
  const savingsPercentage = (totalPotentialSavings / totalMonthlyCost) * 100;
  
  // Cost breakdown
  const costBreakdown = {
    byCategory: ingredients.reduce((acc, ing) => {
      acc[ing.category] = (acc[ing.category] || 0) + ing.totalMonthlyCost;
      return acc;
    }, {} as Record<string, number>),
    
    bySupplier: ingredients.reduce((acc, ing) => {
      acc[ing.supplierName] = (acc[ing.supplierName] || 0) + ing.totalMonthlyCost;
      return acc;
    }, {} as Record<string, number>),
    
    wasteByCategory: wasteAnalysis.reduce((acc, waste) => {
      const ingredient = ingredients.find(ing => ing.id === waste.ingredientId);
      if (ingredient) {
        acc[ingredient.category] = (acc[ingredient.category] || 0) + waste.wasteCost;
      }
      return acc;
    }, {} as Record<string, number>)
  };
  
  const insights = generateCostOptimizationInsights(ingredients, wasteAnalysis, opportunities);
  
  const quickWins = opportunities.filter(opp => 
    opp.timeToImplement === 'immediate' || 
    (opp.timeToImplement === 'short_term' && opp.implementationDifficulty === 'easy')
  );
  
  const longTermStrategies = opportunities.filter(opp => 
    opp.timeToImplement === 'medium_term' || opp.timeToImplement === 'long_term'
  );
  
  return {
    totalMonthlyCost,
    totalPotentialSavings,
    savingsPercentage,
    topWasteItems: wasteAnalysis.slice(0, 10),
    optimizationOpportunities: opportunities,
    supplierRecommendations,
    costBreakdown,
    insights,
    quickWins,
    longTermStrategies
  };
}

// Utility functions
export function formatOptimizationType(type: CostOptimizationOpportunity['type']): string {
  const typeMap = {
    waste_reduction: 'Pengurangan Limbah',
    supplier_change: 'Pergantian Supplier',
    portion_control: 'Kontrol Porsi',
    menu_engineering: 'Menu Engineering',
    bulk_purchasing: 'Pembelian Bulk',
    seasonal_sourcing: 'Sourcing Musiman'
  };
  return typeMap[type] || type;
}

export function getOptimizationIcon(type: CostOptimizationOpportunity['type']): string {
  const iconMap = {
    waste_reduction: '♻️',
    supplier_change: '🔄',
    portion_control: '⚖️',
    menu_engineering: '📊',
    bulk_purchasing: '📦',
    seasonal_sourcing: '🌱'
  };
  return iconMap[type] || '💡';
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'hard': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}