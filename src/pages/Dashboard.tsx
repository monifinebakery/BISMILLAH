import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BarChart3, Calculator, Warehouse, TrendingUp, Package, Trophy, Activity, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 

const formatDateTime = (date: Date | null) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Waktu tidak valid';
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const Dashboard = () => {
  const { activities, loading: activitiesLoading } = useActivity(); 
  const { bahanBaku } = useBahanBaku();
  const { recipes, hppResults } = useRecipe();
  const { orders } = useOrder();
  const { settings } = useUserSettings(); 

  const stats = useMemo(() => {
    const stokMenipis = bahanBaku.filter(item => item.stok <= item.minimum).length;
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + result.hppPerPorsi, 0) / hppResults.length
      : 0;
    const totalStokBahanBaku = bahanBaku.reduce((sum, item) => sum + item.stok, 0);

    return {
      totalProduk: recipes.length,
      totalStokBahanBaku,
      hppRataRata: formatCurrency(averageHPP),
      stokMenipis,
    };
  }, [recipes, hppResults, bahanBaku]);

  const bestSellingProducts = useMemo(() => {
    const productSales: { [key: string]: number } = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        productSales[item.namaBarang] = (productSales[item.namaBarang] || 0) + item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const getGreeting = () => {
    const jam = new Date().getHours();
    let sapaan = "datang";
    if (jam >= 4 && jam < 11) sapaan = "pagi";
    if (jam >= 11 && jam < 15) sapaan = "siang";
    if (jam >= 15 && jam < 19) sapaan = "sore";
    if (jam >= 19 || jam < 4) sapaan = "malam";
    
    if (settings.ownerName) {
      return `Selamat ${sapaan}, Kak ${settings.ownerName}!`;
    }
    return `Selamat ${sapaan}! Kelola bisnis Anda dengan mudah`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-to-b from-orange-50 to-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-orange-100">{getGreeting()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardContent className="p-5 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Produk</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProduk}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-5 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <Warehouse className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Stok Bahan</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStokBahanBaku.toLocaleString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 shadow-sm">
          <CardContent className="p-5 flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">HPP Rata-rata</p>
              <p className="text-2xl font-bold text-gray-800">{stats.hppRataRata}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${stats.stokMenipis > 0 ? 'border-red-500' : 'border-orange-500'} shadow-sm`}>
          <CardContent className="p-5 flex items-center">
            <div className={`p-3 rounded-lg mr-4 ${stats.stokMenipis > 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
              <TrendingUp className={`h-6 w-6 ${stats.stokMenipis > 0 ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Stok Menipis</p>
              <p className={`text-2xl font-bold ${stats.stokMenipis > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                {stats.stokMenipis}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border border-blue-200 hover:shadow-lg transition-shadow">
          <Link to="/hpp">
            <CardContent className="p-5 flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Hitung HPP</p>
                <p className="text-sm text-gray-500 mt-1">Kalkulasi harga pokok produksi</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border border-green-200 hover:shadow-lg transition-shadow">
          <Link to="/gudang">
            <CardContent className="p-5 flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <Warehouse className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Kelola Gudang</p>
                <p className="text-sm text-gray-500 mt-1">Manajemen bahan baku dan stok</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border border-purple-200 hover:shadow-lg transition-shadow">
          <Link to="/laporan">
            <CardContent className="p-5 flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Laporan Keuangan</p>
                <p className="text-sm text-gray-500 mt-1">Analisis kinerja bisnis</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <Card className="border border-yellow-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span>Produk Terlaris</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {bestSellingProducts.length > 0 ? (
                bestSellingProducts.map((product, index) => (
                  <div key={product.name} className="p-4 flex items-center hover:bg-yellow-50/50">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100' : 
                      index === 1 ? 'bg-gray-100' : 
                      'bg-orange-100'
                    }`}>
                      <span className={`font-semibold ${
                        index === 0 ? 'text-yellow-800' : 
                        index === 1 ? 'text-gray-800' : 
                        'text-orange-800'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-semibold truncate">{product.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.quantity} terjual
                      </p>
                    </div>
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {Math.round((product.quantity / bestSellingProducts[0].quantity) * 100)}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada data penjualan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-blue-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Aktivitas Terbaru</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {activitiesLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Memuat aktivitas...</p>
                </div>
              ) : activities.length > 0 ? (
                activities.slice(0, 5).map((activity) => {
                  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                  const amount = isFinancial ? parseFloat(activity.value || '0') : 0;
                  
                  return (
                    <div key={activity.id} className="p-4 hover:bg-blue-50/50">
                      <div className="flex justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{activity.title}</p>
                          <p className="text-sm text-gray-500 mt-1 truncate">{activity.description}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          {isFinancial && amount > 0 && (
                            <p className={`font-semibold ${
                              activity.type === 'keuangan' && activity.title.toLowerCase().includes('pemasukan') 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(amount)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-blue-50 border-t border-blue-100">
            <Link to="/aktivitas" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Lihat semua aktivitas →
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;