import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calculator, Warehouse, Package, Trophy, Activity, 
  TrendingUp, TrendingDown, CircleDollarSign, ListChecks,
  ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 

const formatDateTime = (date: Date | string | null | undefined) => {
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

const getDateString = (date: Date | string | null | undefined): string | null => {
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

  // State untuk filter tanggal global
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)), // Default: 7 hari terakhir
    end: new Date()
  });

  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5;

  // Fungsi untuk memfilter data berdasarkan rentang tanggal
  const filterByDateRange = (data: any[], dateField: string) => {
    return data.filter(item => {
      const itemDate = getDateString(item[dateField]);
      const startDate = getDateString(dateRange.start);
      const endDate = getDateString(dateRange.end);
      
      return itemDate && startDate && endDate && 
             itemDate >= startDate && 
             itemDate <= endDate;
    });
  };

  // Filter semua data berdasarkan rentang tanggal
  const filteredOrders = useMemo(() => filterByDateRange(orders, 'tanggal'), [orders, dateRange]);
  const filteredActivities = useMemo(() => filterByDateRange(activities, 'timestamp'), [activities, dateRange]);

  // Calculate today's revenue (with null checks)
  const todaysRevenue = useMemo(() => {
    return filteredOrders
      .filter(order => {
        const orderDate = getDateString(order.tanggal);
        return orderDate === getDateString(new Date());
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders]);

  // Calculate yesterday's revenue (with null checks)
  const yesterdaysRevenue = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = getDateString(yesterday);
    
    return filteredOrders
      .filter(order => {
        const orderDate = getDateString(order.tanggal);
        return orderDate === yesterdayFormatted;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders]);

  // Calculate revenue trend safely
  const revenueTrend = useMemo(() => {
    if (!yesterdaysRevenue) return todaysRevenue ? 100 : 0;
    return ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100;
  }, [todaysRevenue, yesterdaysRevenue]);

  // Calculate today's profit
  const todaysProfit = useMemo(() => {
    return todaysRevenue * 0.3; // 30% profit margin
  }, [todaysRevenue]);

  // Calculate today's orders
  const todaysOrders = useMemo(() => {
    const today = getDateString(new Date());
    return filteredOrders.filter(order => {
      const orderDate = getDateString(order.tanggal);
      return orderDate === today;
    }).length;
  }, [filteredOrders]);

  // Calculate outstanding invoices
  const outstandingInvoices = useMemo(() => {
    return orders.filter(order => order.status === 'BELUM LUNAS').length;
  }, [orders]);

  const stats = useMemo(() => {
    const stokMenipis = bahanBaku.filter(item => item.stok <= item.minimum).length;
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + (result.hppPerPorsi || 0), 0) / hppResults.length
      : 0;
    const totalStokBahanBaku = bahanBaku.reduce((sum, item) => sum + (item.stok || 0), 0);

    // Calculate total revenue for filtered orders
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    return {
      totalProduk: recipes.length,
      totalStokBahanBaku,
      hppRataRata: formatCurrency(averageHPP),
      stokMenipis,
      todaysRevenue,
      todaysProfit,
      todaysOrders,
      outstandingInvoices,
      revenueTrend,
      totalRevenue
    };
  }, [recipes, hppResults, bahanBaku, todaysRevenue, todaysProfit, todaysOrders, outstandingInvoices, revenueTrend, filteredOrders]);

  const bestSellingProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    const productRevenue: Record<string, number> = {};
    
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
    const productSales: Record<string, number> = {};
    
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

  // Pagination logic for products
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const currentProducts = bestSellingProducts.slice(productsStartIndex, productsStartIndex + itemsPerPage);
  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPage);

  // Pagination logic for activities
  const activitiesStartIndex = (activitiesPage - 1) * itemsPerPage;
  const currentActivities = filteredActivities.slice(activitiesStartIndex, activitiesStartIndex + itemsPerPage);
  const totalActivitiesPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // Fungsi untuk menangani perubahan tanggal
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    setDateRange(prev => ({
      ...prev,
      [type]: value ? new Date(value) : (type === 'start' ? new Date() : new Date())
    }));
  };

  // Reset pagination saat filter berubah
  useEffect(() => {
    setProductsPage(1);
    setActivitiesPage(1);
  }, [dateRange]);

  // Tampilan aktivitas dalam bentuk tabel
  const renderActivitiesTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Waktu
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktivitas
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deskripsi
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentActivities.length > 0 ? (
            currentActivities.map((activity) => {
              const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
              let amount = 0;
              
              if (isFinancial && activity.value) {
                const parsed = parseFloat(activity.value);
                amount = isNaN(parsed) ? 0 : parsed;
              }
              
              return (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(activity.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {activity.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {activity.description}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isFinancial && amount !== 0 ? (
                      <span className={`font-medium ${
                        activity.type === 'keuangan' && 
                        activity.title.toLowerCase().includes('pemasukan') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(amount)}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                {activitiesLoading ? 'Memuat aktivitas...' : 'Belum ada aktivitas'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting()}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(e, 'start')}
                className="text-sm p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="self-center">s/d</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(e, 'end')}
                className="text-sm p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
              <p className="text-xs text-gray-500">Total Omzet</p>
              <p className="font-semibold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {dateRange.start.toLocaleDateString('id-ID')} - {dateRange.end.toLocaleDateString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-50 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pesanan</p>
              <p className="font-semibold text-gray-800">{filteredOrders.length}</p>
              <p className="text-xs text-gray-500 mt-1">dalam rentang</p>
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
            <div className="bg-orange-50 p-2 rounded-lg mr-3">
              <ListChecks className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Stok Kritis</p>
              <p className="font-semibold text-orange-600">{stats.stokMenipis}</p>
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
                <Activity className="h-5 w-5 text-purple-600" />
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

          {/* Recent Activity - Tabel */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span>Aktivitas Terbaru</span>
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Menampilkan {Math.min(filteredActivities.length, itemsPerPage)} dari {filteredActivities.length} aktivitas
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {renderActivitiesTable()}
              
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
                    Halaman {activitiesPage} dari {Math.ceil(filteredActivities.length / itemsPerPage)}
                  </span>
                  <button 
                    className={`p-1 rounded ${activitiesPage >= Math.ceil(filteredActivities.length / itemsPerPage) ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                    disabled={activitiesPage >= Math.ceil(filteredActivities.length / itemsPerPage)}
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