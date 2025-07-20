import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Download } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Area
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import FinancialTransactionDialog from '@/components/FinancialTransactionDialog';
import { usePaymentContext } from '@/contexts/PaymentContext';
import PaymentStatusIndicator from '@/components/PaymentStatusIndicator';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { formatCurrency, formatLargeNumber } from '@/utils/currencyUtils';
import { useFinancial } from '@/contexts/FinancialContext';
import FinancialCategoryManager from '@/components/FinancialCategoryManager';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const FinancialReportPage = () => {
  const {
    financialTransactions: transactions,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
    loading
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
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi ukuran layar untuk responsivitas
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      const transactionDate = t.date;
      // Perbaikan: tambahkan tanda kurung penutup untuk kondisi if
      if (!transactionDate || !(transactionDate instanceof Date)) return false;

      const rangeFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
      const rangeTo = dateRange?.to ? endOfDay(dateRange.to) : null;

      if (rangeFrom && transactionDate < rangeFrom) return false;
      if (rangeTo && transactionDate > rangeTo) return false;

      return true;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, dateRange]);

  const { totalIncome, totalExpense, balance, categoryData, transactionData, dailyData } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    const monthlyData: Record<string, { income: number; expense: number; date: Date }> = {};
    const dailyDataMap: Record<string, { income: number; expense: number; date: Date }> = {};

    filteredTransactions.forEach(t => {
      const categoryName = t.category || 'Lainnya';
      
      // Aggregasi kategori
      if (t.type === 'income') {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + (t.amount || 0);
      } else {
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + (t.amount || 0);
      }

      // Aggregasi bulanan
      if (t.date) {
        const monthStart = startOfMonth(t.date);
        const monthYearKey = format(monthStart, 'yyyy-MM');
        
        if (!monthlyData[monthYearKey]) {
          monthlyData[monthYearKey] = { income: 0, expense: 0, date: monthStart };
        }
        
        if (t.type === 'income') monthlyData[monthYearKey].income += t.amount || 0;
        else monthlyData[monthYearKey].expense += t.amount || 0;

        // Aggregasi harian (30 hari terakhir)
        const dayKey = format(t.date, 'yyyy-MM-dd');
        if (!dailyDataMap[dayKey]) {
          dailyDataMap[dayKey] = { income: 0, expense: 0, date: t.date };
        }
        
        if (t.type === 'income') dailyDataMap[dayKey].income += t.amount || 0;
        else dailyDataMap[dayKey].expense += t.amount || 0;
      }
    });

    // Format data bulanan
    const finalMonthlyData = Object.values(monthlyData)
      .map(value => ({
        month: format(value.date, 'MMM yyyy', { locale: id }),
        Pemasukan: value.income,
        Pengeluaran: value.expense,
        Saldo: value.income - value.expense,
        date: value.date,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Format data harian (30 hari terakhir)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const dailyDataArray = Object.values(dailyDataMap)
      .filter(d => d.date >= thirtyDaysAgo)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Isi hari yang tidak ada transaksi
    const completeDailyData = [];
    let currentDate = new Date(thirtyDaysAgo);
    const today = new Date();
    
    while (currentDate <= today) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const existing = dailyDataArray.find(d => format(d.date, 'yyyy-MM-dd') === dateStr);
      
      if (existing) {
        completeDailyData.push({
          date: format(currentDate, 'd MMM', { locale: id }),
          Pemasukan: existing.income,
          Pengeluaran: existing.expense,
          Saldo: existing.income - existing.expense
        });
      } else {
        completeDailyData.push({
          date: format(currentDate, 'd MMM', { locale: id }),
          Pemasukan: 0,
          Pengeluaran: 0,
          Saldo: 0
        });
      }
      
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      categoryData: {
        incomeData: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
        expenseData: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
      },
      transactionData: finalMonthlyData,
      dailyData: completeDailyData
    };
  }, [filteredTransactions]);

  // Warna untuk chart
  const COLORS = ['#16a34a', '#dc2626', '#2563eb', '#f59e0b', '#8b5cf6', '#06b6d4'];
  const INCOME_COLOR = '#16a34a';
  const EXPENSE_COLOR = '#dc2626';
  const BALANCE_COLOR = '#2563eb';

  const formatYAxis = (tickItem: number) => formatLargeNumber(tickItem);

  // Custom Tooltip untuk Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {`${entry.name} : ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render label untuk pie chart
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Render ringkasan keuangan
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="border-l-4 border-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            <div className="bg-green-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
            <div className="bg-red-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Saldo Akhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </p>
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render chart utama (berubah berdasarkan rentang tanggal)
  const renderMainChart = () => {
    const useDailyData = dateRange?.from && 
                         dateRange?.to && 
                         (dateRange.to.getTime() - dateRange.from.getTime()) < 31 * 24 * 60 * 60 * 1000;
    
    const data = useDailyData ? dailyData : transactionData;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {useDailyData ? 'Grafik Harian (30 Hari Terakhir)' : 'Grafik Pemasukan & Pengeluaran'}
          </CardTitle>
        </CardHeader>
        <CardContent className={premiumContentClass}>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis 
                  dataKey={useDailyData ? "date" : "month"} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  tickFormatter={formatYAxis} 
                  axisLine={false} 
                  tickLine={false}
                  width={isMobile ? 60 : 80}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={40}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  fill={`${BALANCE_COLOR}20`}
                  stroke={BALANCE_COLOR}
                  strokeWidth={2}
                  fillOpacity={0.4}
                  name="Saldo"
                />
                <Bar
                  dataKey="Pemasukan"
                  fill={INCOME_COLOR}
                  name="Pemasukan"
                  barSize={isMobile ? 12 : 20}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Pengeluaran"
                  fill={EXPENSE_COLOR}
                  name="Pengeluaran"
                  barSize={isMobile ? 12 : 20}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render pie chart untuk kategori
  const renderCategoryCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Kategori Pemasukan</CardTitle>
        </CardHeader>
        <CardContent className={premiumContentClass}>
          {categoryData.incomeData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center">
              <div className="h-64 w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={categoryData.incomeData}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 80 : 100}
                      innerRadius={isMobile ? 40 : 60}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {categoryData.incomeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 mt-4 md:mt-0">
                <div className="space-y-3">
                  {categoryData.incomeData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Tidak ada data pemasukan
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Kategori Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent className={premiumContentClass}>
          {categoryData.expenseData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center">
              <div className="h-64 w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={categoryData.expenseData}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 80 : 100}
                      innerRadius={isMobile ? 40 : 60}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {categoryData.expenseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 mt-4 md:mt-0">
                <div className="space-y-3">
                  {categoryData.expenseData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Tidak ada data pengeluaran
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render tabel transaksi
  const renderTransactionTable = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle>Daftar Transaksi</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Transaksi
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[120px]">Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.date ? format(transaction.date, 'dd MMM yyyy', { locale: id }) : '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description || 'Tanpa deskripsi'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.category || 'Lainnya'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(transaction.amount || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2 z-10 relative"
                        onClick={() => handleEditClick(transaction)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteFinancialTransaction(transaction.id)}
                      >
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada transaksi</h3>
            <p className="text-gray-500 mb-4">Tambahkan transaksi baru untuk mulai melacak keuangan Anda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Tambah Transaksi Pertama
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis pemasukan, pengeluaran, dan saldo bisnis Anda</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant="outline" className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
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
              <div className="flex flex-col p-2 space-y-1 border-b">
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}>Hari ini</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) })}>30 Hari Terakhir</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Bulan ini</Button>
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })}>Bulan Kemarin</Button>
              </div>
              <Calendar 
                initialFocus 
                mode="range" 
                defaultMonth={dateRange?.from} 
                selected={dateRange} 
                onSelect={setDateRange} 
                numberOfMonths={isMobile ? 1 : 2}
              />
            </PopoverContent>
          </Popover>
          <FinancialCategoryManager />
        </div>
      </div>

      {renderSummaryCards()}

      {!isPaid && (
        <div className="flex justify-center my-4">
          <PaymentStatusIndicator size="lg" />
        </div>
      )}

      {renderMainChart()}
      {renderCategoryCharts()}
      {renderTransactionTable()}

      <FinancialTransactionDialog
  isOpen={isDialogOpen}
  onClose={closeDialog}
  onAddTransaction={addFinancialTransaction}
  onUpdateTransaction={updateFinancialTransaction} // Tambahkan prop untuk update
  categories={settings.financialCategories}
  transaction={editingTransaction} // Kirim transaksi yang sedang diedit
/>
    </div>
  );
};

export default FinancialReportPage;