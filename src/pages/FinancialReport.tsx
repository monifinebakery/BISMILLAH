import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Impor yang dibutuhkan dari date-fns
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, eachDayOfInterval, eachMonthOfInterval, differenceInDays } from 'date-fns'; 
import { id as localeID } from 'date-fns/locale'; // Impor localeID dengan benar

// Impor komponen UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus } from 'lucide-react'; 
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import FinancialTransactionDialog from '@/components/FinancialTransactionDialog';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils';
import { useFinancial } from '@/contexts/FinancialContext';
import FinancialCategoryManager from '@/components/FinancialCategoryManager';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FinancialTransactionList from '@/components/FinancialTransactionList'; 

// Impor komponen Recharts & ShadCN Chart
import { Area, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts'; // Impor semua dari Recharts
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";

const FinancialReportPage = () => {
  const { financialTransactions: transactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, isLoading } = useFinancial();
  const { settings } = useUserSettings();

  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const [transactionsCurrentPage, setTransactionsCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(subMonths(new Date(), 5)), to: endOfDay(new Date()) }); // Default: 6 bulan terakhir
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); 

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  }, []);
  
  const handleEditClick = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const filteredTransactions = useMemo(() => {
    const cleanTransactions = transactions.map(t => ({
      ...t,
      // Pastikan tanggal adalah objek Date yang valid
      date: t.date instanceof Date && !isNaN(t.date.getTime()) ? t.date : new Date(t.date),
    })).filter(t => t.date && !isNaN(t.date.getTime()));

    const from = dateRange?.from ? startOfDay(dateRange.from) : null;
    const to = dateRange?.to ? endOfDay(dateRange.to) : null;     

    if (!from || !to) return cleanTransactions;

    return cleanTransactions.filter(t => {
      return t.date >= from && t.date <= to;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, dateRange]);

  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const totalExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const { chartData, chartMode, categoryData } = useMemo(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;

    if (!from || !to) { 
        return { chartData: [], chartMode: 'monthly', categoryData: { incomeData: [], expenseData: [] } };
    }

    const diffInDays = differenceInDays(to, from);
    const useDailyMode = diffInDays <= 30; // Gunakan harian jika rentang 30 hari atau kurang

    let aggregatedDataMap: { [key: string]: { name: string; pemasukan: number; pengeluaran: number; date: Date } } = {};

    if (useDailyMode) { // Mode Harian: Isi semua hari di rentang
        const days = eachDayOfInterval({ start: from, end: to });
        days.forEach(date => {
            const dayKey = format(date, 'yyyy-MM-dd');
            aggregatedDataMap[dayKey] = {
                name: format(date, 'd MMM', { locale: localeID }), 
                pemasukan: 0,
                pengeluaran: 0,
                date: startOfDay(date),
            };
        });
    } else { // Mode Bulanan: Isi semua bulan di rentang
        const months = eachMonthOfInterval({ start: from, end: to });
        months.forEach(date => {
            const monthKey = format(date, 'yyyy-MM');
            aggregatedDataMap[monthKey] = {
                name: format(date, 'MMM yy', { locale: localeID }),
                pemasukan: 0,
                pengeluaran: 0,
                date: startOfMonth(date),
            };
        });
    }

    // Alokasikan transaksi ke data agregat
    filteredTransactions.forEach(t => {
        let key;
        if (useDailyMode) { key = format(t.date, 'yyyy-MM-dd'); } else { key = format(t.date, 'yyyy-MM'); }

        if (aggregatedDataMap[key]) {
            if (t.type === 'pemasukan') aggregatedDataMap[key].pemasukan += t.amount;
            else if (t.type === 'pengeluaran') aggregatedDataMap[key].pengeluaran += t.amount;
        }
    });

    const finalChartData = Object.values(aggregatedDataMap)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(item => ({ ...item, Saldo: item.pemasukan - item.pengeluaran }));

    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};
    filteredTransactions.forEach(t => {
      const category = t.category || 'Lain-lain';
      if (t.type === 'pemasukan') incomeByCategory[category] = (incomeByCategory[category] || 0) + t.amount;
      else if (t.type === 'pengeluaran') expenseByCategory[category] = (expenseByCategory[category] || 0) + t.amount;
    });
    const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    return {
      chartData: finalChartData,
      chartMode: useDailyMode ? 'daily' : 'monthly',
      categoryData: { incomeData, expenseData },
    };
  }, [filteredTransactions, dateRange]);


  const chartConfig = {
    pemasukan: { label: "Pemasukan", color: "hsl(var(--chart-1))" },
    pengeluaran: { label: "Pengeluaran", color: "hsl(var(--chart-2))" },
    Saldo: { label: "Saldo", color: "hsl(var(--chart-3))" }
  } satisfies ChartConfig;
  
  const categoryColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Pemasukan</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></CardContent></Card>
        <Card className="border-l-4 border-red-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Pengeluaran</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></CardContent></Card>
        <Card className="border-l-4 border-blue-500"><CardHeader className="pb-2"><CardTitle className="text-base font-medium">Saldo Akhir</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(balance)}</p></CardContent></Card>
    </div>
  );

  const renderMainChart = () => {
    return (
      <Card><CardHeader><CardTitle>Grafik Pemasukan & Pengeluaran {chartMode === 'daily' ? 'Harian' : 'Bulanan'}</CardTitle><CardDescription>Tren keuangan dalam rentang tanggal yang dipilih.</CardDescription></CardHeader><CardContent>
        {/* Menggunakan ResponsiveContainer */}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickFormatter={formatLargeNumber} tickLine={false} axisLine={false} tickMargin={8} /> 
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area type="monotone" dataKey="Pemasukan" fill="hsl(var(--chart-1))" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Pemasukan" activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="Pengeluaran" fill="hsl(var(--chart-2))" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Pengeluaran" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Saldo" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Saldo" dot={false} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent></Card>
    );
  };

  const renderCategoryCharts = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Distribusi Kategori Pemasukan</CardTitle></CardHeader><CardContent>
          {categoryData.incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData.incomeData} layout="vertical" margin={{ left: 10 }}>
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
                <XAxis type="number" hide />
                <Tooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} hideIndicator />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.incomeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<p className="text-muted-foreground text-center py-10">Tidak ada data pemasukan.</p>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Distribusi Kategori Pengeluaran</CardTitle></CardHeader><CardContent>
          {categoryData.expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData.expenseData} layout="vertical" margin={{ left: 10 }}>
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
                <XAxis type="number" hide />
                <Tooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} hideIndicator />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<p className="text-muted-foreground text-center py-10">Tidak ada data pengeluaran.</p>)}
        </CardContent></Card>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Daftar Transaksi Terbaru</h2>
        <FinancialTransactionList 
          transactions={filteredTransactions.slice(0, 10)}
          loading={isLoading}
          onUpdateTransaction={updateFinancialTransaction}
          onDeleteTransaction={deleteFinancialTransaction}
          categories={settings.financialCategories}
        />
      </div>
      
      <FinancialTransactionDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          onAddTransaction={addFinancialTransaction}
          onUpdateTransaction={updateFinancialTransaction}
          categories={settings.financialCategories}
          transaction={editingTransaction}
      />
    </div>
  );
};

export default FinancialReportPage;