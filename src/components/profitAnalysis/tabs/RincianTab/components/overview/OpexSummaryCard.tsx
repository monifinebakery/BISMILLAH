import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

import { OpexSummaryCardProps } from '../../types/components';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';
import { CARD_COLORS } from '../../constants/colors';

export const OpexSummaryCard: React.FC<OpexSummaryCardProps> = ({
  opexBreakdown,
  profitMarginData,
  opexComposition,
  isMobile
}) => {
  const colors = CARD_COLORS.OPEX;

  // Validasi profitMarginData dan revenue
  if (!profitMarginData || typeof profitMarginData.revenue !== 'number' || isNaN(profitMarginData.revenue)) {
    logger.warn('OpexSummaryCard: profitMarginData tidak valid atau revenue tidak tersedia', { profitMarginData });
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Data pendapatan tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const revenue = profitMarginData.revenue;

  // Cegah pembagian dengan nol
  if (revenue === 0) {
    logger.warn('OpexSummaryCard: revenue adalah nol', { profitMarginData });
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Pendapatan nol, tidak dapat menghitung persentase</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Building className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          {SECTION_TITLES.OPEX_SUMMARY}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        <div className="space-y-3">
          {/* Administrative Expenses */}
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isMobile && "text-xs")}>Administrasi:</span>
            <div className="text-right">
              <span className={cn("font-medium", isMobile && "text-sm")}>
                {formatCurrency(opexBreakdown.totalAdministrative)}
              </span>
              <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                {formatPercentage((opexBreakdown.totalAdministrative / revenue) * 100)}
              </p>
            </div>
          </div>

          {/* Selling Expenses */}
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isMobile && "text-xs")}>Penjualan:</span>
            <div className="text-right">
              <span className={cn("font-medium", isMobile && "text-sm")}>
                {formatCurrency(opexBreakdown.totalSelling)}
              </span>
              <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                {formatPercentage((opexBreakdown.totalSelling / revenue) * 100)}
              </p>
            </div>
          </div>

          {/* General Expenses */}
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isMobile && "text-xs")}>Umum:</span>
            <div className="text-right">
              <span className={cn("font-medium", isMobile && "text-sm")}>
                {formatCurrency(opexBreakdown.totalGeneral)}
              </span>
              <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                {formatPercentage((opexBreakdown.totalGeneral / revenue) * 100)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Total OPEX */}
          <div className="flex justify-between items-center font-bold">
            <span className={cn(isMobile && "text-sm")}>Total OPEX:</span>
            <div className="text-right">
              <span className={cn(isMobile && "text-sm")}>
                {formatCurrency(opexBreakdown.totalOPEX)}
              </span>
              <p className={cn("text-xs text-gray-500 font-normal", isMobile && "text-[0.65rem]")}>
                {formatPercentage((opexBreakdown.totalOPEX / revenue) * 100)} dari revenue
              </p>
            </div>
          </div>
        </div>

        {/* OPEX Composition */}
        <div className={cn("p-3 rounded", colors.bg)}>
          <h5 className={cn("font-medium mb-2", colors.textDark, isMobile && "text-sm")}>
            📋 Komposisi OPEX
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Admin:</span>
              <span className="font-medium">{formatPercentage(opexComposition.adminRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span>Selling:</span>
              <span className="font-medium">{formatPercentage(opexComposition.sellingRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span>General:</span>
              <span className="font-medium">{formatPercentage(opexComposition.generalRatio)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};