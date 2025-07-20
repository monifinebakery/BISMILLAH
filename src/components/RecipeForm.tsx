import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calculator, RefreshCw } from "lucide-react";
import { Recipe, NewRecipe, RecipeIngredient } from "@/types/recipe";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useIngredientPrices } from "@/hooks/useIngredientPrices";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSettings } from "@/contexts/UserSettingsContext";

interface RecipeFormProps {
  initialData?: Recipe | null;
  onSave: (data: NewRecipe) => void;
  onCancel: () => void;
}

const RecipeForm = ({ initialData, onSave, onCancel }: RecipeFormProps) => {
  const { bahanBaku } = useBahanBaku();
  const { settings } = useUserSettings(); // MODIFIED: Ambil settings dari useUserSettings
  const { getIngredientPrice, updateIngredientPrices } = useIngredientPrices();
  
  const [formData, setFormData] = useState<NewRecipe>({
    namaResep: "",
    deskripsi: "",
    porsi: 1,
    ingredients: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntungan: 0,
    category: "", // MODIFIED: Tambahkan category ke state formData
  });

  const [newIngredient, setNewIngredient] = useState<Omit<RecipeIngredient, 'id' | 'totalHarga'>>({
    nama: "",
    jumlah: 0,
    satuan: "",
    hargaPerSatuan: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        namaResep: initialData.namaResep,
        deskripsi: initialData.deskripsi,
        porsi: initialData.porsi,
        ingredients: initialData.ingredients,
        biayaTenagaKerja: initialData.biayaTenagaKerja,
        biayaOverhead: initialData.biayaOverhead,
        marginKeuntungan: initialData.marginKeuntungan,
        category: initialData.category, // MODIFIED: Set category dari initialData
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof NewRecipe, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleIngredientChange = (field: keyof typeof newIngredient, value: string | number) => {
    const updatedIngredient = { ...newIngredient, [field]: value };
    
    // Auto-fill price and unit when ingredient name is selected
    if (field === 'nama' && typeof value === 'string') {
      const bahanBakuItem = bahanBaku.find(item => item.nama === value);
      if (bahanBakuItem) {
        updatedIngredient.hargaPerSatuan = bahanBakuItem.hargaSatuan;
        updatedIngredient.satuan = bahanBakuItem.satuan;
        
        toast({
          title: "Data Otomatis Terisi",
          description: `Harga dan satuan untuk ${value} berhasil diambil dari gudang`,
        });
      }
    }
    
    setNewIngredient(updatedIngredient);
  };

  const addIngredient = () => {
    if (newIngredient.nama && newIngredient.jumlah > 0 && newIngredient.hargaPerSatuan > 0) {
      const ingredient: RecipeIngredient = {
        id: Date.now().toString(),
        ...newIngredient,
        totalHarga: newIngredient.jumlah * newIngredient.hargaPerSatuan,
      };
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredient],
      });
      setNewIngredient({
        nama: "",
        jumlah: 0,
        satuan: "",
        hargaPerSatuan: 0,
      });
    }
  };

  const removeIngredient = (id: string) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter(ing => ing.id !== id),
    });
  };

  const refreshIngredientPrices = () => {
    const updatedIngredients = updateIngredientPrices(formData.ingredients);
    const hasChanges = updatedIngredients.some((ing, index) => 
      ing.hargaPerSatuan !== formData.ingredients[index].hargaPerSatuan
    );
    
    if (hasChanges) {
      setFormData({ ...formData, ingredients: updatedIngredients });
      toast({
        title: "Harga Diperbarui",
        description: "Harga bahan baku telah diperbarui sesuai data gudang terkini",
      });
    } else {
      toast({
        title: "Harga Terkini",
        description: "Semua harga bahan baku sudah menggunakan data terkini",
      });
    }
  };

  const calculateTotals = () => {
    const totalBahanBaku = formData.ingredients.reduce((sum, ing) => sum + ing.totalHarga, 0);
    const totalHPP = totalBahanBaku + formData.biayaTenagaKerja + formData.biayaOverhead;
    const hppPerPorsi = totalHPP / formData.porsi;
    const hargaJualPerPorsi = hppPerPorsi * (1 + formData.marginKeuntungan / 100);

    return {
      totalBahanBaku,
      totalHPP,
      hppPerPorsi,
      hargaJualPerPorsi,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.namaResep && formData.ingredients.length > 0 && formData.category) { // MODIFIED: Tambahkan validasi category
      // Validate ingredient availability
      const unavailableIngredients = formData.ingredients.filter(ing => {
        const bahanBakuItem = bahanBaku.find(item => item.nama === ing.nama);
        return !bahanBakuItem;
      });

      if (unavailableIngredients.length > 0) {
        toast({
          title: "Bahan Tidak Tersedia",
          description: `${unavailableIngredients.map(ing => ing.nama).join(', ')} tidak tersedia di gudang`,
          variant: "destructive",
        });
        return;
      }

      onSave(formData);
    } else {
      toast({
        title: "Data Belum Lengkap",
        description: "Nama Resep, Kategori, dan Bahan-bahan tidak boleh kosong.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="namaResep">Nama Resep *</Label>
          <Input
            id="namaResep"
            value={formData.namaResep}
            onChange={(e) => handleInputChange('namaResep', e.target.value)}
            placeholder="Masukkan nama resep"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="porsi">Jumlah Porsi *</Label>
          <Input
            id="porsi"
            type="number"
            min="1"
            value={formData.porsi}
            onChange={(e) => handleInputChange('porsi', parseInt(e.target.value) || 1)}
            required
            className="mt-1"
          />
        </div>
        {/* MODIFIED: Tambahkan Select untuk Kategori Resep */}
        <div>
          <Label htmlFor="category">Kategori Resep *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value)}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" disabled={settings.recipeCategories.length > 0}>Semua Kategori</SelectItem> {/* MODIFIED: Tambahkan disabled */}
              {settings.recipeCategories.length > 0 && ( // Hanya render jika ada kategori
                settings.recipeCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="deskripsi">Deskripsi</Label>
        <Textarea
          id="deskripsi"
          value={formData.deskripsi}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsi resep (opsional)"
          className="mt-1"
          rows={3}
        />
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Bahan-bahan</CardTitle>
            {formData.ingredients.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshIngredientPrices}
                className="hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Perbarui Harga
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Ingredient Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs sm:text-sm">Nama Bahan</Label>
              <Select
                value={newIngredient.nama}
                onValueChange={(value) => handleIngredientChange('nama', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih bahan..." />
                </SelectTrigger>
                <SelectContent>
                  {bahanBaku.map((item) => (
                    <SelectItem key={item.id} value={item.nama}>
                      {item.nama} (Stok: {item.stok} {item.satuan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Jumlah</Label>
              <Input
                type="number"
                step="0.1"
                value={newIngredient.jumlah || ''}
                onChange={(e) => handleIngredientChange('jumlah', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Satuan</Label>
              <Input
                value={newIngredient.satuan}
                onChange={(e) => handleIngredientChange('satuan', e.target.value)}
                placeholder="kg, gram, liter"
                className="mt-1"
                readOnly={!!newIngredient.nama}
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Harga/Satuan</Label>
              <Input
                type="number"
                value={newIngredient.hargaPerSatuan || ''}
                onChange={(e) => handleIngredientChange('hargaPerSatuan', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-1"
                readOnly={!!newIngredient.nama}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addIngredient}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Tambah</span>
              </Button>
            </div>
          </div>

          {/* Ingredients List */}
          {formData.ingredients.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm font-medium text-gray-600 px-2">
                <div className="col-span-3">Nama</div>
                <div className="col-span-2">Jumlah</div>
                <div className="col-span-2">Satuan</div>
                <div className="col-span-2">Harga/Satuan</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1">Aksi</div>
              </div>
              {formData.ingredients.map((ingredient) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-2 text-xs sm:text-sm p-2 bg-white rounded border">
                  <div className="col-span-3 truncate">{ingredient.nama}</div>
                  <div className="col-span-2">{ingredient.jumlah}</div>
                  <div className="col-span-2">{ingredient.satuan}</div>
                  <div className="col-span-2">{formatCurrency(ingredient.hargaPerSatuan)}</div>
                  <div className="col-span-2 font-medium">{formatCurrency(ingredient.totalHarga)}</div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Costs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="biayaTenagaKerja">Biaya Tenaga Kerja (Rp)</Label>
          <Input
            id="biayaTenagaKerja"
            type="number"
            value={formData.biayaTenagaKerja || ''}
            onChange={(e) => handleInputChange('biayaTenagaKerja', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="biayaOverhead">Biaya Overhead (Rp)</Label>
          <Input
            id="biayaOverhead"
            type="number"
            value={formData.biayaOverhead || ''}
            onChange={(e) => handleInputChange('biayaOverhead', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="marginKeuntungan">Margin Keuntungan (%)</Label>
          <Input
            id="marginKeuntungan"
            type="number"
            value={formData.marginKeuntungan || ''}
            onChange={(e) => handleInputChange('marginKeuntungan', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>

      {/* Calculation Preview */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Preview Kalkulasi HPP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between">
                <span>Total Bahan Baku:</span>
                <span className="font-medium">{formatCurrency(totals.totalBahanBaku)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tenaga Kerja:</span>
                <span className="font-medium">{formatCurrency(formData.biayaTenagaKerja)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overhead:</span>
                <span className="font-medium">{formatCurrency(formData.biayaOverhead)}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold text-blue-600">
                <span>Total HPP:</span>
                <span>{formatCurrency(totals.totalHPP)}</span>
              </div>
              <div className="flex justify-between">
                <span>HPP per Porsi:</span>
                <span className="font-medium">{formatCurrency(totals.hppPerPorsi)}</span>
              </div>
              <div className="flex justify-between font-semibold text-green-600">
                <span>Harga Jual per Porsi:</span>
                <span>{formatCurrency(totals.hargaJualPerPorsi)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
          Batal
        </Button>
        <Button
          type="submit" 
          className="flex-1 sm:flex-none bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          disabled={!formData.namaResep || formData.ingredients.length === 0}
        >
          {initialData ? 'Update Resep' : 'Simpan Resep'}
        </Button>
      </div>
    </form>
  );
};

export default RecipeForm;
