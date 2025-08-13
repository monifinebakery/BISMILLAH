// src/components/profitAnalysis/tabs/rincianTab/components/opexDetail/OpexDetailTab.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Building, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

import { OpexDetailTabProps } from '../../types/components';
import { ExpenseCard } from './ExpenseCard';
import { hasDetailedOpexBreakdown } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';

export const OpexDetailTab: React.FC<OpexDetailTabProps> = ({
  profitData,
  calculations,
  isMobile,
  className
}) => {
  const { opexBreakdown, profitMarginData } = profitData;
  const revenue = profitMarginData.revenue;

  return (
    <TabsContent value="opex" className={cn("mt-6", isMobile && "mt-4", className)}>
      {hasDetailedOpexBreakdown(profitData) ? (
        <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-3")}>
          
          {/* Administrative Expenses */}
          {opexBreakdown.administrativeExpenses && opexBreakdown.administrativeExpenses.length > 0 && (
            <ExpenseCard
              title={SECTION_TITLES.ADMIN_EXPENSES}
              expenses={opexBreakdown.administrativeExpenses}
              total={opexBreakdown.totalAdministrative}
              revenue={revenue}
              colorScheme="blue"
              icon={Building}
              isMobile={isMobile}
            />
          )}

          {/* Selling Expenses */}
          {opexBreakdown.sellingExpenses && opexBreakdown.sellingExpenses.length > 0 && (
            <ExpenseCard
              title={SECTION_TITLES.SELLING_EXPENSES}
              expenses={opexBreakdown.sellingExpenses}
              total={opexBreakdown.totalSelling}
              revenue={revenue}
              colorScheme="green"
              icon={TrendingUp}
              isMobile={isMobile}
            />
          )}

          {/* General Expenses */}
          {opexBreakdown.generalExpenses && opexBreakdown.generalExpenses.length > 0 && (
            <ExpenseCard
              title={SECTION_TITLES.GENERAL_EXPENSES}
              expenses={opexBreakdown.generalExpenses}
              total={opexBreakdown.totalGeneral}
              revenue={revenue}
              colorScheme="purple"
              icon={Settings}
              isMobile={isMobile}
            />
          )}
        </div>
      ) : (
        /* No Detail Available Message */
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-gray-400 mb-2">💼</div>
            <p className="text-gray-500 font-medium">Detail OPEX Tidak Tersedia</p>
            <p className="text-sm text-gray-400 mt-1">
              Data breakdown biaya operasional belum diinput secara detail
            </p>
            
            {/* Show basic totals */}
            <div className={cn("mt-4 p-4 bg-gray-50 rounded", isMobile && "p-3")}>
              <h6 className={cn("font-medium mb-2", isMobile && "text-sm")}>Total OPEX Summary</h6>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Administrasi:</span>
                  <span className="font-medium">{formatCurrency(opexBreakdown.totalAdministrative)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan:</span>
                  <span className="font-medium">{formatCurrency(opexBreakdown.totalSelling)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Umum:</span>
                  <span className="font-medium">{formatCurrency(opexBreakdown.totalGeneral)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(opexBreakdown.totalOPEX)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </TabsContent>
  );
};