import React, { useState, useMemo, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns'; 
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import FinancialTransactionDialog from '@/components/FinancialTransactionDialog';
import FinancialTransactionList from '@/components/FinancialTransactionList';
import { usePaymentContext } from '@/contexts/PaymentContext';
import PaymentStatusIndicator from '@/components/PaymentStatusIndicator';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatDateForDisplay } from '@/utils/dateUtils'; 
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils';
import { useFinancial } from '@/contexts/FinancialContext';
import FinancialCategoryManager from '@/components/FinancialCategoryManager';

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
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfDay(new Date()), 
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    console.log('[FinancialReportPage] Raw Transactions:', transactions); 
    return transactions.filter(t => {
      const transactionDate = t.date;
      if (!transactionDate || !(transactionDate instanceof Date) || isNaN(transactionDate.getTime())) {
          console.warn('Invalid transaction date found:', t); 
          return false;
      }
      console.log('[FinancialReportPage] Checking transaction date:', transactionDate); 

      const rangeFrom = dateRange?.from ? startOfDay(dateRange.from) : null; 
      const rangeTo = dateRange?.to ? endOfDay(dateRange.to) : null;     

      console.log('[FinancialReportPage] Date Range From:', rangeFrom, 'To:', rangeTo); 

      if (rangeFrom && transactionDate < rangeFrom) return false;
      if (rangeTo && transactionDate > rangeTo) return false; 
      
      return true;
    });
  }, [transactions, dateRange]);

  const { totalIncome, totalExpense, balance, categoryData, transactionData } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0); 
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0); 
    
    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};
    const monthlyData: { [key: string]: { income: number; expense: number; date: Date } } = {};

    filteredTransactions.forEach(t => {
      const categoryName = t.category || 'Lainnya';
      if (t.type === 'income') { 
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + (t.amount || 0);
      } else if (t.type === 'expense') { 
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + (t.amount || 0);
      }
      
      if(t.date){
        const monthStart = startOfMonth(t.date); 
        console.log('[FinancialReportPage] Monthly Data - Original Date:', t.date, 'Month Start:', monthStart); 
        const monthYearKey = format(monthStart, 'yyyy-MM'); 
        if (!monthlyData[monthYearKey]) {
          monthlyData[monthYearKey] = { income: 0, expense: 0, date: monthStart }; 
        }
        if (t.type === 'income') monthlyData[monthYearKey].income += t.amount || 0; 
        else if (t.type === 'expense') monthlyData[monthYearKey].expense += t.amount || 0; 
      }
    });

    const finalTransactionData = Object.values(monthlyData)
        .map(value => ({
          // ✅ PERBAIKAN: Ubah format bulan menjadi 'MMM yyyy' agar lebih jelas
          month: format(value.date, 'MMM yyyy', { locale: id }), // Contoh: "Jul 2025"
          Pemasukan: value.income,
          Pengeluaran: value.expense,
          date: value.date, 
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log('[FinancialReportPage] Final Transaction Data for Chart:', finalTransactionData); 

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      categoryData: {
        incomeData: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
        expenseData: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
      },
      transactionData: finalTransactionData,
    };
  }, [filteredTransactions]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];

  const formatYAxis = (tickItem: number) => tickItem.toLocaleString('id-ID');

  return (
    <div className="p-4 sm:p-6 space-y-6">
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
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}>Hari ini</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) })}>30 Hari Terakhir</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Bulan ini</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })}>Bulan Kemarin</Button>
              </div>
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <FinancialCategoryManager />
          <Button onClick={() => setIsDialogOpen(true)}>Tambah Transaksi</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>Total Pemasukan</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Pengeluaran</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Saldo Akhir</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(balance)}</p></CardContent></Card>
      </div>

      {!isPaid && <div className="flex justify-center my-4"><PaymentStatusIndicator size="lg"/></div>}
      <div className={premiumContentClass}>
        <Card className="mb-6">
            <CardHeader><CardTitle>Grafik Pemasukan & Pengeluaran Bulanan</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={transactionData}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis tickFormatter={formatYAxis} width={90} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="Pemasukan" stroke="#16a34a" strokeWidth={2} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="Pengeluaran" stroke="#dc2626" strokeWidth={2} activeDot={{ r: 8 }}/>
                    </LineChart>
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Distribusi Kategori Pemasukan</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart><Pie dataKey="value" data={categoryData.incomeData} nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{categoryData.incomeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /></PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Distribusi Kategori Pengeluaran</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart><Pie dataKey="value" data={categoryData.expenseData} nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{categoryData.expenseData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /></PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Daftar Transaksi</h2>
        <FinancialTransactionList
          transactions={filteredTransactions}
          loading={false}
          onUpdateTransaction={updateFinancialTransaction}
          onDeleteTransaction={deleteFinancialTransaction}
          categories={settings.financialCategories}
        />
      </div>
      
      <FinancialTransactionDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onAddTransaction={addFinancialTransaction}
        categories={settings.financialCategories}
      />
    </div>
  );
};

export default FinancialReportPage;