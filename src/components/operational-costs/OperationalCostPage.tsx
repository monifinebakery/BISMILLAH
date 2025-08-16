// src/components/operational-costs/OperationalCostPageSimple.tsx

import React, { useState } from 'react';
import { Plus, Calculator, Edit2, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OperationalCostProvider, useOperationalCost } from './context';
import { formatCurrency } from './utils/costHelpers';
import { OperationalCost } from './types';

const OperationalCostContent: React.FC = () => {
  const { state, actions } = useOperationalCost();
  
  const [productionTarget, setProductionTarget] = useState(3000);
  const [newCost, setNewCost] = useState({
    nama_biaya: '',
    jumlah_per_bulan: 0,
    jenis: 'tetap' as 'tetap' | 'variabel',
    cost_category: 'general' as any,
    isAdding: false
  });
  const [editingCost, setEditingCost] = useState<{
    id: string;
    nama_biaya: string;
    jumlah_per_bulan: number;
    jenis: 'tetap' | 'variabel';
    cost_category: string;
  } | null>(null);

  // Calculate totals
  const totalMonthlyCosts = state.summary?.total_biaya_aktif || 0;
  const costPerProduct = productionTarget > 0 ? totalMonthlyCosts / productionTarget : 0;

  // Handlers
  const handleSaveNewCost = async () => {
    if (!newCost.nama_biaya || newCost.jumlah_per_bulan <= 0) return;
    
    const success = await actions.createCost({
      nama_biaya: newCost.nama_biaya,
      jumlah_per_bulan: newCost.jumlah_per_bulan,
      jenis: newCost.jenis,
      cost_category: newCost.cost_category,
      status: 'aktif'
    });
    
    if (success) {
      setNewCost({
        nama_biaya: '',
        jumlah_per_bulan: 0,
        jenis: 'tetap',
        cost_category: 'general',
        isAdding: false
      });
    }
  };

  const handleEditCost = (cost: OperationalCost) => {
    setEditingCost({
      id: cost.id,
      nama_biaya: cost.nama_biaya,
      jumlah_per_bulan: cost.jumlah_per_bulan,
      jenis: cost.jenis as 'tetap' | 'variabel',
      cost_category: cost.cost_category || 'general'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCost) return;
    
    const success = await actions.updateCost(editingCost.id, {
      nama_biaya: editingCost.nama_biaya,
      jumlah_per_bulan: editingCost.jumlah_per_bulan,
      jenis: editingCost.jenis,
      cost_category: editingCost.cost_category
    });
    
    if (success) {
      setEditingCost(null);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    if (confirm('Yakin ingin menghapus biaya ini?')) {
      await actions.deleteCost(costId);
    }
  };

  const productionSuggestions = [1000, 2000, 3000, 5000, 8000, 10000];

  // Loading state
  if (state.loading.auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-4">
            Anda perlu login untuk mengakses halaman ini.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Biaya Operasional</h1>
              <p className="text-gray-600">Kelola biaya operasional dan hitung overhead per produk</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Section: Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              🧮 Kalkulator Overhead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Monthly Fixed Costs */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Biaya tetap bulanan Anda:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <Input
                    type="text"
                    value={formatCurrency(totalMonthlyCosts)}
                    readOnly
                    className="pl-8 bg-gray-50 font-medium"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total dari {state.costs.length} item biaya di bawah
                </p>
              </div>

              {/* Production Target */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Target produksi bulanan:
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    value={productionTarget || ''}
                    onChange={(e) => setProductionTarget(parseFloat(e.target.value) || 0)}
                    placeholder="3000"
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    produk
                  </span>
                </div>
                
                {/* Quick suggestions */}
                <div className="flex gap-1 flex-wrap items-center mt-2">
                  <p className="text-xs text-gray-400 mr-2">Coba:</p>
                  {productionSuggestions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setProductionTarget(amount)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {amount.toLocaleString()} pcs
                    </button>
                  ))}
                </div>
              </div>
              
            </div>

            {/* Result */}
            {totalMonthlyCosts > 0 && productionTarget > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-orange-700">
                    💡 Setiap produk perlu "bayar":
                  </p>
                  <div className="text-2xl font-bold text-orange-800">
                    {formatCurrency(costPerProduct)}
                  </div>
                  <p className="text-sm text-orange-600">
                    untuk tutup biaya operasional
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-orange-600">Total Biaya/Bulan</p>
                      <p className="font-medium text-orange-800">{formatCurrency(totalMonthlyCosts)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-orange-600">Target Produksi/Bulan</p>
                      <p className="font-medium text-orange-800">{productionTarget.toLocaleString()} produk</p>
                    </div>
                    <div className="text-center">
                      <p className="text-orange-600">Biaya per Produk</p>
                      <p className="font-medium text-orange-800">{formatCurrency(costPerProduct)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Gunakan angka ini
                  </Button>
                </div>
              </div>
            )}

            {totalMonthlyCosts === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600">
                  Tambahkan biaya operasional di bawah untuk melihat hasil perhitungan
                </p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Bottom Section: Cost Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Detail Biaya Operasional ({state.costs.length} item)</span>
              <Button
                onClick={() => setNewCost(prev => ({ ...prev, isAdding: true }))}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Biaya Baru
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Nama Biaya</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Jumlah/Bulan</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Jenis</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Kategori</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  
                  {/* Add new cost row */}
                  {newCost.isAdding && (
                    <tr className="border-b border-gray-100 bg-blue-50">
                      <td className="py-3 px-2">
                        <Input
                          placeholder="Nama biaya..."
                          value={newCost.nama_biaya}
                          onChange={(e) => setNewCost(prev => ({ ...prev, nama_biaya: e.target.value }))}
                          className="h-8"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newCost.jumlah_per_bulan || ''}
                            onChange={(e) => setNewCost(prev => ({ ...prev, jumlah_per_bulan: parseFloat(e.target.value) || 0 }))}
                            className="h-8 pl-6 text-right"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Select value={newCost.jenis} onValueChange={(value: 'tetap' | 'variabel') => setNewCost(prev => ({ ...prev, jenis: value }))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tetap">Tetap</SelectItem>
                            <SelectItem value="variabel">Variabel</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2">
                        <Select value={newCost.cost_category} onValueChange={(value) => setNewCost(prev => ({ ...prev, cost_category: value }))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="administrative">Administrative</SelectItem>
                            <SelectItem value="selling">Selling</SelectItem>
                            <SelectItem value="overhead">Overhead</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveNewCost}
                            disabled={!newCost.nama_biaya || newCost.jumlah_per_bulan <= 0}
                            className="h-8 px-2 bg-green-600 hover:bg-green-700"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNewCost(prev => ({ ...prev, isAdding: false, nama_biaya: '', jumlah_per_bulan: 0 }))}
                            className="h-8 px-2"
                          >
                            ✕
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Existing costs */}
                  {state.costs.map((cost) => (
                    <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                      
                      {editingCost?.id === cost.id ? (
                        // Edit mode
                        <>
                          <td className="py-3 px-2">
                            <Input
                              value={editingCost.nama_biaya}
                              onChange={(e) => setEditingCost(prev => prev ? ({ ...prev, nama_biaya: e.target.value }) : null)}
                              className="h-8"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                              <Input
                                type="number"
                                value={editingCost.jumlah_per_bulan || ''}
                                onChange={(e) => setEditingCost(prev => prev ? ({ ...prev, jumlah_per_bulan: parseFloat(e.target.value) || 0 }) : null)}
                                className="h-8 pl-6 text-right"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Select value={editingCost.jenis} onValueChange={(value: 'tetap' | 'variabel') => setEditingCost(prev => prev ? ({ ...prev, jenis: value }) : null)}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tetap">Tetap</SelectItem>
                                <SelectItem value="variabel">Variabel</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-2">
                            <Select value={editingCost.cost_category} onValueChange={(value) => setEditingCost(prev => prev ? ({ ...prev, cost_category: value }) : null)}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="administrative">Administrative</SelectItem>
                                <SelectItem value="selling">Selling</SelectItem>
                                <SelectItem value="overhead">Overhead</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="h-8 px-2 bg-green-600 hover:bg-green-700"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCost(null)}
                                className="h-8 px-2"
                              >
                                ✕
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="py-3 px-2 font-medium">{cost.nama_biaya}</td>
                          <td className="py-3 px-2 text-right font-medium">{formatCurrency(cost.jumlah_per_bulan)}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant={cost.jenis === 'tetap' ? 'default' : 'secondary'}>
                              {cost.jenis === 'tetap' ? 'Tetap' : 'Variabel'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant="outline" className="text-xs">
                              {cost.cost_category || 'general'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCost(cost)}
                                className="h-8 px-2"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCost(cost.id)}
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {/* Empty state */}
                  {state.costs.length === 0 && !newCost.isAdding && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        <div className="space-y-2">
                          <p>Belum ada biaya operasional</p>
                          <Button
                            onClick={() => setNewCost(prev => ({ ...prev, isAdding: true }))}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Biaya Pertama
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
                
                {/* Total Row */}
                {state.costs.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-semibold bg-gray-50">
                      <td className="py-3 px-2">Total:</td>
                      <td className="py-3 px-2 text-right text-lg">{formatCurrency(totalMonthlyCosts)}</td>
                      <td className="py-3 px-2"></td>
                      <td className="py-3 px-2"></td>
                      <td className="py-3 px-2"></td>
                    </tr>
                  </tfoot>
                )}

              </table>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

const OperationalCostPage: React.FC = () => {
  return (
    <OperationalCostProvider>
      <OperationalCostContent />
    </OperationalCostProvider>
  );
};

export default OperationalCostPage;
