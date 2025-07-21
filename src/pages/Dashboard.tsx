import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Menambahkan Badge untuk digunakan
import { Calculator, Warehouse, Package, Trophy, Activity as ActivityIcon, TrendingUp, TrendingDown, CircleDollarSign, ListChecks, Bell, ChevronLeft, ChevronRight } from 'lucide-react'; // Menambahkan ikon Bell dan ListChecks
import { Link } from "react-router-dom";
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { startOfDay, endOfDay, format, subDays } from 'date-fns'; // Impor format, subDays dari date-fns
import { id as localeID } from 'date-fns/locale'; // Impor locale ID

// Untuk Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


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
  const itemsPerPageProduct = 5; // Untuk produk terlaris
  const itemsPerPageActivity = 5; // Untuk aktivitas terbaru

  const today = useMemo(() => new Date(), []);
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);


  // ===================================================================
  // --- Data untuk Dashboard Chart (Tren 30 Hari Terakhir) ---
  // ===================================================================
  const dashboardChartData = useMemo(() => {
    const thirtyDaysAgo = subDays(today, 29); 
    
    const dailyData: { [key: string]: { name: string; Pemasukan: number; Pengeluaran: number } } = {};

    for (let i = 0; i < 30; i++) { 
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'd MMM', { locale: localeID }); // Format "15 Jul"
      dailyData[dayKey] = { name: dayName, Pemasukan: 0, Pengeluaran: 0 };
    }

    financialTransactions.forEach(t => {
      const transDate = t.date instanceof Date ? t.date : new Date(t.date);
      if (transDate >= thirtyDaysAgo && transDate <= today) {
        const dayKey = format(transDate, 'yyyy-MM-dd');
        if (dailyData[dayKey]) { // Memastikan dataKey ada sebelum update
          if (t.type === 'income') dailyData[dayKey].Pemasukan += t.amount; // Menggunakan 'income'
          else if (t.type === 'expense') dailyData[dayKey].Pengeluaran += t.amount; // Menggunakan 'expense'
        }
      }
    });
    return Object.values(dailyData);
  }, [financialTransactions, today]);


  // ===================================================================
  // --- Metrik KPI gabungan ---
  // ===================================================================
  const { 
    totalProducts, totalBahanBakuUnit, averageHPP, lowStockCount, 
    totalRevenueToday, totalExpenseToday, netProfitToday, ordersToProcess,
    totalPiutang, piutangJatuhTempo, countPiutang
  } = useMemo(() => {
    const totalProducts = recipes.length; // Menggunakan recipes.length sebagai proxy total produk

    const totalUnitsInStock = bahanBaku.reduce((sum, item) => sum + item.stok, 0);

    const validHpps = hppResults.map(r => r.hppPerPorsi).filter(hpp => hpp !== undefined && hpp !== null); // Filter undefined/null
    const avgHPP = validHpps.length > 0 ? validHpps.reduce((sum, hpp) => sum + hpp, 0) / validHpps.length : 0;
    
    const lowStock = bahanBaku.filter(item => item.stok <= item.minimum).length;

    const filteredFinancialsToday = financialTransactions.filter(t => {
      const transDate = t.date instanceof Date ? t.date : new Date(t.date);
      return transDate >= startOfToday && transDate <= endOfToday;
    });
    const totalRevenue = filteredFinancialsToday.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); // Menggunakan 'income'
    const totalExpense = filteredFinancialsToday.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); // Menggunakan 'expense'
    const netProfit = totalRevenue - totalExpense;

    const ordersPendingProcess = orders.filter(order =>
      order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing'
    ).length;

    const totalPiutangAmount = orders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
                              .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    const piutangJatuhTempoAmount = orders.filter(order => 
        (order.status === 'pending' || order.status === 'confirmed') && order.tanggal && order.tanggal < startOfDay(today)
    )
    .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    const piutangCount = orders.filter(order => 
      order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipping'
    ).length;


    return { 
      totalProducts, totalBahanBakuUnit: totalUnitsInStock, averageHPP: avgHPP, lowStockCount: lowStock,
      totalRevenueToday: totalRevenue, totalExpenseToday: totalExpense, netProfitToday: netProfit, ordersToProcess,
      totalPiutang: totalPiutangAmount, piutangJatuhTempo: piutangJatuhTempoAmount, countPiutang: piutangCount
    };
  }, [orders, bahanBaku, financialTransactions, hppResults, today, recipes]);


  // ===================================================================
  // --- Produk Terlaris ---
  // ===================================================================
  const bestSellingProducts = useMemo(() => {
    const productSales: { [productName: string]: { quantity: number; revenue: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.nama || 'Produk Tidak Dikenal'; 
        if (!productSales[name]) {
          productSales[name] = { quantity: 0, revenue: 0 };
        }
        productSales[name].quantity += item.quantity || 0;
        productSales[name].revenue += (item.quantity || 0) * (item.hargaSatuan || 0); // Menggunakan total harga item
      });
    });

    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue); // Urutkan berdasarkan omzet/revenue
  }, [orders]);

  const paginatedBestSellingProducts = useMemo(() => {
    const startIndex = (productsPage - 1) * itemsPerPageProduct;
    return bestSellingProducts.slice(startIndex, startIndex + itemsPerPageProduct);
  }, [bestSellingProducts, productsPage, itemsPerPageProduct]);

  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPageProduct);

  // ===================================================================
  // --- Produk Kurang Laris ---
  // ===================================================================
  const worstSellingProducts = useMemo(() => {
    const productSales: { [productName: string]: { quantity: number; revenue: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.nama || 'Produk Tidak Dikenal';
        if (!productSales[name]) {
          productSales[name] = { quantity: 0, revenue: 0 };
        }
        productSales[name].quantity += item.quantity || 0;
        productSales[name].revenue += (item.quantity || 0) * (item.hargaSatuan || 0);
      });
    });
    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.quantity - b.quantity) // Urutkan berdasarkan kuantitas paling sedikit
      .slice(0, 5); // Ambil 5 teratas yang paling sedikit terjual
  }, [orders]);


  // ===================================================================
  // --- Aktivitas Terbaru ---
  // ===================================================================
  const paginatedActivities = useMemo(() => {
    const startIndex = (activitiesPage - 1) * itemsPerPageActivity;
    return activities.slice(startIndex, startIndex + itemsPerPageActivity);
  }, [activities, activitiesPage, itemsPerPageActivity]);

  const totalActivitiesPages = Math.ceil(activities.length / itemsPerPageActivity);

  // ===================================================================
  // --- Tampilan Dashboard ---
  // ===================================================================
  const getGreeting = useMemo(() => { // Gunakan useMemo untuk ini
    const hour = new Date().getHours();
    let greeting = 'Selamat ';
    if (hour < 11) greeting += 'pagi';
    else if (hour < 15) greeting += 'siang';
    else if (hour < 18) greeting += 'sore';
    else greeting += 'malam';
    
    const ownerName = settings.ownerName || user?.email?.split('@')[0] || 'Teman';
    return `${greeting}, Kak ${ownerName}!`;
  }, [settings.ownerName, user]);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Dashboard & Tombol Export */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting}</p> {/* getGreeting sekarang adalah nilai dari useMemo */}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-gray-400">
            {format(today, 'EEEE, d MMM yyyy', { locale: localeID })} {/* Format tanggal hari ini */}
          </div>
          <MenuExportButton
            data={[ 
              { "Metrik": "Omzet Hari Ini", "Nilai": totalRevenueToday, "Tren": `${totalRevenueToday > 0 && totalRevenueToday > totalExpenseToday ? (totalRevenueToday - totalExpenseToday) / totalExpenseToday * 100 : 0}%` }, // Tren bisa dihitung lebih akurat
              { "Metrik": "Laba Bersih Hari Ini", "Nilai": netProfitToday, "Tren": "" }, 
              { "Metrik": "Piutang Jatuh Tempo", "Nilai": outstandingInvoices.jatuhTempo, "Tren": "" },
              { "Metrik": "Stok Menipis", "Nilai": statsData.lowStockCount, "Tren": "" }
            ]}
            filename="ringkasan_dashboard"
            menuType="Ringkasan Dashboard"
          />
        </div>
      </div>

      {/* Widget KPI Utama (Baris Pertama Dashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Produk */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Produk</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{statsData.totalProducts}</div></CardContent></Card>
        {/* Total Stok Bahan */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Stok Bahan</CardTitle><Warehouse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{statsData.totalBahanBakuUnit}</div></CardContent></Card>
        {/* HPP Rata-rata */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">HPP Rata-rata</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{statsData.hppRataRata}</div></CardContent></Card>
        {/* Stok Menipis */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stok Menipis</CardTitle><Bell className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{statsData.lowStockCount}</div></CardContent></Card>
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

        {/* Laba Bersih Hari Ini */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Laba Bersih Hari Ini</p>
              <p className="text-xl font-bold">{formatCurrency(todaysProfit)}</p>
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
              <p className="text-xl font-bold text-red-600">{formatCurrency(outstandingInvoices.jatuhTempo)}</p>
              <p className="text-xs text-gray-500 mt-1">({outstandingInvoices.countPiutang} pelanggan)</p>
            </div>
            <ListChecks className="h-6 w-6 text-red-500" />
          </CardContent>
        </Card>

        {/* Pesanan Diproses */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pesanan Diproses</p>
              <p className="text-xl font-bold">{ordersToProcess}</p>
              <p className="text-xs text-gray-500 mt-1">menunggu dikirim/selesai</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Tren Keuangan Terbaru (30 Hari) */}
      <h2 className="text-xl font-bold mb-4 mt-6">Tren Keuangan Terbaru (30 Hari)</h2>
      <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
        <CardHeader><CardTitle>Grafik Pemasukan & Pengeluaran</CardTitle><CardDescription>Performa keuangan Anda dalam 30 hari terakhir.</CardDescription></CardHeader>
        <CardContent className="h-[250px] p-4"> {/* Padding content chart */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboardChartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }} {/* Sesuaikan margin agar label YAxis terlihat */}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} /> {/* dataKey="name" sudah berisi "d MMM" */}
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatLargeNumber}
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: 10 }} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Produk Terlaris & Aktivitas Terbaru */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
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
              {paginatedBestSellingProducts.length > 0 ? (
                paginatedBestSellingProducts.map((product, index) => (
                  <div 
                    key={product.name} 
                    className="p-4 flex items-center hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1 + (productsPage - 1) * itemsPerPageProduct}
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
          
          {/* Pagination Produk Terlaris */}
          {bestSellingProducts.length > itemsPerPageProduct && (
            <CardFooter className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 p-0 hover:bg-gray-100" 
                onClick={() => setProductsPage(productsPage - 1)}
                disabled={productsPage === 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-500">
                Halaman {productsPage} dari {totalProductsPages}
              </span>
              <Button 
                className={`p-1 rounded ${productsPage >= totalProductsPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage >= totalProductsPages}
                onClick={() => setProductsPage(productsPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
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
                <ActivityIcon className="h-5 w-5 text-gray-600" />
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
                    const amount = isFinancial && typeof activity.value === 'string' ? parseFloat(activity.value || '0') : 0; 
                    
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
                            {format(activity.createdAt, 'd LLL y, HH.mm', { locale: localeID })}
                        </p>
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
          {activities.length > itemsPerPageActivity && (
            <CardFooter className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button 
                className={`p-1 rounded ${activitiesPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={activitiesPage === 1}
                onClick={() => setActivitiesPage(activitiesPage - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-500">
                Halaman {activitiesPage} dari {totalActivitiesPages}
              </span>
              <Button 
                className={`p-1 rounded ${activitiesPage >= totalActivitiesPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={activitiesPage >= totalActivitiesPages}
                onClick={() => setActivitiesPage(activitiesPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
