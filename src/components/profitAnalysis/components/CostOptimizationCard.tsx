import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingDown, 
  Package, 
  Users, 
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Scale,
  ShoppingCart,
  Leaf,
  PieChart,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { BusinessType } from '../utils/config/profitConfig';
import {
  performCostOptimizationAnalysis,
  formatOptimizationType,
  getPriorityColor,
  getDifficultyColor,
  IngredientCost,
  CostOptimizationResult,
  CostOptimizationOpportunity,
  WasteAnalysis
} from '../utils/costOptimization';
import { formatCurrency } from '@/utils/formatUtils';

interface CostOptimizationCardProps {
  ingredients: IngredientCost[];
  businessType: BusinessType;
}

const CostOptimizationCard: React.FC<CostOptimizationCardProps> = ({
  ingredients,
  businessType
}) => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const analysisResult: CostOptimizationResult = performCostOptimizationAnalysis(
    ingredients,
    businessType
  );

  const getOptimizationIcon = (type: CostOptimizationOpportunity['type']) => {
    switch (type) {
      case 'waste_reduction': return <Trash2 className="h-4 w-4" />;
      case 'supplier_change': return <RefreshCw className="h-4 w-4" />;
      case 'portion_control': return <Scale className="h-4 w-4" />;
      case 'menu_engineering': return <BarChart3 className="h-4 w-4" />;
      case 'bulk_purchasing': return <ShoppingCart className="h-4 w-4" />;
      case 'seasonal_sourcing': return <Leaf className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return <Zap className="h-4 w-4 text-red-600" />;
      case 'short_term': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'medium_term': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'long_term': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protein': return '🥩';
      case 'vegetables': return '🥬';
      case 'grains': return '🌾';
      case 'dairy': return '🥛';
      case 'spices': return '🌶️';
      case 'beverages': return '🥤';
      case 'packaging': return '📦';
      default: return '🍽️';
    }
  };

  const getWasteLevel = (wastePercentage: number) => {
    if (wastePercentage > 15) return { level: 'Sangat Tinggi', color: 'text-red-600 bg-red-50' };
    if (wastePercentage > 10) return { level: 'Tinggi', color: 'text-orange-600 bg-orange-50' };
    if (wastePercentage > 5) return { level: 'Sedang', color: 'text-yellow-600 bg-yellow-50' };
    return { level: 'Rendah', color: 'text-green-600 bg-green-50' };
  };

  const topCategories = Object.entries(analysisResult.costBreakdown.byCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const topSuppliers = Object.entries(analysisResult.costBreakdown.bySupplier)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Analisis Optimasi Biaya
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              Potensi Hemat: {formatCurrency(analysisResult.totalPotentialSavings)}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {analysisResult.savingsPercentage.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="waste">Analisis Waste</TabsTrigger>
            <TabsTrigger value="opportunities">Peluang</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Monthly Cost */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Biaya Bulanan</span>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(analysisResult.totalMonthlyCost)}
                </div>
                <div className="text-sm text-gray-600">
                  Semua kategori bahan
                </div>
              </div>

              {/* Potential Savings */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Potensi Penghematan</span>
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(analysisResult.totalPotentialSavings)}
                </div>
                <div className="text-sm text-gray-600">
                  {analysisResult.savingsPercentage.toFixed(1)}% dari total biaya
                </div>
              </div>

              {/* Quick Wins */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Quick Wins</span>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-xl font-bold">
                  {analysisResult.quickWins.length}
                </div>
                <div className="text-sm text-gray-600">
                  Implementasi mudah & cepat
                </div>
              </div>

              {/* Top Waste Items */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Item Waste Tertinggi</span>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-xl font-bold">
                  {analysisResult.topWasteItems.length}
                </div>
                <div className="text-sm text-gray-600">
                  Perlu perhatian khusus
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Insight Utama</h4>
              <div className="space-y-2">
                {analysisResult.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins Preview */}
            {analysisResult.quickWins.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Quick Wins - Implementasi Segera
                </h4>
                <div className="space-y-2">
                  {analysisResult.quickWins.slice(0, 3).map((opportunity, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-yellow-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getOptimizationIcon(opportunity.type)}
                          <span className="font-medium">{opportunity.title}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          +{formatCurrency(opportunity.potentialSavings)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{opportunity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="waste" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Analisis Limbah Bahan Baku</h4>
              
              {analysisResult.topWasteItems.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tidak ada item dengan tingkat waste yang signifikan. Operasional sudah efisien.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {analysisResult.topWasteItems.map((waste, index) => {
                    const wasteLevel = getWasteLevel(waste.wastePercentage);
                    const ingredient = ingredients.find(ing => ing.id === waste.ingredientId);
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {ingredient ? getCategoryIcon(ingredient.category) : '🍽️'}
                            </span>
                            <span className="font-medium">{waste.ingredientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={wasteLevel.color}>
                              {wasteLevel.level}
                            </Badge>
                            <Badge className="bg-red-100 text-red-800">
                              {waste.wastePercentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-600">Waste Amount:</span>
                            <div className="font-medium">{waste.wasteAmount.toFixed(1)} {ingredient?.unitType || 'unit'}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Waste Cost:</span>
                            <div className="font-medium text-red-600">{formatCurrency(waste.wasteCost)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Potensi Reduksi:</span>
                            <div className="font-medium text-green-600">{waste.reductionPotential.toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Potensi Hemat:</span>
                            <div className="font-medium text-green-600">
                              {formatCurrency((waste.wasteCost * waste.reductionPotential) / waste.wastePercentage)}
                            </div>
                          </div>
                        </div>
                        
                        {waste.wasteReasons.length > 0 && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-600">Kemungkinan Penyebab:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {waste.wasteReasons.map((reason, reasonIndex) => (
                                <Badge key={reasonIndex} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {waste.recommendedActions.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Rekomendasi Aksi:</span>
                            <ul className="list-disc list-inside text-xs text-gray-600 mt-1 space-y-1">
                              {waste.recommendedActions.slice(0, 3).map((action, actionIndex) => (
                                <li key={actionIndex}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Peluang Optimasi Biaya</h4>
                <Badge className="bg-gray-100 text-gray-800">
                  {analysisResult.optimizationOpportunities.length} Peluang
                </Badge>
              </div>
              
              <div className="space-y-3">
                {analysisResult.optimizationOpportunities.map((opportunity, index) => (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedOpportunity === opportunity.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOpportunity(
                      selectedOpportunity === opportunity.id ? null : opportunity.id
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getOptimizationIcon(opportunity.type)}
                        <span className="font-medium">{opportunity.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(opportunity.priority)}>
                          {opportunity.priority}
                        </Badge>
                        <Badge className={getDifficultyColor(opportunity.implementationDifficulty)}>
                          {opportunity.implementationDifficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{opportunity.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Biaya Saat Ini:</span>
                        <div className="font-medium">{formatCurrency(opportunity.currentMonthlyCost)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Potensi Hemat:</span>
                        <div className="font-medium text-green-600">{formatCurrency(opportunity.potentialSavings)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">ROI Estimasi:</span>
                        <div className="font-medium text-blue-600">{opportunity.estimatedROI}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Timeframe:</span>
                        <div className="flex items-center gap-1">
                          {getTimeframeIcon(opportunity.timeToImplement)}
                          <span className="font-medium">{opportunity.timeToImplement.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Dampak: <span className="font-medium text-green-600">+{opportunity.savingsPercentage.toFixed(1)}%</span>
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOpportunity(
                            selectedOpportunity === opportunity.id ? null : opportunity.id
                          );
                        }}
                      >
                        {selectedOpportunity === opportunity.id ? 'Tutup' : 'Detail'}
                      </Button>
                    </div>
                    
                    {selectedOpportunity === opportunity.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Langkah Implementasi:</span>
                            <ol className="list-decimal list-inside text-sm text-gray-600 mt-1 space-y-1">
                              {opportunity.actionSteps.map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-600">KPI yang Dipantau:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {opportunity.kpiToTrack.map((kpi, kpiIndex) => (
                                <Badge key={kpiIndex} variant="outline" className="text-xs">
                                  {kpi.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Risk Level:</span>
                            <Badge className={opportunity.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                           opportunity.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                           'bg-red-100 text-red-800'}>
                              {opportunity.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Rekomendasi Supplier</h4>
              
              {analysisResult.supplierRecommendations.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Tidak ada rekomendasi supplier saat ini. Supplier existing sudah optimal.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {analysisResult.supplierRecommendations.map((supplier, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{supplier.ingredientName}</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          Current: {supplier.currentSupplier.name}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-600">Supplier Saat Ini:</span>
                        <div className="grid grid-cols-3 gap-4 mt-1 text-sm">
                          <div>
                            <span className="text-gray-600">Harga:</span>
                            <div className="font-medium">{formatCurrency(supplier.currentSupplier.unitCost)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Kualitas:</span>
                            <div className="font-medium">{supplier.currentSupplier.quality}/100</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Reliabilitas:</span>
                            <div className="font-medium">{supplier.currentSupplier.reliability}/100</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-600">Alternatif Terbaik:</span>
                        <div className="space-y-2 mt-1">
                          {supplier.alternativeSuppliers.slice(0, 2).map((alt, altIndex) => (
                            <div key={altIndex} className="p-2 bg-gray-50 rounded border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{alt.name}</span>
                                <Badge className={alt.potentialSavings > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {alt.potentialSavings > 0 ? '+' : ''}{formatCurrency(alt.potentialSavings)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Harga:</span>
                                  <div>{formatCurrency(alt.unitCost)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Kualitas:</span>
                                  <div>{alt.quality}/100</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Reliabilitas:</span>
                                  <div>{alt.reliability}/100</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Risk:</span>
                                  <div className={alt.riskAssessment.includes('Low') ? 'text-green-600' :
                                                alt.riskAssessment.includes('Medium') ? 'text-yellow-600' :
                                                'text-red-600'}>
                                    {alt.riskAssessment}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm font-medium">Rekomendasi:</p>
                        <p className="text-sm text-gray-700">{supplier.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="space-y-6">
              {/* Cost by Category */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Breakdown Biaya per Kategori
                </h4>
                <div className="space-y-2">
                  {topCategories.map(([category, cost], index) => {
                    const percentage = (cost / analysisResult.totalMonthlyCost) * 100;
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(category)}</span>
                            <span className="font-medium capitalize">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(cost)}</div>
                            <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost by Supplier */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Breakdown Biaya per Supplier
                </h4>
                <div className="space-y-2">
                  {topSuppliers.map(([supplier, cost], index) => {
                    const percentage = (cost / analysisResult.totalMonthlyCost) * 100;
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{supplier}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(cost)}</div>
                            <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Waste by Category */}
              {Object.keys(analysisResult.costBreakdown.wasteByCategory).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Breakdown Waste per Kategori
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(analysisResult.costBreakdown.wasteByCategory)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, wasteCost], index) => {
                        const totalCategoryWaste = Object.values(analysisResult.costBreakdown.wasteByCategory)
                          .reduce((sum, cost) => sum + cost, 0);
                        const percentage = totalCategoryWaste > 0 ? (wasteCost / totalCategoryWaste) * 100 : 0;
                        
                        return (
                          <div key={index} className="p-3 border rounded-lg bg-red-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getCategoryIcon(category)}</span>
                                <span className="font-medium capitalize">{category}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-red-600">{formatCurrency(wasteCost)}</div>
                                <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CostOptimizationCard;