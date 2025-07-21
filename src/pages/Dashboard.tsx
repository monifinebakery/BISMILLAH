import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, Warehouse, Package, Trophy, Activity, TrendingUp, TrendingDown, 
  CircleDollarSign, ListChecks, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  FileText, BarChart3, Users, ShoppingCart, AlertTriangle, Sparkles
} from "lucide-react"; 
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext"; 
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 
import { format, subDays, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, startOfYear } from "date-fns";
import { id as localeID } from 'date-fns/locale';

const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return 'Waktu tidak valid';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Waktu tidak valid';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(dateObj);
  } catch { return 'Waktu tidak valid'; }
};

const getDateString = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) { return null; }
    return format(dateObj, 'yyyy-MM-dd'); 
  } catch { return null; }
};

const Dashboard = () => {
  // --- Hooks & State ---
  const { activities, loading: activitiesLoading } = useActivity(); 
  // Pastikan `useBahanBaku`, `useRecipe`, `useOrder` memiliki properti `isLoading` atau kita asumsikan default false
  const { bahanBaku, isLoading: bahanBakuLoading } = useBahanBaku(); 
  const { recipes, hppResults, isLoading: recipesLoading } = useRecipe(); 
  const { orders, isLoading: ordersLoading } = useOrder();
  const { settings, isLoading: settingsLoading } = useUserSettings(); 

  const isLoading = useMemo(() => {
      // Pastikan semua isLoading dari context ada dan digabungkan dengan benar
      return activitiesLoading || bahanBakuLoading || recipesLoading || ordersLoading || settingsLoading;
  }, [activitiesLoading, bahanBakuLoading, recipesLoading, ordersLoading, settingsLoading]);


  const [date, setDate] = useState({ from: new Date(), to: new Date() });
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [chartType, setChartType] = useState('revenue'); 

  const itemsPerPage = 5; 

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    let sapaan = 'datang';
    if (hour >= 4 && hour < 11) sapaan = 'pagi';
    else if (hour >= 11 && hour < 15) sapaan = 'siang';
    else if (hour >= 15 && hour < 19) sapaan = 'sore';
    else sapaan = 'malam';
    
    return settings.ownerName ? `Selamat ${sapaan}, ${settings.ownerName}` : `Selamat ${sapaan}`;
  }, [settings.ownerName]);

  const stats = useMemo(() => {
    const todayStr = getDateString(new Date());
    const yesterdayDate = subDays(new Date(), 1);
    const yesterdayStr = getDateString(yesterdayDate);

    const todaysOrdersList = (orders || []).filter(order => getDateString(order.tanggal) === todayStr); // Guard orders
    const yesterdaysOrdersList = (orders || []).filter(order => getDateString(order.tanggal) === yesterdayStr); 
    
    const totalRevenueToday = todaysOrdersList.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
    const totalRevenueYesterday = yesterdaysOrdersList.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    const netProfitToday = totalRevenueToday * 0.3; // Estimasi

    const ordersToProcess = (orders || []).filter(order => 
        order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing'
    ).length;

    const lowStockCount = (bahanBaku || []).filter(item => item.stok <= item.minimum).length; // Guard bahanBaku

    const averageHPP = (hppResults || []).length > 0 ? 
      (hppResults || []).reduce((sum, result) => sum + (result.hppPerPorsi || 0), 0) / (hppResults || []).length : 0; 
    
    return {
      totalRevenueToday,
      totalRevenueYesterday,
      netProfitToday,
      ordersToProcess,
      lowStockCount,
      averageHPP,
      totalProducts: (recipes || []).length, // Guard recipes
      totalBahanBakuCount: (bahanBaku || []).reduce((sum, item) => sum + (item.stok || 0), 0),
    };
  }, [orders, bahanBaku, hppResults, recipes]); // Sertakan semua dependensi yang digunakan

  const productAnalysis = useMemo(() => {
    const productSales: Record<string, { quantity: number; revenue: number; orders: number }> = {};
    
    (orders || []).forEach(order => { // Guard orders
      (order.items || []).forEach(item => { // Guard order.items
        const name = item.nama || 'Produk Tidak Diketahui';
        if (!productSales[name]) {
          productSales[name] = { quantity: 0, revenue: 0, orders: 0 };
        }
        productSales[name].quantity += item.quantity || 0;
        productSales[name].revenue += (item.totalHarga || 0); 
        productSales[name].orders += 1;
      });
    });

    const products = Object.values(productSales);
    
    return {
      bestSelling: products.sort((a, b) => b.revenue - a.revenue).slice(0, 20),
      worstSelling: products.sort((a, b) => a.quantity - b.quantity).slice(0, 5),
    };
  }, [orders]);


  const stockAnalysis = useMemo(() => {
    const lowStock = (bahanBaku || []).filter(item => item.stok <= item.minimum); // Guard bahanBaku
    return { lowStock };
  }, [bahanBaku]);

  // Pagination logic for products
  // Gunakan optional chaining pada bestSellingProducts sebelum mengakses .length
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const currentProducts = (productAnalysis.bestSelling || []).slice(productsStartIndex, productsStartIndex + itemsPerPage);
  const totalProductsPages = Math.ceil((productAnalysis.bestSelling || []).length / itemsPerPage);

  // Pagination logic for activities
  const activitiesStartIndex = (activitiesPage - 1) * itemsPerPage;
  const currentActivities = (activities || []).slice(activitiesStartIndex, activitiesStartIndex + itemsPerPage); // Guard activities
  const totalActivitiesPages = Math.ceil((activities || []).length / itemsPerPage);


  // Render Loading State Global
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-center">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen"> 
      {/* Enhanced Header (dengan tanggal) */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 sm:px-8 sm:py-6 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">Dashboard</h1>
                <p className="text-blue-100 text-sm sm:text-lg mt-1">{getGreeting()}</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-white/20">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-white border-white/20 hover:bg-white/20 h-10 sm:h-12 text-sm sm:text-base px-3 sm:px-4">
                    <CalendarIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium">
                      {date?.from ? (
                        date.to && format(date.from, 'yyyy-MM-dd') !== format(date.to, 'yyyy-MM-dd') ? 
                          `${format(date.from, "dd MMM", { locale: localeID })} - ${format(date.to, "dd MMM", { locale: localeID })}` : 
                          format(date.from, "dd MMM yyyy", { locale: localeID })
                      ) : "Pilih periode"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex" align="end">
                  {/* Date Presets */}
                  <div className="flex flex-col space-y-1 p-2 border-r">
                    <Button variant="ghost" size="sm" onClick={() => setDate({ from: new Date(), to: new Date() })} className="justify-start">Hari Ini</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDate({ from: subDays(new Date(), 6), to: new Date() })} className="justify-start">7 Hari Terakhir</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDate({ from: subDays(new Date(), 29), to: new Date() })} className="justify-start">30 Hari Terakhir</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })} className="justify-start">Bulan Ini</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDate({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })} className="justify-start">Bulan Lalu</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDate({ from: startOfYear(new Date()), to: endOfMonth(new Date()) })} className="justify-start">Tahun Ini</Button> {/* Add "Tahun Ini" */}
                  </div>
                  <div className="border-l border-gray-200">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={1} locale={localeID} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Omzet Periode Ini */}
        <Card className="bg-white border-b-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-1">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Omzet Periode Ini</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">{formatCurrency(stats.totalRevenueToday)}</p>
              <div className="flex items-center text-xs sm:text-sm mt-1">
                {stats.totalRevenueToday >= stats.totalRevenueYesterday ? (<TrendingUp className="h-4 w-4 text-green-500 mr-1" />) : (<TrendingDown className="h-4 w-4 text-red-500 mr-1" />)}
                <span className={stats.totalRevenueToday >= stats.totalRevenueYesterday ? 'text-green-500' : 'text-red-500'}>
                  {stats.totalRevenueYesterday > 0 ? (Math.abs((stats.totalRevenueToday - stats.totalRevenueYesterday) / stats.totalRevenueYesterday) * 100).toFixed(1) + '%' : '0.0%'}
                </span>
                <span className="ml-1 text-gray-400">vs kemarin</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Laba Bersih Periode Ini */}
        <Card className="bg-white border-b-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-1">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Laba Bersih Periode Ini</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700">{formatCurrency(stats.netProfitToday)}</p>
              <div className="flex items-center text-xs sm:text-sm mt-1">
                <span className="text-gray-400">
                  Margin: {stats.totalRevenueToday > 0 ? ((stats.netProfitToday / stats.totalRevenueToday) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pesanan Menunggu Proses */}
        <Card className="bg-white border-b-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-1">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Pesanan Menunggu Proses</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.ordersToProcess}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Siap dikemas & dikirim</p>
            </div>
          </CardContent>
        </Card>

        {/* Item Stok Menipis */}
        <Card className="bg-white border-b-4 border-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-1">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Item Stok Menipis</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-700">{stats.lowStockCount}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Cek daftar gudang</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg sm:text-xl font-bold mb-4 mt-6">Aksi Cepat</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <Link to="/hpp" className="block"><Card className="shadow-lg border hover:shadow-xl transition-shadow flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white"><div className="bg-blue-500 p-2 sm:p-3 rounded-xl mx-auto mb-2 w-fit"><Calculator className="h-6 w-6 text-white" /></div><h3 className="font-semibold text-sm sm:text-base text-gray-800">Kalkulator HPP</h3></Card></Link>
        <Link to="/gudang" className="block"><Card className="shadow-lg border hover:shadow-xl transition-shadow flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white"><div className="bg-green-500 p-2 sm:p-3 rounded-xl mx-auto mb-2 w-fit"><Warehouse className="h-6 w-6 text-white" /></div><h3 className="font-semibold text-sm sm:text-base">Kelola Gudang</h3></Card></Link>
        <Link to="/pesanan" className="block"><Card className="shadow-lg border hover:shadow-xl transition-shadow flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white"><div className="bg-purple-500 p-2 sm:p-3 rounded-xl mx-auto mb-2 w-fit"><ShoppingCart className="h-6 w-6 text-white" /></div><h3 className="font-semibold text-sm sm:text-base">Manajemen Pesanan</h3></Card></Link>
        <Link to="/laporan" className="block"><Card className="shadow-lg border hover:shadow-xl transition-shadow flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white"><div className="bg-orange-500 p-2 sm:p-3 rounded-xl mx-auto mb-2 w-fit"><FileText className="h-6 w-6 text-white" /></div><h3 className="font-semibold text-sm sm:text-base">Laporan Keuangan</h3></Card></Link>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Produk Terlaris & Stok Kritis (Left Column) */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-lg border">
            <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4 bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Produk Terlaris
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {productAnalysis.bestSelling.length > 0 ? (
                  currentProducts.map((product, index) => (
                    <div key={product.name} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg sm:text-xl font-bold text-gray-700 w-6 text-center">{productsPage * itemsPerPage - itemsPerPage + index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{product.quantity} terjual dalam {product.orders} pesanan</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(product.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm">Belum ada data penjualan pada periode ini.</p>
                  </div>
                )}
              </div>
            </CardContent>
            {productAnalysis.bestSelling.length > itemsPerPage && (
              <CardFooter className="flex items-center justify-between py-2 sm:py-4 px-4 sm:px-6 border-t border-gray-100 bg-gray-50">
                <Button variant="ghost" size="sm" onClick={() => setProductsPage(p => p - 1)} disabled={productsPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs sm:text-sm text-gray-600">Halaman {productsPage} dari {totalProductsPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setProductsPage(p => p + 1)} disabled={productsPage >= totalProductsPages}><ChevronRight className="h-4 w-4" /></Button>
              </CardFooter>
            )}
          </Card>

          <Card className="shadow-lg border">
            <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4 bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                Item Stok Kritis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {stockAnalysis.lowStock.length > 0 ? stockAnalysis.lowStock.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{item.nama}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{item.kategori}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                          Sisa {item.stok} {item.satuan}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-0.5">Min: {item.minimum} {item.satuan}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Warehouse className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm">Semua stok dalam kondisi baik!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-lg border">
            <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4 bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="sr-only">
                  <TableRow><TableHead>Aktivitas</TableHead><TableHead>Waktu</TableHead><TableHead>Nilai</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {activitiesLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                        <Skeleton className="h-10 w-full mx-auto mb-2" />
                        <p>Memuat aktivitas...</p>
                      </TableCell>
                    </TableRow>
                  ) : currentActivities.length > 0 ? (
                    currentActivities.map((activity) => {
                      const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                      let amount = 0;
                      if (isFinancial && activity.value && typeof activity.value === 'string') {
                          const cleanValue = activity.value.replace(/[^0-9.,-]/g, '').replace(',', '.'); 
                          amount = parseFloat(cleanValue) || 0;
                      }

                      return (
                        <TableRow key={activity.id} className="hover:bg-gray-50">
                          <TableCell className="p-4 sm:p-6">
                            <div>
                              <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{activity.title}</p>
                              <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{activity.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 text-right p-4 sm:p-6 w-[80px] sm:w-[100px] align-top">
                            {formatDateTime(activity.createdAt)}
                            {isFinancial && amount !== 0 && (
                              <p className={`font-semibold mt-1 ${
                                activity.title.toLowerCase().includes('pemasukan') 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {formatCurrency(amount)}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      <Activity className="h-10 w-10 mx-auto mb-3" />
                      <p className="text-sm">Belum ada aktivitas pada periode ini.</p>
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {activities.length > itemsPerPage && (
              <CardFooter className="flex items-center justify-between py-2 sm:py-4 px-4 sm:px-6 border-t border-gray-100 bg-gray-50">
                <Button variant="ghost" size="sm" onClick={() => setActivitiesPage(p => p - 1)} disabled={activitiesPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs sm:text-sm text-gray-600">Hal {activitiesPage} dari {totalActivitiesPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setActivitiesPage(p => p + 1)} disabled={activitiesPage >= totalActivitiesPages}><ChevronRight className="h-4 w-4" /></Button>
              </CardFooter>
            )}
          </Card>

          {/* Worst Selling Products */}
          <Card className="shadow-xl border">
            <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4 bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                Produk Kurang Laris
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {productAnalysis.worstSelling.length > 0 ? productAnalysis.worstSelling.map((product, index) => (
                  <div key={product.name} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Hanya {product.quantity} terjual</p>
                    </div>
                    <Badge variant="outline" className="border-orange-200 text-orange-700 text-xs sm:text-sm">Perlu perhatian</Badge>
                  </div>
                )) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm">Semua produk laris!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;