import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, Warehouse, Package, Trophy, Activity, TrendingDown, TrendingUp,
  CircleDollarSign, ListChecks, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  FileText, BarChart3, PieChart, Users, ShoppingCart, AlertTriangle, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { format, subDays, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfYear } from "date-fns";
import { id } from 'date-fns/locale';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell,
  XAxis, YAxis, Pie, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Helper function untuk format waktu
const formatDateTime = (date) => {
  if (!date) return 'Waktu tidak valid';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Waktu tidak valid';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(dateObj);
  } catch {
    return 'Waktu tidak valid';
  }
};

// Enhanced filtering function
const filterByDateRange = (items, dateRange, dateField) => {
  if (!dateRange.from || !dateRange.to || !items) return [];
  
  const startDate = new Date(dateRange.from);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(dateRange.to);
  endDate.setHours(23, 59, 59, 999);
  
  return items.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

// Enhanced revenue calculation
const calculateFinancialMetrics = (orders) => {
  let totalRevenue = 0;
  let totalCOGS = 0; // Cost of Goods Sold
  let completedOrders = 0;
  let pendingOrders = 0;
  
  orders.forEach(order => {
    if (order.status === 'delivered' || order.status === 'LUNAS') {
      totalRevenue += order.totalPesanan || 0;
      completedOrders++;
      
      // Calculate COGS (simplified estimation)
      (order.items || []).forEach(item => {
        const quantity = item.quantity || 0;
        const unitCost = (item.hargaSatuan || 0) * 0.6; // Assuming 60% is COGS
        totalCOGS += quantity * unitCost;
      });
    } else {
      pendingOrders++;
    }
  });
  
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit * 0.8; // Assuming 20% for operational costs
  
  return {
    totalRevenue,
    totalCOGS,
    grossProfit,
    netProfit,
    completedOrders,
    pendingOrders,
    averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0
  };
};

const Dashboard = () => {
  // Hooks
  const { activities, loading: activitiesLoading } = useActivity();
  const { bahanBaku } = useBahanBaku();
  const { orders } = useOrder();
  const { settings } = useUserSettings();

  // State
  const [date, setDate] = useState({ from: new Date(), to: new Date() });
  const [productsPage, setProductsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [chartType, setChartType] = useState('revenue'); // 'revenue' | 'orders' | 'products'
  const itemsPerPage = 5;
  
  // Filtered data
  const filteredOrders = useMemo(() => filterByDateRange(orders, date, 'tanggal'), [orders, date]);
  const filteredActivities = useMemo(() => filterByDateRange(activities, date, 'timestamp'), [activities, date]);

  // Financial calculations
  const financialMetrics = useMemo(() => calculateFinancialMetrics(filteredOrders), [filteredOrders]);
  
  // Chart data preparation
  const chartData = useMemo(() => {
    if (!date.from || !date.to) return [];
    
    const days = eachDayOfInterval({ start: date.from, end: date.to });
    
    return days.map(day => {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.tanggal);
        return orderDate.toDateString() === day.toDateString();
      });
      
      const dayMetrics = calculateFinancialMetrics(dayOrders);
      
      return {
        date: format(day, 'dd/MM'),
        fullDate: format(day, 'dd MMM yyyy'),
        revenue: dayMetrics.totalRevenue,
        orders: dayOrders.length,
        profit: dayMetrics.netProfit,
        averageOrder: dayMetrics.averageOrderValue
      };
    });
  }, [orders, date]);

  // Product analysis
  const productAnalysis = useMemo(() => {
    const productStats = {};
    
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!item.namaBarang) return;
        
        if (!productStats[item.namaBarang]) {
          productStats[item.namaBarang] = {
            name: item.namaBarang,
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        
        productStats[item.namaBarang].quantity += item.quantity || 0;
        productStats[item.namaBarang].revenue += (item.quantity || 0) * (item.hargaSatuan || 0);
        productStats[item.namaBarang].orders += 1;
      });
    });
    
    const products = Object.values(productStats);
    
    return {
      bestSelling: products.sort((a, b) => b.quantity - a.quantity).slice(0, 20),
      worstSelling: products.sort((a, b) => a.quantity - b.quantity).slice(0, 5),
      topRevenue: products.sort((a, b) => b.revenue - a.revenue).slice(0, 5)
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

  // Helper functions
  const getGreeting = () => {
    const jam = new Date().getHours();
    let sapaan = "datang";
    if (jam >= 4 && jam < 11) sapaan = "pagi";
    else if (jam >= 11 && jam < 15) sapaan = "siang";
    else if (jam >= 15 && jam < 19) sapaan = "sore";
    else sapaan = "malam";
    return settings.ownerName ? `Selamat ${sapaan}, ${settings.ownerName}` : `Selamat ${sapaan}`;
  };

  const currentProducts = productAnalysis.bestSelling.slice((productsPage - 1) * itemsPerPage, productsPage * itemsPerPage);
  const totalProductsPages = Math.ceil(productAnalysis.bestSelling.length / itemsPerPage);
  const currentActivities = filteredActivities.slice((activitiesPage - 1) * itemsPerPage, activitiesPage * itemsPerPage);
  const totalActivitiesPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // Date presets component
  const DatePresets = ({ setDateRange }) => {
    const today = new Date();
    const presets = [
      { label: "Hari Ini", range: { from: today, to: today } },
      { label: "Kemarin", range: { from: subDays(today, 1), to: subDays(today, 1) } },
      { label: "7 Hari Terakhir", range: { from: subDays(today, 6), to: today } },
      { label: "30 Hari Terakhir", range: { from: subDays(today, 29), to: today } },
      { label: "Bulan Ini", range: { from: startOfMonth(today), to: endOfMonth(today) } },
      { label: "Bulan Lalu", range: { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) } },
    ];
    
    return (
      <div className="flex flex-col space-y-1 p-2">
        {presets.map(({ label, range }) => (
          <Button 
            key={label} 
            variant="ghost" 
            className="w-full justify-start hover:bg-blue-50" 
            onClick={() => setDateRange(range)}
          >
            {label}
          </Button>
        ))}
      </div>
    );
  };

  // Colors for charts
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };

  const pieColors = [colors.primary, colors.secondary, colors.warning, colors.danger, colors.purple, colors.pink];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
                  <p className="text-blue-100 text-lg">{getGreeting()}</p>
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
                          date.to && date.from.toDateString() !== date.to.toDateString() ? 
                            `${format(date.from, "dd MMM", { locale: id })} - ${format(date.to, "dd MMM", { locale: id })}` : 
                            format(date.from, "dd MMM yyyy", { locale: id })
                        ) : "Pilih periode"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 flex" align="end">
                    <DatePresets setDateRange={setDate} />
                    <div className="border-l border-gray-200">
                      <Calendar 
                        initialFocus 
                        mode="range" 
                        defaultMonth={date?.from} 
                        selected={date} 
                        onSelect={setDate} 
                        numberOfMonths={1} 
                        locale={id} 
                      />
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
                  <p className="text-2xl font-bold mt-2">{formatCurrency(financialMetrics.totalRevenue)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-xs">+{financialMetrics.completedOrders} pesanan</span>
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
                  <p className="text-2xl font-bold mt-2">{formatCurrency(financialMetrics.netProfit)}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs">Margin: {financialMetrics.totalRevenue > 0 ? ((financialMetrics.netProfit / financialMetrics.totalRevenue) * 100).toFixed(1) : 0}%</span>
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
                  <p className="text-purple-100 text-sm font-medium">Total Pesanan</p>
                  <p className="text-2xl font-bold mt-2">{filteredOrders.length}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs">Rata-rata: {formatCurrency(financialMetrics.averageOrderValue)}</span>
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
                  <p className="text-orange-100 text-sm font-medium">Piutang</p>
                  <p className="text-2xl font-bold mt-2">{financialMetrics.pendingOrders}</p>
                  <div className="flex items-center mt-2">
                    {stockAnalysis.lowStock.length > 0 && (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-xs">{stockAnalysis.lowStock.length} stok rendah</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <ListChecks className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="xl:col-span-2 shadow-xl border-0">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Tren Penjualan
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
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Omzet']}
                        labelFormatter={(label) => `Tanggal: ${label}`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={colors.primary} 
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
                        labelFormatter={(label) => `Tanggal: ${label}`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Bar dataKey="orders" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product Distribution Pie Chart */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Distribusi Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={productAnalysis.topRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="name"
                    >
                      {productAnalysis.topRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Best Selling Products */}
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Produk Terlaris
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {currentProducts.length > 0 ? currentProducts.map((product, index) => (
                    <div key={`${product.name}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold">
                          {productsPage * itemsPerPage - itemsPerPage + index + 1}
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
                    className="hover:bg-white"
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
                    className="hover:bg-white"
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Activities */}
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Aktivitas Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Aktivitas</TableHead>
                      <TableHead className="font-semibold">Waktu</TableHead>
                      <TableHead className="text-right font-semibold">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activitiesLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          Memuat aktivitas...
                        </TableCell>
                      </TableRow>
                    ) : currentActivities.length > 0 ? (
                      currentActivities.map((activity) => {
                        const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                        let amount = 0;
                        if (isFinancial && activity.value) {
                          const parsed = parseFloat(activity.value);
                          amount = isNaN(parsed) ? 0 : parsed;
                        }
                        
                        return (
                          <TableRow key={activity.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                                <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {formatDateTime(activity.timestamp)}
                            </TableCell>
                            <TableCell className="text-right">
                              {isFinancial && amount !== 0 && (
                                <Badge 
                                  variant={activity.title.toLowerCase().includes('pemasukan') ? 'default' : 'destructive'}
                                  className={activity.title.toLowerCase().includes('pemasukan') 
                                    ? 'bg-green-100 text-green-700 border-green-200' 
                                    : 'bg-red-100 text-red-700 border-red-200'
                                  }
                                >
                                  {formatCurrency(amount)}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          Belum ada aktivitas pada periode ini.
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

            {/* Worst Selling Products */}
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <TrendingDown className="h-5 w-5 text-gray-600" />
                  Produk Kurang Laris
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {productAnalysis.worstSelling.length > 0 ? productAnalysis.worstSelling.map((product, index) => (
                    <div key={`${product.name}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Hanya {product.quantity} terjual
                          </p>
                        </div>
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          Perlu perhatian
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Semua produk laris!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;