import React, { useState, useMemo, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import FinancialTransactionDialog from '@/components/FinancialTransactionDialog';
import FinancialTransactionList from '@/components/FinancialTransactionList';
import FinancialCategoryManager from '@/components/FinancialCategoryManager';
import { usePaymentContext } from '@/contexts/PaymentContext';
import PaymentStatusIndicator from '@/components/PaymentStatusIndicator';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils';
import { useFinancial } from '@/contexts/FinancialContext';

const FinancialReportPage = () => {
  const { 
    financialTransactions: transactions, 
    addFinancialTransaction, 
    updateFinancialTransaction, 
    deleteFinancialTransaction 
  } = useFinancial();

  const { settings } = useUserSettings();
  const { isPaid } = usePaymentContext();
  const premiumContentClass = !isPaid ? 'opacity-50 pointer-events-none' : '';

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => setIsDialogOpen(true);

  // --- TAMBAHKAN KODE INI ---
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      const transactionDate = t.date;
      if (!transactionDate || !(transactionDate instanceof Date) || isNaN(transactionDate.getTime())) return false;
      
      const rangeFrom = dateRange?.from;
      const rangeTo = dateRange?.to;

      if (rangeFrom && transactionDate < rangeFrom) return false;
      if (rangeTo) {
          const adjustedRangeTo = new Date(rangeTo);
          adjustedRangeTo.setHours(23, 59, 59, 999);
          if (transactionDate > adjustedRangeTo) return false;
      }
      
      return true;
    });
  }, [transactions, dateRange]);

  const { totalIncome, totalExpense, balance, categoryData, transactionData } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};
    const monthlyData: { [key: string]: { income: number; expense: number; date: Date } } = {};

    filteredTransactions.forEach(t => {
      const categoryName = t.category || 'Lainnya';
      if (t.type === 'pemasukan') {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + (t.amount || 0);
      } else {
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + (t.amount || 0);
      }
      
      if(t.date){
        const monthYear = format(t.date, 'yyyy-MM');
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expense: 0, date: t.date };
        }
        if (t.type === 'pemasukan') monthlyData[monthYear].income += t.amount || 0;
        else monthlyData[monthYear].expense += t.amount || 0;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      categoryData: {
        incomeData: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
        expenseData: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
      },
      transactionData: Object.values(monthlyData)
        .map(value => ({
          month: format(value.date, 'MMM yy', { locale: id }),
          Pemasukan: value.income,
          Pengeluaran: value.expense,
          date: value.date,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  }, [filteredTransactions]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis pemasukan, pengeluaran, dan saldo bisnis Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant="outline" className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}` : formatDateForDisplay(dateRange.from)) : <span>Pilih tanggal</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col p-2 space-y-1 border-b">
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: new Date(), to: new Date() })}>Hari ini</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 29), to: new Date() })}>30 Hari Terakhir</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Bulan ini</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })}>Bulan Kemarin</Button>
              </div>
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <FinancialCategoryManager /> {/* <-- TAMBAHKAN BARIS INI */}
          <Button onClick={() => setIsDialogOpen(true)}>Tambah Transaksi</Button>
        </div>
      </div>

      {/* Kartu Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>Total Pemasukan</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Pengeluaran</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Saldo Akhir</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(balance)}</p></CardContent></Card>
      </div>

      {/* Konten Premium */}
      {!isPaid && <div className="flex justify-center my-4"><PaymentStatusIndicator size="lg"/></div>}
      <div className={premiumContentClass}>
        {/* Grafik Garis (Full Width) */}
        <Card className="mb-6">
            <CardHeader><CardTitle>Grafik Pemasukan & Pengeluaran</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={transactionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={formatLargeNumber} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="Pemasukan" stroke="#16a34a" strokeWidth={2} />
                        <Line type="monotone" dataKey="Pengeluaran" stroke="#dc2626" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Chart Pie (Side-by-side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Distribusi Pemasukan */}
            <Card>
                <CardHeader><CardTitle>Distribusi Kategori Pemasukan</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie dataKey="value" data={categoryData.incomeData} nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                                {categoryData.incomeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Chart Distribusi Pengeluaran */}
            <Card>
                <CardHeader><CardTitle>Distribusi Kategori Pengeluaran</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie dataKey="value" data={categoryData.expenseData} nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                                {categoryData.expenseData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Daftar Transaksi */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Daftar Transaksi</h2>
        <FinancialTransactionList
          transactions={filteredTransactions}
          loading={false}
          onUpdateTransaction={updateFinancialTransaction}
          onDeleteTransaction={deleteFinancialTransaction}
          categories={settings.financialCategories || []}
        />
      </div>

      {/* Dialog Tambah Transaksi */}
      <FinancialTransactionDialog
  isOpen={isDialogOpen}
  onClose={closeDialog}
  onAddTransaction={addFinancialTransaction}
  // PASTIKAN SELALU MENGIRIM ARRAY, bahkan saat settings masih loading
  categories={settings?.financialCategories || []}
/>
    </div>
  );
};

export default FinancialReportPage;