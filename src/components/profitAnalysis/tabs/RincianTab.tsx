// src/components/financial/profit-analysis/tabs/RincianTab.tsx
// ✅ TAB RINCIAN - Fixed and Enhanced Version

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Factory, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '../utils/formatters';

interface RincianTabProps {
  profitData: any;
}

export const RincianTab: React.FC<RincianTabProps> = ({ profitData }) => {
  const isMobile = useIsMobile();
  
  // Validasi data
  if (!profitData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Data tidak tersedia</p>
      </div>
    );
  }

  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <span className="font-medium">{formatCurrency(cogsBreakdown.totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tenaga Kerja Langsung:</span>
                <span className="font-medium">{formatCurrency(cogsBreakdown.totalDirectLaborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overhead Manufaktur:</span>
                <span className="font-medium">{formatCurrency(cogsBreakdown.manufacturingOverhead)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total HPP:</span>
                <span>{formatCurrency(cogsBreakdown.totalCOGS)}</span>
              </div>
            </div>

            {/* Detail Material */}
            {cogsBreakdown.materialCosts?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Detail Material:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cogsBreakdown.materialCosts.slice(0, 5).map((material: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{material.materialName}</span>
                      <span>{formatCurrency(material.totalCost)}</span>
                    </div>
                  ))}
                  {cogsBreakdown.materialCosts.length > 5 && (
                    <p className="text-xs text-gray-500">
                      +{cogsBreakdown.materialCosts.length - 5} material lainnya
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detail Tenaga Kerja */}
            {cogsBreakdown.directLaborCosts?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Detail Tenaga Kerja:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cogsBreakdown.directLaborCosts.map((labor: any, index: number) => (
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
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total OPEX:</span>
                <span>{formatCurrency(opexBreakdown.totalOPEX)}</span>
              </div>
            </div>

            {/* Detail OPEX */}
            <div className="mt-4">
              <h5 className="font-medium mb-2">Detail Biaya:</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[
                  ...(opexBreakdown.administrativeExpenses || []),
                  ...(opexBreakdown.sellingExpenses || []),
                  ...(opexBreakdown.generalExpenses || [])
                ].slice(0, 5).map((expense: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate">{expense.costName}</span>
                    <span>{formatCurrency(expense.monthlyAmount)}</span>
                  </div>
                ))}
                {((opexBreakdown.administrativeExpenses?.length || 0) +
                  (opexBreakdown.sellingExpenses?.length || 0) +
                  (opexBreakdown.generalExpenses?.length || 0)) > 5 && (
                  <p className="text-xs text-gray-500">
                    +{((opexBreakdown.administrativeExpenses?.length || 0) +
                      (opexBreakdown.sellingExpenses?.length || 0) +
                      (opexBreakdown.generalExpenses?.length || 0)) - 5} biaya lainnya
                  </p>
                )}
              </div>
            </div>

            {/* Info Metode Alokasi */}
            <div className="bg-blue-50 p-3 rounded mt-4">
              <h5 className="font-medium text-blue-800 mb-1">ℹ️ Metode Alokasi</h5>
              <p className="text-xs text-blue-700">
                Overhead dialokasikan dengan metode: <strong>{cogsBreakdown.overheadAllocationMethod}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Overhead manufaktur: {formatCurrency(cogsBreakdown.manufacturingOverhead)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analisis Struktur Biaya */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Analisis Struktur Biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium mb-3">Analisis Komposisi Biaya</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Rasio Biaya Material:</span>
                  <span className="font-medium">
                    {((cogsBreakdown.totalMaterialCost / profitMarginData.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rasio Biaya Tenaga Kerja:</span>
                  <span className="font-medium">
                    {((cogsBreakdown.totalDirectLaborCost / profitMarginData.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rasio Overhead:</span>
                  <span className="font-medium">
                    {((cogsBreakdown.manufacturingOverhead / profitMarginData.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-3">Metrik Efisiensi</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pendapatan per Biaya:</span>
                  <span className="font-medium">
                    {(profitMarginData.revenue / (profitMarginData.cogs + profitMarginData.opex)).toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Efisiensi HPP:</span>
                  <span className="font-medium">
                    {(profitMarginData.revenue / profitMarginData.cogs).toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Efisiensi OPEX:</span>
                  <span className="font-medium">
                    {(profitMarginData.revenue / profitMarginData.opex).toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Target vs Aktual */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded">
              <h5 className="font-medium text-red-800 mb-2">🎯 Target HPP</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-medium">{"<"}70%</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktual:</span>
                  <span className={cn(
                    "font-medium",
                    ((cogsBreakdown.totalCOGS / profitMarginData.revenue) * 100) < 70 
                      ? "text-green-600" 
                      : "text-red-600"
                  )}>
                    {((cogsBreakdown.totalCOGS / profitMarginData.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {((cogsBreakdown.totalCOGS / profitMarginData.revenue) * 100) < 70 
                    ? "✅ Dalam target yang sehat" 
                    : "⚠️ Melebihi target, perlu optimisasi"}
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded">
              <h5 className="font-medium text-purple-800 mb-2">🎯 Target OPEX</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-medium">{"<"}20%</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktual:</span>
                  <span className={cn(
                    "font-medium",
                    ((opexBreakdown.totalOPEX / profitMarginData.revenue) * 100) < 20 
                      ? "text-green-600" 
                      : "text-purple-600"
                  )}>
                    {((opexBreakdown.totalOPEX / profitMarginData.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {((opexBreakdown.totalOPEX / profitMarginData.revenue) * 100) < 20 
                    ? "✅ Efisiensi operasional baik" 
                    : "⚠️ OPEX tinggi, review efisiensi"}
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <h5 className="font-medium text-green-800 mb-2">🎯 Target Margin</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Target Net:</span>
                  <span className="font-medium">{">"}10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktual:</span>
                  <span className={cn(
                    "font-medium",
                    profitMarginData.netMargin > 10 
                      ? "text-green-600" 
                      : "text-orange-600"
                  )}>
                    {profitMarginData.netMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {profitMarginData.netMargin > 10 
                    ? "✅ Margin sehat dan menguntungkan" 
                    : "⚠️ Margin perlu ditingkatkan"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Breakdown per Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detail Material Costs */}
        {cogsBreakdown.materialCosts?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🧾 Rincian Biaya Material</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cogsBreakdown.materialCosts.map((material: any, index: number) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <h6 className="font-medium text-sm truncate">{material.materialName}</h6>
                      <div className="text-xs text-gray-600 mt-1">
                        <p>Supplier: {material.supplier}</p>
                        <p>Kategori: {material.category}</p>
                        {material.quantityUsed > 0 && (
                          <p>Qty: {material.quantityUsed.toFixed(2)} | Unit: {formatCurrency(material.unitCost)}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-medium">{formatCurrency(material.totalCost)}</p>
                      <p className="text-xs text-gray-500">
                        {((material.totalCost / cogsBreakdown.totalMaterialCost) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="bg-red-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-red-800">Total Biaya Material</span>
                    <span className="font-bold text-red-700">{formatCurrency(cogsBreakdown.totalMaterialCost)}</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    {((cogsBreakdown.totalMaterialCost / profitMarginData.revenue) * 100).toFixed(1)}% dari total pendapatan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Labor Costs */}
        {cogsBreakdown.directLaborCosts?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>👷 Rincian Biaya Tenaga Kerja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cogsBreakdown.directLaborCosts.map((labor: any, index: number) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <h6 className="font-medium text-sm truncate">{labor.costName}</h6>
                      <div className="text-xs text-gray-600 mt-1">
                        <p>Jenis: {labor.costType === 'tetap' ? 'Biaya Tetap' : 'Biaya Variabel'}</p>
                        <p>Basis Alokasi: {labor.allocationBasis}</p>
                        <p>Jumlah Bulanan: {formatCurrency(labor.monthlyAmount)}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-medium">{formatCurrency(labor.allocatedAmount)}</p>
                      <p className="text-xs text-gray-500">
                        {((labor.allocatedAmount / cogsBreakdown.totalDirectLaborCost) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="bg-orange-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-orange-800">Total Biaya Tenaga Kerja</span>
                    <span className="font-bold text-orange-700">{formatCurrency(cogsBreakdown.totalDirectLaborCost)}</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {((cogsBreakdown.totalDirectLaborCost / profitMarginData.revenue) * 100).toFixed(1)}% dari total pendapatan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Ringkasan Rincian & Rekomendasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium mb-3">📊 Komposisi Biaya</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span>HPP Total:</span>
                  <span className="font-medium">{formatCurrency(cogsBreakdown.totalCOGS)}</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded">
                  <span>OPEX Total:</span>
                  <span className="font-medium">{formatCurrency(opexBreakdown.totalOPEX)}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Total Biaya:</span>
                  <span className="font-medium">{formatCurrency(cogsBreakdown.totalCOGS + opexBreakdown.totalOPEX)}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>Laba Bersih:</span>
                  <span className="font-medium">{formatCurrency(profitMarginData.netProfit)}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-3">💡 Rekomendasi Optimisasi</h5>
              <div className="space-y-2 text-sm">
                {((cogsBreakdown.totalMaterialCost / profitMarginData.revenue) * 100) > 40 && (
                  <div className="p-2 bg-yellow-50 rounded">
                    <p className="font-medium text-yellow-800">🔧 Optimisasi Material</p>
                    <p className="text-yellow-700">Biaya material tinggi, review supplier dan efisiensi penggunaan</p>
                  </div>
                )}
                
                {((cogsBreakdown.totalDirectLaborCost / profitMarginData.revenue) * 100) > 20 && (
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-medium text-blue-800">⚡ Efisiensi Tenaga Kerja</p>
                    <p className="text-blue-700">Evaluasi produktivitas dan otomasi proses</p>
                  </div>
                )}
                
                {((opexBreakdown.totalOPEX / profitMarginData.revenue) * 100) > 20 && (
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="font-medium text-purple-800">📉 Kontrol OPEX</p>
                    <p className="text-purple-700">OPEX tinggi, review biaya operasional yang tidak esensial</p>
                  </div>
                )}
                
                <div className="p-2 bg-green-50 rounded">
                  <p className="font-medium text-green-800">🎯 Target Optimisasi</p>
                  <p className="text-green-700">Material <w-screen h-screen40%, Labor <20%, OPEX <20% dari revenue</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};