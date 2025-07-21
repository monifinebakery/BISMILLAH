import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Warehouse, Package, Trophy, Activity, TrendingUp, TrendingDown, CircleDollarSign, ListChecks } from "lucide-react"; 
import { Link } from "react-router-dom";
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils'; 
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } = "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 
import { useFinancial } from '@/contexts/FinancialContext'; 
import { startOfDay, endOfDay, format, subDays } from 'date-fns'; // ✅ Pastikan format dan subDays diimpor dari date-fns

// ✅ Impor MenuExportButton
import MenuExportButton from '@/components/MenuExportButton'; 


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
  const { financialTransactions } = useFinancial(); 

  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate today's date in YYYY-MM-DD format
  const today = new Date(); // Dapatkan objek Date untuk hari ini
  const todayFormatted = format(today, 'yyyy-MM-dd'); // ✅ Gunakan format()
  
  // Calculate today's revenue
  const todaysRevenue = useMemo(() => {
    return orders
      .filter(order => order.tanggal && format(order.tanggal, 'yyyy-MM-dd') === todayFormatted) // ✅ Gunakan format()
      .reduce((sum, order) => sum + (order.totalPesanan || 0), 0); // ✅ Menggunakan totalPesanan, bukan total
  }, [orders, todayFormatted]);

  // Calculate yesterday's revenue
  const yesterdaysRevenue = useMemo(() => {
    const yesterday = subDays(today, 1); // Gunakan date-fns subDays
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd'); // ✅ Gunakan format()
    
    return orders
      .filter(order => order.tanggal && format(order.tanggal, 'yyyy-MM-dd') === yesterdayFormatted) // ✅ Gunakan format()
      .reduce((sum, order) => sum + (order.totalPesanan || 0), 0); // ✅ Menggunakan totalPesanan
  }, [orders, today]); // today perlu ada di sini karena yesterday tergantung today

  // Calculate revenue trend
  const revenueTrend = useMemo(() => {
    if (yesterdaysRevenue === 0) { 
      return todaysRevenue > 0 ? 100 : 0; 
    }
    return ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100;
  }, [todaysRevenue, yesterdaysRevenue]);

  // Calculate today's profit (from financial transactions)
  const todaysProfit = useMemo(() => {
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const todayIncome = financialTransactions.filter(t => t.date && t.date >= startOfToday && t.date <= endOfToday && t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayExpense = financialTransactions.filter(t => t.date && t.date >= startOfToday && t.date <= endOfToday && t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    return todayIncome - todayExpense;
  }, [financialTransactions, today]);

  // Calculate today's orders count
  const todaysOrdersCount = useMemo(() => {
    return orders.filter(order => order.tanggal && format(order.tanggal, 'yyyy-MM-dd') === todayFormatted).length; // ✅ Gunakan format()
  }, [orders, todayFormatted]);

  // Calculate outstanding invoices (Piutang)
  const outstandingInvoices = useMemo(() => {
    const totalPiutang = orders.filter(order => order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipping')
                              .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    const piutangJatuhTempo = orders.filter(order => 
        (order.status === 'pending' || order.status === 'confirmed') && order.tanggal && order.tanggal < startOfDay(today)
    )
    .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    return {
      total: totalPiutang,
      jatuhTempo: piutangJatuhTempo,
      count: orders.filter(order => order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipping').length
    };
  }, [orders, today]);


  const statsData = useMemo(() => { 
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
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {}; // Menggunakan objek untuk quantity dan revenue
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const current = productSales[item.namaBarang] || { quantity: 0, revenue: 0 };
        productSales[item.namaBarang] = {
          quantity: current.quantity + (item.quantity || 0),
          revenue: current.revenue + ((item.quantity || 0) * (item.hargaSatuan || 0))
        };
      });
    });

    return Object.entries(productSales)
      .map(([name, data]) => ({ 
        name, 
        quantity: data.quantity,
        revenue: data.revenue 
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20); 
  }, [orders]);

  const worstSellingProducts = useMemo(() => {
    const productSales: { [key: string]: number } = {};
    
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        productSales[item.namaBarang] = (productSales[item.namaBarang] || 0) + item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5); // Get bottom 5
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
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
          {/* ✅ MenuExportButton di sini */}
          <MenuExportButton
            data={[ 
              {
                "Metrik": "Omzet Hari Ini",
                "Nilai": todaysRevenue,
                "Tren": revenueTrend.toFixed(1) + "%"
              },
              {
                "Metrik": "Laba Bersih Hari Ini",
                "Nilai": todaysProfit,
                "Tren": "N/A" 
              },
              {
                "Metrik": "Piutang Belum Lunas",
                "Nilai": outstandingInvoices.jatuhTempo, 
                "Tren": "N/A"
              },
            ]}
            filename="ringkasan_dashboard"
            menuType="Ringkasan Dashboard"
          />
        </div>
      </div>

      {/* Kategori 1: Ringkasan Finansial Tingkat Tinggi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Omzet Hari Ini</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(todaysRevenue)}</p>
              <div className="flex items-center mt-1">
                {revenueTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${revenueTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(revenueTrend).toFixed(1)}%
                </span>
              </div>
            </div>
            <CircleDollarSign className="h-6 w-6 text-green-500" />
          </CardContent>
        </Card>

        {/* Pesanan Hari Ini */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pesanan Hari Ini</p>
              <p className="font-semibold text-gray-800">{todaysOrdersCount}</p>
            </div>
            <Package className="h-6 w-6 text-blue-500" />
          </CardContent>
        </Card>

        {/* Laba Bersih Hari Ini */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Laba Bersih Hari Ini</p>
              <p className="font-semibold text-gray-800">{formatCurrency(todaysProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">(Estimasi)</p>
            </div>
            <Calculator className="h-6 w-6 text-purple-500" />
          </CardContent>
        </Card>

        {/* Piutang Belum Lunas */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Piutang Belum Lunas</p>
              <p className="font-semibold text-red-600">{formatCurrency(outstandingInvoices.jatuhTempo)}</p>
              <p className="text-xs text-gray-500 mt-1">({outstandingInvoices.count} pelanggan)</p>
            </div>
            <ListChecks className="h-6 w-6 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow rounded-lg">
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

        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow rounded-lg">
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

        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow rounded-lg">
          <Link to="/laporan">
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-50 p-2 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-purple-600" /> 
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
          <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
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
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Stok Kritis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {statsData.stokMenipis > 0 ? ( 
                lowStockItems 
                  .slice(0, 5) 
                  .map((item, index) => (
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

          {/* Worst Selling Products */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
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
                      key={product.name} 
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

          {/* Recent Activity */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Activity className="h-5 w-5 text-gray-600" />
                <span>Aktivitas Terbaru</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
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
                        className="p-4 flex items-center hover:bg-gray-50"
                      >
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