import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Edit, Trash2, DollarSign, Calendar, TrendingUp, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAssets } from '@/contexts/AssetContext';
import { Asset, AssetCategory, AssetCondition } from '@/types/asset';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { formatDateForDisplay, formatDateToYYYYMMDD, safeParseDate } from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { getInputValue } from '@/utils/inputUtils';

const AssetManagement = () => {
  const isMobile = useIsMobile();

  // Get context values with proper fallbacks
  const contextValue = useAssets();
  const {
    assets = [],
    loading = false,
    addAsset = () => Promise.resolve(false),
    updateAsset = () => Promise.resolve(false),
    deleteAsset = () => Promise.resolve(false)
  } = contextValue || {};

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data with proper defaults
  const initialFormData: Partial<Asset> = {
    nama: '',
    kategori: undefined,
    nilaiAwal: 0,
    nilaiSaatIni: 0,
    tanggalPembelian: null,
    kondisi: undefined,
    lokasi: '',
    deskripsi: '',
    depresiasi: null,
  };

  const [formData, setFormData] = useState<Partial<Asset>>(initialFormData);

  // Condition colors with proper typing
  const kondisiColors: { [key in AssetCondition]: string } = {
    'Baik': 'bg-green-100 text-green-800',
    'Rusak Ringan': 'bg-yellow-100 text-yellow-800',
    'Rusak Berat': 'bg-red-100 text-red-800'
  };

  // Memoized calculations with safety checks
  const calculations = useMemo(() => {
    if (!Array.isArray(assets)) {
      return {
        totalNilaiAwal: 0,
        totalNilaiSaatIni: 0,
        totalDepresiasi: 0,
        validAssets: []
      };
    }

    const validAssets = assets.filter(asset => 
      asset && 
      asset.tanggalPembelian instanceof Date && 
      !isNaN(asset.tanggalPembelian.getTime())
    );

    const totalNilaiAwal = validAssets.reduce((sum, asset) => sum + (asset.nilaiAwal || 0), 0);
    const totalNilaiSaatIni = validAssets.reduce((sum, asset) => sum + (asset.nilaiSaatIni || 0), 0);
    const totalDepresiasi = validAssets.reduce((sum, asset) => sum + (asset.depresiasi || 0), 0);

    return {
      totalNilaiAwal,
      totalNilaiSaatIni,
      totalDepresiasi,
      validAssets
    };
  }, [assets]);

  const resetFormData = () => {
    setFormData(initialFormData);
    setSelectedAsset(null);
    setIsEditing(false);
  };

  const handleEdit = (asset: Asset) => {
    if (!asset) {
      toast.error('Data aset tidak valid');
      return;
    }

    setSelectedAsset(asset);
    setFormData({
      nama: asset.nama || '',
      kategori: asset.kategori,
      nilaiAwal: asset.nilaiAwal || 0,
      nilaiSaatIni: asset.nilaiSaatIni || 0,
      tanggalPembelian: asset.tanggalPembelian instanceof Date && !isNaN(asset.tanggalPembelian.getTime()) 
        ? new Date(asset.tanggalPembelian) 
        : null,
      kondisi: asset.kondisi,
      lokasi: asset.lokasi || '',
      deskripsi: asset.deskripsi || '',
      depresiasi: asset.depresiasi,
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const validateFormData = (): boolean => {
    if (!formData.nama || formData.nama.trim() === '') {
      toast.error('Nama aset wajib diisi');
      return false;
    }
    
    if (!formData.kategori) {
      toast.error('Kategori aset wajib dipilih');
      return false;
    }
    
    if (!formData.kondisi) {
      toast.error('Kondisi aset wajib dipilih');
      return false;
    }
    
    if (!formData.lokasi || formData.lokasi.trim() === '') {
      toast.error('Lokasi aset wajib diisi');
      return false;
    }
    
    if (formData.nilaiAwal === undefined || formData.nilaiAwal < 0) {
      toast.error('Nilai awal harus berupa angka positif');
      return false;
    }
    
    if (formData.nilaiSaatIni === undefined || formData.nilaiSaatIni < 0) {
      toast.error('Nilai sekarang harus berupa angka positif');
      return false;
    }
    
    if (!formData.tanggalPembelian || 
        !(formData.tanggalPembelian instanceof Date) || 
        isNaN(formData.tanggalPembelian.getTime())) {
      toast.error('Tanggal pembelian wajib diisi dengan format yang valid');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateFormData()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        nama: formData.nama!.trim(),
        kategori: formData.kategori as AssetCategory,
        nilaiAwal: formData.nilaiAwal!,
        nilaiSaatIni: formData.nilaiSaatIni!,
        tanggalPembelian: formData.tanggalPembelian!,
        kondisi: formData.kondisi as AssetCondition,
        lokasi: formData.lokasi!.trim(),
        deskripsi: formData.deskripsi?.trim() || null,
        depresiasi: formData.depresiasi,
      };

      let success = false;
      if (isEditing && selectedAsset?.id) {
        success = await updateAsset(selectedAsset.id, assetData);
      } else {
        success = await addAsset(assetData);
      }

      if (success) {
        toast.success(isEditing ? 'Aset berhasil diperbarui' : 'Aset berhasil ditambahkan');
        setShowAddForm(false);
        resetFormData();
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(isEditing ? 'Gagal memperbarui aset' : 'Gagal menambahkan aset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, assetName?: string) => {
    if (!id) {
      toast.error('ID aset tidak valid');
      return;
    }

    try {
      const success = await deleteAsset(id);
      if (success) {
        toast.success(`Aset ${assetName || ''} berhasil dihapus`);
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Gagal menghapus aset');
    }
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    resetFormData();
  };

  // If context is not available, show error
  if (!contextValue) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
          <p className="text-gray-600">Asset Context tidak tersedia. Pastikan komponen ini dibungkus dengan AssetProvider.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data aset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className={`w-full max-w-none px-4 py-4 ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Manajemen Aset
              </h1>
              <p className="text-gray-600 text-sm">
                Kelola dan pantau aset bisnis Anda
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          <Card className="shadow-lg border-orange-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-2 mr-3">
                  <Package className="text-orange-600 h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-600 text-sm">Total Aset</p>
                  <p className="font-bold text-gray-900 text-xl sm:text-2xl">{calculations.validAssets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-orange-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-2 mr-3">
                  <DollarSign className="text-orange-600 h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-600 text-sm">Nilai Awal</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(calculations.totalNilaiAwal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-orange-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-2 mr-3">
                  <TrendingUp className="text-orange-600 h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-600 text-sm">Nilai Sekarang</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(calculations.totalNilaiSaatIni)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-orange-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <Calendar className="text-red-600 h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-600 text-sm">Total Depresiasi</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(calculations.totalDepresiasi)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets Table/List */}
        <Card className="shadow-lg border-orange-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg">Daftar Aset</CardTitle>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto text-sm py-2 px-3"
                    onClick={resetFormData}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Aset
                  </Button>
                </DialogTrigger>
                <DialogContent className={`${isMobile ? 'w-[95vw] max-w-sm h-[90vh] flex flex-col' : 'w-[95vw] max-w-md max-h-[90vh] flex flex-col'} mx-auto`}>
                  <DialogHeader>
                    <DialogTitle className="text-orange-600">
                      {isEditing ? 'Edit Aset' : 'Tambah Aset Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-grow overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nama" className="text-gray-700">Nama Aset *</Label>
                          <Input
                            id="nama"
                            value={getInputValue(formData.nama)}
                            onChange={(e) => setFormData({...formData, nama: e.target.value})}
                            placeholder="Masukkan nama aset"
                            className="border-orange-200 focus:border-orange-400"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="kategori" className="text-gray-700">Kategori *</Label>
                          <Select
                            value={getInputValue(formData.kategori) as string}
                            onValueChange={(value: AssetCategory) =>
                              setFormData({...formData, kategori: value})
                            }
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Peralatan">Peralatan</SelectItem>
                              <SelectItem value="Kendaraan">Kendaraan</SelectItem>
                              <SelectItem value="Bangunan">Bangunan</SelectItem>
                              <SelectItem value="Mesin">Mesin</SelectItem>
                              <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nilaiAwal" className="text-gray-700">Nilai Awal *</Label>
                          <Input
                            id="nilaiAwal"
                            type="number"
                            value={getInputValue(formData.nilaiAwal)}
                            onChange={(e) => setFormData({
                              ...formData, 
                              nilaiAwal: e.target.value ? Number(e.target.value) : 0
                            })}
                            placeholder="0"
                            className="border-orange-200 focus:border-orange-400"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nilaiSaatIni" className="text-gray-700">Nilai Sekarang *</Label>
                          <Input
                            id="nilaiSaatIni"
                            type="number"
                            value={getInputValue(formData.nilaiSaatIni)}
                            onChange={(e) => setFormData({
                              ...formData, 
                              nilaiSaatIni: e.target.value ? Number(e.target.value) : 0
                            })}
                            placeholder="0"
                            className="border-orange-200 focus:border-orange-400"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tanggalPembelian" className="text-gray-700">Tanggal Pembelian *</Label>
                        <Input
                          id="tanggalPembelian"
                          type="date"
                          value={formatDateToYYYYMMDD(formData.tanggalPembelian)}
                          onChange={(e) => setFormData({
                            ...formData,
                            tanggalPembelian: safeParseDate(e.target.value)
                          })}
                          className="border-orange-200 focus:border-orange-400"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="depresiasi" className="text-gray-700">Depresiasi (%)</Label>
                        <Input
                          id="depresiasi"
                          type="number"
                          value={getInputValue(formData.depresiasi)}
                          onChange={(e) => setFormData({
                            ...formData, 
                            depresiasi: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          placeholder="0"
                          className="border-orange-200 focus:border-orange-400"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="kondisi" className="text-gray-700">Kondisi *</Label>
                          <Select
                            value={getInputValue(formData.kondisi) as string}
                            onValueChange={(value: AssetCondition) =>
                              setFormData({...formData, kondisi: value})
                            }
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400">
                              <SelectValue placeholder="Pilih kondisi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baik">Baik</SelectItem>
                              <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                              <SelectItem value="Rusak Berat">Rusak Berat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="lokasi" className="text-gray-700">Lokasi *</Label>
                          <Input
                            id="lokasi"
                            value={getInputValue(formData.lokasi)}
                            onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                            placeholder="Masukkan lokasi aset"
                            className="border-orange-200 focus:border-orange-400"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="deskripsi" className="text-gray-700">Deskripsi</Label>
                        <Textarea
                          id="deskripsi"
                          value={getInputValue(formData.deskripsi)}
                          onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                          placeholder="Masukkan deskripsi aset"
                          rows={3}
                          className="border-orange-200 focus:border-orange-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        isEditing ? 'Update' : 'Simpan'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleFormClose}
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Mobile View */}
            {isMobile ? (
              <div className="space-y-4">
                {calculations.validAssets.length > 0 ? (
                  calculations.validAssets.map((asset) => (
                    <Card key={asset.id} className="border border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm text-gray-900">{asset.nama}</h3>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(asset)}
                              className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-50"
                              title="Edit Aset"
                            >
                              <Edit className="h-3 w-3 text-orange-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(asset.id, asset.nama)}
                              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
                              title="Hapus Aset"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kategori:</span>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {asset.kategori}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nilai Awal:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(asset.nilaiAwal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nilai Sekarang:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(asset.nilaiSaatIni)}
                            </span>
                          </div>
                          {asset.depresiasi !== undefined && asset.depresiasi !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Depresiasi (%):</span>
                              <span className="font-medium text-gray-900">{asset.depresiasi}%</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kondisi:</span>
                            <Badge className={`${kondisiColors[asset.kondisi]} text-xs`}>
                              {asset.kondisi}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lokasi:</span>
                            <span className="font-medium text-gray-900">{asset.lokasi}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tanggal Pembelian:</span>
                            <span className="font-medium text-gray-900">
                              {asset.tanggalPembelian ? formatDateForDisplay(asset.tanggalPembelian) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base">Belum ada aset yang terdaftar</p>
                    <p className="text-sm mt-1">Klik tombol "Tambah Aset" untuk memulai</p>
                  </div>
                )}
              </div>
            ) : (
              /* Desktop View */
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px] text-gray-700">Nama Aset</TableHead>
                        <TableHead className="text-gray-700">Kategori</TableHead>
                        <TableHead className="text-gray-700">Nilai Awal</TableHead>
                        <TableHead className="text-gray-700">Nilai Sekarang</TableHead>
                        <TableHead className="text-gray-700">Depresiasi (%)</TableHead>
                        <TableHead className="text-gray-700">Kondisi</TableHead>
                        <TableHead className="text-gray-700">Lokasi</TableHead>
                        <TableHead className="text-gray-700">Tanggal Pembelian</TableHead>
                        <TableHead className="text-right text-gray-700">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculations.validAssets.length > 0 ? (
                        calculations.validAssets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium text-gray-900">{asset.nama}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                {asset.kategori}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900">
                              {formatCurrency(asset.nilaiAwal)}
                            </TableCell>
                            <TableCell className="text-gray-900">
                              {formatCurrency(asset.nilaiSaatIni)}
                            </TableCell>
                            <TableCell className="text-gray-900">
                              {asset.depresiasi?.toFixed(1) || 0}%
                            </TableCell>
                            <TableCell>
                              <Badge className={kondisiColors[asset.kondisi]}>
                                {asset.kondisi}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900">{asset.lokasi}</TableCell>
                            <TableCell className="text-gray-900">
                              {asset.tanggalPembelian ? formatDateForDisplay(asset.tanggalPembelian) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(asset)}
                                  className="border-orange-300 hover:bg-orange-50"
                                  title="Edit Aset"
                                >
                                  <Edit className="h-4 w-4 text-orange-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(asset.id, asset.nama)}
                                  className="bg-red-600 hover:bg-red-700"
                                  title="Hapus Aset"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex flex-col items-center gap-4">
                              <Building2 className="h-16 w-16 text-gray-300" />
                              <div className="text-center">
                                <p className="text-lg font-medium text-gray-600 mb-2">
                                  Belum ada aset yang terdaftar
                                </p>
                                <p className="text-gray-500 text-sm">
                                  Klik tombol "Tambah Aset" untuk memulai mengelola aset
                                </p>
                              </div>
                              <Button
                                onClick={() => setShowAddForm(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Aset Pertama
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetManagement;