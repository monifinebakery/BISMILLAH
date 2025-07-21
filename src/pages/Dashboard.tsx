import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Warehouse, Package, Trophy, Activity, DollarSign, BarChart3, Clock } from "lucide-react"; // Menambahkan ikon baru
import { Link } from "react-router-dom";
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils'; // Asumsi formatLargeNumber ada di sini
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } = "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useFinancial } from '@/contexts/FinancialContext'; // ✅ Impor useFinancial
import { startOfDay, endOfDay } from 'date-fns'; // ✅ Impor helper tanggal

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
  const { financialTransactions } = useFinancial(); // ✅ Panggil useFinancial untuk data transaksi

  // Pagination states (untuk produk terlaris & aktivitas)
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5; // Jumlah item per halaman untuk daftar

  // ✅ Ringkasan Finansial Harian
  const todayFinancials = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todayTransactions = financialTransactions.filter(t => 
      t.date && t.date >= todayStart && t.date <= todayEnd
    );

    const todayIncome = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayExpense = todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayNetProfit = todayIncome - todayExpense;

    const totalPiutang = orders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
                              .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    const piutangJatuhTempo = orders.filter(order => 
        order.status === 'pending' && order.tanggal && order.tanggal < todayStart // Asumsi 'jatuh tempo' jika status pending & tanggal order sudah lewat hari ini
    )
    .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    return {
      omzetHarian: todayIncome,
      labaBersihHarian: todayNetProfit,
      arusKasHarian: todayNetProfit, // Menggunakan laba bersih sebagai proxy untuk arus kas harian
      totalPiutang,
      piutangJatuhTempo,
    };
  }, [financialTransactions, orders]);


  const stats = useMemo(() => { // Ini adalah stats umum/global, bukan harian
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
      .slice(0, 20); 
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
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen"> {/* Mengubah bg-white menjadi bg-gray-50 untuk kesan modern */}
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

      {/* Kategori 1: Ringkasan Finansial Tingkat Tinggi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Harian */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Omzet Hari Ini</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(todayFinancials.omzetHarian)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-green-500" />
          </CardContent>
        </Card>

        {/* Laba Bersih Harian */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Laba Bersih Hari Ini</p>
              <p className="text-xl font-bold">{formatCurrency(todayFinancials.labaBersihHarian)}</p>
            </div>
            <BarChart3 className="h-6 w-6 text-purple-500" />
          </CardContent>
        </Card>

        {/* Arus Kas Harian (Proxy) */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Arus Kas Hari Ini</p>
              <p className="text-xl font-bold">{formatCurrency(todayFinancials.arusKasHarian)}</p>
            </div>
            <Clock className="h-6 w-6 text-blue-500" />
          </CardContent>
        </Card>
        
        {/* Piutang Jatuh Tempo */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Piutang Jatuh Tempo</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(todayFinancials.piutangJatuhTempo)}</p>
            </div>
            <Truck className="h-6 w-6 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Kategori 2 & 3: Performa Operasional & Aktivitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk Terlaris */}
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
          
          {/* Pagination Produk */}
          {bestSellingProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button 
                className={`p-1 rounded ${productsPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage === 1}
                onClick={() => setProductsPage(productsPage - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {productsPage} dari {totalProductsPages}
              </span>
              <Button 
                className={`p-1 rounded ${productsPage >= totalProductsPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage >= totalProductsPages}
                onClick={() => setProductsPage(productsPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Card>

        {/* Aktivitas Terbaru */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
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