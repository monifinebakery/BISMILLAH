// components/dashboard/RecentActivities.tsx
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from '@/utils/formatUtils';
import { generateListKey } from '@/utils/keyUtils';
import { calculatePagination } from '@/components/promoCalculator/utils/promoUtils';
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
  pagination: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

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
  const isIncome = activity.title?.toLowerCase().includes('pemasukan');
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
}> = ({ currentPage, totalPages, onPageChange, hasNext, hasPrev }) => {
  return (
    <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('prev')} 
        disabled={!hasPrev} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <span className="text-sm text-gray-600 font-medium">
        {currentPage} dari {totalPages}
      </span>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('next')} 
        disabled={!hasNext} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </CardFooter>
  );
};

const RecentActivities: React.FC<Props> = ({ 
  activities, 
  pagination, 
  onPageChange, 
  isLoading 
}) => {
  const itemsPerPage = 5;

  // 📊 Calculate pagination
  const paginationInfo = useMemo(() => 
    calculatePagination(pagination, activities.length, itemsPerPage),
    [pagination, activities.length]
  );

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
  }, [activities, paginationInfo, isLoading]);

  // 🎯 Handle pagination
  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && paginationInfo.hasPrev) {
      onPageChange(paginationInfo.currentPage - 1);
    } else if (direction === 'next' && paginationInfo.hasNext) {
      onPageChange(paginationInfo.currentPage + 1);
    }
  };

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
                const key = generateListKey('activity', activity.id, index, pagination.toString());
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
                  <p className="text-sm mt-1">pada periode yang dipilih.</p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>

      {/* 🔄 Pagination */}
      {paginationInfo.totalPages > 1 && !isLoading && (
        <PaginationControls
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          onPageChange={handlePageChange}
          hasNext={paginationInfo.hasNext}
          hasPrev={paginationInfo.hasPrev}
        />
      )}
    </Card>
  );
};

export default RecentActivities;