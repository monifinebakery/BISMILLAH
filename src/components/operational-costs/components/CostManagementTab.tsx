import React from 'react';
import { Plus, Edit2, Trash2, DollarSign, Package, TrendingUp, CheckSquare, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* HPP Summary Card */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardHeader className="relative pb-3">
            <CardTitle className="flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Biaya HPP</h3>
                  <p className="text-xs text-blue-600 mt-1">Harga Pokok Produksi</p>
                </div>
              </div>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full"
                      aria-label="Info biaya HPP"
                    >
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-blue-50 border-blue-200 text-blue-900 max-w-xs">
                    <p>Biaya yang masuk ke dalam resep produk (bahan baku tidak langsung, overhead produksi)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {formatCurrency(hppCosts)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                {costs.filter(c => c.group === 'hpp').length} item biaya
              </p>
              <div className="flex items-center gap-1 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                HPP
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Summary Card */}
        <Card className="border-0 bg-gradient-to-br from-orange-50 to-red-100">
          <CardHeader className="relative pb-3">
            <CardTitle className="flex items-center justify-between text-orange-900">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Biaya Operasional</h3>
                  <p className="text-xs text-orange-600 mt-1">Operasional Bisnis</p>
                </div>
              </div>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-2 bg-orange-100 hover:bg-orange-200 rounded-full"
                      aria-label="Info biaya operasional"
                    >
                      <DollarSign className="h-4 w-4 text-orange-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                    <p>Biaya untuk menjalankan bisnis (sewa, gaji, marketing, utilitas)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-2">
              {formatCurrency(operationalCosts)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-orange-700">
                {costs.filter(c => c.group === 'operasional').length} item biaya
              </p>
              <div className="flex items-center gap-1 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                OPS
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Summary Card */}
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-100 md:col-span-2 xl:col-span-1">
          <CardHeader className="relative pb-3">
            <CardTitle className="flex items-center justify-between text-green-900">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Total Biaya</h3>
                  <p className="text-xs text-green-600 mt-1">Keseluruhan Per Bulan</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                  Monthly
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-green-900 mb-2">
              {formatCurrency(totalMonthlyCosts)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700">
                {costs.filter(c => c.status === 'aktif').length} biaya aktif
              </p>
              <div className="flex items-center gap-1 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                TOTAL
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Cost Management Table */}
      <Card className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
        <CardHeader className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Kelola Biaya Operasional
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Tambah, edit, atau hapus biaya bulanan untuk bisnis Anda dengan mudah
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                onClick={onToggleSelectionMode}
                className={`w-full sm:w-auto ${
                  isSelectionMode 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                    : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 shadow-md'
                }`}
                size="default"
              >
                {isSelectionMode ? (
                  <>
                    <X className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Keluar Mode</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Mode Pilih</span>
                  </>
                )}
              </Button>
              <Button
                onClick={onOpenAddDialog}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                size="default"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Tambah Biaya</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200 sticky top-0 z-[1]">
                <TableRow className="hover:bg-gray-100">
                  {isSelectionMode && (
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onSelectAll}
                        aria-label="Pilih semua biaya"
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-left">Nama Biaya</TableHead>
                  <TableHead className="text-right">Jumlah/Bulan</TableHead>
                  <TableHead className="text-center">Grup</TableHead>
                  <TableHead className="text-center">Jenis</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Tanggal</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id} className="hover:bg-gray-50 border-b border-gray-100">
                    {isSelectionMode && (
                      <TableCell className="text-center py-4">
                        <Checkbox
                          checked={selectedIds.includes(cost.id)}
                          onCheckedChange={() => onSelectionChange?.(cost.id)}
                          aria-label={`Pilih biaya ${cost.nama_biaya}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="py-4">
                      <div className="font-semibold text-gray-900">{cost.nama_biaya}</div>
                      {cost.deskripsi && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {cost.deskripsi}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg py-4">
                      {formatCurrency(cost.jumlah_per_bulan)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge
                        variant={cost.group === 'hpp' ? 'default' : 'secondary'}
                        className={
                          cost.group === 'hpp'
                            ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-md'
                            : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-md'
                        }
                      >
                        {cost.group === 'hpp' ? 'HPP' : 'OPS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-sm ${
                          cost.jenis === 'tetap'
                            ? 'border-blue-300 text-blue-700 bg-blue-50'
                            : 'border-purple-300 text-purple-700 bg-purple-50'
                        }`}
                      >
                        {cost.jenis === 'tetap' ? 'Tetap' : 'Variabel'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-sm ${
                          cost.status === 'aktif'
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : 'border-red-300 text-red-700 bg-red-50'
                        }`}
                      >
                        {cost.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600 py-4">
                      {formatDate(cost.created_at)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditCost(cost)}
                          className="h-9 w-9 p-0 text-blue-600 hover:text-white hover:bg-blue-600 border-blue-300 hover:border-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteCost(cost.id)}
                          className="h-9 w-9 p-0 text-red-600 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Enhanced Empty State */}
                {costs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isSelectionMode ? 8 : 7} className="text-center h-24 bg-gradient-to-b from-gray-50 to-white">
                      <div className="py-16 text-gray-500 space-y-6 max-w-lg mx-auto">
                        {/* Animated Icon */}
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <div className="text-4xl text-orange-500">$</div>
                        </div>
                        
                        {/* Title & Description */}
                        <div className="space-y-3">
                          <h3 className="font-bold text-xl text-gray-700">
                            Siap Mulai Kelola Biaya?
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Belum ada biaya operasional yang tercatat. Mari mulai dengan menambahkan biaya bulanan seperti:
                          </p>
                        </div>
                        
                        {/* Example Cost Items */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                          {[
                            { icon: '', name: 'Gas' },
                            { icon: '', name: 'Sewa' },
                            { icon: '', name: 'Internet' },
                            { icon: '', name: 'Gaji' },
                            { icon: '', name: 'Marketing' },
                            { icon: '', name: 'Listrik' }
                          ].map((item, index) => (
                            <div 
                              key={item.name}
                              className="flex items-center gap-2 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full"
                            >
                              <span className="font-medium text-gray-700">{item.name}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-4">
                          <Button 
                            onClick={onOpenAddDialog} 
                            size="lg" 
                            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 px-8 py-3 shadow-xl"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Tambah Biaya Pertama</span>
                          </Button>
                          
                          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>Tip: Gunakan "Setup Cepat" untuk template</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostManagementTab;
