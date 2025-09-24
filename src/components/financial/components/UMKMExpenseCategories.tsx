// src/components/financial/components/UMKMExpenseCategories.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Zap, Users, Truck, Megaphone, Home, Calculator, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==============================================
// TYPES
// ==============================================

interface Transaction {
  id: string;
  date: Date | string | null;
  amount: number;
  type: 'income' | 'expense';
  description?: string | null;
  category?: string | null;
}

interface UMKMExpenseCategoriesProps {
  transactions: Transaction[];
  className?: string;
}

interface CategoryData {
  name: string;
  friendlyName: string;
  icon: React.ReactNode;
  amount: number;
  percentage: number;
  color: string;
  tips: string;
}

// ==============================================
// KATEGORI UMKM DENGAN BAHASA SEHARI-HARI
// ==============================================

const UMKM_CATEGORIES = {
  'Pembelian Bahan Baku': {
    friendlyName: 'Beli Bahan',
    icon: <ShoppingCart className="h-4 w-4" />,
    color: 'bg-gray-600',
    tips: 'Coba beli dalam jumlah besar untuk dapat harga lebih murah'
  },
  'Utilitas': {
    friendlyName: 'Bayar Listrik & Air',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-gray-500',
    tips: 'Matikan peralatan yang tidak dipakai untuk hemat listrik'
  },
  'Gaji Karyawan': {
    friendlyName: 'Gaji Karyawan',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-gray-700',
    tips: 'Karyawan yang senang akan bekerja lebih produktif'
  },
  'Transportasi': {
    friendlyName: 'Ongkos Kirim & Transport',
    icon: <Truck className="h-4 w-4" />,
    color: 'bg-gray-600',
    tips: 'Cari ekspedisi dengan harga terbaik untuk hemat ongkir'
  },
  'Marketing': {
    friendlyName: 'Promosi & Iklan',
    icon: <Megaphone className="h-4 w-4" />,
    color: 'bg-gray-500',
    tips: 'Manfaatkan media sosial gratis untuk promosi lebih hemat'
  },
  'Sewa Tempat': {
    friendlyName: 'Sewa Tempat',
    icon: <Home className="h-4 w-4" />,
    color: 'bg-gray-700',
    tips: 'Pertimbangkan lokasi strategis vs budget yang tersedia'
  },
  'Lainnya': {
    friendlyName: 'Pengeluaran Lain',
    icon: <MoreHorizontal className="h-4 w-4" />,
    color: 'bg-gray-500',
    tips: 'Catat detail pengeluaran lain agar lebih mudah dikontrol'
  }
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const UMKMExpenseCategories: React.FC<UMKMExpenseCategoriesProps> = ({ 
  transactions, 
  className 
}) => {
  const { formatCurrency } = useCurrency();
  // Analisis kategori pengeluaran bulan ini
  const categoryAnalysis = useMemo((): CategoryData[] => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // ✅ DEBUG: Log all data
    console.log('🔍 [UMKM DEBUG] Current month:', currentMonth);
    console.log('🔍 [UMKM DEBUG] All transactions count:', transactions.length);
    console.log('🔍 [UMKM DEBUG] All transactions:', transactions);
    
    const monthExpenses = transactions.filter(t => {
      if (!t.date || t.type !== 'expense') {
        if (!t.date) console.log('⚠️ [UMKM DEBUG] Transaction without date:', t);
        if (t.type !== 'expense') console.log('⚠️ [UMKM DEBUG] Non-expense transaction:', t);
        return false;
      }
      const dateStr = t.date instanceof Date ? t.date.toISOString() : String(t.date);
      const matches = dateStr.startsWith(currentMonth);
      if (!matches) console.log('⚠️ [UMKM DEBUG] Date not matching current month:', { date: dateStr, currentMonth, transaction: t });
      return matches;
    });
    
    console.log('🔍 [UMKM DEBUG] Month expenses count:', monthExpenses.length);
    console.log('🔍 [UMKM DEBUG] Month expenses:', monthExpenses);

    const totalExpense = monthExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Group by category
    const categoryTotals = monthExpenses.reduce((acc, t) => {
      const category = t.category || 'Lainnya';
      console.log('🔍 [UMKM DEBUG] Processing transaction:', { category, amount: t.amount, transaction: t });
      acc[category] = (acc[category] || 0) + (t.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🔍 [UMKM DEBUG] Category totals:', categoryTotals);
    console.log('🔍 [UMKM DEBUG] Pembelian Bahan Baku total:', categoryTotals['Pembelian Bahan Baku'] || 'NOT FOUND');

    // Convert to CategoryData array
    const categories = Object.entries(categoryTotals).map(([category, amount]) => {
      const categoryInfo = UMKM_CATEGORIES[category as keyof typeof UMKM_CATEGORIES] || UMKM_CATEGORIES['Lainnya'];
      return {
        name: category,
        friendlyName: categoryInfo.friendlyName,
        icon: categoryInfo.icon,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: categoryInfo.color,
        tips: categoryInfo.tips
      };
    });

    // Sort by amount (descending)
    return categories.sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalExpense = categoryAnalysis.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-orange-600" />
          Pengeluaran Bulan Ini
        </CardTitle>
        <p className="text-sm text-orange-600">
          Lihat kemana aja uang keluar bulan ini dan tips hemat
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Pengeluaran */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs text-orange-600 font-medium">Total Pengeluaran Bulan Ini</p>
              <p className="text-lg font-bold text-orange-800">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="text-orange-500 self-start sm:self-auto">
              <Calculator className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Kategori Pengeluaran */}
        <div className="space-y-2">
          <h4 className="font-medium text-orange-800 text-sm">Rincian Pengeluaran:</h4>
          
          {categoryAnalysis.length === 0 ? (
            <div className="text-center py-6 text-orange-500">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada pengeluaran bulan ini</p>
              <p className="text-xs">Mulai catat pengeluaran untuk analisis yang lebih baik</p>
            </div>
          ) : (
            categoryAnalysis.slice(0, 5).map((category, index) => (
              <div key={category.name} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded text-white", category.color)}>
                      {category.icon}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm">{category.friendlyName}</h5>
                      <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 text-sm">{formatCurrency(category.amount)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-orange-200 rounded-full h-1.5">
                    <div 
                      className={cn("h-1.5 rounded-full", category.color)}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tips - Compact */}
                <div className="bg-orange-50 border border-orange-100 rounded p-2">
                  <p className="text-xs text-orange-600">
                    <span className="font-medium">💡 </span>
                    {category.tips}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Show more indicator if there are more categories */}
          {categoryAnalysis.length > 5 && (
            <div className="text-center py-2">
              <p className="text-xs text-orange-500">+{categoryAnalysis.length - 5} kategori lainnya</p>
            </div>
          )}
        </div>

        {/* Tips Umum - Compact */}
        {categoryAnalysis.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <h5 className="font-medium text-orange-800 mb-2 text-sm">🎯 Tips Mengatur Pengeluaran:</h5>
            <ul className="text-xs text-orange-600 space-y-0.5">
              <li>• Catat semua pengeluaran, sekecil apapun</li>
              <li>• Bandingkan harga supplier sebelum beli bahan</li>
              <li>• Sisihkan 10-20% keuntungan untuk dana darurat</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UMKMExpenseCategories;