// components/dashboard/RecentActivities.tsx
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from '@/utils/formatUtils';
import { generateListKey } from '@/utils/keyUtils';
import { formatDateTime } from '@/utils/unifiedDateUtils';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  type: string;
  value?: string | number;
}

interface Props {
  activities: ActivityItem[];
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
  activity: ActivityItem;
  isLoading?: boolean;
}> = ({ activity, isLoading = false }) => {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
          </div>
        </TableCell>
        <TableCell>
          <div className="h-3 bg-gray-200 animate-pulse rounded w-20"></div>
        </TableCell>
        <TableCell>
          <div className="h-3 bg-gray-200 animate-pulse rounded w-16 ml-auto"></div>
        </TableCell>
      </TableRow>
    );
  }

  // 💰 Determine if this is a financial activity
  const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
  let amount = 0;
  
  if (isFinancial && activity.value) {
    const parsed = parseFloat(activity.value.toString());
    amount = isNaN(parsed) ? 0 : parsed;
  }

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
              {activity.description}
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
          <p className={`text-sm font-medium ${amountColor}`}>
            {formatCurrency(amount)}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
};

// 🔄 Pagination Controls (reusable)
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
    <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('prev')} 
        disabled={!hasPrev} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Sebelumnya
      </Button>
      
      <div className="flex flex-col items-center">
        <span className="text-sm text-gray-600 font-medium">
          Halaman {currentPage} dari {totalPages}
        </span>
        <span className="text-xs text-gray-500">
          Menampilkan {startItem}-{endItem} dari {totalItems} aktivitas
        </span>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('next')} 
        disabled={!hasNext} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Selanjutnya
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
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
      // Return skeleton items
      return Array(itemsPerPage).fill(null).map((_, index) => ({
        id: `skeleton-${index}`,
        title: '',
        description: '',
        timestamp: new Date(),
        type: '',
        value: 0
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
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* 📝 Header */}
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
          <Activity className="h-5 w-5 text-blue-600" />
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
                const key = generateListKey('activity', activity.id, index, currentPage.toString());
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
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
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