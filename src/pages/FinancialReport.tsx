import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Plus, Download, ChevronLeft, ChevronRight, Settings, Trash2 } from 'lucide-react';
import { ComposedChart, Area, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import FinancialTransactionDialog from '@/components/FinancialTransactionDialog';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils';
import { useFinancial } from '@/contexts/FinancialContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { filterByDateRange, calculateTotalIncome, calculateTotalExpense } from '@/utils/financialUtils';

const FinancialReportPage = () => {
  const { financialTransactions: transactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, loading } = useFinancial();
  const { settings, saveSettings, isLoading: settingsLoading } = useUserSettings();

  // State Halaman
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfDay(new Date()) });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handlers
  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };
  const handleAddCategory = (type) => { /* ... (fungsi sama seperti sebelumnya) ... */ };
  const handleDeleteCategory = (type, categoryToDelete) => { /* ... (fungsi sama seperti sebelumnya) ... */ };

  // --- Logika dan Kalkulasi ---
  const filteredTransactions = useMemo(() => filterByDateRange(transactions, dateRange, 'date').sort((a, b) => new Date(b.date) - new Date(a.date)), [transactions, dateRange]);
  const totalIncome = useMemo(() => calculateTotalIncome(filteredTransactions), [filteredTransactions]);
  const totalExpense = useMemo(() => calculateTotalExpense(filteredTransactions), [filteredTransactions]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);
  const { categoryData, transactionData, dailyData } = useMemo(() => {
    const result = { categoryData: { incomeData: [], expenseData: [] }, transactionData: [], dailyData: [] };
    if (!filteredTransactions || filteredTransactions.length === 0) return result;
    // ... (sisa logika kalkulasi sama seperti sebelumnya) ...
    return result;
  }, [filteredTransactions]);
  const currentTransactions = useMemo(() => { /* ... (sama seperti sebelumnya) ... */ }, [filteredTransactions, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // --- Fungsi untuk Merender Bagian UI ---

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Pemasukan</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></CardContent></Card>
        <Card className="border-l-4 border-red-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Pengeluaran</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></CardContent></Card>
        <Card className="border-l-4 border-blue-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Saldo Akhir</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(balance)}</p></CardContent></Card>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (<p key={index} style={{ color: entry.color }}>{`${entry.name} : ${formatCurrency(entry.value)}`}</p>))}
        </div>
      );
    }
    return null;
  };

  const renderMainChart = () => {
    const useDailyData = dateRange?.from && dateRange?.to && (dateRange.to.getTime() - dateRange.from.getTime()) < 31 * 24 * 60 * 60 * 1000;
    const data = useDailyData ? dailyData : transactionData;
    return (
      <Card><CardHeader><CardTitle>{useDailyData ? 'Grafik Harian (30 Hari Terakhir)' : 'Grafik Pemasukan & Pengeluaran'}</CardTitle></CardHeader><CardContent><div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={useDailyData ? "date" : "month"} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(tick) => formatLargeNumber(tick)} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value) => <span className="text-sm">{value}</span>}/>
            <Area type="monotone" dataKey="Saldo" fill="#2563eb40" stroke="#2563eb" strokeWidth={2} name="Saldo" />
            <Bar dataKey="Pemasukan" fill="#16a34a" name="Pemasukan" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#dc2626" name="Pengeluaran" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div></CardContent></Card>
    );
  };

  const renderCategoryCharts = () => {
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
      return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
    };
    const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#dc2626', '#06b6d4'];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Distribusi Kategori Pemasukan</CardTitle></CardHeader><CardContent>
          {categoryData.incomeData.length > 0 ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie dataKey="value" data={categoryData.incomeData} nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderCustomizedLabel}>{categoryData.incomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer></div> : <div className="h-64 flex items-center justify-center text-gray-500">Tidak ada data</div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Distribusi Kategori Pengeluaran</CardTitle></CardHeader><CardContent>
          {categoryData.expenseData.length > 0 ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie dataKey="value" data={categoryData.expenseData} nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderCustomizedLabel}>{categoryData.expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer></div> : <div className="h-64 flex items-center justify-center text-gray-500">Tidak ada data</div>}
        </CardContent></Card>
      </div>
    );
  };
  
  if (loading || settingsLoading) {
    return <div className="p-6 text-center text-muted-foreground">Memuat data...</div>;
  }
  
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis pemasukan, pengeluaran, dan saldo bisnis Anda</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}><Settings className="mr-2 h-4 w-4"/> Kelola Kategori</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant="outline" className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}` : formatDateForDisplay(dateRange.from)) : (<span>Pilih tanggal</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={isMobile ? 1 : 2} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* ✨ GRAFIK & CHART DITAMPILKAN KEMBALI DI SINI ✨ */}
      {renderSummaryCards()}
      {renderMainChart()}
      {renderCategoryCharts()}
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Daftar Transaksi</CardTitle>
                <Button size="sm" onClick={() => setIsTransactionDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Transaksi Baru</Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead><TableHead>Deskripsi</TableHead><TableHead>Kategori</TableHead>
                            <TableHead>Tipe</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentTransactions.length > 0 ? currentTransactions.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>{format(new Date(t.date), 'dd MMM yyyy', { locale: id })}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{t.description || '-'}</TableCell>
                                <TableCell><Badge variant="outline">{t.category || 'Lainnya'}</Badge></TableCell>
                                <TableCell><Badge variant={t.type === 'income' ? 'success' : 'destructive'}>{t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</Badge></TableCell>
                                <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEditClick(t)}>Edit</Button></TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada transaksi pada rentang tanggal ini.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </CardFooter>
        )}
      </Card>

      <FinancialTransactionDialog
        isOpen={isTransactionDialogOpen}
        onClose={() => {setIsTransactionDialogOpen(false); setEditingTransaction(null);}}
        onAddTransaction={addFinancialTransaction}
        onUpdateTransaction={updateFinancialTransaction}
        categories={settings?.financialCategories}
        transaction={editingTransaction}
      />
      
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>{/* ... (Dialog Kategori tidak berubah) ... */}</Dialog>
    </div>
  );
};

export default FinancialReportPage;