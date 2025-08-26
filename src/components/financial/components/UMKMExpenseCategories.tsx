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
    icon: <ShoppingCart className="h-5 w-5" />,
    color: 'bg-blue-500',
    tips: 'Coba beli dalam jumlah besar untuk dapat harga lebih murah'
  },
  'Utilitas': {
    friendlyName: 'Bayar Listrik & Air',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-yellow-500',
    tips: 'Matikan peralatan yang tidak dipakai untuk hemat listrik'
  },
  'Gaji Karyawan': {
    friendlyName: 'Gaji Karyawan',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-green-500',
    tips: 'Karyawan yang senang akan bekerja lebih produktif'
  },
  'Transportasi': {
    friendlyName: 'Ongkos Kirim & Transport',
    icon: <Truck className="h-5 w-5" />,
    color: 'bg-purple-500',
    tips: 'Cari ekspedisi dengan harga terbaik untuk hemat ongkir'
  },
  'Marketing': {
    friendlyName: 'Promosi & Iklan',
    icon: <Megaphone className="h-5 w-5" />,
    color: 'bg-pink-500',
    tips: 'Manfaatkan media sosial gratis untuk promosi lebih hemat'
  },
  'Sewa Tempat': {
    friendlyName: 'Sewa Tempat',
    icon: <Home className="h-5 w-5" />,
    color: 'bg-indigo-500',
    tips: 'Pertimbangkan lokasi strategis vs budget yang tersedia'
  },
  'Lainnya': {
    friendlyName: 'Pengeluaran Lain',
    icon: <MoreHorizontal className="h-5 w-5" />,
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
  // Analisis kategori pengeluaran bulan ini
  const categoryAnalysis = useMemo((): CategoryData[] => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthExpenses = transactions.filter(t => {
      if (!t.date || t.type !== 'expense') return false;
      const dateStr = t.date instanceof Date ? t.date.toISOString() : String(t.date);
      return dateStr.startsWith(currentMonth);
    });

    const totalExpense = monthExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Group by category
    const categoryTotals = monthExpenses.reduce((acc, t) => {
      const category = t.category || 'Lainnya';
      acc[category] = (acc[category] || 0) + (t.amount || 0);
      return acc;
    }, {} as Record<string, number>);

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
          <Calculator className="h-5 w-5 text-blue-600" />
          Pengeluaran Bulan Ini
        </CardTitle>
        <p className="text-sm text-gray-600">
          Lihat kemana aja uang keluar bulan ini dan tips hemat
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Pengeluaran */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="text-red-500">
              <Calculator className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Kategori Pengeluaran */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Rincian Pengeluaran:</h4>
          
          {categoryAnalysis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada pengeluaran bulan ini</p>
              <p className="text-sm">Mulai catat pengeluaran untuk analisis yang lebih baik</p>
            </div>
          ) : (
            categoryAnalysis.map((category, index) => (
              <div key={category.name} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg text-white", category.color)}>
                      {category.icon}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">{category.friendlyName}</h5>
                      <p className="text-sm text-gray-500">{category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatCurrency(category.amount)}</p>
                    <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full", category.color)}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">💡 Tips Hemat: </span>
                    {category.tips}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tips Umum */}
        {categoryAnalysis.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-800 mb-2">🎯 Tips Mengatur Pengeluaran UMKM:</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Catat semua pengeluaran, sekecil apapun</li>
              <li>• Bandingkan harga supplier sebelum beli bahan</li>
              <li>• Sisihkan 10-20% dari keuntungan untuk dana darurat</li>
              <li>• Review pengeluaran setiap bulan untuk cari yang bisa dihemat</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UMKMExpenseCategories;