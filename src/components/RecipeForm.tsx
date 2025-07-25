import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator, Package, Users, Info } from 'lucide-react';
import { useBahanBaku } from '@/components/warehouse/context/BahanBakuContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Recipe, NewRecipe, RecipeIngredient } from '@/types/recipe';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

interface RecipeFormProps {
  initialData?: Recipe | null;
  onSave: (recipeData: NewRecipe) => void;
  onCancel: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ initialData, onSave, onCancel }) => {
  const { bahanBaku } = useBahanBaku();
  const { settings } = useUserSettings();
  
  const [recipeData, setRecipeData] = useState<Partial<NewRecipe>>({
    namaResep: '',
    jumlahPorsi: 1,
    kategoriResep: '',
    deskripsi: '',
    fotoUrl: '',
    bahanResep: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntunganPersen: 30,
    jumlahPcsPerPorsi: 1,
    totalHpp: 0,
    hppPerPorsi: 0,
    hargaJualPorsi: 0,
    hppPerPcs: 0,
    hargaJualPerPcs: 0,
  });

  const [newIngredient, setNewIngredient] = useState<{ id: string; jumlah: number; }>({ 
    id: '', 
    jumlah: 0 
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setRecipeData({
        ...initialData,
        jumlahPcsPerPorsi: initialData.jumlahPcsPerPorsi || 1,
        hppPerPcs: initialData.hppPerPcs || 0,
        hargaJualPerPcs: initialData.hargaJualPerPcs || 0,
        hargaJualPorsi: initialData.hargaJualPorsi || 0,
        totalHpp: initialData.totalHpp || 0,
        hppPerPorsi: initialData.hppPerPorsi || 0,
        biayaTenagaKerja: initialData.biayaTenagaKerja || 0,
        biayaOverhead: initialData.biayaOverhead || 0,
        marginKeuntunganPersen: initialData.marginKeuntunganPersen || 30,
      });
    }
  }, [initialData]);

  // Enhanced HPP Calculation with Per PCS Support
  useEffect(() => {
    const calculateHPP = () => {
      const totalBahanBaku = recipeData.bahanResep?.reduce((sum, item) => sum + item.totalHarga, 0) || 0;
      const biayaTenagaKerja = recipeData.biayaTenagaKerja || 0;
      const biayaOverhead = recipeData.biayaOverhead || 0;
      const jumlahPorsi = recipeData.jumlahPorsi || 1;
      const jumlahPcsPerPorsi = recipeData.jumlahPcsPerPorsi || 1;
      const marginPersen = recipeData.marginKeuntunganPersen || 0;

      // Calculate total HPP
      const totalHpp = totalBahanBaku + biayaTenagaKerja + biayaOverhead;
      
      // Calculate HPP per porsi
      const hppPerPorsi = jumlahPorsi > 0 ? totalHpp / jumlahPorsi : 0;
      
      // Calculate HPP per PCS
      const hppPerPcs = jumlahPcsPerPorsi > 0 ? hppPerPorsi / jumlahPcsPerPorsi : 0;
      
      // Calculate margin amount
      const marginAmount = (totalHpp * marginPersen) / 100;
      
      // Calculate selling prices
      const hargaJualPorsi = hppPerPorsi + (marginAmount / jumlahPorsi);
      const hargaJualPerPcs = hppPerPcs + (marginAmount / jumlahPorsi / jumlahPcsPerPorsi);

      setRecipeData(prev => ({
        ...prev,
        totalHpp,
        hppPerPorsi,
        hargaJualPorsi,
        hppPerPcs,
        hargaJualPerPcs,
      }));
    };

    calculateHPP();
  }, [
    recipeData.bahanResep,
    recipeData.biayaTenagaKerja,
    recipeData.biayaOverhead,
    recipeData.jumlahPorsi,
    recipeData.jumlahPcsPerPorsi,
    recipeData.marginKeuntunganPersen
  ]);

  const handleInputChange = (field: keyof NewRecipe, value: any) => {
    setRecipeData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddIngredient = () => {
    if (!newIngredient.id || newIngredient.jumlah <= 0) {
      toast.error("Pilih bahan dan masukkan jumlah yang valid.");
      return;
    }

    const selectedBahan = bahanBaku.find(b => b.id === newIngredient.id);
    if (!selectedBahan) {
      toast.error("Bahan baku tidak ditemukan.");
      return;
    }

    const existingIngredient = recipeData.bahanResep?.find(item => item.id === selectedBahan.id);
    if (existingIngredient) {
      toast.error("Bahan sudah ditambahkan. Edit jumlahnya jika diperlukan.");
      return;
    }

    const ingredientToAdd: RecipeIngredient = {
      id: selectedBahan.id,
      nama: selectedBahan.nama,
      jumlah: newIngredient.jumlah,
      satuan: selectedBahan.satuan,
      hargaSatuan: selectedBahan.hargaSatuan,
      totalHarga: selectedBahan.hargaSatuan * newIngredient.jumlah,
      isFromInventory: true,
      inventoryId: selectedBahan.id,
    };

    handleInputChange('bahanResep', [...(recipeData.bahanResep || []), ingredientToAdd]);
    setNewIngredient({ id: '', jumlah: 0 });
    toast.success(`${selectedBahan.nama} berhasil ditambahkan`);
  };

  const handleRemoveIngredient = (id: string) => {
    const ingredient = recipeData.bahanResep?.find(item => item.id === id);
    handleInputChange('bahanResep', (recipeData.bahanResep || []).filter(item => item.id !== id));
    if (ingredient) {
      toast.success(`${ingredient.nama} dihapus dari resep`);
    }
  };

  const handleUpdateIngredientQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    const updatedIngredients = (recipeData.bahanResep || []).map(item => {
      if (item.id === id) {
        return {
          ...item,
          jumlah: newQuantity,
          totalHarga: item.hargaSatuan * newQuantity
        };
      }
      return item;
    });

    handleInputChange('bahanResep', updatedIngredients);
  };
  
  const validateRecipe = (): boolean => {
    if (!recipeData.namaResep?.trim()) {
      toast.error("Nama resep wajib diisi");
      return false;
    }

    if (!recipeData.jumlahPorsi || recipeData.jumlahPorsi <= 0) {
      toast.error("Jumlah porsi harus lebih dari 0");
      return false;
    }

    if (!recipeData.jumlahPcsPerPorsi || recipeData.jumlahPcsPerPorsi <= 0) {
      toast.error("Jumlah pcs per porsi harus lebih dari 0");
      return false;
    }

    if (!recipeData.bahanResep || recipeData.bahanResep.length === 0) {
      toast.error("Minimal harus ada 1 bahan resep");
      return false;
    }

    if (recipeData.marginKeuntunganPersen && recipeData.marginKeuntunganPersen < 0) {
      toast.error("Margin keuntungan tidak boleh negatif");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateRecipe()) return;
    
    console.log('[RecipeForm] Saving recipe with data:', recipeData);
    
    const recipeToSave: NewRecipe = {
      namaResep: recipeData.namaResep!.trim(),
      jumlahPorsi: recipeData.jumlahPorsi!,
      kategoriResep: recipeData.kategoriResep || null,
      deskripsi: recipeData.deskripsi?.trim() || null,
      fotoUrl: recipeData.fotoUrl?.trim() || null,
      bahanResep: recipeData.bahanResep!,
      biayaTenagaKerja: recipeData.biayaTenagaKerja || 0,
      biayaOverhead: recipeData.biayaOverhead || 0,
      marginKeuntunganPersen: recipeData.marginKeuntunganPersen || 0,
      jumlahPcsPerPorsi: recipeData.jumlahPcsPerPorsi || 1,
      totalHpp: recipeData.totalHpp || 0,
      hppPerPorsi: recipeData.hppPerPorsi || 0,
      hargaJualPorsi: recipeData.hargaJualPorsi || 0,
      hppPerPcs: recipeData.hppPerPcs || 0,
      hargaJualPerPcs: recipeData.hargaJualPerPcs || 0,
    };

    console.log('[RecipeForm] Recipe to save:', recipeToSave);
    onSave(recipeToSave);
  };

  const totalIngredientCost = recipeData.bahanResep?.reduce((sum, item) => sum + item.totalHarga, 0) || 0;
  const profitPerPorsi = (recipeData.hargaJualPorsi || 0) - (recipeData.hppPerPorsi || 0);
  const profitPerPcs = (recipeData.hargaJualPerPcs || 0) - (recipeData.hppPerPcs || 0);
  const totalPcsProduced = (recipeData.jumlahPorsi || 1) * (recipeData.jumlahPcsPerPorsi || 1);

  return (
    <div className="space-y-6 pb-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informasi Dasar
          </CardTitle>
          <CardDescription>Detail dasar resep yang akan dibuat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="namaResep">Nama Resep *</Label>
              <Input
                id="namaResep"
                value={recipeData.namaResep || ''}
                onChange={e => handleInputChange('namaResep', e.target.value)}
                placeholder="Contoh: Nasi Goreng Spesial"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="kategoriResep">Kategori Resep</Label>
              <Select value={recipeData.kategoriResep || 'none'} onValueChange={val => handleInputChange('kategoriResep', val === 'none' ? null : val)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada Kategori</SelectItem>
                  {(settings?.recipeCategories || []).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jumlahPorsi">Jumlah Porsi *</Label>
              <Input
                id="jumlahPorsi"
                type="number"
                min="1"
                value={recipeData.jumlahPorsi || ''}
                onChange={e => handleInputChange('jumlahPorsi', Number(e.target.value))}
                className="mt-1"
              />
            </div>

            {/* Jumlah PCS per Porsi */}
            <div>
              <Label htmlFor="jumlahPcsPerPorsi">
                Jumlah Pcs per Porsi *
                <span className="text-xs text-gray-500 ml-1">(untuk kalkulasi HPP per pcs)</span>
              </Label>
              <Input
                id="jumlahPcsPerPorsi"
                type="number"
                min="1"
                value={recipeData.jumlahPcsPerPorsi || ''}
                onChange={e => handleInputChange('jumlahPcsPerPorsi', Number(e.target.value))}
                className="mt-1"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total produksi: {totalPcsProduced} pcs
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={recipeData.deskripsi || ''}
              onChange={e => handleInputChange('deskripsi', e.target.value)}
              placeholder="Deskripsi singkat tentang resep ini..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bahan-bahan
          </CardTitle>
          <CardDescription>Tambah bahan baku yang diperlukan untuk resep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Ingredient Form */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-4 bg-gray-50 rounded-lg">
            <div className="md:col-span-2">
              <Label>Nama Bahan</Label>
              <Select value={newIngredient.id} onValueChange={val => setNewIngredient({...newIngredient, id: val})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Bahan Baku..." />
                </SelectTrigger>
                <SelectContent>
                  {bahanBaku
                    .filter(b => !recipeData.bahanResep?.some(item => item.id === b.id))
                    .map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nama} - {formatCurrency(b.hargaSatuan)}/{b.satuan}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Jumlah</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newIngredient.jumlah || ''}
                onChange={e => setNewIngredient({...newIngredient, jumlah: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Satuan</Label>
              <Input
                value={newIngredient.id ? bahanBaku.find(b => b.id === newIngredient.id)?.satuan || '' : ''}
                disabled
                className="mt-1 bg-gray-100"
              />
            </div>
            
            <Button onClick={handleAddIngredient} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>

          {/* Ingredients Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total Harga</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recipeData.bahanResep || []).length > 0 ? (
                  (recipeData.bahanResep || []).map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.nama}
                          {item.isFromInventory && (
                            <Badge variant="secondary" className="text-xs">
                              Inventory
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.jumlah}
                            onChange={e => handleUpdateIngredientQuantity(item.id!, Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">{item.satuan}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.totalHarga)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(item.id!)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Belum ada bahan yang ditambahkan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {(recipeData.bahanResep || []).length > 0 && (
            <div className="flex justify-end">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Total Biaya Bahan:</span>
                  <span className="font-bold ml-2">{formatCurrency(totalIngredientCost)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Costs & Margin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Biaya & Margin
          </CardTitle>
          <CardDescription>Pengaturan biaya tambahan dan margin keuntungan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="biayaTenagaKerja">Biaya Tenaga Kerja (Rp)</Label>
              <Input
                id="biayaTenagaKerja"
                type="number"
                min="0"
                value={recipeData.biayaTenagaKerja || ''}
                onChange={e => handleInputChange('biayaTenagaKerja', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="biayaOverhead">Biaya Overhead (Rp)</Label>
              <Input
                id="biayaOverhead"
                type="number"
                min="0"
                value={recipeData.biayaOverhead || ''}
                onChange={e => handleInputChange('biayaOverhead', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="marginKeuntunganPersen">Margin Keuntungan (%)</Label>
              <Input
                id="marginKeuntunganPersen"
                type="number"
                min="0"
                max="100"
                value={recipeData.marginKeuntunganPersen || ''}
                onChange={e => handleInputChange('marginKeuntunganPersen', Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rekomendasi: 20-30% untuk makanan, 40-60% untuk minuman
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* HPP Calculation Preview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calculator className="h-5 w-5" />
            Preview Kalkulasi HPP
          </CardTitle>
          <CardDescription className="text-green-600">
            Hasil kalkulasi otomatis berdasarkan input yang telah dimasukkan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cost Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <div className="text-gray-600">Total Bahan Baku:</div>
              <div className="font-semibold text-blue-600">{formatCurrency(totalIngredientCost)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-gray-600">Tenaga Kerja:</div>
              <div className="font-semibold text-orange-600">{formatCurrency(recipeData.biayaTenagaKerja || 0)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-gray-600">Overhead:</div>
              <div className="font-semibold text-purple-600">{formatCurrency(recipeData.biayaOverhead || 0)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-gray-600">Total HPP:</div>
              <div className="font-bold text-red-600">{formatCurrency(recipeData.totalHpp || 0)}</div>
            </div>
          </div>

          <Separator />

          {/* Per Porsi & Per PCS Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Per Porsi */}
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <Users className="h-5 w-5" />
                Per Porsi
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>HPP per Porsi:</span>
                  <span className="font-semibold">{formatCurrency(recipeData.hppPerPorsi || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga Jual per Porsi:</span>
                  <span className="font-bold text-green-600">{formatCurrency(recipeData.hargaJualPorsi || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Profit per Porsi:</span>
                  <span className="font-bold text-green-600">{formatCurrency(profitPerPorsi)}</span>
                </div>
              </div>
            </div>

            {/* Per PCS */}
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-orange-700 font-semibold">
                <Package className="h-5 w-5" />
                Per Pcs
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>HPP per Pcs:</span>
                  <span className="font-semibold">{formatCurrency(recipeData.hppPerPcs || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga Jual per Pcs:</span>
                  <span className="font-bold text-green-600">{formatCurrency(recipeData.hargaJualPerPcs || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Profit per Pcs:</span>
                  <span className="font-bold text-green-600">{formatCurrency(profitPerPcs)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Production Summary */}
          <div className="bg-gray-800 text-white p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-300">Total Porsi:</div>
                <div className="font-bold text-lg">{recipeData.jumlahPorsi || 0}</div>
              </div>
              <div>
                <div className="text-gray-300">Total Pcs:</div>
                <div className="font-bold text-lg">{totalPcsProduced}</div>
              </div>
              <div>
                <div className="text-gray-300">Total Profit:</div>
                <div className="font-bold text-lg text-green-400">
                  {formatCurrency(profitPerPorsi * (recipeData.jumlahPorsi || 1))}
                </div>
              </div>
              <div>
                <div className="text-gray-300">Margin:</div>
                <div className="font-bold text-lg text-yellow-400">{recipeData.marginKeuntunganPersen || 0}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} size="lg">
          Batal
        </Button>
        <Button onClick={handleSave} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          {initialData ? 'Perbarui Resep' : 'Simpan Resep'}
        </Button>
      </div>
    </div>
  );
};

export default RecipeForm;