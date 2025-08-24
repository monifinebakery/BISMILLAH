// src/components/operational-costs/OperationalCostPage.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Calculator, Edit2, Trash2, DollarSign, Settings, Target, Info, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperationalCostProvider, useOperationalCost } from './context';
import { formatCurrency, formatDate } from './utils/costHelpers';
import { OperationalCost, AppSettings } from './types/operationalCost.types';
import { CostFormDialog } from './components/CostFormDialog';
import DualModeCalculator from './components/DualModeCalculator';
import { appSettingsApi } from './services';
import { toast } from 'sonner';

const OperationalCostContent: React.FC = () => {
  const { state, actions } = useOperationalCost();
  
  const [productionTarget, setProductionTarget] = useState(3000);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [activeTab, setActiveTab] = useState('costs'); // 'costs' or 'calculator'
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);

  // Auto-refresh data when component mounts
  useEffect(() => {
    if (state.isAuthenticated) {
      actions.loadCosts();
      // Load app settings
      loadAppSettings();
    }
  }, [state.isAuthenticated]);

  // Check if user needs onboarding (first time with no costs)
  useEffect(() => {
    if (state.isAuthenticated && !state.loading.costs && state.costs.length === 0) {
      const hasSeenOnboarding = localStorage.getItem('operational-costs-onboarding-seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [state.isAuthenticated, state.loading.costs, state.costs.length]);

  // Load app settings
  const loadAppSettings = async () => {
    try {
      const response = await appSettingsApi.getSettings();
      if (response.data) {
        setAppSettings(response.data);
        setProductionTarget(response.data.target_output_monthly);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };

  // Auto-refresh after CRUD operations
  useEffect(() => {
    if (state.isAuthenticated && !state.loading.costs) {
      actions.loadCosts();
    }
  }, [state.costs.length]); // Refresh when costs count changes

  // Calculate totals with dual-mode support
  const totalMonthlyCosts = state.summary?.total_biaya_aktif || 0;
  const hppCosts = state.summary?.total_hpp_group || 0;
  const operasionalCosts = state.summary?.total_operasional_group || 0;
  const costPerProduct = productionTarget > 0 ? totalMonthlyCosts / productionTarget : 0;

  // Handlers
  const handleOpenAddDialog = () => {
    setEditingCost(null);
    setShowDialog(true);
  };

  const handleOpenEditDialog = (cost: OperationalCost) => {
    setEditingCost(cost);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCost(null);
  };

  const handleSaveDialog = async (costData: any) => {
    let success = false;
    
    if (editingCost) {
      // Update existing cost
      success = await actions.updateCost(editingCost.id, costData);
    } else {
      // Create new cost
      success = await actions.createCost({
        ...costData,
        status: 'aktif'
      });
    }
    
    if (success) {
      handleCloseDialog();
      // Data will auto-refresh due to useEffect
    }
    
    return success;
  };

  const handleDeleteCost = async (costId: string) => {
    if (confirm('Yakin ingin menghapus biaya ini?')) {
      const success = await actions.deleteCost(costId);
      if (success) {
        // Data will auto-refresh due to useEffect
      }
    }
  };

  const productionSuggestions = [1000, 2000, 3000, 5000, 8000, 10000];

  // Onboarding handlers
  const handleStartOnboarding = () => {
    setShowOnboarding(true);
    setCurrentOnboardingStep(0);
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('operational-costs-onboarding-seen', 'true');
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('operational-costs-onboarding-seen', 'true');
  };

  // Quick setup for common cost types
  const handleQuickSetup = async (type: 'bakery' | 'restaurant' | 'cafe') => {
    const costTemplates = {
      bakery: [
        { nama_biaya: 'Gas Oven', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Listrik Oven', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1000000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Marketing', jumlah_per_bulan: 2000000, jenis: 'variabel' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Admin/Kasir', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const }
      ],
      restaurant: [
        { nama_biaya: 'Gas Kompor', jumlah_per_bulan: 400000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Gaji Koki', jumlah_per_bulan: 3000000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Marketing', jumlah_per_bulan: 3000000, jenis: 'variabel' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Internet & Listrik Toko', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const }
      ],
      cafe: [
        { nama_biaya: 'Listrik Coffee Machine', jumlah_per_bulan: 200000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Sewa Tempat', jumlah_per_bulan: 2000000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Gaji Barista', jumlah_per_bulan: 2500000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Marketing & Promo', jumlah_per_bulan: 1500000, jenis: 'variabel' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Internet & Musik', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const }
      ]
    };

    const templates = costTemplates[type];
    let successCount = 0;

    for (const template of templates) {
      try {
        const success = await actions.createCost({ ...template, status: 'aktif' });
        if (success) successCount++;
      } catch (error) {
        console.error('Error creating template cost:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`Setup ${type} berhasil!`, {
        description: `${successCount} biaya contoh telah ditambahkan. Silakan edit sesuai kebutuhan.`
      });
      handleCompleteOnboarding();
    }
  };

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
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang! 👋</h2>
                <p className="text-gray-600">Mari setup sistem biaya operasional Anda dalam 2 langkah mudah</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium text-blue-800">Tambah Biaya Operasional</p>
                    <p className="text-sm text-blue-600">Gas, sewa, marketing, dll (akan auto-klasifikasi)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium text-green-800">Hitung Biaya per Produk</p>
                    <p className="text-sm text-green-600">Set target produksi & kalkulasi otomatis</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700 mb-3">Pilih template bisnis untuk mulai cepat:</div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handleQuickSetup('bakery')}
                    className="w-full flex items-center justify-between p-4 h-auto bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="font-medium">🧁 Toko Roti/Bakery</div>
                      <div className="text-xs text-orange-600">Gas oven, sewa dapur, marketing, dll</div>
                    </div>
                    <div className="text-xs bg-orange-200 px-2 py-1 rounded">5 item</div>
                  </Button>
                  
                  <Button
                    onClick={() => handleQuickSetup('restaurant')}
                    className="w-full flex items-center justify-between p-4 h-auto bg-green-50 hover:bg-green-100 text-green-800 border border-green-200"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="font-medium">🍽️ Restoran/Warung</div>
                      <div className="text-xs text-green-600">Gas kompor, gaji koki, sewa, dll</div>
                    </div>
                    <div className="text-xs bg-green-200 px-2 py-1 rounded">5 item</div>
                  </Button>
                  
                  <Button
                    onClick={() => handleQuickSetup('cafe')}
                    className="w-full flex items-center justify-between p-4 h-auto bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="font-medium">☕ Cafe/Kedai Kopi</div>
                      <div className="text-xs text-purple-600">Coffee machine, barista, sewa, dll</div>
                    </div>
                    <div className="text-xs bg-purple-200 px-2 py-1 rounded">5 item</div>
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSkipOnboarding}
                    variant="outline"
                    className="w-full mb-2"
                  >
                    Mulai dari Kosong
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    💡 Tip: Template bisa diedit sesuai kebutuhan bisnis Anda
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>

              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Biaya Operasional
                </h1>
                <p className="text-white opacity-90">
                  Kelola biaya operasional dan hitung overhead per produk
                </p>
              </div>
            </div>

            <div className="hidden md:flex gap-3">
              <Button
                onClick={handleOpenAddDialog}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Biaya
              </Button>
            </div>
          </div>

          <div className="flex md:hidden flex-col gap-3 mt-6">
            <Button
              onClick={handleOpenAddDialog}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Biaya
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Tabs for Cost Management and Calculator */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Kelola Biaya
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Kalkulator Dual-Mode
            </TabsTrigger>
          </TabsList>

          {/* Tab Content: Cost Management */}
          <TabsContent value="costs" className="space-y-6">
        
        {/* Explanation Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Apa itu "Kelola Biaya"?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-blue-700 space-y-2">
              <p>📝 <strong>Tab ini untuk mengelola daftar biaya bulanan Anda:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Tambah biaya baru (gas, sewa, marketing, dll)</li>
                <li>• Edit biaya yang sudah ada (jika nominal berubah)</li>
                <li>• Klasifikasi biaya ke grup yang tepat (HPP vs Operasional)</li>
                <li>• Lihat total biaya per kategori</li>
              </ul>
              
              <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                <p className="font-medium text-blue-800 mb-2">🎯 Setelah selesai mengelola biaya:</p>
                <p>Pindah ke tab <strong>"Kalkulator Dual-Mode"</strong> untuk menghitung biaya per produk yang akan digunakan di resep.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Group Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Overhead Pabrik (HPP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-800">
                  {formatCurrency(
                    state.costs
                      .filter(c => c.group === 'HPP' && c.status === 'aktif')
                      .reduce((sum, c) => sum + c.jumlah_per_bulan, 0)
                  )}
                </div>
                <p className="text-xs text-orange-600">
                  {state.costs.filter(c => c.group === 'HPP' && c.status === 'aktif').length} item • masuk ke HPP resep
                </p>
                <p className="text-xs text-gray-500">
                  Gas, listrik oven, sewa dapur, gaji koki, dll
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Biaya Operasional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(
                    state.costs
                      .filter(c => c.group === 'OPERASIONAL' && c.status === 'aktif')
                      .reduce((sum, c) => sum + c.jumlah_per_bulan, 0)
                  )}
                </div>
                <p className="text-xs text-green-600">
                  {state.costs.filter(c => c.group === 'OPERASIONAL' && c.status === 'aktif').length} item • untuk markup harga jual
                </p>
                <p className="text-xs text-gray-500">
                  Marketing, admin, internet, biaya bank, dll
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Management Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Daftar Semua Biaya ({state.costs.length} item)</span>
              <Button
                onClick={handleOpenAddDialog}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Biaya Baru
              </Button>
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Kelola semua biaya bulanan Anda. Sistem akan otomatis menyarankan klasifikasi grup berdasarkan nama biaya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Nama Biaya</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Jumlah/Bulan</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Grup</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Jenis</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Terakhir Diperbarui</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Existing costs */}
                  {state.costs.map((cost) => (
                    <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{cost.nama_biaya}</td>
                      <td className="py-3 px-2 text-right font-medium">{formatCurrency(cost.jumlah_per_bulan)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant={cost.group === 'HPP' ? 'default' : 'secondary'}
                          className={cost.group === 'HPP' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}
                        >
                          {cost.group === 'HPP' ? '🏭 HPP' : '💼 Operasional'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={cost.jenis === 'tetap' ? 'outline' : 'secondary'} className="text-xs">
                          {cost.jenis === 'tetap' ? 'Tetap' : 'Variabel'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">{formatDate(cost.updated_at)}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditDialog(cost)}
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
                    </tr>
                  ))}

                  {/* Empty state */}
                  {state.costs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
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
                              onClick={handleOpenAddDialog}
                              size="lg"
                              className="bg-blue-600 hover:bg-blue-700 px-6"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Biaya Pertama
                            </Button>
                            
                            <div className="text-xs text-gray-400">
                              atau
                            </div>
                            
                            <Button
                              onClick={handleStartOnboarding}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              🚀 Setup Cepat dengan Template
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
                
                {/* Total Row */}
                {state.costs.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-semibold bg-gray-50">
                      <td className="py-3 px-2">Total Semua Biaya:</td>
                      <td className="py-3 px-2 text-right text-lg">{formatCurrency(totalMonthlyCosts)}</td>
                      <td className="py-3 px-2"></td>
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

          </TabsContent>

          {/* Tab Content: Dual-Mode Calculator */}
          <TabsContent value="calculator" className="space-y-6">
            
            {/* Progress Indicator */}
            {state.costs.length > 0 && (
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Progress Setup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Step 1 */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          ✓
                        </div>
                        <span className="text-sm font-medium text-green-800">Biaya Ditambahkan</span>
                      </div>
                      
                      <div className="w-8 h-1 bg-green-300 rounded"></div>
                      
                      {/* Step 2 */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          appSettings?.overhead_per_pcs && appSettings?.operasional_per_pcs 
                            ? 'bg-green-600 text-white' 
                            : 'bg-indigo-600 text-white'
                        }`}>
                          {appSettings?.overhead_per_pcs && appSettings?.operasional_per_pcs ? '✓' : '2'}
                        </div>
                        <span className={`text-sm font-medium ${
                          appSettings?.overhead_per_pcs && appSettings?.operasional_per_pcs 
                            ? 'text-green-800' 
                            : 'text-indigo-800'
                        }`}>
                          Kalkulasi Selesai
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-indigo-600">
                        {state.costs.length} biaya • {state.costs.filter(c => c.group === 'HPP').length} HPP + {state.costs.filter(c => c.group === 'OPERASIONAL').length} Operasional
                      </div>
                      {appSettings?.overhead_per_pcs && appSettings?.operasional_per_pcs && (
                        <div className="text-xs text-green-600 font-medium">
                          Siap digunakan di resep! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* No costs warning */}
            {state.costs.length === 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-800">Belum ada data biaya</p>
                      <p className="text-sm text-yellow-700">Tambahkan biaya operasional dulu di tab "Kelola Biaya"</p>
                    </div>
                    <Button
                      onClick={() => setActiveTab('costs')}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Ke Tab Kelola Biaya
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Calculator Guide Card */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Calculator className="h-5 w-5" />
                  Kalkulator Dual-Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-purple-700 space-y-2">
                  <p>🧮 <strong>Hitung biaya per produk dari daftar biaya yang sudah Anda kelola:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Set target produksi bulanan</li>
                    <li>• Hitung overhead HPP per produk (masuk ke resep)</li>
                    <li>• Hitung biaya operasional per produk (untuk markup)</li>
                    <li>• Simpan hasil untuk digunakan otomatis di resep</li>
                  </ul>
                  
                  <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                    <p className="text-sm">
                      💡 <strong>Data biaya:</strong> {state.costs.length} item biaya siap dihitung
                      ({state.costs.filter(c => c.group === 'HPP').length} HPP + {state.costs.filter(c => c.group === 'OPERASIONAL').length} Operasional)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <DualModeCalculator
              costs={state.costs}
              currentSettings={appSettings}
              onCalculationComplete={(hppResult, operasionalResult) => {
                loadAppSettings();
              }}
            />
          </TabsContent>

        </Tabs>

      </div>

      {/* Cost Form Dialog */}
      <CostFormDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveDialog}
        cost={editingCost}
        isLoading={state.loading.costs}
      />
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
