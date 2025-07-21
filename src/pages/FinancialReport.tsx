import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  // State Dialog Transaksi
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // State Dialog Kategori
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Handlers ---
  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
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

  const handleDeleteCategory = (type: 'income' | 'expense', categoryToDelete: string) => {
    const categories = settings?.financialCategories || { income: [], expense: [] };
    const updatedList = (categories[type] || []).filter(cat => cat !== categoryToDelete);
    saveSettings({ financialCategories: { ...categories, [type]: updatedList } });
    toast.success('Kategori berhasil dihapus!');
  };

  // --- Logika dan Kalkulasi ---
  const filteredTransactions = useMemo(() => filterByDateRange(transactions, dateRange, 'date').sort((a, b) => new Date(b.date) - new Date(a.date)), [transactions, dateRange]);
  const totalIncome = useMemo(() => calculateTotalIncome(filteredTransactions), [filteredTransactions]);
  const totalExpense = useMemo(() => calculateTotalExpense(filteredTransactions), [filteredTransactions]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);
  const { categoryData, transactionData, dailyData } = useMemo(() => { /* ... (logika ini tidak berubah) ... */ }, [filteredTransactions]);
  const currentTransactions = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(firstItem, firstItem + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

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
      
      {/* Kartu Ringkasan, Grafik, dll. */}
      {/* ... (renderSummaryCards, renderMainChart, renderCategoryCharts) ... */}

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
                    <div key={cat} className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-100">
                      <p>{cat}</p>
                      <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 size={14} className="text-red-500"/></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory('income', cat)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
                    <div key={cat} className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-100">
                      <p>{cat}</p>
                      <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 size={14} className="text-red-500"/></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Kategori "{cat}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory('expense', cat)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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