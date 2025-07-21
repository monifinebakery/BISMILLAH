// src/pages/Dashboard.jsx

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calculator, Warehouse, Package, Trophy, Activity, TrendingDown, CircleDollarSign, ListChecks, ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id } from 'date-fns/locale';
import { filterByDateRange, calculateGrossRevenue } from '@/utils/financialUtils'; // <= IMPORT FUNGSI BARU

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

    // State
    const [date, setDate] = useState({ from: new Date(), to: new Date() });
    const [productsPage, setProductsPage] = useState(1);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const itemsPerPage = 5;
    
    // --- Logika Inti Menggunakan Fungsi Terpusat ---
    const filteredOrders = useMemo(() => filterByDateRange(orders, date, 'tanggal'), [orders, date]);
    const filteredActivities = useMemo(() => filterByDateRange(activities, date, 'timestamp'), [activities, date]);

    // --- Kalkulasi Data Berdasarkan Filter ---
    const revenueInRange = useMemo(() => calculateGrossRevenue(filteredOrders), [filteredOrders]); // <= GUNAKAN FUNGSI BARU
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
                    <Button key={label} variant="ghost" className="w-full justify-start" onClick={() => setDateRange(range)}>{label}</Button>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">{getGreeting()}</p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className="w-[300px] justify-start text-left font-normal bg-white">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to && date.from.toDateString() !== date.to.toDateString() ? (`${format(date.from, "LLL dd, y", { locale: id })} - ${format(date.to, "LLL dd, y", { locale: id })}`) : (format(date.from, "LLL dd, y", { locale: id }))) : (<span>Pilih tanggal</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 flex" align="end">
                        <DatePresets setDateRange={setDate} />
                        <div className="border-l border-gray-200">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={1} locale={id} />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4"><div className="flex items-center"><div className="bg-blue-50 p-2 rounded-lg mr-3"><CircleDollarSign className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-gray-500">Omzet</p><p className="font-semibold text-gray-800 text-lg">{formatCurrency(revenueInRange)}</p></div></div></CardContent>
                </Card>
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4"><div className="flex items-center"><div className="bg-green-50 p-2 rounded-lg mr-3"><Package className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-gray-500">Total Pesanan</p><p className="font-semibold text-gray-800 text-lg">{ordersInRange}</p></div></div></CardContent>
                </Card>
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4"><div className="flex items-center"><div className="bg-purple-50 p-2 rounded-lg mr-3"><Calculator className="h-5 w-5 text-purple-600" /></div><div><p className="text-xs text-gray-500">Laba Bersih</p><p className="font-semibold text-gray-800 text-lg">{formatCurrency(profitInRange)}</p><p className="text-xs text-gray-500 mt-1">(Estimasi)</p></div></div></CardContent>
                </Card>
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4"><div className="flex items-center"><div className="bg-orange-50 p-2 rounded-lg mr-3"><ListChecks className="h-5 w-5 text-orange-600" /></div><div><p className="text-xs text-gray-500">Piutang</p><p className="font-semibold text-orange-600 text-lg">{outstandingInvoices}</p></div></div></CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Card className="bg-white border-gray-100 hover:shadow transition-shadow"><Link to="/hpp" className="p-4 flex items-center h-full"><div className="bg-blue-50 p-2 rounded-lg mr-3"><Calculator className="h-5 w-5 text-blue-600" /></div><p className="font-medium text-gray-800">Hitung HPP</p></Link></Card>
                 <Card className="bg-white border-gray-100 hover:shadow transition-shadow"><Link to="/gudang" className="p-4 flex items-center h-full"><div className="bg-green-50 p-2 rounded-lg mr-3"><Warehouse className="h-5 w-5 text-green-600" /></div><p className="font-medium text-gray-800">Kelola Gudang</p></Link></Card>
                 <Card className="bg-white border-gray-100 hover:shadow transition-shadow"><Link to="/laporan" className="p-4 flex items-center h-full"><div className="bg-purple-50 p-2 rounded-lg mr-3"><FileText className="h-5 w-5 text-purple-600" /></div><p className="font-medium text-gray-800">Laporan Keuangan</p></Link></Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-gray-800"><Trophy className="h-5 w-5 text-yellow-500" /><span>Produk Terlaris</span></CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {currentProducts.length > 0 ? currentProducts.map((product, index) => (
                                    <div key={`${product.name}-${index}`} className="p-4 flex items-center hover:bg-gray-50">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-sm font-medium text-gray-700">{productsPage * itemsPerPage - itemsPerPage + index + 1}</span></div>
                                        <div className="ml-4 flex-1 min-w-0"><p className="font-medium text-gray-800 truncate">{product.name}</p><div className="flex justify-between mt-1"><p className="text-sm text-gray-500">{product.quantity} terjual</p><p className="text-sm font-medium text-gray-800">{formatCurrency(product.revenue)}</p></div></div>
                                    </div>
                                )) : <div className="p-6 text-center"><p className="text-gray-500">Tidak ada data penjualan pada periode ini.</p></div>}
                            </div>
                        </CardContent>
                        {bestSellingProducts.length > itemsPerPage && (<CardFooter className="flex items-center justify-between py-3 border-t border-gray-100"><Button variant="outline" size="sm" onClick={() => setProductsPage(p => p - 1)} disabled={productsPage === 1}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm text-gray-500">Halaman {productsPage} dari {totalProductsPages}</span><Button variant="outline" size="sm" onClick={() => setProductsPage(p => p + 1)} disabled={productsPage >= totalProductsPages}><ChevronRight className="h-4 w-4" /></Button></CardFooter>)}
                    </Card>
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><Warehouse className="h-5 w-5" /><span>Stok Kritis</span></CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {bahanBaku.filter(item => item.stok <= item.minimum).length > 0 ? bahanBaku.filter(item => item.stok <= item.minimum).slice(0, 5).map((item) => (
                                    <div key={item.id} className="p-4 hover:bg-gray-50"><p className="font-medium text-gray-800 truncate">{item.nama}</p><div className="flex justify-between mt-1"><p className="text-sm text-gray-500">Stok: {item.stok} {item.satuan}</p><p className="text-sm text-red-600 font-medium">Minimum: {item.minimum} {item.satuan}</p></div></div>
                                )) : <div className="p-6 text-center"><p className="text-gray-500">Tidak ada stok kritis.</p></div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-gray-800"><Activity className="h-5 w-5 text-gray-600" /><span>Aktivitas Terbaru</span></CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader><TableRow><TableHead>Aktivitas</TableHead><TableHead>Waktu</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {activitiesLoading ? <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-6">Memuat aktivitas...</TableCell></TableRow>
                                    : currentActivities.length > 0 ? currentActivities.map((activity) => {
                                        const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                                        let amount = 0;
                                        if (isFinancial && activity.value) { const parsed = parseFloat(activity.value); amount = isNaN(parsed) ? 0 : parsed; }
                                        return (<TableRow key={activity.id}><TableCell><p className="font-medium text-gray-800 truncate">{activity.title}</p><p className="text-sm text-gray-500 truncate">{activity.description}</p></TableCell><TableCell className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</TableCell><TableCell className="text-right">{isFinancial && amount !== 0 && (<p className={`text-sm font-medium ${activity.title.toLowerCase().includes('pemasukan') ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(amount)}</p>)}</TableCell></TableRow>);
                                    }) : <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-6">Belum ada aktivitas pada periode ini.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                        {filteredActivities.length > itemsPerPage && (<CardFooter className="flex items-center justify-between py-3 border-t border-gray-100"><Button variant="outline" size="sm" onClick={() => setActivitiesPage(p => p - 1)} disabled={activitiesPage === 1}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm text-gray-500">Halaman {activitiesPage} dari {totalActivitiesPages}</span><Button variant="outline" size="sm" onClick={() => setActivitiesPage(p => p + 1)} disabled={activitiesPage >= totalActivitiesPages}><ChevronRight className="h-4 w-4" /></Button></CardFooter>)}
                    </Card>
                    <Card className="bg-white border-gray-100 shadow-sm">
                         <CardHeader><CardTitle className="flex items-center gap-2 text-gray-800"><TrendingDown className="h-5 w-5 text-gray-600" /><span>Produk Kurang Laris</span></CardTitle></CardHeader>
                         <CardContent className="p-0">
                             <div className="divide-y divide-gray-100">
                                 {worstSellingProducts.length > 0 ? worstSellingProducts.map((product, index) => (
                                     <div key={`${product.name}-${index}`} className="p-4 hover:bg-gray-50"><p className="font-medium text-gray-800 truncate">{product.name}</p><p className="text-sm text-gray-500 mt-1">Hanya {product.quantity} terjual</p></div>
                                 )) : <div className="p-6 text-center"><p className="text-gray-500">Tidak ada data untuk ditampilkan.</p></div>}
                             </div>
                         </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;