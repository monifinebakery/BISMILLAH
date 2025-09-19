// components/dashboard/RecentActivities.tsx
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity as ActivityIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { CurrencyDisplay } from '@/lib/shared';
import { generateListKey } from '@/utils/keyUtils';
import { formatDateTime } from '@/utils/unifiedDateUtils';
import type { Activity } from '@/types/activity';
import { useSupplier } from '@/contexts/SupplierContext';

interface Props {
  activities: Activity[];
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  itemsPerPage?: number;
}

// 🔧 FIXED: Simple pagination calculation
const calculatePagination = (currentPage: number, totalItems: number, itemsPerPage: number) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    totalItems
  };
};

// 📝 Activity Row Component
const ActivityRow: React.FC<{
  activity: Activity;
  isLoading?: boolean;
}> = ({ activity, isLoading = false }) => {
  const { suppliers } = useSupplier();
  
  // Fungsi untuk mengubah ID supplier menjadi nama
  const getDisplayDescription = (description: string | null | undefined): string => {
    if (!description) return '-';
    
    // Pattern untuk mendeteksi UUID supplier (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
    
    // Pattern untuk mendeteksi ID supplier pendek (format: cb8d8ef-a1be-4202-b527-f1f5939e6)
    const shortIdPattern = /[a-f0-9]{7,8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{9,12}/gi;
    
    // Pattern untuk "Supplier [ID]"
    const supplierIdPattern = /Supplier\s+([a-f0-9-]+)/gi;
    
    let result = description;
    
    // Ganti semua UUID yang ditemukan
    result = result.replace(uuidPattern, (match) => {
      const supplier = suppliers.find(s => s.id === match);
      return supplier ? supplier.nama : 'Supplier Tidak Dikenal';
    });
    
    // Ganti semua short ID yang ditemukan
    result = result.replace(shortIdPattern, (match) => {
      const supplier = suppliers.find(s => s.id === match);
      return supplier ? supplier.nama : 'Supplier Tidak Dikenal';
    });
    
    // Ganti pattern "Supplier [ID]"
    result = result.replace(supplierIdPattern, (match, supplierId) => {
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier ? supplier.nama : 'Supplier Tidak Dikenal';
    });
    
    return result;
  };

  if (isLoading) {
    return null;
  }

  // 💰 Determine if this is a financial activity
  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
  const amount = activity.value 
    ? (typeof activity.value === 'string' ? parseFloat(activity.value) || 0 : Number(activity.value) || 0)
    : 0;

  // 🎨 Determine colors based on activity type
  const isIncome = activity.title?.toLowerCase().includes('pemasukan') || 
                   activity.title?.toLowerCase().includes('income') ||
                   activity.title?.toLowerCase().includes('penjualan');
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      {/* 📋 Activity Details */}
      <TableCell>
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate" title={activity.title}>
            {activity.title || 'Aktivitas tidak diketahui'}
          </p>
          {activity.description && (
            <p className="text-sm text-gray-500 truncate mt-1" title={activity.description}>
              {getDisplayDescription(activity.description)}
            </p>
          )}
        </div>
      </TableCell>
      
      {/* ⏰ Timestamp */}
      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
        {formatDateTime(activity.timestamp)}
      </TableCell>
      
      {/* 💰 Amount */}
      <TableCell className="text-right">
        {isFinancial && amount !== 0 && (
          <CurrencyDisplay
            amount={amount}
            size="sm"
            className={`font-medium ${amountColor}`}
          />
        )}
      </TableCell>
    </TableRow>
  );
};

