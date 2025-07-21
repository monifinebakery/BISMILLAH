import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Warehouse, Package, Trophy, Activity, TrendingUp, TrendingDown, CircleDollarSign, ListChecks, ArrowUpCircle } from "lucide-react"; // Menambah ListChecks, ArrowUpCircle
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
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) { return 'Waktu tidak valid'; }
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', }).format(dateObj);
  } catch { return 'Waktu tidak valid'; }
};

// Fungsi untuk mendapatkan tanggal dalam format YYYY-MM-DD
const getDateString = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) { return null; }
    return dateObj.toISOString().split('T')[0];
  } catch { return null; }
};

const Dashboard = () => {
  const { activities, loading: activitiesLoading } = useActivity(); 
  const { bahanBaku, isLoading: bahanBakuLoading } = useBahanBaku();
  const { recipes, hppResults, isLoading: recipesLoading } = useRecipe(); // Memuat hppResults
  const { orders, loading: ordersLoading } = useOrder();
  const { settings, isLoading: settingsLoading } = useUserSettings(); 

  const isLoading = activitiesLoading || bahanBakuLoading || recipesLoading || ordersLoading || settingsLoading;

  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5;

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    let sapaan = 'datang';
    if (hour >= 4 && hour < 11) sapaan = 'pagi';
    if (hour >= 11 && hour < 15) sapaan = 'siang';
    if (hour >= 15 && hour < 19) sapaan = 'sore';
    if (hour >= 19 || hour < 4) sapaan = 'malam';
    
    if (settings.ownerName) { return `Selamat ${sapaan}, Kak ${settings.ownerName}`; }
    return `Selamat ${sapaan}`;
  }, [settings.ownerName]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Total HPP Rata-rata dari semua resep (perlu data HPPResults)
    const averageHPP = hppResults.length > 0 ? 
      hppResults.reduce((sum, result) => sum + (result.hppPerPorsi || 0), 0) / hppResults.length : 0;
    
    const lowStockCount = bahanBaku.filter(item => item.stok <= item.minimum).length;

    // Omzet & Laba
    const todaysOrdersList = orders.filter(order => getDateString(order.tanggal) === todayStr);
    const yesterdaysOrdersList = orders.filter(order => getDateString(order.tanggal) === yesterdayStr);
    
    const totalRevenueToday = todaysOrdersList.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
    const totalRevenueYesterday = yesterdaysOrdersList.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    const netProfitToday = totalRevenueToday - (totalRevenueToday * 0.3); // Estimasi laba bersih (misal 70% dari omzet)

    const outstandingInvoices = orders.filter(order => order.status === 'pending').length; // Assuming 'pending' means belum lunas


    return {
      averageHPP,
      lowStockCount,
      totalRevenueToday,
      totalRevenueYesterday,
      netProfitToday,
      todaysOrdersCount: todaysOrdersList.length,
      outstandingInvoices,
    };
  }, [hppResults, bahanBaku, orders, settings.ownerName]); // Tambah ownerName agar re-kalkulasi saat update user setting

  const bestSellingProducts = useMemo(() => {
    const productSales: Record<string, { quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const name = item.nama || 'Produk Tidak Diketahui';
        if (!productSales[name]) productSales[name] = { quantity: 0, revenue: 0 };
        productSales[name].quantity += item.quantity || 0;
        productSales[name].revenue += (item.totalHarga || 0);
      });
    });
    return Object.entries(productSales).map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
  }, [orders]);

  const worstSellingProducts = useMemo(() => {
    const productSales: Record<string, { quantity: number; }> = {}; // Perlu dikalkulasi berdasarkan periode jika ada
    orders.forEach(order => {
        (order.items || []).forEach(item => {
            const name = item.nama || 'Produk Tidak Diketahui';
            if (!productSales[name]) productSales[name] = { quantity: 0 };
            productSales[name].quantity += item.quantity || 0;
        });
    });
    return Object.entries(productSales).map(([name, data]) => ({ name, ...data }))
        .sort((a,b) => a.quantity - b.quantity)
        .slice(0, 5); // Tampilkan 5 paling kurang laku
  }, [orders]);


  // Pagination logic
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const currentProducts = bestSellingProducts.slice(productsStartIndex, productsStartIndex + itemsPerPage);
  const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPage);

  const activitiesStartIndex = (activitiesPage - 1) * itemsPerPage;
  const currentActivities = activities.slice(activitiesStartIndex, activitiesStartIndex + itemsPerPage);
  const totalActivitiesPages = Math.ceil(activities.length / itemsPerPage);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-white min-h-screen">
      {/* Header Dashboard */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting()}</p>
        </div>
        <div className="text-xs text-gray-400">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards (Metrics Overview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-50 p-2 rounded-lg mr-3"><CircleDollarSign className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Omzet Hari Ini</p>
              <p className="font-semibold text-gray-800">{formatCurrency(stats.totalRevenueToday)}</p>
              {/* Tren (perlu logika perhitungan trend dari totalRevenueToday vs totalRevenueYesterday) */}
            </div>
          </CardContent>
        </Card>
        
        {/* Pesanan Hari Ini */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-50 p-2 rounded-lg mr-3"><Package className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pesanan Hari Ini</p>
              <p className="font-semibold text-gray-800">{stats.todaysOrdersCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Laba Bersih */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-purple-50 p-2 rounded-lg mr-3"><Calculator className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Laba Bersih Hari Ini</p>
              <p className="font-semibold text-gray-800">{formatCurrency(stats.netProfitToday)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Piutang Belum Lunas */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex items-center">
            <div className="bg-orange-50 p-2 rounded-lg mr-3"><ListChecks className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pesanan Menunggu Proses</p>
              <p className="font-semibold text-orange-600">{stats.outstandingInvoices}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions (Tidak dihapus, tapi diatur ulang) */}
      <h2 className="text-xl font-bold mb-4 mt-6">Aksi Cepat</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Mengubah menjadi 4 kolom */}
        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/hpp">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-50 p-2 rounded-lg mr-3"><Calculator className="h-5 w-5 text-blue-600" /></div>
              <div><p className="font-medium text-gray-800">Hitung HPP Resep</p></div>
            </CardContent>
          </Link>
        </Card>
        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/gudang">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-50 p-2 rounded-lg mr-3"><Warehouse className="h-5 w-5 text-green-600" /></div>
              <div><p className="font-medium text-gray-800">Kelola Inventori</p></div>
            </CardContent>
          </Link>
        </Card>
        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/pesanan">
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-50 p-2 rounded-lg mr-3"><Package className="h-5 w-5 text-purple-600" /></div>
              <div><p className="font-medium text-gray-800">Daftar Pesanan</p></div>
            </CardContent>
          </Link>
        </Card>
        <Card className="bg-white border border-gray-100 hover:shadow transition-shadow">
          <Link to="/laporan">
            <CardContent className="p-4 flex items-center">
              <div className="bg-yellow-50 p-2 rounded-lg mr-3"><CircleDollarSign className="h-5 w-5 text-yellow-600" /></div>
              <div><p className="font-medium text-gray-800">Lihat Laporan Keuangan</p></div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Bottom Section (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk Terlaris */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-gray-800"><Trophy className="h-5 w-5 text-gray-600" /><span>Produk Terlaris</span></CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {bestSellingProducts.length > 0 ? (
                currentProducts.map((product, index) => (
                  <div key={product.name} className="p-4 flex items-center hover:bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-4"><span className="text-sm font-medium text-gray-700">{productsStartIndex + index + 1}</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{product.name}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-gray-500">{product.quantity} terjual</p>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (<div className="p-6 text-center"><p className="text-gray-500">Belum ada data penjualan produk terlaris.</p></div>)}
            </div>
            {bestSellingProducts.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button className={`p-1 rounded ${productsPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`} disabled={productsPage === 1} onClick={() => setProductsPage(productsPage - 1)}><ChevronLeft className="h-5 w-5" /></button>
                <span className="text-sm text-gray-500">Halaman {productsPage} dari {totalProductsPages}</span>
                <button className={`p-1 rounded ${productsPage >= totalProductsPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`} disabled={productsPage >= totalProductsPages} onClick={() => setProductsPage(productsPage + 1)}><ChevronRight className="h-5 w-5" /></button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitas Terbaru */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-gray-800"><Activity className="h-5 w-5 text-gray-600" /><span>Aktivitas Terbaru</span></CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {activitiesLoading ? (
                <div className="p-6 text-center"><p className="text-gray-500">Memuat aktivitas...</p></div>
              ) : activities.length > 0 ? (
                currentActivities.map((activity) => {
                  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                  let amount = 0;
                  if (isFinancial && activity.value && typeof activity.value === 'string') { // Pastikan activity.value adalah string
                    const cleanedValue = activity.value.replace(/[^0-9,.-]/g, '').replace(',', '.'); // Hapus Rp dan ganti koma dengan titik
                    amount = parseFloat(cleanedValue) || 0;
                  }
                  
                  return (
                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                          <p className="text-sm text-gray-500 mt-1 truncate">{activity.description}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          {isFinancial && amount > 0 && (
                            <p className={`text-sm font-medium ${
                              (activity.type === 'keuangan' && activity.description.toLowerCase().includes('pemasukan'))
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(amount)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center"><p className="text-gray-500">Belum ada aktivitas.</p></div>
              )}
            </div>
            {activities.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button className={`p-1 rounded ${activitiesPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`} disabled={activitiesPage === 1} onClick={() => setActivitiesPage(activitiesPage - 1)}><ChevronLeft className="h-5 w-5" /></button>
                <span className="text-sm text-gray-500">Halaman {activitiesPage} dari {totalActivitiesPages}</span>
                <button className={`p-1 rounded ${activitiesPage >= totalActivitiesPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`} disabled={activitiesPage >= totalActivitiesPages} onClick={() => setActivitiesPage(activitiesPage + 1)}><ChevronRight className="h-5 w-5" /></button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;