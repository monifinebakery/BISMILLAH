import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calculator, RefreshCw } from "lucide-react";
import { Recipe, NewRecipe, RecipeIngredient } from "@/types/recipe";
import { useIngredientPrices } from "@/hooks/useIngredientPrices";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// --- IMPOR BARU ---
import { useBahanBaku } from "@/contexts/BahanBakuContext";

interface EnhancedRecipeFormProps {
  initialData?: Recipe | null;
  onSave: (data: NewRecipe) => void;
  onCancel: () => void;
}

const EnhancedRecipeForm = ({ initialData, onSave, onCancel }: EnhancedRecipeFormProps) => {
  // --- MENGGUNAKAN HOOK BARU ---
  const { bahanBaku } = useBahanBaku();
  const { updateIngredientPrices } = useIngredientPrices();
  
  const [formData, setFormData] = useState<NewRecipe>({
    namaResep: "",
    deskripsi: "",
    porsi: 1,
    ingredients: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntungan: 0,
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
        deskripsi: initialData.deskripsi || "",
        porsi: initialData.porsi,
        ingredients: initialData.ingredients,
        biayaTenagaKerja: initialData.biayaTenagaKerja,
        biayaOverhead: initialData.biayaOverhead,
        marginKeuntungan: initialData.marginKeuntungan,
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof NewRecipe, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleIngredientChange = (field: keyof typeof newIngredient, value: string | number) => {
    const updatedIngredient = { ...newIngredient, [field]: value };
    
    if (field === 'nama' && typeof value === 'string') {
      const bahanBakuItem = bahanBaku.find(item => item.nama === value);
      if (bahanBakuItem) {
        updatedIngredient.hargaPerSatuan = bahanBakuItem.hargaSatuan;
        updatedIngredient.satuan = bahanBakuItem.satuan;
        
        toast.info(`Data otomatis terisi untuk ${value}`);
      }
    }
    
    setNewIngredient(updatedIngredient);
  };

  const addIngredient = () => {
    if (newIngredient.nama && newIngredient.jumlah > 0 && newIngredient.hargaPerSatuan >= 0) { // Harga boleh 0
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
      
      toast.success(`${ingredient.nama} berhasil ditambahkan`);
    } else {
      toast.error("Nama, Jumlah, dan Harga bahan harus diisi");
    }
  };

  const removeIngredient = (id: string) => {
    const ingredient = formData.ingredients.find(ing => ing.id === id);
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter(ing => ing.id !== id),
    });
    
    if (ingredient) {
      toast.success(`${ingredient.nama} dihapus dari resep`);
    }
  };

  const refreshIngredientPrices = () => {
    const updatedIngredients = updateIngredientPrices(formData.ingredients);
    const hasChanges = updatedIngredients.some((ing, index) => 
      ing.hargaPerSatuan !== formData.ingredients[index].hargaPerSatuan
    );
    
    if (hasChanges) {
      setFormData({ ...formData, ingredients: updatedIngredients });
      toast.success("Harga bahan baku diperbarui sesuai data gudang");
    } else {
      toast.info("Semua harga sudah menggunakan data terkini");
    }
  };

  const calculateTotals = () => {
    const totalBahanBaku = formData.ingredients.reduce((sum, ing) => sum + (ing.jumlah * ing.hargaPerSatuan), 0);
    const totalHPP = totalBahanBaku + formData.biayaTenagaKerja + formData.biayaOverhead;
    const hppPerPorsi = formData.porsi > 0 ? totalHPP / formData.porsi : 0;
    const hargaJualPerPorsi = hppPerPorsi * (1 + formData.marginKeuntungan / 100);

    return { totalBahanBaku, totalHPP, hppPerPorsi, hargaJualPerPorsi };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.namaResep && formData.ingredients.length > 0) {
      // Validasi ini penting untuk memastikan semua bahan yang dipilih ada di gudang.
      // Jika Anda ingin mengizinkan bahan custom, logika ini bisa diubah.
      const unavailableIngredients = formData.ingredients.filter(ing => {
        return !bahanBaku.some(item => item.nama === ing.nama);
      });

      if (unavailableIngredients.length > 0) {
        toast.error(`Bahan tidak tersedia di gudang: ${unavailableIngredients.map(ing => ing.nama).join(', ')}`);
        return;
      }

      onSave(formData);
    } else {
      toast.error("Nama resep dan minimal 1 bahan harus diisi");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="namaResep">Nama Resep *</Label>
          <Input id="namaResep" value={formData.namaResep} onChange={(e) => handleInputChange('namaResep', e.target.value)} placeholder="Masukkan nama resep" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="porsi">Jumlah Porsi *</Label>
          <Input id="porsi" type="number" min="1" value={formData.porsi} onChange={(e) => handleInputChange('porsi', parseInt(e.target.value) || 1)} required className="mt-1" />
        </div>
      </div>

      <div>
        <Label htmlFor="deskripsi">Deskripsi</Label>
        <Textarea id="deskripsi" value={formData.deskripsi} onChange={(e) => handleInputChange('deskripsi', e.target.value)} placeholder="Deskripsi resep (opsional)" className="mt-1" rows={3} />
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Daftar Bahan</CardTitle>
            {formData.ingredients.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={refreshIngredientPrices} className="hover:bg-blue-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Perbarui Harga
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs sm:text-sm">Nama Bahan *</Label>
              <Select value={newIngredient.nama} onValueChange={(value) => handleIngredientChange('nama', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih bahan..." />
                </SelectTrigger>
                <SelectContent>
                  {bahanBaku.map((item) => (
                    <SelectItem key={item.id} value={item.nama}>
                      {item.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Jumlah *</Label>
              <Input type="number" step="0.1" value={newIngredient.jumlah || ''} onChange={(e) => handleIngredientChange('jumlah', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Satuan</Label>
              <Input value={newIngredient.satuan} onChange={(e) => handleIngredientChange('satuan', e.target.value)} placeholder="kg, gram, dll" className="mt-1" readOnly={bahanBaku.some(b => b.nama === newIngredient.nama)} />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Harga/Satuan</Label>
              <Input type="number" value={newIngredient.hargaPerSatuan || ''} onChange={(e) => handleIngredientChange('hargaPerSatuan', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" readOnly={bahanBaku.some(b => b.nama === newIngredient.nama)} />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={addIngredient} className="w-full bg-green-600 hover:bg-green-700" size="sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Tambah</span>
              </Button>
            </div>
          </div>

          {formData.ingredients.length > 0 && (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bahan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Harga/Satuan</TableHead>
                    <TableHead>Total Harga</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.nama}</TableCell>
                      <TableCell>{ingredient.jumlah} {ingredient.satuan}</TableCell>
                      <TableCell>{formatCurrency(ingredient.hargaPerSatuan)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(ingredient.jumlah * ingredient.hargaPerSatuan)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(ingredient.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Costs & Calculation Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-base">Biaya Lainnya</h3>
            <div>
              <Label htmlFor="biayaTenagaKerja">Biaya Tenaga Kerja (Rp)</Label>
              <Input id="biayaTenagaKerja" type="number" value={formData.biayaTenagaKerja || ''} onChange={(e) => handleInputChange('biayaTenagaKerja', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="biayaOverhead">Biaya Overhead (Rp)</Label>
              <Input id="biayaOverhead" type="number" value={formData.biayaOverhead || ''} onChange={(e) => handleInputChange('biayaOverhead', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="marginKeuntungan">Margin Keuntungan (%)</Label>
              <Input id="marginKeuntungan" type="number" value={formData.marginKeuntungan || ''} onChange={(e) => handleInputChange('marginKeuntungan', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
        </div>
        <Card className="bg-gray-50 border">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calculator className="h-5 w-5 mr-2" />
              Preview Kalkulasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Total Bahan Baku:</span><span className="font-medium">{formatCurrency(totals.totalBahanBaku)}</span></div>
            <div className="flex justify-between"><span>Biaya Lainnya:</span><span className="font-medium">{formatCurrency(formData.biayaTenagaKerja + formData.biayaOverhead)}</span></div>
            <hr/>
            <div className="flex justify-between font-semibold text-base"><span>Total HPP:</span><span>{formatCurrency(totals.totalHPP)}</span></div>
            <div className="flex justify-between"><span>HPP per Porsi:</span><span className="font-medium">{formatCurrency(totals.hppPerPorsi)}</span></div>
            <div className="flex justify-between font-bold text-lg text-green-600"><span>Harga Jual / Porsi:</span><span>{formatCurrency(totals.hargaJualPerPorsi)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={!formData.namaResep || formData.ingredients.length === 0}>
          {initialData ? 'Update Resep' : 'Simpan Resep'}
        </Button>
      </div>
    </form>
  );
};

export default EnhancedRecipeForm;