import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DollarSign, ShoppingCart, Calculator, TrendingUp,
  Filter, Search, HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { 
  formatCurrency, 
  formatPercentage, 
  transformToRevenueBreakdown,
  transformToOpExBreakdown 
} from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { getEffectiveCogs } from '@/utils/cogsCalculation';
import { safeCalculateMargins } from '@/utils/profitValidation';

// ==============================================
// TYPES
// ==============================================

export interface DetailedBreakdownTableProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  isLoading: boolean;
  className?: string;
  /** ⬇️ COGS efektif (WAC) */
  effectiveCogs?: number;
  /** ⬇️ rincian HPP dari WAC calcHPP (opsional) */
  hppBreakdown?: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }>;
  /** ⬇️ label/tooltip WAC */
  labels?: { hppLabel: string; hppHint: string };
}

interface BreakdownSection {
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  total: number;
  items: BreakdownItem[];
  helpText?: string; // Add helpText for tooltips
}

interface BreakdownItem {
  name: string;
  amount: number;
  percentage: number;
  count?: number;
  type?: string;
}

// ==============================================
// MEMOIZED SUB-COMPONENTS
// ==============================================

const MemoizedSectionHeader = React.memo(({ section, sortedItemsLength }: { section: BreakdownSection; sortedItemsLength: number }) => {
  const Icon = section.icon;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${section.bgColor}`}>
          <Icon className={`w-5 h-5 ${section.color}`} />
        </div>
        <div>
          <h4 className={`font-semibold ${section.color} flex items-center gap-2`}>
            {section.title}
            {section.helpText && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info section"
                    >
                      <HelpCircle className="w-4 h-4 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{section.helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </h4>
          <p className="text-sm text-gray-600">
            Total: {formatCurrency(section.total)}
          </p>
        </div>
      </div>
      
      <Badge variant="secondary">
        {sortedItemsLength} item
      </Badge>
    </div>
  );
});

const MemoizedTableRow = React.memo(({ item, itemIndex }: { item: BreakdownItem; itemIndex: number }) => {
  return (
    <TableRow key={itemIndex} className="hover:bg-white hover:bg-opacity-50 transition-colors">
      <TableCell className="font-medium text-xs sm:text-sm">
        <div className="truncate max-w-[100px] sm:max-w-none" title={item.name}>
          {item.name}
        </div>
        {/* Show percentage on mobile (when hidden column) */}
        <div className="sm:hidden text-xs text-gray-500 mt-1">
          {formatPercentage(item.percentage)}
        </div>
      </TableCell>
      
      <TableCell className="text-right font-semibold text-xs sm:text-sm">
        <div className="truncate">
          {formatCurrency(item.amount)}
        </div>
      </TableCell>
      
      <TableCell className="text-right hidden sm:table-cell">
        <div className="flex items-center justify-end space-x-2">
          <span className="font-medium text-xs sm:text-sm">
            {formatPercentage(item.percentage)}
          </span>
          
          <div className="w-12 sm:w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300 bg-orange-500 opacity-60"
              style={{ 
                width: `${Math.min(item.percentage, 100)}%`
              }}
            />
          </div>
        </div>
      </TableCell>
      
      <TableCell className="text-center hidden md:table-cell">
        <Badge variant="outline" className="text-xs">
          {item.type ? (
            item.type === 'tetap' ? 'Tetap' : 
            item.type === 'variabel' ? 'Variabel' : 
            item.type === 'Bahan Langsung' ? 'Bahan' :
            item.type === 'Tenaga Kerja Langsung' ? 'Tenaga' :
            item.type
          ) : (
            item.count ? `${item.count}x` : 'N/A'
          )}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

const MemoizedSectionSummary = React.memo(({ section, sortedItems }: { section: BreakdownSection; sortedItems: BreakdownItem[] }) => {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total Item:</span>
          <span className="ml-2 font-semibold">{sortedItems.length}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Total Jumlah:</span>
          <span className="ml-2 font-semibold">{formatCurrency(section.total)}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Rata-rata per Item:</span>
          <span className="ml-2 font-semibold">
            {formatCurrency(sortedItems.length > 0 ? section.total / sortedItems.length : 0)}
          </span>
        </div>
        
        <div>
          <span className="text-gray-600">Item Terbesar:</span>
          <span className="ml-2 font-semibold">
            {sortedItems.length > 0 
              ? formatPercentage(Math.max(...sortedItems.map(i => i.percentage)))
              : '0%'
            }
          </span>
        </div>
      </div>
    </div>
  );
});

// ==============================================
// KOMPONEN TABEL BREAKDOWN DETAIL
// ==============================================

const DetailedBreakdownTable = ({
  currentAnalysis,
  isLoading,
  className = '',
  effectiveCogs,
  hppBreakdown,
  labels
}: DetailedBreakdownTableProps) => {
  
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('amount');
  const [sortOrder, setSortOrder] = useState('desc');

  // ✅ IMPROVED: Use centralized COGS calculation and validation
  const revenue = currentAnalysis?.revenue_data?.total ?? 0;
  
  const cogsResult = getEffectiveCogs(
    currentAnalysis || {} as RealTimeProfitCalculation,
    effectiveCogs,
    revenue,
    { preferWAC: true, validateRange: true }
  );
  
  const opex = currentAnalysis?.opex_data?.total ?? 0;
  
  // ✅ IMPROVED: Use safe margin calculation with validation
  const validationResult = safeCalculateMargins(revenue, cogsResult.value, opex);
  
  // Log warnings in development
  if (import.meta.env.DEV && cogsResult.warnings.length > 0) {
    cogsResult.warnings.forEach(warning => {
      console.warn('[DetailedBreakdown] COGS warning:', warning);
    });
  }
  
  if (import.meta.env.DEV && !validationResult.isValid) {
    console.warn('[DetailedTable] Data validation issues:', {
      errors: validationResult.errors,
      qualityScore: validationResult.qualityScore
    });
  }
  
  // Use validated values directly (safeCalculateMargins doesn't return nested corrections/metrics structure)
  const finalRevenue = revenue;
  const finalCogs = cogsResult.value;
  const finalOpex = opex;
  const revenueTransactions = currentAnalysis?.revenue_data?.transactions ?? [];
  const opexCosts = currentAnalysis?.opex_data?.costs ?? [];

  // ✅ Process revenue items
  const revenueItems = useMemo(() => {
    return revenueTransactions.map(t => ({
      name: t.category || 'Kategori Tidak Diketahui',
      amount: t.amount || 0,
      percentage: finalRevenue > 0 ? ((t.amount || 0) / finalRevenue) * 100 : 0,
      count: 1
    }));
  }, [revenueTransactions, finalRevenue]);

  // ✅ Group revenue by category
  const groupedRevenue: BreakdownItem[] = useMemo(() => {
    return revenueItems.reduce((acc: BreakdownItem[], item) => {
      const existing = acc.find((a) => a.name === item.name);
      if (existing) {
        return acc.map((a) => 
          a.name === item.name 
            ? { 
                ...a, 
                amount: a.amount + item.amount,
                count: (a.count || 0) + 1,
                percentage: finalRevenue > 0 ? ((a.amount + item.amount) / finalRevenue) * 100 : 0
              }
            : a
        );
      } else {
        return [...acc, { ...item }];
      }
    }, []);
  }, [revenueItems, finalRevenue]);

  // ✅ UPDATE: Process COGS items - pakai hppBreakdown kalau ada
  const cogsItems = useMemo(() => {
    if (hppBreakdown && hppBreakdown.length > 0 && finalCogs > 0) {
      // mapping WAC breakdown → rows
      const items = hppBreakdown
        .map(b => ({
          name: b.nama || 'Komponen HPP',
          amount: b.hpp || 0,                  // nilai HPP per komponen
          percentage: finalCogs > 0 ? ((b.hpp || 0) / finalCogs) * 100 : 0,
          type: 'Bahan Langsung'
        }))
        .filter(i => i.amount > 0);

      // kalau misal total rounding berbeda, tetap jalan
      return items;
    }

    // fallback F&B friendly
    return [
      { name: '🍲 Bahan Makanan Utama', amount: finalCogs * 0.6, percentage: finalCogs > 0 ? 60 : 0, type: '🍲 Bahan Pokok' },
      { name: '🧂 Bumbu & Pelengkap', amount: finalCogs * 0.2, percentage: finalCogs > 0 ? 20 : 0, type: '🌶️ Bumbu Dapur' },
      { name: '🥤 Minuman & Es', amount: finalCogs * 0.15, percentage: finalCogs > 0 ? 15 : 0, type: '🥤 Minuman' },
      { name: '🎁 Kemasan & Perlengkapan', amount: finalCogs * 0.05, percentage: finalCogs > 0 ? 5 : 0, type: '🎁 Kemasan' }
    ].filter(item => item.amount > 0);
  }, [hppBreakdown, finalCogs]);

  // ✅ Process OPEX items
  const opexItems = useMemo(() => {
    return opexCosts.map(cost => ({
      name: cost.nama_biaya || cost.name || 'Biaya Tidak Diketahui',
      amount: cost.jumlah_per_bulan || cost.amount || 0,
      percentage: finalOpex > 0 ? ((cost.jumlah_per_bulan || cost.amount || 0) / finalOpex) * 100 : 0,
      type: cost.jenis || cost.type || 'Tidak Diketahui'
    }));
  }, [opexCosts, finalOpex]);

  // ✅ Breakdown sections
  const breakdownSections = useMemo(() => {
    return [
      {
        title: '💰 Sumber Pemasukan (Dari Mana Uang Masuk)',
        icon: DollarSign,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        total: finalRevenue,
        items: groupedRevenue,
        helpText: 'Semua uang yang masuk ke warung dari penjualan makanan, minuman, dan layanan lainnya'
      },
      {
        title: '🛒 Modal Bahan Baku (Belanja Dapur)',
        icon: ShoppingCart,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        total: finalCogs,
        items: cogsItems,
        helpText: 'Uang yang keluar untuk beli bahan-bahan makanan dan minuman'
      },
      {
        title: '🏪 Biaya Bulanan Tetap (Operasional)',
        icon: Calculator,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        total: finalOpex,
        items: opexItems,
        helpText: 'Biaya yang harus dibayar setiap bulan: sewa, listrik, gaji, internet, dll'
      }
    ];
  }, [groupedRevenue, cogsItems, opexItems, finalRevenue, finalCogs, finalOpex]);

  // ✅ OPTIMASI: Memoize filtered sections
  const filteredSections = useMemo(() => {
    if (activeTab === 'all') return breakdownSections;
    
    const sectionMap: Record<string, number> = {
      revenue: 0,
      cogs: 1,
      opex: 2
    };
    
    const sectionIndex = sectionMap[activeTab];
    return breakdownSections[sectionIndex] ? [breakdownSections[sectionIndex]] : [];
  }, [breakdownSections, activeTab]);

  // ✅ OPTIMASI: Memoize sorting function
  const getSortedItems = useCallback((items: BreakdownItem[]) => {
    return [...items].sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        default:
          aValue = a.amount;
          bValue = b.amount;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
    });
  }, [sortBy, sortOrder]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>📋 Rincian Lengkap Keuangan Warung</CardTitle>
          <CardDescription>
            Dari mana uang masuk dan kemana uang keluar - dalam bahasa yang mudah dipahami
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ NO DATA STATE
  if (!currentAnalysis || breakdownSections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>📋 Rincian Lengkap Keuangan Warung</CardTitle>
          <CardDescription>
            Dari mana uang masuk dan kemana uang keluar - dalam bahasa yang mudah dipahami
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📋 Belum Ada Rincian Data</div>
            <div className="text-gray-500 text-sm">
              Pilih periode yang sudah ada transaksi untuk melihat rincian keuangan warung
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-2">
            📋 Rincian Lengkap Keuangan Warung
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button"
                    className="p-1 -m-1 touch-manipulation"
                    aria-label="Info rincian keuangan"
                  >
                    <HelpCircle className="w-4 h-4 text-orange-500 hover:text-orange-700 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>Tabel detail semua transaksi masuk dan keluar. Gunakan tab untuk melihat kategori tertentu, dan klik kolom untuk mengurutkan data.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Dari mana uang masuk dan kemana uang keluar untuk periode {currentAnalysis.period} - dalam bahasa yang mudah dipahami
          </CardDescription>
            
            {/* ⬇️ Tambah indikator WAC di header HPP */}
            {labels?.hppLabel && (
              <div className="mt-1 text-xs text-gray-500">
                <span
                  className="underline decoration-dotted cursor-help"
                  title={labels.hppHint}
                >
                  {labels.hppLabel} aktif
                </span>
              </div>
            )}
          </div>
          
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mt-4">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'revenue', label: 'Pemasukan' },
          { key: 'cogs', label: 'Belanja' },
          { key: 'opex', label: 'Biaya' }
        ].map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTabChange(tab.key)}
              className={`text-xs px-2 py-1 ${
                activeTab === tab.key 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
          <span className="text-xs sm:text-sm text-gray-600 py-1">Urutkan:</span>
          {[
            { key: 'amount', label: 'Jumlah' },
            { key: 'percentage', label: '%' },
            { key: 'name', label: 'Nama' }
          ].map(sort => (
            <Button
              key={sort.key}
              variant={sortBy === sort.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange(sort.key)}
              className={`text-xs px-2 py-1 ${
                sortBy === sort.key 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'text-black hover:bg-black hover:text-white'
              }`}
            >
              {sort.label}
              {sortBy === sort.key && (
                <span className="ml-1">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {filteredSections.map((section, sectionIndex) => {
            const sortedItems = getSortedItems(section.items);
            
            return (
              <div key={sectionIndex}>
                {/* Section Header */}
                <MemoizedSectionHeader 
                  section={section} 
                  sortedItemsLength={sortedItems.length} 
                />

                {/* Items Table */}
                <div className={`rounded-lg border ${section.bgColor} border-opacity-20 overflow-x-auto`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-xs sm:text-sm min-w-[120px]">Item</TableHead>
                        <TableHead className="font-semibold text-right text-xs sm:text-sm min-w-[80px]">Jumlah</TableHead>
                        <TableHead className="font-semibold text-right text-xs sm:text-sm min-w-[60px] hidden sm:table-cell">%</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm min-w-[60px] hidden md:table-cell">Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
                            Tidak ada item ditemukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedItems.map((item, itemIndex) => (
                          <MemoizedTableRow
                            key={`${item.name}-${itemIndex}`}
                            item={item}
                            itemIndex={itemIndex}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Section Summary */}
                <MemoizedSectionSummary 
                  section={section} 
                  sortedItems={sortedItems} 
                />
              </div>
            );
          })}
        </div>

        {/* Overall Summary with Tooltips */}
        {activeTab === 'all' && breakdownSections.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              Ringkasan Keseluruhan
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info ringkasan keseluruhan"
                    >
                      <HelpCircle className="w-4 h-4 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Ringkasan total semua pemasukan dan pengeluaran untuk menghitung keuntungan bersih warung.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue Summary */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="text-sm text-green-600">Total Omset</div>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className="p-1 -m-1 touch-manipulation"
                          aria-label="Info total omset"
                        >
                          <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Semua uang yang masuk dari penjualan makanan, minuman, dan layanan lainnya.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {formatCurrency(breakdownSections[0]?.total || 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Dari {Array.isArray(breakdownSections[0]?.items) ? breakdownSections[0].items.length : 0} sumber pemasukan
                </div>
              </div>

              {/* Cost Summary */}
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="text-sm text-red-600">Total Pengeluaran</div>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className="p-1 -m-1 touch-manipulation"
                          aria-label="Info total pengeluaran"
                        >
                          <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Gabungan modal bahan baku dan semua biaya tetap bulanan seperti sewa, listrik, gaji.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-red-700 mb-1">
                  {formatCurrency(
                    (breakdownSections[1]?.total || 0) + (breakdownSections[2]?.total || 0)
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Modal Bahan + Biaya Bulanan
                </div>
              </div>

              {/* Profit Summary */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="text-sm text-blue-600">Untung Bersih</div>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className="p-1 -m-1 touch-manipulation"
                          aria-label="Info untung bersih"
                        >
                          <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Keuntungan yang benar-benar bisa dibawa pulang setelah dikurangi semua pengeluaran.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {formatCurrency(
                    (breakdownSections[0]?.total || 0) - 
                    (breakdownSections[1]?.total || 0) - 
                    (breakdownSections[2]?.total || 0)
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {formatPercentage(
                    breakdownSections[0]?.total > 0
                      ? ((breakdownSections[0].total - (breakdownSections[1]?.total || 0) - (breakdownSections[2]?.total || 0)) / breakdownSections[0].total) * 100
                      : 0
                  )} margin
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetailedBreakdownTable;