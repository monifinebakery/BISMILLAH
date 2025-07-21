import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Recipe, NewRecipe, RecipeIngredient } from '@/types/recipe';
import { formatCurrency } from '@/utils/currencyUtils';
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
    namaResep: '', jumlahPorsi: 1, kategoriResep: '', deskripsi: '',
    bahanResep: [], biayaTenagaKerja: 0, biayaOverhead: 0, marginKeuntunganPersen: 50,
    totalHpp: 0, hppPerPorsi: 0, hargaJualPorsi: 0,
  });

  const [newIngredient, setNewIngredient] = useState<{ id: string; jumlah: number; }>({ id: '', jumlah: 0 });

  useEffect(() => {
    if (initialData) setRecipeData(initialData);
  }, [initialData]);

  // Kalkulasi HPP & Harga Jual Otomatis
  useEffect(() => {
    const totalBahanBaku = recipeData.bahanResep?.reduce((sum, item) => sum + item.totalHarga, 0) || 0;
    const totalHpp = totalBahanBaku + (recipeData.biayaTenagaKerja || 0) + (recipeData.biayaOverhead || 0);
    const hppPerPorsi = recipeData.jumlahPorsi > 0 ? totalHpp / recipeData.jumlahPorsi : 0;
    
    let hargaJualPorsi = 0;
    const margin = recipeData.marginKeuntunganPersen || 0;
    if (margin < 100) hargaJualPorsi = hppPerPorsi / (1 - (margin / 100));

    setRecipeData(prev => ({ ...prev, totalHpp, hppPerPorsi, hargaJualPorsi }));
  }, [recipeData.bahanResep, recipeData.biayaTenagaKerja, recipeData.biayaOverhead, recipeData.jumlahPorsi, recipeData.marginKeuntunganPersen]);

  const handleInputChange = (field: keyof NewRecipe, value: any) => {
    setRecipeData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddIngredient = () => {
    if (!newIngredient.id || newIngredient.jumlah <= 0) {
      toast.error("Pilih bahan dan masukkan jumlah yang valid.");
      return;
    }
    const selectedBahan = bahanBaku.find(b => b.id === newIngredient.id);
    if (!selectedBahan) return;

    const ingredientToAdd: RecipeIngredient = {
      id: selectedBahan.id,
      namaBahan: selectedBahan.nama,
      jumlah: newIngredient.jumlah,
      satuan: selectedBahan.satuan,
      hargaSatuan: selectedBahan.hargaSatuan,
      totalHarga: selectedBahan.hargaSatuan * newIngredient.jumlah,
    };

    handleInputChange('bahanResep', [...(recipeData.bahanResep || []), ingredientToAdd]);
    setNewIngredient({ id: '', jumlah: 0 });
  };

  const handleRemoveIngredient = (id: string) => {
    handleInputChange('bahanResep', (recipeData.bahanResep || []).filter(item => item.id !== id));
  };
  
  const handleSave = () => {
    if (!recipeData.namaResep || !recipeData.jumlahPorsi) {
        toast.error("Nama Resep dan Jumlah Porsi wajib diisi.");
        return;
    }
    onSave(recipeData as NewRecipe);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informasi Dasar</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Nama Resep *</Label><Input value={recipeData.namaResep} onChange={e => handleInputChange('namaResep', e.target.value)} /></div>
          <div><Label>Jumlah Porsi *</Label><Input type="number" value={recipeData.jumlahPorsi} onChange={e => handleInputChange('jumlahPorsi', Number(e.target.value))} /></div>
          <div><Label>Kategori Resep</Label>
            <Select value={recipeData.kategoriResep} onValueChange={val => handleInputChange('kategoriResep', val)}>
              <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
              <SelectContent>{(settings?.recipeCategories || []).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Deskripsi</Label><Textarea value={recipeData.deskripsi || ''} onChange={e => handleInputChange('deskripsi', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bahan-bahan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div className="md:col-span-2"><Label>Nama Bahan</Label>
              <Select value={newIngredient.id} onValueChange={val => setNewIngredient({...newIngredient, id: val})}>
                <SelectTrigger><SelectValue placeholder="Pilih Bahan Baku..."/></SelectTrigger>
                <SelectContent>{bahanBaku.map(b => <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Jumlah</Label><Input type="number" value={newIngredient.jumlah || ''} onChange={e => setNewIngredient({...newIngredient, jumlah: Number(e.target.value)})} /></div>
            <Button onClick={handleAddIngredient} className="w-full"><Plus className="h-4 w-4 mr-2" />Tambah</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Jumlah</TableHead><TableHead>Total Harga</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {(recipeData.bahanResep || []).map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.namaBahan}</TableCell>
                  <TableCell>{item.jumlah} {item.satuan}</TableCell>
                  <TableCell>{formatCurrency(item.totalHarga)}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(item.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Biaya & Margin</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Biaya Tenaga Kerja (Rp)</Label><Input type="number" value={recipeData.biayaTenagaKerja || ''} onChange={e => handleInputChange('biayaTenagaKerja', Number(e.target.value))} /></div>
          <div><Label>Biaya Overhead (Rp)</Label><Input type="number" value={recipeData.biayaOverhead || ''} onChange={e => handleInputChange('biayaOverhead', Number(e.target.value))} /></div>
          <div><Label>Margin Keuntungan (%)</Label><Input type="number" value={recipeData.marginKeuntunganPersen || ''} onChange={e => handleInputChange('marginKeuntunganPersen', Number(e.target.value))} /></div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-50">
        <CardHeader><CardTitle>Preview Kalkulasi HPP</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>Total Bahan Baku:</div><div className="font-semibold text-right">{formatCurrency(recipeData.totalHpp - (recipeData.biayaOverhead || 0) - (recipeData.biayaTenagaKerja || 0))}</div>
            <div>Total Biaya Lain:</div><div className="font-semibold text-right">{formatCurrency((recipeData.biayaOverhead || 0) + (recipeData.biayaTenagaKerja || 0))}</div>
            <div className="font-bold border-t pt-2">Total HPP:</div><div className="font-bold border-t pt-2 text-right">{formatCurrency(recipeData.totalHpp)}</div>
            <div>HPP per Porsi:</div><div className="font-semibold text-right">{formatCurrency(recipeData.hppPerPorsi)}</div>
            <div className="font-bold text-lg text-green-600">Harga Jual per Porsi:</div><div className="font-bold text-lg text-green-600 text-right">{formatCurrency(recipeData.hargaJualPorsi)}</div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>Batal</Button>
          <Button onClick={handleSave}>{initialData ? 'Perbarui Resep' : 'Simpan Resep'}</Button>
      </div>
    </div>
  );
};

export default RecipeForm;