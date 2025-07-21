import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ShoppingCart, Package, DollarSign, TrendingUp, Receipt, Bell, Activity as ActivityIcon, Users, Scale } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { useOrder } from '@/contexts/OrderContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useRecipe } from '@/contexts/RecipeContext';

import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils'; // Import formatLargeNumber
import { format, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns'; // Impor date-fns
import { id as localeID } from 'date-fns/locale'; // Impor locale ID

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Untuk Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const Dashboard = () => {
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const { user } = useAuth();
  const { activities, isLoading: activityLoading } = useActivity();
  const { bahanBaku, isLoading: bahanBakuLoading } = useBahanBaku();
  const { orders, isLoading: ordersLoading } = useOrder();
  const { financialTransactions, isLoading: financialLoading } = useFinancial();
  const { hppResults, isLoading: recipesLoading } = useRecipe();

  const isLoading = settingsLoading || activityLoading || bahanBakuLoading || ordersLoading || financialLoading || recipesLoading;

  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPageProduct = 5; // Untuk produk terlaris
  const itemsPerPageActivity = 5; // Untuk aktivitas terbaru

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = 'Selamat ';
    if (hour < 11) greeting += 'pagi';
    else if (hour < 15) greeting += 'siang';
    else if (hour < 18) greeting += 'sore';
    else greeting += 'malam';
    
    const ownerName = settings.ownerName || user?.email?.split('@')[0] || 'Teman';
    return `${greeting}, Kak ${ownerName}!`;
  }, [settings.ownerName, user]);

  const today = useMemo(() => new Date(), []);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);


  // ===================================================================
  // --- Data untuk Dashboard Chart (Tren 30 Hari Terakhir) ---
  // ===================================================================
  const dashboardChartData = useMemo(() => {
    const thirtyDaysAgo = subDays(today, 29); // Dari 29 hari yang lalu sampai hari ini = 30 hari
    const startDate = startOfToday; // Memastikan dimulai dari awal hari ini

    const dailyData: { [key: string]: { name: string; Pemasukan: number; Pengeluaran: number } } = {};

    for (let i = 0; i < 30; i++) { // Looping untuk 30 hari
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'd MMM', { locale: localeID });
      dailyData[dayKey] = { name: dayName, Pemasukan: 0, Pengeluaran: 0 };
    }

    financialTransactions.forEach(t => {
      const transDate = t.date instanceof Date ? t.date : new Date(t.date);
      // Hanya sertakan transaksi dalam 30 hari terakhir
      if (transDate >= thirtyDaysAgo && transDate <= today) {
        const dayKey = format(transDate, 'yyyy-MM-dd');
        if (dailyData[dayKey]) {
          if (t.type === 'pemasukan') dailyData[dayKey].Pemasukan += t.amount;
          else if (t.type === 'pengeluaran') dailyData[dayKey].Pengeluaran += t.amount;
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
    totalRevenueToday, totalExpenseToday, netProfitToday, ordersToProcess 
  } = useMemo(() => {
    const uniqueProductIds = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => { if (item.nama) uniqueProductIds.add(item.nama); });
    });
    const totalProducts = uniqueProductIds.size;

    const totalUnitsInStock = bahanBaku.reduce((sum, item) => sum + item.stok, 0);

    const validHpps = hppResults.map(r => r.hppPerPorsi);
    const avgHPP = validHpps.length > 0 ? validHpps.reduce((sum, hpp) => sum + hpp, 0) / validHpps.length : 0;
    
    const lowStock = bahanBaku.filter(item => item.stok <= item.minimum).length;

    const filteredFinancialsToday = financialTransactions.filter(t => {
      const transDate = t.date instanceof Date ? t.date : new Date(t.date);
      return transDate >= startOfToday && transDate <= endOfToday;
    });
    const totalRevenue = filteredFinancialsToday.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredFinancialsToday.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    const ordersPendingProcess = orders.filter(order =>
      order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing'
    ).length;

    return { 
      totalProducts, totalBahanBakuUnit, averageHPP, lowStockCount,
      totalRevenueToday: totalRevenue, totalExpenseToday: totalExpense, netProfitToday: netProfit, ordersToProcess 
    };
  }, [orders, bahanBaku, financialTransactions, hppResults, startOfToday, endOfToday]);

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
        productSales[name].revenue += (item.totalHarga || 0);
      });
    });

    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const paginatedBestSellingProducts = useMemo(() => {
    const startIndex = (productsPage - 1) * itemsPerPageProduct;
    return bestSellingProducts.slice(startIndex, startIndex + itemsPerPageProduct);
  }, [bestSellingProducts, productsPage]);

  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPageProduct);

  // ===================================================================
  // --- Aktivitas Terbaru ---
  // ===================================================================
  const paginatedActivities = useMemo(() => {
    const startIndex = (activitiesPage - 1) * itemsPerPageActivity;
    return activities.slice(startIndex, startIndex + itemsPerPageActivity);
  }, [activities, activitiesPage]);

  const totalActivitiesPages = Math.ceil(activities.length / itemsPerPageActivity);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">{getGreeting}</h1>

      {/* Widget KPI Utama (Baris Pertama Dashboard) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Produk</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Stok Bahan</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalBahanBakuUnit}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">HPP Rata-rata</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(averageHPP)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stok Menipis</CardTitle><Bell className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{lowStockCount}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Omzet Hari Ini</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenueToday)}</div><p className="text-xs text-muted-foreground">+5% dari kemarin</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Laba Kotor</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(netProfitToday)}</div><p className="text-xs text-muted-foreground">Termasuk semua HPP & pengeluaran</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pesanan Diproses</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{ordersToProcess}</div><p className="text-xs text-muted-foreground">Menunggu dikirim atau selesai</p></CardContent></Card>
      </div>

      {/* --- TREND KEUANGAN TERBARU (MENGGANTIKAN AKSI CEPAT) --- */}
      <h2 className="text-xl font-bold mb-4 mt-6">Tren Keuangan Terbaru (30 Hari)</h2>
      <Card>
        <CardHeader><CardTitle>Grafik Pemasukan & Pengeluaran</CardTitle><CardDescription>Performa keuangan Anda dalam 30 hari terakhir.</CardDescription></CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboardChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              {/* tickFormatter untuk sumbu X: hanya menampilkan tanggal dan bulan */}
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tickFormatter={(value) => value.slice(0, 6)} // Contoh: "15 Jul"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                // Gunakan formatLargeNumber yang diimpor dari currencyUtils
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
      {/* --- AKHIR TREND KEUANGAN --- */}

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Produk Terlaris */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy />Produk Terlaris</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {paginatedBestSellingProducts.length > 0 ? (
                paginatedBestSellingProducts.map((product, index) => (
                  <div key={product.name} className="p-4 flex items-center hover:bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">{index + 1 + (productsPage - 1) * itemsPerPageProduct}</span>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} terjual • {formatCurrency(product.revenue)}</p>
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
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 p-0 hover:bg-gray-100" 
                onClick={() => setProductsPage(productsPage + 1)}
                disabled={productsPage >= totalProductsPages}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Aktivitas Terbaru */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ActivityIcon />Aktivitas Terbaru</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {activities.length > 0 ? (
                paginatedActivities.map((activity) => {
                  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                  const amount = isFinancial && typeof activity.value === 'string' ? parseFloat(activity.value || '0') : 0; 
                  
                  return (
                    <div key={activity.id} className="p-4 flex items-center hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        {isFinancial && amount > 0 && (
                          <p className={`text-sm font-medium ${
                              activity.type === 'keuangan' && activity.title.toLowerCase().includes('pemasukan')
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
          
          {/* Pagination Aktivitas Terbaru */}
          {activities.length > itemsPerPageActivity && (
            <CardFooter className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 p-0 hover:bg-gray-100" 
                onClick={() => setActivitiesPage(activitiesPage - 1)}
                disabled={activitiesPage === 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-500">
                Halaman {activitiesPage} dari {totalActivitiesPages}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 p-0 hover:bg-gray-100" 
                onClick={() => setActivitiesPage(activitiesPage + 1)}
                disabled={activitiesPage >= totalActivitiesPages}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;