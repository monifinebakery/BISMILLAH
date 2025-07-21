import React, { useState, useMemo, useCallback } from 'react'; // Menambahkan useCallback
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ShoppingCart, Package, DollarSign, TrendingUp, Handshake, Users, Trophy, Bell, Activity as ActivityIcon, Receipt } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { useOrder } from '@/contexts/OrderContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { Link, useLocation } from "react-router-dom";

import { formatCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns'; // Impor format dari date-fns
import { id as localeID } from 'date-fns/locale'; // Impor locale ID

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Dashboard = () => {
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const { user } = useAuth();
  const { activities, isLoading: activityLoading } = useActivity();
  const { bahanBaku, isLoading: bahanBakuLoading } = useBahanBaku();
  const { orders, isLoading: ordersLoading } = useOrder();
  const { financialTransactions, isLoading: financialLoading } = useFinancial();

  const isLoading = settingsLoading || activityLoading || bahanBakuLoading || ordersLoading || financialLoading;

  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPageProduct = 5; // Untuk produk terlaris
  const itemsPerPageActivity = 5; // Untuk aktivitas terbaru

  // Sambutan dengan Nama Pemilik
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

  const formatDateWithTime = (date: Date) => {
    return format(date, 'd LLL y, HH.mm', { locale: localeID });
  };
  
  // ===================================================================
  // --- Metrik KPI Utama ---
  // ===================================================================
  const { totalRevenueToday, totalExpenseToday, netProfitToday, ordersToProcess, lowStockCount, totalUnitsInStock, averageHPP } = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const filteredFinancialsToday = financialTransactions.filter(t => {
      const transDate = t.date instanceof Date ? t.date : new Date(t.date);
      return transDate >= startOfToday && transDate <= endOfToday;
    });

    const totalRevenue = filteredFinancialsToday
      .filter(t => t.type === 'pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredFinancialsToday
      .filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalRevenue - totalExpense;

    const ordersPendingProcess = orders.filter(order =>
      order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing'
    ).length;

    const lowStock = bahanBaku.filter(item => item.stok <= item.minimum).length;

    const totalUnits = bahanBaku.reduce((sum, item) => sum + item.stok, 0);

    // TODO: Implementasi HPP Rata-rata dari HPPResults jika sudah ada
    // Untuk saat ini biarkan 0 atau kalkulasi dari resep jika diperlukan
    const avgHPP = 0; 

    return { 
      totalRevenueToday: totalRevenue, 
      totalExpenseToday: totalExpense, 
      netProfitToday: netProfit, 
      ordersToProcess: ordersPendingProcess,
      lowStockCount: lowStock,
      totalUnitsInStock: totalUnits,
      averageHPP: avgHPP
    };
  }, [financialTransactions, orders, bahanBaku]);

  // ===================================================================
  // --- Produk Terlaris (Memperbaiki "undefined" & Paginasi) ---
  // ===================================================================
  const bestSellingProducts = useMemo(() => {
    const productSales: { [productName: string]: { quantity: number; revenue: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.nama || 'Produk Tanpa Nama'; 
        if (!productSales[name]) {
          productSales[name] = { quantity: 0, revenue: 0 };
        }
        productSales[name].quantity += item.quantity || 0;
        productSales[name].revenue += (item.totalHarga || 0);
      });
    });

    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue); // Urutkan berdasarkan total pendapatan
  }, [orders]);

  const paginatedBestSellingProducts = useMemo(() => {
    const startIndex = (productsPage - 1) * itemsPerPageProduct;
    return bestSellingProducts.slice(startIndex, startIndex + itemsPerPageProduct);
  }, [bestSellingProducts, productsPage]);

  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPageProduct);


  // ===================================================================
  // --- Aktivitas Terbaru (Dengan Paginasi) ---
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

      {/* Widget KPI Utama (Row 1) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Omzet Hari Ini</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenueToday)}</div><p className="text-xs text-muted-foreground">+5% dari kemarin</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Laba Kotor</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(netProfitToday)}</div><p className="text-xs text-muted-foreground">Termasuk semua HPP & pengeluaran</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pesanan Diproses</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{ordersToProcess}</div><p className="text-xs text-muted-foreground">Menunggu dikirim atau selesai</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stok Bahan Habis/Menipis</CardTitle><Bell className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{lowStockCount}</div><p className="text-xs text-muted-foreground">Lihat daftar di gudang</p></CardContent></Card>
      </div>

      {/* Aksi Cepat */}
      <h2 className="text-xl font-bold mb-4 mt-6">Aksi Cepat</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/hpp"><Button className="w-full h-auto py-4 bg-blue-100 hover:bg-blue-200 text-blue-800"><Receipt className="mr-2" /> Hitung HPP</Button></Link>
        <Link to="/gudang"><Button className="w-full h-auto py-4 bg-green-100 hover:bg-green-200 text-green-800"><Package className="mr-2" /> Kelola Gudang</Button></Link>
        <Link to="/laporan"><Button className="w-full h-auto py-4 bg-purple-100 hover:bg-purple-200 text-purple-800"><DollarSign className="mr-2" /> Laporan Keuangan</Button></Link>
      </div>

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
                className="p-1 rounded text-gray-600 hover:bg-gray-100" // Pastikan ada style ini
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
                className="p-1 rounded text-gray-600 hover:bg-gray-100" // Pastikan ada style ini
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
                  const amount = isFinancial && typeof activity.value === 'string' ? parseFloat(activity.value || '0') : 0; // Pastikan activity.value adalah string sebelum parseFloat
                  
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
                className="p-1 rounded text-gray-600 hover:bg-gray-100"
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
                className="p-1 rounded text-gray-600 hover:bg-gray-100"
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