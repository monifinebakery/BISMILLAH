import React, { useState, useMemo } from 'react';
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

const Dashboard = () => {
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
          month: format(value.date, 'MMM yyyy', { locale: id }), 
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
  
  const COLORS = ['#28a745', '#dc3545', '#007bff', '#ffc107', '#6f42c1', '#17a2b8']; 

  const formatYAxis = (tickItem: number) => formatLargeNumber(tickItem);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pemasukan = payload.find((p: any) => p.dataKey === 'Pemasukan');
      const pengeluaran = payload.find((p: any) => p.dataKey === 'Pengeluaran');
      return (
        <div className="p-3 bg-white border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {pemasukan && <p style={{ color: pemasukan.color }}>{`Pemasukan : ${formatCurrency(pemasukan.value)}`}</p>}
          {pengeluaran && <p style={{ color: pengeluaran.color }}>{`Pengeluaran : ${formatCurrency(pengeluaran.value)}`}</p>}
          <p className="mt-1 text-gray-600">{`Saldo : ${formatCurrency((pemasukan?.value || 0) - (pengeluaran?.value || 0))}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen"> 
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{getGreeting()}</p>
        </div>
        <div className="text-xs text-gray-400">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

      {/* Kategori 1: Ringkasan Finansial Tingkat Tinggi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Harian */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Omzet Hari Ini</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(todayFinancials.omzetHarian)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-green-500" />
          </CardContent>
        </Card>

        {/* Laba Bersih Harian */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Laba Bersih Hari Ini</p>
              <p className="text-xl font-bold">{formatCurrency(todayFinancials.labaBersihHarian)}</p>
            </div>
            <BarChart3 className="h-6 w-6 text-purple-500" />
          </CardContent>
        </Card>

        {/* Arus Kas Harian (Proxy) */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Arus Kas Hari Ini</p>
              <p className="text-xl font-bold">{formatCurrency(todayFinancials.arusKasHarian)}</p>
            </div>
            <Clock className="h-6 w-6 text-blue-500" />
          </CardContent>
        </Card>
        
        {/* Piutang Jatuh Tempo */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Piutang Jatuh Tempo</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(todayFinancials.piutangJatuhTempo)}</p>
            </div>
            <Truck className="h-6 w-6 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Kategori 2 & 3: Performa Operasional & Aktivitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk Terlaris */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Trophy className="h-5 w-5 text-gray-600" />
              <span>Produk Terlaris</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {currentProducts.length > 0 ? (
                currentProducts.map((product, index) => (
                  <div 
                    key={product.name} 
                    className="p-4 flex items-center hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {productsStartIndex + index + 1}
                      </span>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.quantity} terjual
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Belum ada data penjualan</p>
                </div>
              )}
            </div>
          </CardContent>
          
          {/* Pagination Produk */}
          {bestSellingProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button 
                className={`p-1 rounded ${productsPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage === 1}
                onClick={() => setProductsPage(productsPage - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {productsPage} dari {totalProductsPages}
              </span>
              <Button 
                className={`p-1 rounded ${productsPage >= totalProductsPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={productsPage >= totalProductsPages}
                onClick={() => setProductsPage(productsPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Card>

        {/* Aktivitas Terbaru */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Activity className="h-5 w-5 text-gray-600" />
              <span>Aktivitas Terbaru</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {activitiesLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Memuat aktivitas...</p>
                </div>
              ) : currentActivities.length > 0 ? (
                currentActivities.map((activity) => {
                  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                  const amount = isFinancial ? parseFloat(activity.value || '0') : 0;
                  
                  return (
                    <div 
                      key={activity.id} 
                      className="p-4 flex items-center hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                        <p className="text-sm text-gray-500 mt-1 truncate">{activity.description}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        {isFinancial && amount > 0 && (
                          <p className={`text-sm font-medium ${
                              activity.type === 'keuangan' && 
                              activity.title.toLowerCase().includes('pemasukan') 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(amount)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </CardContent>
          
          {/* Pagination */}
          {activities.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button 
                className={`p-1 rounded ${activitiesPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={activitiesPage === 1}
                onClick={() => setActivitiesPage(activitiesPage - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {activitiesPage} dari {totalActivitiesPages}
              </span>
              <button 
                className={`p-1 rounded ${activitiesPage >= totalActivitiesPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                disabled={activitiesPage >= totalActivitiesPages}
                onClick={() => setActivitiesPage(activitiesPage + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
