import React, { useState, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import FinancialTransactionDialog from '@/components/FinancialTransactionDialog';
import FinancialTransactionList from '@/components/FinancialTransactionList';
import { useAppData } from '@/contexts/AppDataContext';
import ExportButtons from '@/components/ExportButtons';
import FinancialCategoryManager from '@/components/FinancialCategoryManager';
import { usePaymentContext } from '@/contexts/PaymentContext';
import PaymentStatusIndicator from '@/components/PaymentStatusIndicator';
import { useUserSettings } from '@/hooks/useUserSettings';
import { safeParseDate } from '@/hooks/useSupabaseSync';
import { formatDateForDisplay } from '@/utils/dateUtils';

const FinancialReportPage = () => {
  const { financialTransactions: transactions = [], loading, addFinancialTransaction: addTransaction, updateFinancialTransaction: updateTransaction, deleteFinancialTransaction: deleteTransaction } = useAppData() || {};
  const { settings } = useUserSettings();
  const { isPaid } = usePaymentContext();
  const premiumContentClass = !isPaid ? 'opacity-50 pointer-events-none' : '';

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter(t => {
      // t.tanggal sudah berupa Date | null dari useFinancialTransactions.
      // safeParseDate sekarang mengembalikan Date | null.
      // Pastikan t.tanggal adalah Date object yang valid.
      const transactionDate = t.date; // Menggunakan t.date sesuai interface FinancialTransaction
                                    // asumsikan t.date sudah diproses oleh useAppData/useSupabaseSync

      // Filter keluar transaksi dengan tanggal yang tidak valid atau null
      if (!transactionDate || !(transactionDate instanceof Date) || isNaN(transactionDate.getTime())) {
        return false;
      }
      
      // Sekarang transactionDate dijamin sebagai objek Date yang valid
      if (dateRange?.from && transactionDate < dateRange.from) return false;
      if (dateRange?.to && transactionDate > dateRange.to) return false;
      return true;
    });
  }, [transactions, dateRange]);

  const totalIncome = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + (t.amount || 0), 0); // t.jenis -> t.type, t.jumlah -> t.amount
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + (t.amount || 0), 0); // t.jenis -> t.type, t.jumlah -> t.amount
  }, [filteredTransactions]);

  const balance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];

  const categoryData = useMemo(() => {
    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};

    filteredTransactions.forEach(t => {
      const categoryName = t.category || 'Uncategorized'; // t.deskripsi -> t.category
      if (t.type === 'pemasukan') { // t.jenis -> t.type
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + (t.amount || 0); // t.jumlah -> t.amount
      } else {
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + (t.amount || 0); // t.jumlah -> t.amount
      }
    });

    const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));
    const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    return { incomeData, expenseData };
  }, [filteredTransactions]);

  const transactionData = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number; date: Date | null } } = {}; // date bisa null

    filteredTransactions.forEach(t => {
      const transactionDate = t.date; // Ambil langsung t.date (sudah Date | null)
      
      // Pastikan transactionDate valid sebelum format dan digunakan sebagai key
      if (!transactionDate || isNaN(transactionDate.getTime())) {
          return; // Lewati transaksi dengan tanggal tidak valid
      }

      const monthYear = format(transactionDate, 'yyyy-MM');
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expense: 0, date: transactionDate };
      }
      if (t.type === 'pemasukan') { // t.jenis -> t.type
        monthlyData[monthYear].income += t.amount || 0; // t.jumlah -> t.amount
      } else {
        monthlyData[monthYear].expense += t.amount || 0; // t.jumlah -> t.amount
      }
    });

    return Object.values(monthlyData)
      .map(value => ({
        month: format(value.date as Date, 'MMM yy', { locale: id }), // Cast ke Date karena sudah difilter valid
        income: value.income,
        expense: value.expense,
        date: value.date,
      }))
      .sort((a, b) => {
        // Memastikan a.date dan b.date adalah objek Date yang valid sebelum memanggil .getTime()
        const dateA = (a.date instanceof Date && !isNaN(a.date.getTime())) ? a.date.getTime() : -Infinity;
        const dateB = (b.date instanceof Date && !isNaN(b.date.getTime())) ? b.date.getTime() : -Infinity;
        return dateA - dateB;
      });
  }, [filteredTransactions]);

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Laporan Keuangan
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Analisis keuangan dan laporan bisnis
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`
                      ) : (
                        formatDateForDisplay(dateRange.from)
                      )
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
              <FinancialCategoryManager />
              <ExportButtons data={filteredTransactions} filename="laporan-keuangan" type="financial" />
              <Button onClick={openDialog} className="bg-green-600 text-white hover:bg-green-700">
                Tambah Transaksi
              </Button>
              <FinancialTransactionDialog
                isOpen={isDialogOpen}
                onClose={closeDialog}
                onAddTransaction={addTransaction}
                categories={settings.financialCategories || []}
              />
            </div>
          </div>
        </div>

        {!isPaid && <div className="flex justify-center my-4"><PaymentStatusIndicator size="lg"/></div>}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${premiumContentClass}`}>
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">Rp {totalIncome.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div><p className="text-sm text-muted-foreground">Dalam rentang waktu terpilih</p></CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">Rp {totalExpense.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div><p className="text-sm text-muted-foreground">Dalam rentang waktu terpilih</p></CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle><DollarSign className="h-4 w-4 text-blue-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">Rp {balance.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div><p className="text-sm text-muted-foreground">Dalam rentang waktu terpilih</p></CardContent>
          </Card>
        </div>

        {!isPaid && <div className="flex justify-center my-4"><PaymentStatusIndicator size="lg"/></div>}
        <div className={premiumContentClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader><CardTitle>Grafik Pemasukan & Pengeluaran</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={transactionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="income" stroke="#82ca9d" name="Pemasukan" /><Line type="monotone" dataKey="expense" stroke="#e47272" name="Pengeluaran" /></LineChart></ResponsiveContainer></CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader><CardTitle>Distribusi Kategori Pemasukan</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie dataKey="value" isAnimationActive={false} data={categoryData.incomeData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{categoryData.incomeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader><CardTitle>Distribusi Kategori Pengeluaran</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie dataKey="value" isAnimationActive={false} data={categoryData.expenseData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{categoryData.expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader><CardTitle>Pemasukan vs Pengeluaran Bulanan</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={transactionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="income" fill="#82ca9d" name="Pemasukan" /><Bar dataKey="expense" fill="#e47272" name="Pengeluaran" /></BarChart></ResponsiveContainer></CardContent>
            </Card>
          </div>
        </div>

        {!isPaid && <div className="flex justify-center my-4"><PaymentStatusIndicator size="lg"/></div>}
        <div className={`mb-6 ${premiumContentClass}`}>
          <h2 className="text-xl font-semibold mb-4">Daftar Transaksi</h2>
          <FinancialTransactionList
            transactions={filteredTransactions}
            loading={loading}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            categories={settings.financialCategories || []}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialReportPage;