import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRecipe } from '@/contexts/RecipeContext';
import { usePromo } from '@/contexts/PromoContext';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { AlertTriangle, Save, Trash2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PromoCalculatorPage = () => {
  const { recipes } = useRecipe();
  const { promoHistory, addPromoEstimation, deletePromoEstimation } = usePromo();

  // --- Bagian 1: State Pemilihan Produk ---
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  
  // --- Bagian 2: State Kalkulator ---
  const [promoType, setPromoType] = useState('discount_percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [bogoBuy, setBogoBuy] = useState(2);
  const [bogoGet, setBogoGet] = useState(1);
  
  // --- Bagian 3: State Riwayat ---
  const [promoName, setPromoName] = useState('');
  
  const selectedRecipe = useMemo(() => recipes.find(r => r.id === selectedRecipeId), [recipes, selectedRecipeId]);
  
  const originalHpp = selectedRecipe?.hppPerPorsi || 0;
  const originalPrice = selectedRecipe?.hargaJualPorsi || 0;
  const originalMarginRp = originalPrice > 0 ? originalPrice - originalHpp : 0;
  const originalMarginPercent = originalPrice > 0 ? originalMarginRp / originalPrice : 0;

  const promoResult = useMemo(() => {
    if (!selectedRecipe) return null;

    let price = 0, marginRp = 0, marginPercent = 0, details = {};
    
    switch(promoType) {
      case 'discount_percent':
        price = originalPrice * (1 - (discountValue / 100));
        details = { type: '%', value: discountValue };
        break;
      case 'discount_rp':
        price = originalPrice - discountValue;
        details = { type: 'Rp', value: discountValue };
        break;
      case 'bogo':
        if ((bogoBuy + bogoGet) === 0 || bogoBuy <= 0) break;
        price = (originalPrice * bogoBuy) / (bogoBuy + bogoGet);
        details = { buy: bogoBuy, get: bogoGet };
        break;
      default:
        return null;
    }
    
    marginRp = price - originalHpp;
    marginPercent = price > 0 ? (marginRp / price) : 0;
    
    return { price, marginRp, marginPercent, details };
  }, [promoType, discountValue, bogoBuy, bogoGet, selectedRecipe, originalHpp, originalPrice]);
  
  const handleSave = () => {
    if (!promoName.trim()) {
        toast.error('Nama promo wajib diisi.');
        return;
    }
    if (!selectedRecipe || !promoResult) {
        toast.error('Pilih produk dan pastikan kalkulasi valid.');
        return;
    }

    addPromoEstimation({
        promo_name: promoName.trim(),
        promo_type: promoType,
        base_recipe_id: selectedRecipeId,
        base_recipe_name: selectedRecipe.namaResep,
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
            return <div className="flex items-center gap-2"><Input type="number" placeholder="Contoh: 10" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} /><span className="font-semibold">%</span></div>;
        case 'discount_rp':
            return <div className="flex items-center gap-2"><span className="font-semibold">Rp</span><Input type="number" placeholder="Contoh: 5000" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} /></div>;
        case 'bogo':
            return (
                <div className="flex items-center gap-3 text-sm">
                    <span>Beli</span>
                    <Input className="w-20 text-center" type="number" value={bogoBuy} onChange={e => setBogoBuy(Number(e.target.value))} />
                    <span>Gratis</span>
                    <Input className="w-20 text-center" type="number" value={bogoGet} onChange={e => setBogoGet(Number(e.target.value))} />
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Kalkulator & Analisis Promo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Kolom Kiri: Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>1. Pilih Produk Promo Anda</CardTitle></CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedRecipeId}><SelectTrigger><SelectValue placeholder="Pilih Produk/Resep..." /></SelectTrigger><SelectContent>{recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.namaResep}</SelectItem>)}</SelectContent></Select>
            </CardContent>
            {selectedRecipe && (
              <CardContent className="grid grid-cols-3 gap-2 text-center text-sm p-4 bg-gray-50 rounded-b-md">
                <div><p className="font-semibold">{formatCurrency(originalHpp)}</p><p className="text-muted-foreground">HPP</p></div>
                <div><p className="font-semibold">{formatCurrency(originalPrice)}</p><p className="text-muted-foreground">Harga Asli</p></div>
                <div><p className="font-semibold text-green-600">{formatPercentage(originalMarginPercent)}</p><p className="text-muted-foreground">Margin</p></div>
              </CardContent>
            )}
          </Card>
          
          <Card>
            <CardHeader><CardTitle>2. Jenis & Kalkulasi Promo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={setPromoType} value={promoType}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_percent">Diskon (%)</SelectItem>
                  <SelectItem value="discount_rp">Diskon (Rp)</SelectItem>
                  <SelectItem value="bogo">Beli X Gratis Y</SelectItem>
                </SelectContent>
              </Select>
              {selectedRecipe ? renderPromoForm() : <p className="text-sm text-muted-foreground text-center py-4">Pilih produk terlebih dahulu.</p>}
            </CardContent>
          </Card>
        </div>
        
        {/* Kolom Kanan: Hasil */}
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>3. Hasil & Simpan Estimasi</CardTitle>
            <CardDescription>Lihat potensi keuntungan dari promo Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            {promoResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg"><p className="text-xl font-bold text-blue-700">{formatCurrency(promoResult.price)}</p><p className="text-sm text-muted-foreground flex items-center justify-center gap-1">Harga Efektif <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle size={12}/></TooltipTrigger><TooltipContent><p>Harga jual rata-rata per item setelah promo.</p></TooltipContent></Tooltip></TooltipProvider></p></div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: promoResult.marginPercent < 0 ? '#FFF1F2' : '#F0FFF4' }}>
                        <p className={`text-xl font-bold ${promoResult.marginPercent < 0 ? 'text-red-700' : 'text-green-700'}`}>{formatPercentage(promoResult.marginPercent)}</p>
                        <p className="text-sm text-muted-foreground">Estimasi Margin</p>
                    </div>
                </div>
                {promoResult.marginPercent < 0 && <p className="text-red-600 flex items-center gap-2 text-sm"><AlertTriangle size={16}/> Margin negatif, keuntungan Anda berkurang!</p>}
                <div className="flex gap-2 pt-4 border-t"><Input placeholder="Nama Promo (e.g., Promo Gajian)" value={promoName} onChange={e => setPromoName(e.target.value)} /><Button onClick={handleSave} disabled={!promoName.trim()}><Save size={16} className="mr-2"/>Simpan</Button></div>
              </div>
            ) : <p className="text-muted-foreground text-center py-10">Hasil akan muncul di sini setelah produk & promo dipilih.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Estimasi Promo</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Nama Promo</TableHead><TableHead>Produk</TableHead><TableHead>Harga Asli</TableHead><TableHead>Harga Promo</TableHead><TableHead>Margin</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                    {promoHistory.length > 0 ? promoHistory.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.promo_name}</TableCell>
                            <TableCell>{p.base_recipe_name}</TableCell>
                            <TableCell>{formatCurrency(p.original_price)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(p.promo_price_effective)}</TableCell>
                            <TableCell className={`font-semibold ${p.estimated_margin_percent < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatPercentage(p.estimated_margin_percent)}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deletePromoEstimation(p.id)} className="text-red-500"><Trash2 size={16}/></Button></TableCell>
                        </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Belum ada riwayat promo yang disimpan.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCalculatorPage;