import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Edit, Trash2, DollarSign, Calendar, TrendingUp, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAssets, Asset } from '@/hooks/useAssets';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { formatDateForDisplay, formatDateToYYYYMMDD, safeParseDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { getInputValue } from '@/utils/inputUtils';

const AssetManagement = () => {
  const isMobile = useIsMobile();
  const { assets, loading, addAsset, updateAsset, deleteAsset } = useAssets();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Asset>>({
    nama: '',
    kategori: undefined,
    nilaiAwal: 0,
    nilaiSaatIni: 0,
    tanggalPembelian: null,
    kondisi: undefined,
    lokasi: '',
    deskripsi: '',
    depresiasi: null,
    penyusutanPerBulan: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kondisiColors: { [key: string]: string } = {
    'Baik': 'bg-orange-100 text-orange-800',
    'Cukup': 'bg-red-100 text-red-800',
    'Buruk': 'bg-red-200 text-red-900'
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      nama: asset.nama,
      kategori: asset.kategori,
      nilaiAwal: asset.nilaiAwal,
      nilaiSaatIni: asset.nilaiSaatIni,
      tanggalPembelian: asset.tanggalPembelian instanceof Date && !isNaN(asset.tanggalPembelian.getTime()) ? new Date(asset.tanggalPembelian) : new Date(),
      kondisi: asset.kondisi,
      lokasi: asset.lokasi,
      deskripsi: asset.deskripsi,
      depresiasi: asset.depresiasi,
      penyusutanPerBulan: asset.penyusutanPerBulan,
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.nama || !formData.kategori || !formData.kondisi || !formData.lokasi || formData.nilaiAwal === undefined || formData.nilaiAwal < 0 || formData.nilaiSaatIni === undefined || formData.nilaiSaatIni < 0) {
      toast.error("Harap lengkapi semua field wajib dan pastikan nilai tidak negatif.");
      return;
    }
    
    if (formData.tanggalPembelian === null || formData.tanggalPembelian === undefined) {
      toast.error("Tanggal Pembelian wajib diisi.");
      return;
    }
    if (!(formData.tanggalPembelian instanceof Date) || isNaN(formData.tanggalPembelian.getTime())) {
      toast.error("Tanggal Pembelian tidak valid.");
      return;
    }

    setIsSubmitting(true);

    const assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> = {
      nama: formData.nama,
      kategori: formData.kategori as 'Peralatan' | 'Kendaraan' | 'Properti' | 'Teknologi',
      nilaiAwal: formData.nilaiAwal,
      nilaiSaatIni: formData.nilaiSaatIni,
      tanggalPembelian: formData.tanggalPembelian,
      kondisi: formData.kondisi as 'Baik' | 'Cukup' | 'Buruk',
      lokasi: formData.lokasi,
      deskripsi: formData.deskripsi || '',
      depresiasi: formData.depresiasi,
      penyusutanPerBulan: formData.penyusutanPerBulan || 0,
    };

    let success = false;
    if (isEditing && selectedAsset) {
      success = await updateAsset(selectedAsset.id, assetData);
    } else {
      success = await addAsset(assetData);
    }

    if (success) {
      setIsEditing(false);
      setShowAddForm(false);
      setSelectedAsset(null);
      setFormData({
        nama: '',
        kategori: undefined,
        nilaiAwal: 0,
        nilaiSaatIni: 0,
        tanggalPembelian: null,
        kondisi: undefined,
        lokasi: '',
        deskripsi: '',
        depresiasi: null,
        penyusutanPerBulan: 0,
      });
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus aset ini?")) {
      await deleteAsset(id);
      toast.success("Aset berhasil dihapus!");
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat data aset...</p>
        </div>
      </div>
    );
  }

  const totalNilaiAwal = assets.reduce((sum, asset) => sum + asset.nilaiAwal, 0);
  const totalNilaiSaatIni = assets.reduce((sum, asset) => sum + asset.nilaiSaatIni, 0);
  const totalDepresiasi = assets.reduce((sum, asset) => sum + (asset.depresiasi || 0), 0);

  console.log('--- Assets List Date Debug ---');
  assets.forEach(asset => {
    console.log(`Asset ID: ${asset.id || asset.nama}`);
    console.log(`  tanggalPembelian: ${asset.tanggalPembelian}, Valid: ${asset.tanggalPembelian instanceof Date && !isNaN(asset.tanggalPembelian.getTime())}`);
    console.log(`  createdAt: ${asset.createdAt}, Valid: ${asset.createdAt instanceof Date && !isNaN(asset.createdAt.getTime())}`);
    console.log(`  updatedAt: ${asset.updatedAt}, Valid: ${asset.updatedAt instanceof Date && !isNaN(asset.updatedAt.getTime())}`);
  });
  console.log('------------------------------');

  return (
    <div className="w-full min-h-screen bg-white">
      <div className={`w-full max-w-none px-4 py-4 ${isMobile ? 'pb-20' : ''}`}>
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

        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          <Card className="shadow-lg border-orange-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-2 mr-3">
                  <Package className="text-orange-600 h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-600 text-sm">Total Aset</p>
                  <p className="font-bold text-gray-900 text-xl sm:text-2xl">{assets.length}</p>
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
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(totalNilaiAwal)}</p>
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
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(totalNilaiSaatIni)}</p>
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
                  <p className="font-medium text-gray-600 text-sm">Depresiasi</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(totalDepresiasi)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-orange-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg">Daftar Aset</CardTitle>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto text-sm py-2 px-3"
                    onClick={() => {
                      setFormData({
                        nama: '',
                        kategori: undefined,
                        nilaiAwal: 0,
                        nilaiSaatIni: 0,
                        tanggalPembelian: null,
                        kondisi: undefined,
                        lokasi: '',
                        deskripsi: '',
                        depresiasi: null,
                        penyusutanPerBulan: 0,
                      });
                      setIsEditing(false);
                    }}
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
                            onValueChange={(value: 'Peralatan' | 'Kendaraan' | 'Properti' | 'Teknologi') =>
                              setFormData({...formData, kategori: value})
                            }
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Peralatan">Peralatan</SelectItem>
                              <SelectItem value="Kendaraan">Kendaraan</SelectItem>
                              <SelectItem value="Properti">Properti</SelectItem>
                              <SelectItem value="Teknologi">Teknologi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nilaiAwal" className="text-gray-700">Nilai Awal</Label>
                          <Input
                            id="nilaiAwal"
                            type="number"
                            value={getInputValue(formData.nilaiAwal)}
                            onChange={(e) => setFormData({...formData, nilaiAwal: Number(e.target.value)})}
                            placeholder="0"
                            className="border-orange-200 focus:border-orange-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nilaiSaatIni" className="text-gray-700">Nilai Sekarang</Label>
                          <Input
                            id="nilaiSaatIni"
                            type="number"
                            value={getInputValue(formData.nilaiSaatIni)}
                            onChange={(e) => setFormData({...formData, nilaiSaatIni: Number(e.target.value)})}
                            placeholder="0"
                            className="border-orange-200 focus:border-orange-400"
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
                          onChange={(e) => setFormData({...formData, depresiasi: parseFloat(e.target.value) || null})}
                          placeholder="0"
                          className="border-orange-200 focus:border-orange-400"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="kondisi" className="text-gray-700">Kondisi *</Label>
                          <Select
                            value={getInputValue(formData.kondisi) as string}
                            onValueChange={(value: 'Baik' | 'Cukup' | 'Buruk') =>
                              setFormData({...formData, kondisi: value})
                            }
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400">
                              <SelectValue placeholder="Pilih kondisi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baik">Baik</SelectItem>
                              <SelectItem value="Cukup">Cukup</SelectItem>
                              <SelectItem value="Buruk">Buruk</SelectItem>
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
                      {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Update' : 'Simpan')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setIsEditing(false);
                        setFormData({
                          nama: '',
                          kategori: undefined,
                          nilaiAwal: 0,
                          nilaiSaatIni: 0,
                          tanggalPembelian: null,
                          kondisi: undefined,
                          lokasi: '',
                          deskripsi: '',
                          depresiasi: null,
                          penyusutanPerBulan: 0,
                        });
                      }}
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
            {isMobile ? (
              <div className="space-y-4">
                {assets
                  .filter(asset => asset.tanggalPembelian instanceof Date && !isNaN(asset.tanggalPembelian.getTime()))
                  .map((asset) => (
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
                            >
                              <Edit className="h-3 w-3 text-orange-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(asset.id)}
                              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kategori:</span>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">{asset.kategori}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nilai Awal:</span>
                            <span className="font-medium text-gray-900">{formatCurrency(asset.nilaiAwal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nilai Sekarang:</span>
                            <span className="font-medium text-gray-900">{formatCurrency(asset.nilaiSaatIni)}</span>
                          </div>
                          {asset.depresiasi !== undefined && asset.depresiasi !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Depresiasi:</span>
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
                            <span className="font-medium text-gray-900">{asset.tanggalPembelian ? formatDateForDisplay(asset.tanggalPembelian) : 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] text-gray-700">Nama Aset</TableHead>
                        <TableHead className="text-gray-700">Kategori</TableHead>
                        <TableHead className="text-gray-700">Nilai Awal</TableHead>
                        <TableHead className="text-gray-700">Nilai Sekarang</TableHead>
                        <TableHead className="text-gray-700">Depresiasi</TableHead>
                        <TableHead className="text-gray-700">Kondisi</TableHead>
                        <TableHead className="text-gray-700">Lokasi</TableHead>
                        <TableHead className="text-gray-700">Tanggal Pembelian</TableHead>
                        <TableHead className="text-right text-gray-700">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets
                        .filter(asset => asset.tanggalPembelian instanceof Date && !isNaN(asset.tanggalPembelian.getTime()))
                        .map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium text-gray-900">{asset.nama}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">{asset.kategori}</Badge>
                            </TableCell>
                            <TableCell className="text-gray-900">{formatCurrency(asset.nilaiAwal)}</TableCell>
                            <TableCell className="text-gray-900">{formatCurrency(asset.nilaiSaatIni)}</TableCell>
                            <TableCell className="text-gray-900">{asset.depresiasi?.toFixed(1) || 0}%</TableCell>
                            <TableCell>
                              <Badge className={kondisiColors[asset.kondisi]}>
                                {asset.kondisi}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900">{asset.lokasi}</TableCell>
                            <TableCell className="text-gray-900">{asset.tanggalPembelian ? formatDateForDisplay(asset.tanggalPembelian) : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(asset)}
                                  className="border-orange-300 hover:bg-orange-50"
                                >
                                  <Edit className="h-4 w-4 text-orange-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(asset.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
            {assets.length === 0 && !isMobile && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base">Belum ada aset yang terdaftar</p>
                <p className="text-sm mt-1">Klik tombol "Tambah Aset" untuk memulai</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetManagement;