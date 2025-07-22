import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRecipe } from '@/contexts/RecipeContext';
import { usePromo } from '@/contexts/PromoContext';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { AlertTriangle, Save, Trash2, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PromoCalculatorPage = () => {
  const { recipes } = useRecipe();
  const { promoHistory, addPromoEstimation, deletePromoEstimation } = usePromo();

  // --- State Management ---
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [promoType, setPromoType] = useState('discount_percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [bogoBuy, setBogoBuy] = useState(2);
  const [bogoGet, setBogoGet] = useState(1);
  const [promoName, setPromoName] = useState('');
  const [selectedPromos, setSelectedPromos] = useState(new Set()); // For bulk delete
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const selectedRecipe = useMemo(() => recipes.find(r => r.id === selectedRecipeId) || null, [recipes, selectedRecipeId]);

  const originalHpp = selectedRecipe?.hppPerPorsi || 0;
  const originalPrice = selectedRecipe?.hargaJualPorsi || 0;
  const originalMarginRp = originalPrice > 0 ? originalPrice - originalHpp : 0;
  const originalMarginPercent = originalPrice > 0 ? originalMarginRp / originalPrice : 0;

  const promoResult = useMemo(() => {
    if (!selectedRecipe) return null;

    let price = 0, marginRp = 0, marginPercent = 0, details = {};

    switch (promoType) {
      case 'discount_percent':
        const discPercent = Math.min(100, Math.max(0, discountValue)); // Validate between 0-100
        price = originalPrice * (1 - (discPercent / 100));
        details = { type: '%', value: discPercent };
        break;
      case 'discount_rp':
        const discRp = Math.max(0, discountValue); // Validate non-negative
        price = Math.max(0, originalPrice - discRp); // Ensure price doesn't go negative
        details = { type: 'Rp', value: discRp };
        break;
      case 'bogo':
        const buy = Math.max(1, bogoBuy); // Minimum 1 buy
        const get = Math.max(0, bogoGet); // Minimum 0 get
        if (buy === 0) break;
        price = (originalPrice * buy) / (buy + get);
        details = { buy, get };
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
    setPromoName(''); // Reset nama promo
  };

  const handleBulkDelete = () => {
    if (selectedPromos.size === 0) {
      toast.warning('Pilih setidaknya satu promo untuk dihapus.');
      return;
    }
    selectedPromos.forEach(id => deletePromoEstimation(id));
    setSelectedPromos(new Set());
    toast.success('Promo berhasil dihapus.');
  };

  const renderPromoForm = () => {
    switch (promoType) {
      case 'discount_percent':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Contoh: 10"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Math.min(100, Math.max(0, Number(e.target.value))))}
              min="0"
              max="100"
            />
            <span className="font-semibold">%</span>
          </div>
        );
      case 'discount_rp':
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Rp</span>
            <Input
              type="number"
              placeholder="Contoh: 5000"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
              min="0"
            />
          </div>
        );
      case 'bogo':
        return (
          <div className="flex items-center gap-3 text-sm">
            <span>Beli</span>
            <Input
              className="w-20 text-center"
              type="number"
              value={bogoBuy}
              onChange={(e) => setBogoBuy(Math.max(1, Number(e.target.value)))}
              min="1"
            />
            <span>Gratis</span>
            <Input
              className="w-20 text-center"
              type="number"
              value={bogoGet}
              onChange={(e) => setBogoGet(Math.max(0, Number(e.target.value)))}
              min="0"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(promoHistory.length / itemsPerPage);
  const paginatedPromos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return promoHistory.slice(start, start + itemsPerPage);
  }, [promoHistory, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Kalkulator & Analisis Promo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Input */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
              <CardTitle className="text-lg font-semibold">1. Pilih Produk Promo</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Select onValueChange={setSelectedRecipeId} value={selectedRecipeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Produk/Resep..." />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="hover:bg-gray-100">
                      {r.namaResep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            {selectedRecipe && (
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-b-lg text-center">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xl font-bold">{formatCurrency(originalHpp)}</p>
                  <p className="text-sm text-gray-500">HPP</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xl font-bold">{formatCurrency(originalPrice)}</p>
                  <p className="text-sm text-gray-500">Harga Asli</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xl font-bold text-green-600">{formatPercentage(originalMarginPercent)}</p>
                  <p className="text-sm text-gray-500">Margin</p>
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
              <CardTitle className="text-lg font-semibold">2. Jenis & Kalkulasi Promo</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Select onValueChange={setPromoType} value={promoType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Jenis Promo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_percent" className="hover:bg-gray-100">
                    Diskon (%)
                  </SelectItem>
                  <SelectItem value="discount_rp" className="hover:bg-gray-100">
                    Diskon (Rp)
                  </SelectItem>
                  <SelectItem value="bogo" className="hover:bg-gray-100">
                    Beli X Gratis Y
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedRecipe ? renderPromoForm() : <p className="text-sm text-gray-500 text-center py-4">Pilih produk terlebih dahulu.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Hasil */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
            <CardTitle className="text-lg font-semibold">3. Hasil & Simpan Estimasi</CardTitle>
            <CardDescription>Lihat potensi keuntungan dari promo Anda.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {promoResult ? (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(promoResult.price)}</p>
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                      Harga Efektif{' '}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle size={14} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Harga jual rata-rata per item setelah promo.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: promoResult.marginPercent < 0 ? '#FFF1F2' : '#F0FFF4',
                    }}
                  >
                    <p
                      className={`text-2xl font-bold ${
                        promoResult.marginPercent < 0 ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {formatPercentage(promoResult.marginPercent)}
                    </p>
                    <p className="text-sm text-gray-500">Estimasi Margin</p>
                  </div>
                </div>
                {promoResult.marginPercent < 0 && (
                  <p className="text-red-600 flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} /> Margin negatif, keuntungan Anda berkurang!
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nama Promo (e.g., Promo Gajian)"
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={!promoName.trim() || !selectedRecipe || !promoResult}
                    className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    <Save size={16} className="mr-2" /> Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">Hasil akan muncul di sini setelah produk & promo dipilih.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 mt-6">
        <CardHeader className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Riwayat Estimasi Promo</CardTitle>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedPromos.size === 0}
            className="bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Trash2 size={16} className="mr-2" /> Hapus Terpilih
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedPromos.size === promoHistory.length && promoHistory.length > 0}
                    onChange={(e) =>
                      setSelectedPromos(
                        e.target.checked ? new Set(promoHistory.map((p) => p.id)) : new Set()
                      )
                    }
                  />
                </TableHead>
                <TableHead>Nama Promo</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Harga Asli</TableHead>
                <TableHead>Harga Promo</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPromos.length > 0 ? (
                paginatedPromos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPromos.has(p.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedPromos);
                          if (e.target.checked) newSelected.add(p.id);
                          else newSelected.delete(p.id);
                          setSelectedPromos(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.promo_name}</TableCell>
                    <TableCell>{p.base_recipe_name}</TableCell>
                    <TableCell>{formatCurrency(p.original_price)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(p.promo_price_effective)}</TableCell>
                    <TableCell
                      className={`font-semibold ${
                        p.estimated_margin_percent < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatPercentage(p.estimated_margin_percent)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                    Belum ada riwayat promo yang disimpan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <CardFooter className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-gray-600 hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-gray-600 hover:bg-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCalculatorPage;