import React, { useMemo, useState, Component, useEffect, useCallback } from 'react';
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
import { format, subDays, startOfMonth, endOfMonth, subMonths, isValid, parseISO } from "date-fns";
import { id } from 'date-fns/locale';
import { filterByDateRange, calculateGrossRevenue } from '@/utils/financialUtils';
import { useIsMobile } from '@/hooks/use-mobile';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Terjadi Kesalahan</h2>
            <p className="text-red-600 mb-4">Dashboard mengalami masalah. Silakan muat ulang halaman.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Muat Ulang
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safe date formatter with fallback
const formatDateTime = (date) => {
    if (!date) return 'Waktu tidak valid';
    try {
        let dateObj;
        if (typeof date === 'string') {
            dateObj = parseISO(date);
        } else {
            dateObj = new Date(date);
        }
        
        if (!isValid(dateObj)) return 'Waktu tidak valid';
        
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
        }).format(dateObj);
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'Waktu tidak valid';
    }
};

// Safe date conversion
const toISOString = (date) => {
    try {
        if (!date) return null;
        if (typeof date === 'string') return date;
        return date.toISOString();
    } catch (error) {
        console.warn('Date conversion error:', error);
        return null;
    }
};

// Safe date parsing
const parseDate = (dateString) => {
    try {
        if (!dateString) return null;
        const parsed = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
        return isValid(parsed) ? parsed : null;
    } catch (error) {
        console.warn('Date parsing error:', error);
        return null;
    }
};

// Date presets component - moved outside to prevent re-creation
const DatePresets = React.memo(({ setDateRange, onClose = () => {} }) => {
    const today = new Date();
    const presets = useMemo(() => [
        { 
            label: "Hari Ini", 
            range: { 
                from: today.toISOString(), 
                to: today.toISOString() 
            } 
        },
        { 
            label: "Kemarin", 
            range: { 
                from: subDays(today, 1).toISOString(), 
                to: subDays(today, 1).toISOString() 
            } 
        },
        { 
            label: "7 Hari Terakhir", 
            range: { 
                from: subDays(today, 6).toISOString(), 
                to: today.toISOString() 
            } 
        },
        { 
            label: "30 Hari Terakhir", 
            range: { 
                from: subDays(today, 29).toISOString(), 
                to: today.toISOString() 
            } 
        },
        { 
            label: "Bulan Ini", 
            range: { 
                from: startOfMonth(today).toISOString(), 
                to: endOfMonth(today).toISOString() 
            } 
        },
        { 
            label: "Bulan Lalu", 
            range: { 
                from: startOfMonth(subMonths(today, 1)).toISOString(), 
                to: endOfMonth(subMonths(today, 1)).toISOString() 
            } 
        },
    ], [today]);

    const handlePresetClick = useCallback((range) => {
        setDateRange(range);
        onClose();
    }, [setDateRange, onClose]);

    return (
        <div className="flex flex-col space-y-1 p-3 bg-white">
            <div className="pb-2 mb-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Pilihan Cepat</h4>
            </div>
            {presets.map(({ label, range }) => (
                <Button
                    key={label}
                    variant="ghost"
                    className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-700 rounded-md py-2 px-3 text-gray-700 font-normal"
                    onClick={() => handlePresetClick(range)}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
});

const Dashboard = () => {
    // Initialize dates safely
    const today = useMemo(() => new Date(), []);
    const [date, setDate] = useState(() => {
        const todayISO = today.toISOString();
        return {
            from: todayISO,
            to: todayISO,
        };
    });
    
    const [productsPage, setProductsPage] = useState(1);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [mounted, setMounted] = useState(true);
    const itemsPerPage = 5;

    // Cleanup effect to prevent memory leaks
    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);

    // Hooks with safe defaults
    const { activities = [], loading: activitiesLoading = false } = useActivity() || {};
    const { bahanBaku = [] } = useBahanBaku() || {};
    const { orders = [] } = useOrder() || {};
    const { settings = {} } = useUserSettings() || {};
    const isMobile = useIsMobile();

    // Convert ISO strings to Date objects for Calendar with null safety
    const calendarDate = useMemo(() => {
        if (!mounted) return { from: null, to: null };
        
        const fromDate = parseDate(date?.from);
        const toDate = parseDate(date?.to);
        return {
            from: fromDate,
            to: toDate,
        };
    }, [date, mounted]);

    // Safe date filtering with error handling
    const filteredOrders = useMemo(() => {
        try {
            if (!mounted || !Array.isArray(orders) || !date?.from || !date?.to) return [];
            return filterByDateRange(orders, date, 'tanggal');
        } catch (error) {
            console.warn('Order filtering error:', error);
            return [];
        }
    }, [orders, date, mounted]);

    const filteredActivities = useMemo(() => {
        try {
            if (!mounted || !Array.isArray(activities) || !date?.from || !date?.to) return [];
            return filterByDateRange(activities, date, 'timestamp');
        } catch (error) {
            console.warn('Activity filtering error:', error);
            return [];
        }
    }, [activities, date, mounted]);

    // Safe calculations with fallbacks
    const revenueInRange = useMemo(() => {
        try {
            if (!mounted) return 0;
            return calculateGrossRevenue(filteredOrders);
        } catch (error) {
            console.warn('Revenue calculation error:', error);
            return 0;
        }
    }, [filteredOrders, mounted]);

    const profitInRange = useMemo(() => {
        try {
            if (!mounted) return 0;
            return revenueInRange * 0.3;
        } catch (error) {
            console.warn('Profit calculation error:', error);
            return 0;
        }
    }, [revenueInRange, mounted]);

    const ordersInRange = useMemo(() => {
        try {
            if (!mounted) return 0;
            return Array.isArray(filteredOrders) ? filteredOrders.length : 0;
        } catch (error) {
            console.warn('Orders count error:', error);
            return 0;
        }
    }, [filteredOrders, mounted]);

    const outstandingInvoices = useMemo(() => {
        try {
            if (!mounted) return 0;
            return Array.isArray(filteredOrders) 
                ? filteredOrders.filter(o => o?.status === 'BELUM LUNAS').length 
                : 0;
        } catch (error) {
            console.warn('Outstanding invoices calculation error:', error);
            return 0;
        }
    }, [filteredOrders, mounted]);

    // Safe product sales calculation with stable keys
    const bestSellingProducts = useMemo(() => {
        try {
            if (!mounted || !Array.isArray(filteredOrders)) return [];
            
            const productSales = {};
            const productRevenue = {};
            
            filteredOrders.forEach((order, orderIndex) => {
                if (!order?.items || !Array.isArray(order.items)) return;
                
                order.items.forEach((item, itemIndex) => {
                    if (!item?.namaBarang) return;
                    const quantity = Number(item.quantity) || 0;
                    const harga = Number(item.hargaSatuan) || 0;
                    const key = `${item.namaBarang}_${orderIndex}_${itemIndex}`;
                    
                    if (!productSales[item.namaBarang]) {
                        productSales[item.namaBarang] = { quantity: 0, key };
                    }
                    if (!productRevenue[item.namaBarang]) {
                        productRevenue[item.namaBarang] = 0;
                    }
                    
                    productSales[item.namaBarang].quantity += quantity;
                    productRevenue[item.namaBarang] += (quantity * harga);
                });
            });
            
            return Object.entries(productSales)
                .map(([name, data]) => ({ 
                    id: data.key,
                    name, 
                    quantity: Number(data.quantity) || 0, 
                    revenue: Number(productRevenue[name]) || 0 
                }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 20);
        } catch (error) {
            console.warn('Best selling products calculation error:', error);
            return [];
        }
    }, [filteredOrders, mounted]);

    const worstSellingProducts = useMemo(() => {
        try {
            if (!mounted || !Array.isArray(filteredOrders)) return [];
            
            const productSales = {};
            filteredOrders.forEach((order, orderIndex) => {
                if (!order?.items || !Array.isArray(order.items)) return;
                
                order.items.forEach((item, itemIndex) => {
                    if (!item?.namaBarang) return;
                    const quantity = Number(item.quantity) || 0;
                    const key = `${item.namaBarang}_worst_${orderIndex}_${itemIndex}`;
                    
                    if (!productSales[item.namaBarang]) {
                        productSales[item.namaBarang] = { quantity: 0, key };
                    }
                    productSales[item.namaBarang].quantity += quantity;
                });
            });
            
            return Object.entries(productSales)
                .map(([name, data]) => ({ 
                    id: data.key,
                    name, 
                    quantity: Number(data.quantity) || 0 
                }))
                .sort((a, b) => a.quantity - b.quantity)
                .slice(0, 5);
        } catch (error) {
            console.warn('Worst selling products calculation error:', error);
            return [];
        }
    }, [filteredOrders, mounted]);

    // Safe greeting function
    const getGreeting = useCallback(() => {
        try {
            const jam = new Date().getHours();
            let sapaan = "datang";
            if (jam >= 4 && jam < 11) sapaan = "pagi";
            else if (jam >= 11 && jam < 15) sapaan = "siang";
            else if (jam >= 15 && jam < 19) sapaan = "sore";
            else sapaan = "malam";
            
            const ownerName = settings?.ownerName;
            return ownerName ? `Selamat ${sapaan}, Kak ${ownerName}` : `Selamat ${sapaan}`;
        } catch (error) {
            console.warn('Greeting generation error:', error);
            return "Selamat datang";
        }
    }, [settings?.ownerName]);

    // Safe pagination with bounds checking
    const currentProducts = useMemo(() => {
        try {
            if (!mounted || !Array.isArray(bestSellingProducts)) return [];
            const start = Math.max(0, (productsPage - 1) * itemsPerPage);
            const end = start + itemsPerPage;
            return bestSellingProducts.slice(start, end);
        } catch (error) {
            console.warn('Product pagination error:', error);
            return [];
        }
    }, [bestSellingProducts, productsPage, mounted]);

    const totalProductsPages = useMemo(() => {
        try {
            if (!mounted) return 1;
            return Math.max(1, Math.ceil((bestSellingProducts?.length || 0) / itemsPerPage));
        } catch (error) {
            console.warn('Product pages calculation error:', error);
            return 1;
        }
    }, [bestSellingProducts, mounted]);

    const currentActivities = useMemo(() => {
        try {
            if (!mounted || !Array.isArray(filteredActivities)) return [];
            const start = Math.max(0, (activitiesPage - 1) * itemsPerPage);
            const end = start + itemsPerPage;
            return filteredActivities.slice(start, end);
        } catch (error) {
            console.warn('Activity pagination error:', error);
            return [];
        }
    }, [filteredActivities, activitiesPage, mounted]);

    const totalActivitiesPages = useMemo(() => {
        try {
            if (!mounted) return 1;
            return Math.max(1, Math.ceil((filteredActivities?.length || 0) / itemsPerPage));
        } catch (error) {
            console.warn('Activity pages calculation error:', error);
            return 1;
        }
    }, [filteredActivities, mounted]);

    // Safe date range setter
    const setDateRange = useCallback((newRange) => {
        try {
            if (!mounted || !newRange) return;
            
            const fromISO = toISOString(newRange.from);
            const toISO = toISOString(newRange.to);
            
            if (fromISO && toISO) {
                setDate({ from: fromISO, to: toISO });
                setIsCalendarOpen(false);
            }
        } catch (error) {
            console.warn('Date range setting error:', error);
        }
    }, [mounted]);

    // Reset pagination when data changes
    useEffect(() => {
        if (mounted) {
            setProductsPage(1);
            setActivitiesPage(1);
        }
    }, [date, mounted]);

    // Safe pagination handlers
    const handleProductsPageChange = useCallback((direction) => {
        if (!mounted) return;
        
        setProductsPage(prevPage => {
            if (direction === 'prev') {
                return Math.max(1, prevPage - 1);
            } else {
                return Math.min(totalProductsPages, prevPage + 1);
            }
        });
    }, [totalProductsPages, mounted]);

    const handleActivitiesPageChange = useCallback((direction) => {
        if (!mounted) return;
        
        setActivitiesPage(prevPage => {
            if (direction === 'prev') {
                return Math.max(1, prevPage - 1);
            } else {
                return Math.min(totalActivitiesPages, prevPage + 1);
            }
        });
    }, [totalActivitiesPages, mounted]);

    // Format date range for display
    const formatDateRange = useCallback(() => {
        try {
            if (!mounted || !calendarDate.from) return "Pilih rentang tanggal";
            
            if (!calendarDate.to || calendarDate.from.toDateString() === calendarDate.to.toDateString()) {
                return format(calendarDate.from, "dd MMM yyyy", { locale: id });
            }
            
            return `${format(calendarDate.from, "dd MMM", { locale: id })} - ${format(calendarDate.to, "dd MMM yyyy", { locale: id })}`;
        } catch (error) {
            console.warn('Date range formatting error:', error);
            return "Tanggal tidak valid";
        }
    }, [calendarDate, mounted]);

    // Handle calendar selection
    const handleCalendarSelect = useCallback((range) => {
        if (!mounted || !range) return;
        
        try {
            setDateRange({
                from: range.from,
                to: range.to || range.from
            });
        } catch (error) {
            console.warn('Calendar selection error:', error);
        }
    }, [mounted, setDateRange]);

    // Early return if not mounted to prevent DOM manipulation errors
    if (!mounted) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Memuat dashboard...</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
                {/* Header with improved date picker */}
                <div className="flex flex-col space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                            <p className="text-md text-gray-600 mt-1">{getGreeting()}</p>
                        </div>
                        
                        {/* Date Range Picker */}
                        <div className="w-full sm:w-auto">
                            {isMobile ? (
                                <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between text-left font-medium bg-white border-gray-300 hover:bg-gray-50 transition-colors rounded-lg shadow-sm py-2.5 px-4"
                                        >
                                            <div className="flex items-center">
                                                <CalendarIcon className="mr-3 h-5 w-5 text-gray-500" />
                                                <span className="text-gray-700">{formatDateRange()}</span>
                                            </div>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] max-w-[420px] p-0 bg-white rounded-xl">
                                        <DialogTitle className="sr-only">Pilih Rentang Tanggal</DialogTitle>
                                        <div className="flex flex-col">
                                            <div className="p-4 border-b border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-800">Pilih Rentang Tanggal</h3>
                                                <p className="text-sm text-gray-600 mt-1">Pilih periode untuk melihat data</p>
                                            </div>
                                            <DatePresets setDateRange={setDateRange} onClose={() => setIsCalendarOpen(false)} />
                                            <div className="border-t border-gray-200">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={calendarDate.from}
                                                    selected={calendarDate}
                                                    onSelect={handleCalendarSelect}
                                                    numberOfMonths={1}
                                                    locale={id}
                                                    className="p-3"
                                                    classNames={{
                                                        day: "w-10 h-10 text-sm font-medium",
                                                        day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                                                        day_today: "border-2 border-blue-300 bg-blue-50",
                                                        day_range_middle: "bg-blue-100 text-blue-900",
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
                                            variant="outline"
                                            className="w-full sm:w-[320px] justify-between text-left font-medium bg-white border-gray-300 hover:bg-gray-50 transition-colors rounded-lg shadow-sm py-2.5 px-4"
                                        >
                                            <div className="flex items-center">
                                                <CalendarIcon className="mr-3 h-5 w-5 text-gray-500" />
                                                <span className="text-gray-700">{formatDateRange()}</span>
                                            </div>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 flex bg-white shadow-xl rounded-xl border border-gray-200" align="end">
                                        <DatePresets setDateRange={setDateRange} />
                                        <div className="border-l border-gray-200">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={calendarDate.from}
                                                selected={calendarDate}
                                                onSelect={handleCalendarSelect}
                                                numberOfMonths={2}
                                                locale={id}
                                                className="p-3"
                                                classNames={{
                                                    day: "w-9 h-9 text-sm font-medium",
                                                    day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                                                    day_today: "border-2 border-blue-300 bg-blue-50",
                                                    day_range_middle: "bg-blue-100 text-blue-900",
                                                }}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                    
                    {/* Period info */}
                    <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                        <span className="font-medium">Periode yang dipilih:</span> {formatDateRange()}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <CircleDollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Omzet</p>
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
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Pesanan</p>
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
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Laba Bersih</p>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(profitInRange)}</p>
                                <p className="text-xs text-gray-500 mt-1">(Estimasi 30%)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex items-center">
                            <div className="bg-orange-100 p-3 rounded-full mr-4">
                                <ListChecks className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Piutang</p>
                                <p className="text-xl font-semibold text-orange-600">{outstandingInvoices}</p>
                                <p className="text-xs text-gray-500 mt-1">Invoice belum lunas</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <Link to="/orders" className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <ShoppingBag className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-800">Kelola Pesanan</p>
                        </Link>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <Link to="/stock" className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <Boxes className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-800">Kelola Stok</p>
                        </Link>
                    </Card>
                    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <Link to="/laporan" className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg transition-colors">
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
                            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                    <Trophy className="h-5 w-5 text-yellow-600" />
                                    <span>Produk Terlaris</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-200">
                                    {currentProducts.length > 0 ? currentProducts.map((product, index) => (
                                        <div key={product.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
                                                <span className="text-sm font-bold text-white">{(productsPage - 1) * itemsPerPage + index + 1}</span>
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                                                <div className="flex justify-between mt-1 text-sm">
                                                    <p className="text-gray-500">{product.quantity} terjual</p>
                                                    <p className="font-medium text-green-600">{formatCurrency(product.revenue)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-gray-500">
                                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p>Tidak ada data penjualan pada periode ini.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            {totalProductsPages > 1 && (
                                <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleProductsPageChange('prev')} 
                                        disabled={productsPage === 1} 
                                        className="text-gray-600 hover:bg-gray-200"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600 font-medium">
                                        {productsPage} dari {totalProductsPages}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleProductsPageChange('next')} 
                                        disabled={productsPage >= totalProductsPages} 
                                        className="text-gray-600 hover:bg-gray-200"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                        
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-red-600 text-lg">
                                    <Warehouse className="h-5 w-5" />
                                    <span>Stok Kritis</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-200">
                                    {(() => {
                                        const kritisItems = (bahanBaku || []).filter(item => 
                                            item && Number(item.stok) <= Number(item.minimum)
                                        );
                                        
                                        return kritisItems.length > 0 ? kritisItems.slice(0, 5).map((item) => (
                                            <div key={`stock-${item.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                                                <p className="font-medium text-gray-800 truncate">{item.nama}</p>
                                                <div className="flex justify-between mt-1 text-sm">
                                                    <p className="text-gray-500">Stok: {item.stok} {item.satuan}</p>
                                                    <p className="text-red-600 font-medium">Min: {item.minimum} {item.satuan}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-gray-500">
                                                <Warehouse className="h-12 w-12 text-green-300 mx-auto mb-3" />
                                                <p>Semua stok aman.</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    <span>Aktivitas Terbaru</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="text-gray-700 font-medium">Aktivitas</TableHead>
                                            <TableHead className="text-gray-700 font-medium">Waktu</TableHead>
                                            <TableHead className="text-gray-700 font-medium text-right">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activitiesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                                        Memuat aktivitas...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : currentActivities.length > 0 ? (
                                            currentActivities.map((activity, index) => {
                                                const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity?.type);
                                                let amount = 0;
                                                if (isFinancial && activity?.value) {
                                                    const parsed = parseFloat(activity.value);
                                                    amount = isNaN(parsed) ? 0 : parsed;
                                                }
                                                const uniqueKey = `activity-${activity?.id || index}-${activitiesPage}`;
                                                
                                                return (
                                                    <TableRow key={uniqueKey} className="hover:bg-gray-50">
                                                        <TableCell>
                                                            <p className="font-medium text-gray-800 truncate">{activity?.title || 'Aktivitas tidak diketahui'}</p>
                                                            <p className="text-sm text-gray-500 truncate">{activity?.description || ''}</p>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-500">
                                                            {formatDateTime(activity?.timestamp)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {isFinancial && amount !== 0 && (
                                                                <p className={`text-sm font-medium ${
                                                                    (activity?.title || '').toLowerCase().includes('pemasukan') 
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
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                                    <p>Belum ada aktivitas pada periode ini.</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            {totalActivitiesPages > 1 && (
                                <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleActivitiesPageChange('prev')} 
                                        disabled={activitiesPage === 1} 
                                        className="text-gray-600 hover:bg-gray-200"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600 font-medium">
                                        {activitiesPage} dari {totalActivitiesPages}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleActivitiesPageChange('next')} 
                                        disabled={activitiesPage >= totalActivitiesPages} 
                                        className="text-gray-600 hover:bg-gray-200"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                        
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 border-b border-gray-100 p-4">
                                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                    <TrendingDown className="h-5 w-5 text-gray-600" />
                                    <span>Produk Kurang Laris</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-200">
                                    {worstSellingProducts.length > 0 ? worstSellingProducts.map((product) => (
                                        <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <p className="font-medium text-gray-800 truncate">{product.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">Hanya {product.quantity} terjual</p>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-gray-500">
                                            <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p>Tidak ada data untuk ditampilkan.</p>
                                        </div>
                                    )}
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