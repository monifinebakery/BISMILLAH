import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
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
import { formatCurrency, formatLargeNumber } from '@/utils/formatUtils';
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
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfDay(new Date()) });
  const isMobile = useIsMobile();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleAddCategory = (type) => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const newCategory = type === 'income' ? newIncomeCategory : newExpenseCategory;
    const currentList = categories[type] || [];
    if (!newCategory.trim()) { toast.error('Nama kategori tidak boleh kosong'); return; }
    if (currentList.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) { toast.error('Kategori ini sudah ada'); return; }
    const updatedList = [...currentList, newCategory.trim()];
    saveSettings({ financialCategories: { ...categories, [type]: updatedList } });
    if (type === 'income') setNewIncomeCategory(''); else setNewExpenseCategory('');
    toast.success('Kategori berhasil ditambahkan!');
  };

  const handleDeleteCategory = (type, categoryToDelete) => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const updatedList = (categories[type] || []).filter(cat => cat !== categoryToDelete);
    saveSettings({ financialCategories: { ...categories, [type]: updatedList } });
    toast.success('Kategori berhasil dihapus!');
  };

  const filteredTransactions = useMemo(() => filterByDateRange(transactions, dateRange, 'date').sort((a, b) => new Date(b.date) - new Date(a.date)), [transactions, dateRange]);
  const totalIncome = useMemo(() => calculateTotalIncome(filteredTransactions), [filteredTransactions]);
  const totalExpense = useMemo(() => calculateTotalExpense(filteredTransactions), [filteredTransactions]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const { categoryData, transactionData, dailyData } = useMemo(() => {
    const result = {
      categoryData: { incomeData: [], expenseData: [] },
      transactionData: [],
      dailyData: []
    };
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return result;
    }
    const incomeByCategory = {}; const expenseByCategory = {}; const monthlyData = {}; const dailyDataMap = {};
    filteredTransactions.forEach(t => {
      const categoryName = t.category || 'Lainnya';
      if (t.type === 'income') { incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + (t.amount || 0); } 
      else { expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + (t.amount || 0); }
      const transactionDate = new Date(t.date);
      if (transactionDate) {
        const monthStart = startOfMonth(transactionDate);
        const monthYearKey = format(monthStart, 'yyyy-MM');
        if (!monthlyData[monthYearKey]) monthlyData[monthYearKey] = { income: 0, expense: 0, date: monthStart };
        if (t.type === 'income') monthlyData[monthYearKey].income += t.amount || 0; else monthlyData[monthYearKey].expense += t.amount || 0;
        const dayKey = format(transactionDate, 'yyyy-MM-dd');
        if (!dailyDataMap[dayKey]) dailyDataMap[dayKey] = { income: 0, expense: 0, date: transactionDate };
        if (t.type === 'income') dailyDataMap[dayKey].income += t.amount || 0; else dailyDataMap[dayKey].expense += t.amount || 0;
      }
    });
    result.transactionData = Object.values(monthlyData).map(value => ({ month: format(value.date, 'MMM yyyy', { locale: id }), Pemasukan: value.income, Pengeluaran: value.expense, Saldo: value.income - value.expense, date: value.date })).sort((a, b) => a.date - b.date);
    const today = endOfDay(new Date());
    for (let i = 0; i < 30; i++) {
        const currentDate = startOfDay(subDays(today, 29 - i));
        const dayKey = format(currentDate, 'yyyy-MM-dd');
        const existingData = dailyDataMap[dayKey] || { income: 0, expense: 0 };
        result.dailyData.push({ date: format(currentDate, 'd MMM', { locale: id }), Pemasukan: existingData.income, Pengeluaran: existingData.expense, Saldo: existingData.income - existingData.expense });
    }
    result.categoryData = {
        incomeData: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
        expenseData: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    };
    return result;
  }, [filteredTransactions]);
  
  const currentTransactions = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(firstItem, firstItem + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-green-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Pemasukan</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></CardContent></Card>
      <Card className="border-l-4 border-red-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Pengeluaran</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></CardContent></Card>
      <Card className="border-l-4 border-blue-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Saldo Akhir</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(balance)}</p></CardContent></Card>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (<div className="p-3 bg-white border border-gray-300 rounded shadow-lg text-sm"><p className="font-semibold mb-1">{label}</p>{payload.map((entry, index) => (<p key={index} style={{ color: entry.color }}>{`${entry.name} : ${formatCurrency(entry.value)}`}</p>))}</div>);
    }
    return null;
  };

  const renderMainChart = () => {
    const useDailyData = dateRange?.from && dateRange?.to && (dateRange.to.getTime() - dateRange.from.getTime()) < 31 * 24 * 60 * 60 * 1000;
    const data = useDailyData ? dailyData : transactionData;
    return (
      <Card><CardHeader><CardTitle>{useDailyData ? 'Grafik Harian (30 Hari Terakhir)' : 'Grafik Pemasukan & Pengeluaran'}</CardTitle></CardHeader><CardContent><div className="h-80">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey={useDailyData ? "date" : "month"} tick={{ fontSize: 12 }} /><YAxis tickFormatter={(tick) => formatLargeNumber(tick)} tick={{ fontSize: 12 }} /><Tooltip content={<CustomTooltip />} /><Legend formatter={(value) => <span className="text-sm">{value}</span>}/><Area type="monotone" dataKey="Saldo" fill="#2563eb40" stroke="#2563eb" strokeWidth={2} name="Saldo" /><Bar dataKey="Pemasukan" fill="#16a34a" name="Pemasukan" radius={[4, 4, 0, 0]} /><Bar dataKey="Pengeluaran" fill="#dc2626" name="Pengeluaran" radius={[4, 4, 0, 0]} /></ComposedChart></ResponsiveContainer>
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
        <div><h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1><p className="text-muted-foreground">Analisis pemasukan, pengeluaran, dan saldo bisnis Anda</p></div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}><Settings className="mr-2 h-4 w-4"/> Kelola Kategori</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant="outline" className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}` : formatDateForDisplay(dateRange.from)) : (<span>Pilih tanggal</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex" align="end">
              <div className="flex flex-col space-y-1 p-2 border-r">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}>Hari ini</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) })}>Kemarin</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) })}>7 Hari Terakhir</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Bulan ini</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })}>Bulan Kemarin</Button>
              </div>
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={1} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {renderSummaryCards()}
      {renderMainChart()}
      {renderCategoryCharts()}
      
      <Card>
        <CardHeader><div className="flex justify-between items-center"><CardTitle>Daftar Transaksi</CardTitle><Button size="sm" onClick={() => setIsTransactionDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Transaksi Baru</Button></div></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Deskripsi</TableHead><TableHead>Kategori</TableHead><TableHead>Tipe</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
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
                )) : (<TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada transaksi pada rentang tanggal ini.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (<CardFooter className="flex items-center justify-between p-4 border-t"><div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div><div className="flex items-center gap-1"><Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button></div></CardFooter>)}
      </Card>
      
      <FinancialTransactionDialog isOpen={isTransactionDialogOpen} onClose={() => {setIsTransactionDialogOpen(false); setEditingTransaction(null);}} onAddTransaction={addFinancialTransaction} onUpdateTransaction={updateFinancialTransaction} categories={settings?.financialCategories} transaction={editingTransaction} />
      
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Kelola Kategori Keuangan</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Kategori Pemasukan</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2"><Input placeholder="Kategori baru..." value={newIncomeCategory} onChange={e => setNewIncomeCategory(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddCategory('income')} /><Button size="sm" onClick={() => handleAddCategory('income')}><Plus size={16}/></Button></div>
                <div className="space-y-1 pt-2 max-h-48 overflow-y-auto">
                  {(settings?.financialCategories?.income || []).map(cat => (
                    <div key={cat} className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-100"><p>{cat}</p>
                      <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 size={14} className="text-red-500"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory('income', cat)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Kategori Pengeluaran</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2"><Input placeholder="Kategori baru..." value={newExpenseCategory} onChange={e => setNewExpenseCategory(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddCategory('expense')} /><Button size="sm" onClick={() => handleAddCategory('expense')}><Plus size={16}/></Button></div>
                <div className="space-y-1 pt-2 max-h-48 overflow-y-auto">
                  {(settings?.financialCategories?.expense || []).map(cat => (
                    <div key={cat} className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-100"><p>{cat}</p>
                      <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 size={14} className="text-red-500"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory('expense', cat)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialReportPage;