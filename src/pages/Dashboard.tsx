import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Warehouse, Package, Trophy, Activity, TrendingUp, TrendingDown, CircleDollarSign, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatDateTime = (date) => {
  if (!date) return 'Waktu tidak valid';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'Waktu tidak valid';
    }
    
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return 'Waktu tidak valid';
  }
};

const getDateString = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return null;
    }
    
    return dateObj.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const { activities, loading: activitiesLoading } = useActivity();
  const { bahanBaku } = useBahanBaku();
  const { recipes, hppResults } = useRecipe();
  const { orders } = useOrder();
  const { settings } = useUserSettings();

  // Pagination and filter states
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 5;

  // Filter data based on date range
  const filteredOrders = useMemo(() => {
    if (!startDate || !endDate) return orders;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include whole end date

    return orders.filter(order => {
      const orderDate = new Date(order.tanggal);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  const filteredActivities = useMemo(() => {
    if (!startDate || !endDate) return activities;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 999); // Include whole end date

    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= start && activityDate <= end;
    });
  }, [activities, startDate, endDate]);

  // Get date strings safely
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];
  
  // Calculate today's revenue
  const todaysRevenue = useMemo(() => {
    return filteredOrders
      .filter(order => {
        const orderDate = getDateString(order.tanggal);
        return orderDate === today;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders, today]);

  // Calculate yesterday's revenue
  const yesterdaysRevenue = useMemo(() => {
    return filteredOrders
      .filter(order => {
        const orderDate = getDateString(order.tanggal);
        return orderDate === yesterdayFormatted;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders, yesterdayFormatted]);

  // Calculate revenue trend
  const revenueTrend = useMemo(() => {
    if (!yesterdaysRevenue) return todaysRevenue ? 100 : 0;
    return ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100;
  }, [todaysRevenue, yesterdaysRevenue]);

  // Calculate today's profit
  const todaysProfit = useMemo(() => {
    return todaysRevenue * 0.3;
  }, [todaysRevenue]);

  // Calculate today's orders
  const todaysOrders = useMemo(() => {
    return filteredOrders.filter(order => {
      const orderDate = getDateString(order.tanggal);
      return orderDate === today;
    }).length;
  }, [filteredOrders, today]);

  // Calculate outstanding invoices
  const outstandingInvoices = useMemo(() => {
    return filteredOrders.filter(order => order.status === 'BELUM LUNAS').length;
  }, [filteredOrders]);

  const stats = useMemo(() => {
    const stokMenipis = bahanBaku.filter(item => item.stok <= item.minimum).length;
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + (result.hppPerPorsi || 0), 0) / hppResults.length
      : 0;
    const totalStokBahanBaku = bahanBaku.reduce((sum, item) => sum + (item.stok || 0), 0);

    return {
      totalProduk: recipes.length,
      totalStokBahanBaku,
      hppRataRata: formatCurrency(averageHPP),
      stokMenipis,
      todaysRevenue,
      todaysProfit,
      todaysOrders,
      outstandingInvoices,
      revenueTrend
    };
  }, [recipes, hppResults, bahanBaku, todaysRevenue, todaysProfit, todaysOrders, outstandingInvoices, revenueTrend]);

  const bestSellingProducts = useMemo(() => {
    const productSales = {};
    const productRevenue = {};
    
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!item.namaBarang) return;
        productSales[item.namaBarang] = (productSales[item.namaBarang] || 0) + (item.quantity || 0);
        productRevenue[item.namaBarang] = (productRevenue[item.namaBarang] || 0) + 
          ((item.quantity || 0) * (item.hargaSatuan || 0));
      });
    });

    return Object.entries(productSales)
      .map(([name, quantity]) => ({ 
        name, 
        quantity,
        revenue: productRevenue[name] || 0 
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);
  }, [filteredOrders]);

  const worstSellingProducts = useMemo(() => {
    const productSales = {};
    
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!item.namaBarang) return;
        productSales[item.namaBarang] = (productSales[item.namaBarang] || 0) + (item.quantity || 0);
      });
    });

    return Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

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

  // Pagination logic
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const currentProducts = bestSellingProducts.slice(productsStartIndex, productsStartIndex + itemsPerPage);
  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPage);

  const activitiesStartIndex = (activitiesPage - 1) * itemsPerPage;
  const currentActivities = filteredActivities.slice(activitiesStartIndex, activitiesStartIndex + itemsPerPage);
  const totalActivitiesPages = Math.ceil(filteredActivities.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-white min-h-screen">
      {/* Header and Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <span className="text-gray-500">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
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
      </div>

      {/* Stats Grid - Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <CircleDollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Omzet Hari Ini</p>
              <p className="font-semibold text-gray-800">{formatCurrency(stats.todaysRevenue)}</p>
              <div className="flex items-center mt-1">
                {stats.revenueTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${stats.revenueTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(stats.revenueTrend).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-50 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pesanan Hari Ini</p>
              <p className="font-semibold text-gray-800">{stats.todaysOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-purple-50 p-2 rounded-lg mr-3">
              <Calculator className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Laba Bersih</p>
              <p className="font-semibold text-gray-800">{formatCurrency(stats.todaysProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">(Estimasi)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-orange-50 p-2 rounded-lg mr-3">
              <ListChecks className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Piutang Belum Lunas</p>
              <p className="font-semibold text-orange-600">{stats.outstandingInvoices}</p>
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
        {/* Left Column */}
        <div className="space-y-6">
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
                      key={`${product.name}-${index}`} 
                      className="p-4 flex items-center hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {productsStartIndex + index + 1}
                        </span>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{product.name}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-gray-500">
                            {product.quantity} terjual
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
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

          {/* Critical Stock Alert */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="h-5 w-5 text-red-600" />
                <span>Stok Kritis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {bahanBaku.filter(item => item.stok <= item.minimum).length > 0 ? (
                  bahanBaku
                    .filter(item => item.stok <= item.minimum)
                    .slice(0, 5)
                    .map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 flex items-center hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{item.nama}</p>
                          <div className="flex justify-between mt-1">
                            <p className="text-sm text-gray-500">
                              Stok: {item.stok} {item.satuan}
                            </p>
                            <p className="text-sm text-red-600 font-medium">
                              Minimum: {item.minimum} {item.satuan}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">Tidak ada stok kritis</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Worst Selling Products */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <TrendingDown className="h-5 w-5 text-gray-600" />
                <span>Produk Kurang Laris</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {worstSellingProducts.length > 0 ? (
                  worstSellingProducts.map((product, index) => (
                    <div 
                      key={`${product.name}-${index}`} 
                      className="p-4 flex items-center hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Hanya {product.quantity} terjual
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">Semua produk terjual dengan baik</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Table */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Activity className="h-5 w-5 text-gray-600" />
                <span>Aktivitas Terbaru</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="p-4"..4 text-left">Judul</th>
                      <th className="p-4 text-left">Deskripsi</th>
                      <th className="p-4 text-right">Jumlah</th>
                      <th className="p-4 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activitiesLoading ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">
                          Memuat aktivitas...
                        </td>
                      </tr>
                    ) : currentActivities.length > 0 ? (
                      currentActivities.map((activity) => {
                        const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                        let amount = 0;
                        if (isFinancial && activity.value) {
                          const parsed = parseFloat(activity.value);
                          amount = isNaN(parsed) ? 0 : parsed;
                        }
                        
                        return (
                          <tr 
                            key={activity.id} 
                            className="hover:bg-gray-50"
                          >
                            <td className="p-4 font-medium text-gray-800">{activity.title}</td>
                            <td className="p-4 text-gray-500">{activity.description}</td>
                            <td className={`p-4 text-right font-medium ${
                              isFinancial && activity.title.toLowerCase().includes('pemasukan') 
                                ? 'text-green-600' 
                                : isFinancial 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                            }`}>
                              {isFinancial && amount > 0 ? formatCurrency(amount) : '-'}
                            </td>
                            <td className="p-4 text-right text-gray-400 text-sm">
                              {formatDateTime(activity.timestamp)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">
                          Belum ada aktivitas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredActivities.length > itemsPerPage && (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;