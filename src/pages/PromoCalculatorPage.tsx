import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRecipe } from '@/contexts/RecipeContext';
import { usePromo } from '@/contexts/PromoContext';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { Flame, Percent, Tag, Package, Trash2, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';

const PromoCalculatorPage = () => {
  const { recipes } = useRecipe();
  const { promoHistory, addPromoEstimation, deletePromoEstimation } = usePromo();

  // --- Bagian 1: State Pemilihan Produk ---
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  
  // --- Bagian 2: State Kalkulator ---
  const [promoType, setPromoType] = useState('discount_percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [bogoBuy, setBogoBuy] = useState(1);
  const [bogoGet, setBogoGet] = useState(1);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundlePrice, setBundlePrice] = useState(0);

  // --- Bagian 3: State Riwayat ---
  const [promoName, setPromoName] = useState('');
  
  // Memoized values untuk data resep yang dipilih
  const selectedRecipe = useMemo(() => recipes.find(r => r.id === selectedRecipeId), [recipes, selectedRecipeId]);
  
  const originalHpp = selectedRecipe?.hppPerPorsi || 0;
  const originalPrice = selectedRecipe?.hargaJual || 0;
  const originalMarginRp = originalPrice - originalHpp;
  const originalMarginPercent = originalPrice > 0 ? (originalMarginRp / originalPrice) : 0;

  // Memoized values untuk hasil kalkulasi promo
  const promoResult = useMemo(() => {
    if (!selectedRecipe && promoType !== 'bundle') return null;

    let price = 0, marginRp = 0, marginPercent = 0, details = {};
    
    switch(promoType) {
      case 'discount_percent':
        price = originalPrice * (1 - (discountValue / 100));
        details = { value: discountValue };
        break;
      case 'discount_rp':
        price = originalPrice - discountValue;
        details = { value: discountValue };
        break;
      case 'bogo':
        if ((bogoBuy + bogoGet) === 0) break;
        price = (originalPrice * bogoBuy) / (bogoBuy + bogoGet);
        details = { buy: bogoBuy, get: bogoGet };
        break;
      case 'bundle':
        const totalHpp = bundleItems.reduce((sum, item) => sum + (item.recipe.hppPerPorsi * item.quantity), 0);
        price = bundlePrice;
        marginRp = bundlePrice - totalHpp;
        marginPercent = bundlePrice > 0 ? (marginRp / bundlePrice) : 0;
        details = { items: bundleItems.map(i => ({ id: i.recipe.id, name: i.recipe.nama, quantity: i.quantity })), totalHpp: totalHpp };
        return { price, marginRp, marginPercent, details };
    }
    
    if (promoType !== 'bundle') {
      marginRp = price - originalHpp;
      marginPercent = price > 0 ? (marginRp / price) : 0;
    }
    
    return { price, marginRp, marginPercent, details };
  }, [promoType, discountValue, bogoBuy, bogoGet, bundleItems, bundlePrice, selectedRecipe, originalHpp, originalPrice]);
  
  const handleSave = () => {
    if (!promoName) {
        toast.error('Nama promo wajib diisi.');
        return;
    }
    if (!promoResult) {
        toast.error('Kalkulasi promo belum valid.');
        return;
    }

    addPromoEstimation({
        promo_name: promoName,
        promo_type: promoType,
        base_recipe_id: selectedRecipeId || null,
        base_recipe_name: selectedRecipe?.nama || 'Paket Bundle',
        promo_details: promoResult.details,
        original_price: originalPrice,
        original_hpp: originalHpp,
        promo_price_effective: promoResult.price,
        estimated_margin_percent: promoResult.marginPercent,
        estimated_margin_rp: promoResult.marginRp,
    });
    setPromoName(''); // Reset nama promo setelah simpan
  };

  const renderPromoForm = () => {
    switch(promoType) {
        case 'discount_percent':
        case 'discount_rp':
            return <div><Input type="number" placeholder="Nilai Diskon" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} /></div>;
        case 'bogo':
            return <div className="grid grid-cols-2 gap-4"><Input type="number" placeholder="Beli (X)" value={bogoBuy} onChange={e => setBogoBuy(Number(e.target.value))} /><Input type="number" placeholder="Gratis (Y)" value={bogoGet} onChange={e => setBogoGet(Number(e.target.value))} /></div>;
        case 'bundle':
            // Logika form bundle yang lebih kompleks bisa ditambahkan di sini
            return <div><Input type="number" placeholder="Harga Jual Paket (Rp)" value={bundlePrice} onChange={e => setBundlePrice(Number(e.target.value))} /></div>;
        default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-bold">Kalkulator & Analisis Promo</h1>
      
      {/* Bagian 1 & 2 dalam satu grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>1. Pilih Produk & Jenis Promo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setSelectedRecipeId}><SelectTrigger><SelectValue placeholder="Pilih Produk/Resep" /></SelectTrigger><SelectContent>{recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.nama}</SelectItem>)}</SelectContent></Select>
            {selectedRecipe && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm p-2 bg-gray-50 rounded-md">
                <div><p className="font-semibold">{formatCurrency(originalHpp)}</p><p className="text-muted-foreground">HPP</p></div>
                <div><p className="font-semibold">{formatCurrency(originalPrice)}</p><p className="text-muted-foreground">Harga Asli</p></div>
                <div><p className="font-semibold">{formatPercentage(originalMarginPercent)}</p><p className="text-muted-foreground">Margin</p></div>
              </div>
            )}
            <Select onValueChange={setPromoType} value={promoType}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                <SelectItem value="discount_percent">Diskon (%)</SelectItem><SelectItem value="discount_rp">Diskon (Rp)</SelectItem>
                <SelectItem value="bogo">Beli X Gratis Y</SelectItem><SelectItem value="bundle">Paket / Bundling</SelectItem>
            </SelectContent></Select>
            {renderPromoForm()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>2. Hasil Kalkulasi Promo</CardTitle></CardHeader>
          <CardContent>
            {promoResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg"><p className="text-xl font-bold text-blue-700">{formatCurrency(promoResult.price)}</p><p className="text-sm text-muted-foreground">Harga Jual Efektif</p></div>
                    <div className="p-4 bg-green-50 rounded-lg"><p className="text-xl font-bold text-green-700">{formatPercentage(promoResult.marginPercent)}</p><p className="text-sm text-muted-foreground">Estimasi Margin</p></div>
                </div>
                {promoResult.marginPercent < 0 && <p className="text-red-600 flex items-center gap-2"><AlertTriangle size={16}/> Margin negatif, hati-hati!</p>}
                <div className="flex gap-2 pt-4 border-t"><Input placeholder="Nama Promo (e.g., Promo Gajian)" value={promoName} onChange={e => setPromoName(e.target.value)} /><Button onClick={handleSave}><Save size={16} className="mr-2"/>Simpan Estimasi</Button></div>
              </div>
            ) : <p className="text-muted-foreground">Pilih produk dan jenis promo untuk melihat hasil.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Bagian 3 */}
      <Card>
        <CardHeader><CardTitle>3. Riwayat & Analisis Promo</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Nama Promo</TableHead><TableHead>Produk</TableHead><TableHead>Harga Asli</TableHead><TableHead>Harga Promo</TableHead><TableHead>Margin</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                    {promoHistory.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.promo_name}</TableCell>
                            <TableCell>{p.base_recipe_name}</TableCell>
                            <TableCell>{formatCurrency(p.original_price)}</TableCell>
                            <TableCell>{formatCurrency(p.promo_price_effective)}</TableCell>
                            <TableCell className={p.estimated_margin_percent < 0 ? 'text-red-600' : 'text-green-600'}>{formatPercentage(p.estimated_margin_percent)}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => deletePromoEstimation(p.id)}><Trash2 size={16}/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCalculatorPage;