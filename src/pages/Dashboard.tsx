import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calculator, Warehouse, Package, Trophy, Activity, TrendingUp, TrendingDown, 
  CircleDollarSign, ListChecks, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  FileText, BarChart3, Users, ShoppingCart, AlertTriangle, Sparkles, Loader2,
  CheckSquare, X, Trash2, MoreHorizontal, Eye, RefreshCw, Filter, Download,
  PieChart, LineChart
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext'; 
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return 'Waktu tidak valid';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Waktu tidak valid';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
  // Hooks & State
  const { activities, loading: activitiesLoading, deleteActivity } = useActivity(); 
  const { bahanBaku } = useBahanBaku();
  const { recipes, hppResults } = useRecipe();
  const { orders } = useOrder();
  const { settings } = useUserSettings(); 

  // Bulk management state
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [date, setDate] = useState({ from: new Date(), to: new Date() });
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [chartType, setChartType] = useState<'revenue' | 'orders'>('revenue');

  const itemsPerPage = 5;

  const isLoading = useMemo(() => 
    activitiesLoading || bahanBaku.isLoading || recipes.isLoading || orders.isLoading || settings.isLoading, 
    [activitiesLoading, bahanBaku.isLoading, recipes.isLoading, orders.isLoading, settings.isLoading]
  );

  // Filter data berdasarkan tanggal
  const filteredOrders = useMemo(() => {
    if (!date.from || !date.to) return orders;
    const startDate = new Date(date.from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date.to);
    endDate.setHours(23, 59, 59, 999);
    
    return orders.filter(order => {
      const orderDate = new Date(order.tanggal);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, date]);

  const filteredActivities = useMemo(() => {
    if (!date.from || !date.to) return activities;
    const startDate = new Date(date.from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date.to);
    endDate.setHours(23, 59, 59, 999);
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp || activity.createdAt);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }, [activities, date]);

  // Greeting
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    let sapaan = 'datang';
    if (hour >= 4 && hour < 11) sapaan = 'pagi';
    else if (hour >= 11 && hour < 15) sapaan = 'siang';
    else if (hour >= 15 && hour < 19) sapaan = 'sore';
    else sapaan = 'malam';
    
    return settings.ownerName ? `Selamat ${sapaan}, ${settings.ownerName}` : `Selamat ${sapaan}`;
  }, [settings.ownerName]);

  // Statistics calculation
  const stats = useMemo(() => {
    const todayStr = getDateString(new Date());
    const yesterdayDate = subDays(new Date(), 1);
    const yesterdayStr = getDateString(yesterdayDate);

    const todaysOrdersList = filteredOrders.filter(order => getDateString(order.tanggal) === todayStr);
    const yesterdaysOrdersList = orders.filter(order => getDateString(order.tanggal) === yesterdayStr);
    
    const totalRevenueToday = filteredOrders.reduce((sum, order) => {
      if (order.status === 'delivered' || order.status === 'LUNAS') {
        return sum + (order.totalPesanan || 0);
      }
      return sum;
    }, 0);
    
    const totalRevenueYesterday = yesterdaysOrdersList.reduce((sum, order) => {
      if (order.status === 'delivered' || order.status === 'LUNAS') {
        return sum + (order.totalPesanan || 0);
      }
      return sum;
    }, 0);

    const netProfitToday = totalRevenueToday * 0.3;
    const ordersToProcess = orders.filter(order => 
      order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing'
    ).length;
    const lowStockCount = bahanBaku.filter(item => item.stok <= item.minimum).length;
    const averageHPP = hppResults.length > 0 ? 
      hppResults.reduce((sum, result) => sum + (result.hppPerPorsi || 0), 0) / hppResults.length : 0;

    return {
      totalRevenueToday,
      totalRevenueYesterday,
      netProfitToday,
      ordersToProcess,
      lowStockCount,
      averageHPP,
      totalProducts: recipes.length,
      totalBahanBakuCount: bahanBaku.reduce((sum, item) => sum + (item.stok || 0), 0),
    };
  }, [filteredOrders, orders, bahanBaku, hppResults, recipes]);

  // Product analysis
  const productAnalysis = useMemo(() => {
    const productSales: Record<string, { quantity: number; revenue: number; orders: number }> = {};
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const name = item.namaBarang || 'Produk Tidak Diketahui';
        if (!productSales[name]) {
          productSales[name] = { quantity: 0, revenue: 0, orders: 0 };
        }
        productSales[name].quantity += item.quantity || 0;
        productSales[name].revenue += (item.totalHarga || 0); 
        productSales[name].orders += 1;
      });
    });

    const products = Object.entries(productSales).map(([name, data]) => ({ name, ...data }));
    
    return {
      bestSelling: products.sort((a, b) => b.revenue - a.revenue).slice(0, 20),
      worstSelling: products.sort((a, b) => a.quantity - b.quantity).slice(0, 5),
    };
  }, [filteredOrders]);

  // Stock analysis
  const stockAnalysis = useMemo(() => {
    const lowStock = bahanBaku.filter(item => item.stok <= item.minimum);
    const outOfStock = bahanBaku.filter(item => item.stok === 0);
    const totalItems = bahanBaku.length;
    const healthyStock = totalItems - lowStock.length;
    
    return {
      lowStock,
      outOfStock,
      totalItems,
      healthyStock,
      stockHealth: totalItems > 0 ? (healthyStock / totalItems) * 100 : 0
    };
  }, [bahanBaku]);

  // Bulk selection functions
  const toggleActivitySelection = (id: string) => {
    setSelectedActivities(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllActivities = () => {
    setSelectedActivities(filteredActivities.map(activity => activity.id));
  };

  const clearActivitySelection = () => {
    setSelectedActivities([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedActivities([]);
    }
  };

  const isActivitySelected = (id: string) => selectedActivities.includes(id);

  // Bulk delete activities
  const handleBulkDeleteActivities = async () => {
    if (selectedActivities.length === 0) {
      toast.warning('Pilih aktivitas yang ingin dihapus terlebih dahulu');
      return;
    }

    setIsBulkDeleting(true);
    try {
      let successCount = 0;
      for (const activityId of selectedActivities) {
        const success = await deleteActivity(activityId);
        if (success) successCount++;
      }

      if (successCount === selectedActivities.length) {
        toast.success(`${successCount} aktivitas berhasil dihapus!`);
        setSelectedActivities([]);
        setIsSelectionMode(false);
        setShowBulkDeleteDialog(false);
      } else {
        toast.warning(`${successCount} dari ${selectedActivities.length} aktivitas berhasil dihapus`);
      }
    } catch (error) {
      console.error('Error bulk deleting activities:', error);
      toast.error('Terjadi kesalahan saat menghapus aktivitas');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Chart data
  const chartData = useMemo(() => {
    const days = [];
    const startDate = date.from || subDays(new Date(), 7);
    const endDate = date.to || new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStr = getDateString(d);
      const dayOrders = orders.filter(order => getDateString(order.tanggal) === dayStr);
      const dayRevenue = dayOrders.reduce((sum, order) => {
        if (order.status === 'delivered' || order.status === 'LUNAS') {
          return sum + (order.totalPesanan || 0);
        }
        return sum;
      }, 0);

      days.push({
        date: format(d, 'dd/MM'),
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }
    
    return days;
  }, [orders, date]);

  // Pagination
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const currentProducts = productAnalysis.bestSelling.slice(productsStartIndex, productsStartIndex + itemsPerPage);
  const totalProductsPages = Math.ceil(productAnalysis.bestSelling.length / itemsPerPage);

  const activitiesStartIndex = (activitiesPage - 1) * itemsPerPage;
  const currentActivities = filteredActivities.slice(activitiesStartIndex, activitiesStartIndex + itemsPerPage);
  const totalActivitiesPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const allCurrentActivitiesSelected = currentActivities.length > 0 && currentActivities.every(activity => isActivitySelected(activity.id));
  const someCurrentActivitiesSelected = currentActivities.some(activity => isActivitySelected(activity.id)) && !allCurrentActivitiesSelected;

  const handleSelectAllCurrentActivities = () => {
    if (allCurrentActivitiesSelected) {
      currentActivities.forEach(activity => {
        if (isActivitySelected(activity.id)) {
          toggleActivitySelection(activity.id);
        }
      });
    } else {
      currentActivities.forEach(activity => {
        if (!isActivitySelected(activity.id)) {
          toggleActivitySelection(activity.id);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-4 sm:p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                  <p className="text-blue-100 text-lg">{getGreeting}</p>
                  <p className="text-blue-200 text-sm mt-1">
                    Kelola bisnis Anda dengan insight yang mendalam
                  </p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="text-white border-white/20 hover:bg-white/20 h-12">
                      <CalendarIcon className="mr-3 h-5 w-5" />
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
                    <div className="flex flex-col space-y-1 p-2 border-r">
                      <Button variant="ghost" size="sm" onClick={() => setDate({ from: new Date(), to: new Date() })} className="justify-start hover:bg-blue-50">Hari Ini</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDate({ from: subDays(new Date(), 6), to: new Date() })} className="justify-start hover:bg-blue-50">7 Hari Terakhir</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDate({ from: subDays(new Date(), 29), to: new Date() })} className="justify-start hover:bg-blue-50">30 Hari Terakhir</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })} className="justify-start hover:bg-blue-50">Bulan Ini</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDate({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })} className="justify-start hover:bg-blue-50">Bulan Lalu</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDate({ from: startOfYear(new Date()), to: endOfMonth(new Date()) })} className="justify-start hover:bg-blue-50">Tahun Ini</Button>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Omzet</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRevenueToday)}</p>
                  <div className="flex items-center mt-2">
                    {stats.totalRevenueToday >= stats.totalRevenueYesterday ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs">
                      {stats.totalRevenueYesterday > 0 
                        ? `${Math.abs(((stats.totalRevenueToday - stats.totalRevenueYesterday) / stats.totalRevenueYesterday) * 100).toFixed(1)}%`
                        : '0%'
                      } vs kemarin
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <CircleDollarSign className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Laba Bersih</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(stats.netProfitToday)}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs">
                      Margin: {stats.totalRevenueToday > 0 ? ((stats.netProfitToday / stats.totalRevenueToday) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calculator className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Pesanan Aktif</p>
                  <p className="text-2xl font-bold mt-2">{stats.ordersToProcess}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs">Menunggu proses</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Package className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Stok Kritis</p>
                  <p className="text-2xl font-bold mt-2">{stats.lowStockCount}</p>
                  <div className="flex items-center mt-2">
                    {stats.lowStockCount > 0 && (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Perlu perhatian</span>
                      </>
                    )}
                    {stats.lowStockCount === 0 && (
                      <span className="text-xs">Stok aman</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Warehouse className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Revenue/Orders Chart */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  Tren Periode
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={chartType === 'revenue' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('revenue')}
                  >
                    Omzet
                  </Button>
                  <Button 
                    variant={chartType === 'orders' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('orders')}
                  >
                    Pesanan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'revenue' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Omzet']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [value, 'Pesanan']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stock Health Indicator */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                Status Stok Gudang
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-80">
                <div className="relative w-40 h-40">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={stockAnalysis.stockHealth > 70 ? "#10B981" : stockAnalysis.stockHealth > 40 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${stockAnalysis.stockHealth * 2.51} 251`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">
                      {stockAnalysis.stockHealth.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="mt-6 text-center space-y-2">
                  <p className="text-lg font-semibold text-gray-800">Kesehatan Stok</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-green-600">{stockAnalysis.healthyStock}</p>
                      <p className="text-gray-500">Stok Aman</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-red-600">{stockAnalysis.lowStock.length}</p>
                      <p className="text-gray-500">Stok Rendah</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/resep" className="block">
                <Card className="hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <div className="bg-blue-500 p-3 rounded-xl mx-auto mb-3 w-fit">
                      <Calculator className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Hitung HPP</h3>
                    <p className="text-sm text-gray-600 mt-1">Kalkulasi biaya produksi</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/gudang" className="block">
                <Card className="hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6 text-center">
                    <div className="bg-green-500 p-3 rounded-xl mx-auto mb-3 w-fit">
                      <Warehouse className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Kelola Gudang</h3>
                    <p className="text-sm text-gray-600 mt-1">Manajemen inventory</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/pesanan" className="block">
                <Card className="hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6 text-center">
                    <div className="bg-purple-500 p-3 rounded-xl mx-auto mb-3 w-fit">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Pesanan</h3>
                    <p className="text-sm text-gray-600 mt-1">Kelola pesanan masuk</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/laporan" className="block">
                <Card className="hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-6 text-center">
                    <div className="bg-orange-500 p-3 rounded-xl mx-auto mb-3 w-fit">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Laporan</h3>
                    <p className="text-sm text-gray-600 mt-1">Analisis keuangan</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Activities with Bulk Actions */}
        {(isSelectionMode || selectedActivities.length > 0) && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Mode Manajemen Aktivitas</span>
                  </div>
                  {selectedActivities.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                      {selectedActivities.length} aktivitas dipilih
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearActivitySelection}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Batalkan
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllActivities}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Pilih Semua ({filteredActivities.length})
                  </Button>

                  {selectedActivities.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={isBulkDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isBulkDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Hapus {selectedActivities.length} Aktivitas
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Products */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Produk Terlaris
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {productAnalysis.bestSelling.length > 0 ? currentProducts.map((product, index) => (
                    <div key={`${product.name}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold">
                          {productsStartIndex + index + 1}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                          <div className="flex justify-between mt-2">
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {product.quantity} terjual
                              </Badge>
                              <Badge variant="outline" className="border-green-200 text-green-700">
                                {product.orders} pesanan
                              </Badge>
                            </div>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Tidak ada data penjualan pada periode ini.</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {productAnalysis.bestSelling.length > itemsPerPage && (
                <CardFooter className="flex items-center justify-between py-4 border-t border-gray-100 bg-gray-50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setProductsPage(p => p - 1)} 
                    disabled={productsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 font-medium">
                    Halaman {productsPage} dari {totalProductsPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setProductsPage(p => p + 1)} 
                    disabled={productsPage >= totalProductsPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Critical Stock */}
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-pink-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Stok Kritis ({stockAnalysis.lowStock.length} item)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {stockAnalysis.lowStock.length > 0 ? stockAnalysis.lowStock.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-6 hover:bg-red-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{item.nama}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.kategori}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                              {item.stok} {item.satuan}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Min: {item.minimum} {item.satuan}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Semua stok dalam kondisi baik!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activities */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Aktivitas Terbaru
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
                  >
                    {isSelectionMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Keluar Mode
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Kelola
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {isSelectionMode && (
                      <TableHead className="w-12 p-4">
                        <Checkbox
                          checked={allCurrentActivitiesSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someCurrentActivitiesSelected;
                          }}
                          onCheckedChange={handleSelectAllCurrentActivities}
                          className="border-gray-400"
                        />
                      </TableHead>
                    )}
                    <TableHead className="font-semibold">Aktivitas</TableHead>
                    <TableHead className="font-semibold">Waktu</TableHead>
                    {!isSelectionMode && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activitiesLoading ? (
                    <TableRow>
                      <TableCell colSpan={isSelectionMode ? 3 : 4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          <span className="text-gray-500 font-medium">Memuat aktivitas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentActivities.length > 0 ? (
                    currentActivities.map((activity) => {
                      const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                      let amount = 0;
                      
                      if (isFinancial && activity.value && typeof activity.value === 'string') {
                        const cleanValue = activity.value.replace(/Rp|\./g, '').replace(',', '.').trim();
                        amount = parseFloat(cleanValue) || 0;
                      }

                      return (
                        <TableRow 
                          key={activity.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            isActivitySelected(activity.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          {isSelectionMode && (
                            <TableCell className="p-4">
                              <Checkbox
                                checked={isActivitySelected(activity.id)}
                                onCheckedChange={() => toggleActivitySelection(activity.id)}
                                className="border-gray-400"
                              />
                            </TableCell>
                          )}
                          <TableCell className="p-4">
                            <div>
                              <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                              <p className="text-sm text-gray-500 truncate mt-1">{activity.description}</p>
                              {isFinancial && amount !== 0 && (
                                <Badge 
                                  variant={amount > 0 ? 'default' : 'destructive'}
                                  className={`mt-2 ${amount > 0 
                                    ? 'bg-green-100 text-green-700 border-green-200' 
                                    : 'bg-red-100 text-red-700 border-red-200'
                                  }`}
                                >
                                  {formatCurrency(amount)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 p-4 w-32">
                            {formatDateTime(activity.timestamp || activity.createdAt)}
                          </TableCell>
                          {!isSelectionMode && (
                            <TableCell className="p-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Lihat Detail
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => deleteActivity(activity.id)}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isSelectionMode ? 3 : 4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <Activity className="h-16 w-16 text-gray-300" />
                          <div className="text-center">
                            <p className="text-lg font-medium text-gray-600 mb-2">
                              Belum ada aktivitas pada periode ini
                            </p>
                            <p className="text-gray-500 text-sm">
                              Aktivitas akan muncul saat Anda melakukan aksi di aplikasi
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {filteredActivities.length > itemsPerPage && (
              <CardFooter className="flex items-center justify-between py-4 border-t border-gray-100 bg-gray-50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActivitiesPage(p => p - 1)} 
                  disabled={activitiesPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 font-medium">
                  Halaman {activitiesPage} dari {totalActivitiesPages}
                  {selectedActivities.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({selectedActivities.length} selected)
                    </span>
                  )}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActivitiesPage(p => p + 1)} 
                  disabled={activitiesPage >= totalActivitiesPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Konfirmasi Hapus Aktivitas
              </AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan menghapus <strong>{selectedActivities.length} aktivitas</strong> yang dipilih.
                
                <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-2">Aktivitas yang akan dihapus:</p>
                  <ul className="space-y-1">
                    {filteredActivities
                      .filter(activity => selectedActivities.includes(activity.id))
                      .slice(0, 3)
                      .map((activity) => (
                        <li key={activity.id} className="flex items-center gap-2 text-sm">
                          <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="font-medium truncate">{activity.title}</span>
                        </li>
                      ))}
                    {selectedActivities.length > 3 && (
                      <li className="text-sm text-gray-500 italic">
                        ... dan {selectedActivities.length - 3} aktivitas lainnya
                      </li>
                    )}
                  </ul>
                </div>
                
                <p className="mt-3 text-red-600 font-medium text-sm">
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkDeleting}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteActivities}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus {selectedActivities.length} Aktivitas
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Dashboard;