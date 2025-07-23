import React, { useMemo, useState, Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calculator, Warehouse, Package, Trophy, Activity, TrendingDown, CircleDollarSign, ListChecks, ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, ShoppingBag, Boxes } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id } from 'date-fns/locale';
import { filterByDateRange, calculateGrossRevenue } from '@/utils/financialUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationDebugEnhanced from '@/components/NotificationDebugEnhanced';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-600">Terjadi kesalahan. Silakan muat ulang halaman.</div>;
    }
    return this.props.children;
  }
}

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

const Dashboard = () => {
    // Hooks
    const { activities, loading: activitiesLoading } = useActivity();
    const { bahanBaku } = useBahanBaku();
    const { orders } = useOrder();
    const { settings } = useUserSettings();
    const isMobile = useIsMobile();

    // State: Store dates as ISO strings
    const [date, setDate] = useState({
        from: new Date().toISOString(),
        to: new Date().toISOString(),
    });
    const [productsPage, setProductsPage] = useState(1);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const itemsPerPage = 5;

    // Debug logging
    console.log('productsPage:', productsPage);

    // Convert ISO strings to Date objects for Calendar
    const calendarDate = useMemo(() => ({
        from: date.from ? new Date(date.from) : null,
        to: date.to ? new Date(date.to) : null,
    }), [date]);

    // --- Logika Inti Menggunakan Fungsi Terpusat ---
    const filteredOrders = useMemo(() => filterByDateRange(orders, date, 'tanggal'), [orders, date]);
    const filteredActivities = useMemo(() => filterByDateRange(activities, date, 'timestamp'), [activities, date]);

    // --- Kalkulasi Data Berdasarkan Filter ---
    const revenueInRange = useMemo(() => calculateGrossRevenue(filteredOrders), [filteredOrders]);
    const profitInRange = useMemo(() => revenueInRange * 0.3, [revenueInRange]); // Estimasi laba
    const ordersInRange = useMemo(() => filteredOrders.length, [filteredOrders]);
    const outstandingInvoices = useMemo(() => filteredOrders.filter(o => o.status === 'BELUM LUNAS').length, [filteredOrders]);

    const bestSellingProducts = useMemo(() => {
        const productSales = {};
        const productRevenue = {};
        filteredOrders.forEach(order => {
            (order.items || []).forEach(item => {
                if (!item.namaBarang) return;
                productSales[item.namaBarang] = (productSales[item.namaBarang] || 0) + (item.quantity || 0);
                productRevenue[item.namaBarang] = (productRevenue[item.namaBarang] || 0) + ((item.quantity || 0) * (item.hargaSatuan || 0));
            });
        });
        return Object.entries(productSales)
            .map(([name, quantity]) => ({ name, quantity, revenue: productRevenue[name] || 0 }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 20);
    }, [filteredOrders]);

    const worstSellingProducts = useMemo(() => {
        const productSales = {};
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

    // Helper dan Pagination
    const getGreeting = () => {
        const jam = new Date().getHours();
        let sapaan = "datang";
        if (jam >= 4 && jam < 11) sapaan = "pagi";
        else if (jam >= 11 && jam < 15) sapaan = "siang";
        else if (jam >= 15 && jam < 19) sapaan = "sore";
        else sapaan = "malam";
        return settings.ownerName ? `Selamat ${sapaan}, Kak ${settings.ownerName}` : `Selamat ${sapaan}`;
    };

    const currentProducts = bestSellingProducts.slice((productsPage - 1) * itemsPerPage, productsPage * itemsPerPage);
    const totalProductsPages = Math.ceil(bestSellingProducts.length / itemsPerPage);
    const currentActivities = filteredActivities.slice((activitiesPage - 1) * itemsPerPage, activitiesPage * itemsPerPage);
    const totalActivitiesPages = Math.ceil(filteredActivities.length / itemsPerPage);

    // Komponen Pilihan Cepat Tanggal
    const DatePresets = ({ setDateRange }) => {
        const today = new Date();
        const presets = [
            { label: "Hari Ini", range: { from: today.toISOString(), to: today.toISOString() } },
            { label: "Kemarin", range: { from: subDays(today, 1).toISOString(), to: subDays(today, 1).toISOString() } },
            { label: "7 Hari Terakhir", range: { from: subDays(today, 6).toISOString(), to: today.toISOString() } },
            { label: "30 Hari Terakhir", range: { from: subDays(today, 29).toISOString(), to: today.toISOString() } },
            { label: "Bulan Ini", range: { from: startOfMonth(today).toISOString(), to: endOfMonth(today).toISOString() } },
            { label: "Bulan Lalu", range: { from: startOfMonth(subMonths(today, 1)).toISOString(), to: endOfMonth(subMonths(today, 1)).toISOString() } },
        ];
        return (
            <div className="flex flex-col space-y-2 p-3">
                {presets.map(({ label, range }) => (
                    <Button
                        key={label}
                        variant="ghost"
                        className="w-full justify-start text-sm hover:bg-gray-100 rounded-lg py-2 text-gray-800"
                        onClick={() => setDateRange(range)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
        );
    };

    return (
        <ErrorBoundary>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                        <p className="text-md text-gray-600 mt-1">{getGreeting()}</p>
                    </div>
                    {isMobile ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-medium bg-white border-gray-200 hover:bg-gray-50 transition-colors rounded-lg shadow-sm py-2"
                                >
                                    <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                                    <span className="truncate">
                                        {calendarDate.from ? (
                                            calendarDate.to && calendarDate.from.toDateString() !== calendarDate.to.toDateString()
                                                ? `${format(calendarDate.from, "LLL dd, y", { locale: id })} - ${format(calendarDate.to, "LLL dd, y", { locale: id })}`
                                                : format(calendarDate.from, "LLL dd, y", { locale: id })
                                        ) : (
                                            <span className="text-gray-500">Pilih tanggal</span>
                                        )}
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-[400px] p-0 bg-white rounded-xl">
                                <span className="sr-only">
                                    <DialogTitle>Pilih Rentang Tanggal</DialogTitle>
                                </span>
                                <div className="flex flex-col">
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Pilih Rentang Tanggal</h3>
                                    </div>
                                    <DatePresets setDateRange={setDate} />
                                    <div className="border-t border-gray-200">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={calendarDate.from}
                                            selected={calendarDate}
                                            onSelect={(range) => {
                                                setDate(range ? {
                                                    from: range.from ? new Date(range.from).toISOString() : null,
                                                    to: range.to ? new Date(range.to).toISOString() : null,
                                                } : null);
                                            }}
                                            numberOfMonths={1}
                                            locale={id}
                                            className="p-3"
                                            classNames={{
                                                day: "w-10 h-10 text-sm",
                                                day_selected: "bg-blue-600 text-white",
                                                day_today: "border border-blue-300",
                                            }}
                                        />
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant="outline"
                                    className="w-full sm:w-[300px] justify-start text-left font-medium bg-white border-gray-200 hover:bg-gray-50 transition-colors rounded-lg shadow-sm"
                                >
                                    <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                                    {calendarDate.from ? (
                                        calendarDate.to && calendarDate.from.toDateString() !== calendarDate.to.toDateString()
                                            ? `${format(calendarDate.from, "LLL dd, y", { locale: id })} - ${format(calendarDate.to, "LLL dd, y", { locale: id })}`
                                            : format(calendarDate.from, "LLL dd, y", { locale: id })
                                    ) : (
                                        <span className="text-gray-500">Pilih tanggal</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 flex bg-white shadow-lg rounded-xl" align="end">
                                <DatePresets setDateRange={setDate} />
                                <div className="border-l border-gray-200">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={calendarDate.from}
                                        selected={calendarDate}
                                        onSelect={(range) => {
                                            setDate(range ? {
                                                from: range.from ? new Date(range.from).toISOString() : null,
                                                to: range.to ? new Date(range.to).toISOString() : null,
                                            } : null);
                                        }}
                                        numberOfMonths={2}
                                        locale={id}
                                        className="p-3"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <CircleDollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Omzet</p>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(revenueInRange)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex items-center">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <Package className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Total Pesanan</p>
                                <p className="text-xl font-semibold text-gray-900">{ordersInRange}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex items-center">
                            <div className="bg-purple-100 p-3 rounded-full mr-4">
                                <Calculator className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Laba Bersih</p>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(profitInRange)}</p>
                                <p className="text-xs text-gray-500 mt-1">(Estimasi)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex items-center">
                            <div className="bg-orange-100 p-3 rounded-full mr-4">
                                <ListChecks className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Piutang</p>
                                <p className="text-xl font-semibold text-orange-600">{outstandingInvoices}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <Link to="/orders" className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <ShoppingBag className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-800">Pesanan</p>
                        </Link>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <Link to="/stock" className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <Boxes className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-800">Kelola Stok</p>
                        </Link>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <Link to="/laporan" className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg">
                            <div className="bg-purple-100 p-3 rounded-full mr-4">
                                <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-800">Laporan Keuangan</p>
                        </Link>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    <span>Produk Terlaris</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-200">
                                    {currentProducts.length > 0 ? currentProducts.map((product, index) => (
                                        <div key={`${product.name}-${index}`} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-700">{productsPage * itemsPerPage - itemsPerPage + index + 1}</span>
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                                                <div className="flex justify-between mt-1 text-sm">
                                                    <p className="text-gray-500">{product.quantity} terjual</p>
                                                    <p className="font-medium text-gray-800">{formatCurrency(product.revenue)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <div className="p-6 text-center text-gray-500">Tidak ada data penjualan pada periode ini.</div>}
                                </div>
                            </CardContent>
                            {bestSellingProducts.length > itemsPerPage && (
                                <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between">
                                    <Button variant="outline" size="sm" onClick={() => setProductsPage(p => p - 1)} disabled={productsPage === 1} className="text-gray-600 hover:bg-gray-200">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">Halaman {productsPage} dari {totalProductsPages}</span>
                                    <Button variant="outline" size="sm" onClick={() => setProductsPage(p => p + 1)} disabled={productsPage >= totalProductsPages} className="text-gray-600 hover:bg-gray-200">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-red-600 text-lg">
                                    <Warehouse className="h-5 w-5" />
                                    <span>Stok Kritis</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-200">
                                    {bahanBaku.filter(item => item.stok <= item.minimum).length > 0 ? bahanBaku.filter(item => item.stok <= item.minimum).slice(0, 5).map((item) => (
                                        <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <p className="font-medium text-gray-800 truncate">{item.nama}</p>
                                            <div className="flex justify-between mt-1 text-sm">
                                                <p className="text-gray-500">Stok: {item.stok} {item.satuan}</p>
                                                <p className="text-red-600 font-medium">Minimum: {item.minimum} {item.satuan}</p>
                                            </div>
                                        </div>
                                    )) : <div className="p-6 text-center text-gray-500">Tidak ada stok kritis.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                    <Activity className="h-5 w-5 text-gray-600" />
                                    <span>Aktivitas Terbaru</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="text-gray-700">Aktivitas</TableHead>
                                            <TableHead className="text-gray-700">Waktu</TableHead>
                                            <TableHead className="text-gray-700 text-right">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activitiesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-6">Memuat aktivitas...</TableCell>
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
                                                    <TableRow key={activity.id}>
                                                        <TableCell>
                                                            <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                                                            <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-500">{formatDateTime(activity.timestamp)}</TableCell>
                                                        <TableCell className="text-right">
                                                            {isFinancial && amount !== 0 && (
                                                                <p className={`text-sm font-medium ${activity.title.toLowerCase().includes('pemasukan') ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {formatCurrency(amount)}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-6">Belum ada aktivitas pada periode ini.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            {filteredActivities.length > itemsPerPage && (
                                <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between">
                                    <Button variant="outline" size="sm" onClick={() => setActivitiesPage(p => p - 1)} disabled={activitiesPage === 1} className="text-gray-600 hover:bg-gray-200">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">Halaman {activitiesPage} dari {totalActivitiesPages}</span>
                                    <Button variant="outline" size="sm" onClick={() => setActivitiesPage(p => p + 1)} disabled={activitiesPage >= totalActivitiesPages} className="text-gray-600 hover:bg-gray-200">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                    <TrendingDown className="h-5 w-5 text-gray-600" />
                                    <span>Produk Kurang Laris</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-200">
                                    {worstSellingProducts.length > 0 ? worstSellingProducts.map((product, index) => (
                                        <div key={`${product.name}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                                            <p className="font-medium text-green-800 truncate">{product.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">Hanya {product.quantity} terjual</p>
                                        </div>
                                    )) : <div className="p-6 text-center text-gray-500">Tidak ada data untuk ditampilkan.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Dashboard;