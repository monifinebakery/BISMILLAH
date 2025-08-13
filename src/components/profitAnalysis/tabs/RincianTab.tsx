// src/components/financial/profit-analysis/tabs/RincianTab.tsx
// ✅ TAB RINCIAN - Detailed breakdown HPP dan OPEX

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Factory, Building } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface RincianTabProps {
  profitData: any;
}

export const RincianTab: React.FC<RincianTabProps> = ({ profitData }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rincian HPP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              HPP (Harga Pokok Penjualan)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Biaya Material:</span>
                <span className="font-medium">{formatCurrency(profitData.cogsBreakdown.totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tenaga Kerja Langsung:</span>
                <span className="font-medium">{formatCurrency(profitData.cogsBreakdown.totalDirectLaborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overhead Manufaktur:</span>
                <span className="font-medium">{formatCurrency(profitData.cogsBreakdown.manufacturingOverhead)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total HPP:</span>
                <span>{formatCurrency(profitData.cogsBreakdown.totalCOGS)}</span>
              </div>
            </div>

            {/* Detail Material */}
            {profitData.cogsBreakdown.materialCosts.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Detail Material:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {profitData.cogsBreakdown.materialCosts.slice(0, 5).map((material: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{material.materialName}</span>
                      <span>{formatCurrency(material.totalCost)}</span>
                    </div>
                  ))}
                  {profitData.cogsBreakdown.materialCosts.length > 5 && (
                    <p className="text-xs text-gray-500">
                      +{profitData.cogsBreakdown.materialCosts.length - 5} material lainnya
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detail Tenaga Kerja */}
            {profitData.cogsBreakdown.directLaborCosts.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Detail Tenaga Kerja:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {profitData.cogsBreakdown.directLaborCosts.map((labor: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{labor.costName}</span>
                      <span>{formatCurrency(labor.allocatedAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rincian OPEX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              OPEX (Biaya Operasional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Administrasi:</span>
                <span className="font-medium">{formatCurrency(profitData.opexBreakdown.totalAdministrative)}</span>
              </div>
              <div className="flex justify-between">
                <span>Penjualan:</span>
                <span className="font-medium">{formatCurrency(profitData.opexBreakdown.totalSelling)}</span>
              </div>
              <div className="flex justify-between">
                <span>Umum:</span>
                <span className="font-medium">{formatCurrency(profitData.opexBreakdown.totalGeneral)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span