// 🔄 Pagination Controls (reusable) - RESPONSIVE FIXED
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (direction: 'prev' | 'next') => void;
  hasNext: boolean;
  hasPrev: boolean;
  totalItems: number;
  itemsPerPage: number;
}> = ({ currentPage, totalPages, onPageChange, hasNext, hasPrev, totalItems, itemsPerPage }) => {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 space-y-3">
      {/* Mobile/iPad Layout: Stack vertically for better readability */}
      <div className="flex flex-col space-y-2 sm:hidden">
        {/* Page Info */}
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm text-gray-600 font-medium">
            Halaman {currentPage} dari {totalPages}
          </span>
          <span className="text-xs text-gray-500 text-center">
            {startItem}-{endItem} dari {totalItems} aktivitas
          </span>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange('prev')} 
            disabled={!hasPrev} 
            className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Sebelumnya</span>
            <span className="xs:hidden">Prev</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange('next')} 
            disabled={!hasNext} 
            className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ml-2"
          >
            <span className="hidden xs:inline">Selanjutnya</span>
            <span className="xs:hidden">Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Desktop/iPad Landscape Layout: Horizontal with proper spacing */}
      <div className="hidden sm:flex sm:justify-between sm:items-center sm:w-full">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange('prev')} 
          disabled={!hasPrev} 
          className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-fit"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Sebelumnya</span>
          <span className="md:hidden">Prev</span>
        </Button>
        
        <div className="flex flex-col items-center px-4 min-w-0">
          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
            Halaman {currentPage} dari {totalPages}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {startItem}-{endItem} dari {totalItems} aktivitas
          </span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange('next')} 
          disabled={!hasNext} 
          className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-fit"
        >
          <span className="hidden md:inline">Selanjutnya</span>
          <span className="md:hidden">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </CardFooter>
  );
};

// 🔧 FIXED: Main component with internal pagination state
const RecentActivities: React.FC<Props> = ({ 
  activities, 
  isLoading = false,
  itemsPerPage = 5
}) => {
  // 🔧 FIXED: Internal pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // 📊 Calculate pagination
  const paginationInfo = useMemo(() => 
    calculatePagination(currentPage, activities.length, itemsPerPage),
    [currentPage, activities.length, itemsPerPage]
  );

  // 🔧 FIXED: Reset page when activities change
  React.useEffect(() => {
    if (currentPage > paginationInfo.totalPages && paginationInfo.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [activities.length, currentPage, paginationInfo.totalPages]);

  // 📋 Current page activities
  const currentActivities = useMemo(() => {
    if (isLoading) {
      
      return Array(itemsPerPage).fill(null).map((_, index) => ({
        id: `skeleton-${index}`,
        userId: '',
        title: '',
        description: '',
        type: 'order' as const,
        value: null,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: null
      }));
    }
    
    return activities.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [activities, paginationInfo, isLoading, itemsPerPage]);

  // 🎯 Handle pagination
  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && paginationInfo.hasPrev) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && paginationInfo.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 🔧 FIXED: Show pagination if there are enough items OR if we're not on page 1
  const shouldShowPagination = !isLoading && (paginationInfo.totalPages > 1 || currentPage > 1);

  return (
    <Card className="bg-white border">
      {/* 📝 Header */}
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
          <ActivityIcon className="h-5 w-5 text-blue-600" />
          <span>Aktivitas Terbaru</span>
          {!isLoading && activities.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({activities.length} aktivitas)
            </span>
          )}
        </CardTitle>
      </CardHeader>

      {/* 📊 Content */}
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-gray-700 font-medium">Aktivitas</TableHead>
              <TableHead className="text-gray-700 font-medium">Waktu</TableHead>
              <TableHead className="text-gray-700 font-medium text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentActivities.length > 0 ? (
              currentActivities.map((activity, index) => {
                const key = generateListKey(activity, index, 'activity');
                return (
                  <ActivityRow
                    key={key}
                    activity={activity}
                    isLoading={isLoading}
                  />
                );
              })
            ) : !isLoading ? (
              // 📭 Empty State
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Belum ada aktivitas</p>
                  <p className="text-sm mt-1">Aktivitas akan muncul di sini setelah ada transaksi.</p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>

      {/* 🔄 Pagination */}
      {shouldShowPagination && (
        <PaginationControls
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          onPageChange={handlePageChange}
          hasNext={paginationInfo.hasNext}
          hasPrev={paginationInfo.hasPrev}
          totalItems={paginationInfo.totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </Card>
  );
};

export default RecentActivities;