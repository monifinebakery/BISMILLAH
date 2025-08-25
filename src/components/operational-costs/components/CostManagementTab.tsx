import React from 'react';
import { Plus, Edit2, Trash2, DollarSign, Package, TrendingUp, AlertTriangle, CheckSquare, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '../utils/costHelpers';
import { OperationalCost } from '../types/operationalCost.types';

interface CostManagementTabProps {
  costs: OperationalCost[];
  totalMonthlyCosts: number;
  hppCosts: number;
  operationalCosts: number;
  onOpenAddDialog: () => void;
  onEditCost: (cost: OperationalCost) => void;
  onDeleteCost: (id: string) => void;
  // Bulk operations props
  selectedIds?: string[];
  onSelectionChange?: (costId: string) => void;
  isSelectionMode?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  onToggleSelectionMode?: () => void;
}

const CostManagementTab: React.FC<CostManagementTabProps> = ({
  costs,
  totalMonthlyCosts,
  hppCosts,
  operationalCosts,
  onOpenAddDialog,
  onEditCost,
  onDeleteCost,
  selectedIds = [],
  onSelectionChange,
  isSelectionMode = false,
  onSelectAll,
  isAllSelected = false,
  onToggleSelectionMode,
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HPP Summary Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
              <Package className="h-4 w-4" />
              Biaya HPP
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info biaya HPP"
                    >
                      <DollarSign className="h-3 w-3 text-blue-500 hover:text-blue-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-blue-50 border-blue-200 text-blue-900 max-w-xs">
                    <p>Biaya yang masuk ke dalam resep produk (bahan baku tidak langsung, overhead produksi)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(hppCosts)}</div>
            <p className="text-sm text-blue-700 mt-1">
              {costs.filter(c => c.group === 'HPP').length} item biaya
            </p>
          </CardContent>
        </Card>

        {/* Operational Summary Card */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 text-base">
              <TrendingUp className="h-4 w-4" />
              Biaya Operasional
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info biaya operasional"
                    >
                      <DollarSign className="h-3 w-3 text-green-500 hover:text-green-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-green-50 border-green-200 text-green-900 max-w-xs">
                    <p>Biaya untuk menjalankan bisnis (sewa, gaji, marketing, utilitas)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(operationalCosts)}</div>
            <p className="text-sm text-green-700 mt-1">
              {costs.filter(c => c.group === 'OPERASIONAL').length} item biaya
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Management Table */}
      <Card className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>Kelola Biaya Operasional</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Tambah, edit, atau hapus biaya bulanan untuk bisnis Anda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                onClick={onToggleSelectionMode}
                className={isSelectionMode ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}
              >
                {isSelectionMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Keluar Mode Pilih
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mode Pilih
                  </>
                )}
              </Button>
              <Button
                onClick={onOpenAddDialog}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Biaya Baru
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {isSelectionMode && (
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onSelectAll}
                        aria-label="Pilih semua biaya"
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nama Biaya</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Jumlah/Bulan</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Grup</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Jenis</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Tanggal</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {isSelectionMode && (
                      <td className="py-3 px-2 text-center">
                        <Checkbox
                          checked={selectedIds.includes(cost.id)}
                          onCheckedChange={() => onSelectionChange?.(cost.id)}
                          aria-label={`Pilih biaya ${cost.nama_biaya}`}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{cost.nama_biaya}</div>
                      {cost.deskripsi && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {cost.deskripsi}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(cost.jumlah_per_bulan)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={cost.group === 'HPP' ? 'default' : 'secondary'}
                        className={cost.group === 'HPP' 
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }
                      >
                        {cost.group}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="outline"
                        className={cost.jenis === 'tetap' 
                          ? 'border-blue-300 text-blue-700' 
                          : 'border-purple-300 text-purple-700'
                        }
                      >
                        {cost.jenis === 'tetap' ? 'Tetap' : 'Variabel'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="outline"
                        className={cost.status === 'aktif' 
                          ? 'border-green-300 text-green-700' 
                          : 'border-red-300 text-red-700'
                        }
                      >
                        {cost.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {formatDate(cost.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditCost(cost)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteCost(cost.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty state */}
                {costs.length === 0 && (
                  <tr>
                    <td colSpan={isSelectionMode ? 8 : 7} className="py-12 text-center text-gray-500">
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                          📝
                        </div>
                        <div>
                          <p className="font-medium text-lg text-gray-700 mb-2">Belum ada biaya yang ditambahkan</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Mari mulai dengan menambahkan biaya operasional bulanan seperti:
                            <br /><strong>Gas, Sewa, Marketing, Gaji, Internet</strong>
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <Button
                            onClick={onOpenAddDialog}
                            size="lg"
                            className="bg-orange-600 hover:bg-orange-700 px-6"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Biaya Pertama
                          </Button>
                          
                          <div className="text-xs text-gray-500 mt-2">
                            💡 Tip: Gunakan tombol "Setup Cepat" di header untuk template siap pakai
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              
              {/* Total Row */}
              {costs.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-semibold bg-gray-50">
                    {isSelectionMode && <td className="py-3 px-2"></td>}
                    <td className="py-3 px-4">Total Semua Biaya:</td>
                    <td className="py-3 px-4 text-right text-lg">{formatCurrency(totalMonthlyCosts)}</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostManagementTab;
