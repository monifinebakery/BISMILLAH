import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Warehouse, Package, Trophy, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5;

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
      .slice(0, 20); // Get top 20 for pagination
  }, [orders]);

  const getGreeting = () => {
    const jam = new Date().getHours();
    let sapaan = "datang";
    if (jam >= 4 && jam < 11) sapaan = "pagi";
    if (jam >= 11 && jam < 15) sapaan = "siang";
    if (jam >= 15 && jam < 19) sapaan = "sore";
    if (jam >= 19 || jam < 4) sapaan = "malam";
    
    if (settings.ownerName) {
      return `Selamat ${sapaan}, Kak ${settings.ownerName}`;
    }
    return `Selamat ${sapaan}`;
  };

  // Pagination logic for products
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const currentProducts = bestSellingProducts.slice(productsStartIndex, productsStartIndex + itemsPerPage);
  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPage);

  // Pagination logic for activities
  const activitiesStartIndex = (activitiesPage - 1) * itemsPerPage;
  const currentActivities = activities.slice(activitiesStartIndex, activitiesStartIndex + itemsPerPage);
  const totalActivitiesPages = Math.ceil(activities.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting()}</p>
        </div>
        <div className="text-xs text-gray-400">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Produk</p>
              <p className="font-semibold text-gray-800">{stats.totalProduk}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-50 p-2 rounded-lg mr-3">
              <Warehouse className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Stok</p>
              <p className="font-semibold text-gray-800">{stats.totalStokBahanBaku.toLocaleString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-purple-50 p-2 rounded-lg mr-3">
              <Calculator className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">HPP Rata-rata</p>
              <p className="font-semibold text-gray-800">{stats.hppRataRata}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${stats.stokMenipis > 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
              <div className={`h-5 w-5 ${stats.stokMenipis > 0 ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Stok Menipis</p>
              <p className={`font-semibold ${stats.stokMenipis > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                {stats.stokMenipis}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/hpp">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Hitung HPP</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/gudang">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-50 p-2 rounded-lg mr-3">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Kelola Gudang</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/laporan">
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-50 p-2 rounded-lg mr-3">
                <div className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Laporan Keuangan</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Trophy className="h-5 w-5 text-gray-600" />
              <span>Produk Terlaris</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {currentProducts.length > 0 ? (
                currentProducts.map((product, index) => (
                  <div 
                    key={product.name} 
                    className="p-4 flex items-center hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {productsStartIndex + index + 1}
                      </span>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.quantity} terjual
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Belum ada data penjualan</p>
                </div>
              )}
            </div>
          </CardContent>
          
          {/* Pagination */}
          {bestSellingProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button 
                className={`p-1 rounded ${productsPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage === 1}
                onClick={() => setProductsPage(productsPage - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {productsPage} dari {totalProductsPages}
              </span>
              <button 
                className={`p-1 rounded ${productsPage >= totalProductsPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage >= totalProductsPages}
                onClick={() => setProductsPage(productsPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Activity className="h-5 w-5 text-gray-600" />
              <span>Aktivitas Terbaru</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {activitiesLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Memuat aktivitas...</p>
                </div>
              ) : currentActivities.length > 0 ? (
                currentActivities.map((activity) => {
                  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                  const amount = isFinancial ? parseFloat(activity.value || '0') : 0;
                  
                  return (
                    <div 
                      key={activity.id} 
                      className="p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                          <p className="text-sm text-gray-500 mt-1 truncate">{activity.description}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          {isFinancial && amount > 0 && (
                            <p className={`text-sm font-medium ${
                              activity.type === 'keuangan' && 
                              activity.title.toLowerCase().includes('pemasukan') 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(amount)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </CardContent>
          
          {/* Pagination */}
          {activities.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button 
                className={`p-1 rounded ${activitiesPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={activitiesPage === 1}
                onClick={() => setActivitiesPage(activitiesPage - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {activitiesPage} dari {totalActivitiesPages}
              </span>
              <button 
                className={`p-1 rounded ${activitiesPage >= totalActivitiesPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={activitiesPage >= totalActivitiesPages}
                onClick={() => setActivitiesPage(activitiesPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;