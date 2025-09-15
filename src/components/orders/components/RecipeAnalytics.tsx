// src/components/order/components/RecipeAnalytics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChefHat, 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  Target,
  Award
} from 'lucide-react';
import { type Order, calculateRecipeStats, getRecipeUsageByOrder } from '../types';

interface RecipeAnalyticsProps {
  orders: Order[];
  className?: string;
}

const RecipeAnalytics: React.FC<RecipeAnalyticsProps> = ({ orders, className }) => {
  // Calculate overall recipe usage statistics
  const overallStats = React.useMemo(() => {
    const allItems = orders.flatMap(order => order.items);
    const recipeItems = allItems.filter(item => item.isFromRecipe);
    const customItems = allItems.filter(item => !item.isFromRecipe);
    
    const totalRevenue = orders.reduce((sum, order: any) => sum + (order.total_pesanan ?? order.totalPesanan ?? 0), 0);
    const recipeRevenue = recipeItems.reduce((sum, item) => sum + item.total, 0);
    
    return {
      totalOrders: orders.length,
      totalItems: allItems.length,
      recipeItems: recipeItems.length,
      customItems: customItems.length,
      recipePercentage: allItems.length > 0 ? (recipeItems.length / allItems.length) * 100 : 0,
      totalRevenue,
      recipeRevenue,
      revenueFromRecipes: totalRevenue > 0 ? (recipeRevenue / totalRevenue) * 100 : 0
    };
  }, [orders]);

  // Get popular recipes
  const popularRecipes = React.useMemo(() => {
    return getRecipeUsageByOrder(orders).slice(0, 5);
  }, [orders]);

  // Calculate orders with/without recipes
  const orderTypes = React.useMemo(() => {
    const ordersWithRecipes = orders.filter(order => 
      order.items.some(item => item.isFromRecipe)
    );
    const ordersWithoutRecipes = orders.filter(order => 
      !order.items.some(item => item.isFromRecipe)
    );

    return {
      withRecipes: ordersWithRecipes.length,
      withoutRecipes: ordersWithoutRecipes.length,
      recipeOrderPercentage: orders.length > 0 ? (ordersWithRecipes.length / orders.length) * 100 : 0
    };
  }, [orders]);

  if (orders.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <ChefHat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada data pesanan untuk dianalisis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Item dari Resep</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.recipeItems}
                  </p>
                  <Badge variant="secondary" className="ml-2">
                    {overallStats.recipePercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pesanan dengan Resep</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {orderTypes.withRecipes}
                  </p>
                  <Badge variant="secondary" className="ml-2">
                    {orderTypes.recipeOrderPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue dari Resep</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {(overallStats.recipeRevenue / 1000).toFixed(0)}K
                  </p>
                  <Badge variant="secondary" className="ml-2">
                    {overallStats.revenueFromRecipes.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Items/Order</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.length > 0 ? (overallStats.totalItems / orders.length).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipe vs Custom Items Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Komposisi Item Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Item dari Resep</span>
                <span className="text-sm text-gray-900">
                  {overallStats.recipeItems} ({overallStats.recipePercentage.toFixed(1)}%)
                </span>
              </div>
              <Progress 
                value={overallStats.recipePercentage} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Item Manual</span>
                <span className="text-sm text-gray-900">
                  {overallStats.customItems} ({(100 - overallStats.recipePercentage).toFixed(1)}%)
                </span>
              </div>
              <Progress 
                value={100 - overallStats.recipePercentage} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Recipes */}
      {popularRecipes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Resep Terpopuler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularRecipes.map((recipe, index) => (
                <div key={recipe.recipeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{recipe.recipeName}</h4>
                      <p className="text-sm text-gray-500">
                        {recipe.orderCount} pesanan • {recipe.totalQuantity} porsi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      Rp {recipe.totalRevenue.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">total revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights & Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overallStats.recipePercentage > 70 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Excellent Recipe Usage!</p>
                  <p className="text-xs text-green-600">
                    {overallStats.recipePercentage.toFixed(1)}% item pesanan menggunakan resep. 
                    Ini menunjukkan konsistensi yang baik dalam operasi.
                  </p>
                </div>
              </div>
            )}
            
            {overallStats.recipePercentage < 30 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-orange-800">Tingkatkan Penggunaan Resep</p>
                  <p className="text-xs text-orange-600">
                    Hanya {overallStats.recipePercentage.toFixed(1)}% item menggunakan resep. 
                    Pertimbangkan untuk membuat lebih banyak resep dari item manual yang sering dipesan.
                  </p>
                </div>
              </div>
            )}
            
            {popularRecipes.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Resep Favorit Teridentifikasi</p>
                  <p className="text-xs text-blue-600">
                    "{popularRecipes[0].recipeName}" adalah resep terpopuler dengan{' '}
                    {popularRecipes[0].orderCount} pesanan. Pastikan stok bahannya selalu tersedia.
                  </p>
                </div>
              </div>
            )}
            
            {overallStats.revenueFromRecipes > 60 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Recipe-Driven Revenue</p>
                  <p className="text-xs text-purple-600">
                    {overallStats.revenueFromRecipes.toFixed(1)}% revenue berasal dari resep. 
                    Sistem resep berkontribusi signifikan terhadap bisnis Anda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipeAnalytics;
