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
  const [selectedPromos, setSelectedPromos] = useState(new Set());
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
        const discPercent = Math.min(100, Math.max(0, discountValue));
        price = originalPrice * (1 - (discPercent / 100));
        details = { type: '%', value: discPercent };
        break;
      case 'discount_rp':
        const discRp = Math.max(0, discountValue);
        price = Math.max(0, originalPrice - discRp);
        details = { type: 'Rp', value: discRp };
        break;
      case 'bogo':
        const buy = Math.max(1, bogoBuy);
        const get = Math.max(0, bogoGet);
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
    setPromoName('');
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
              className="w-24"
            />
            <span className="font-semibold text-gray-700">%</span>
          </div>
        );
      case 'discount_rp':
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Rp</span>
            <Input
              type="number"
              placeholder="Contoh: 5000"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
              min="0"
              className="w-24"
            />
          </div>
        );
      case 'bogo':
        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-700">Beli</span>
            <Input
              className="w-20 text-center"
              type="number"
              value={bogoBuy}
              onChange={(e) => setBogoBuy(Math.max(1, Number(e.target.value)))}
              min="1"
            />
            <span className="text-gray-700">Gratis</span>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Kalkulator & Analisis Promo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Input */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-white border-b border-blue-100 p-4">
              <CardTitle className="text-lg font-semibold text-blue-900">1. Pilih Produk Promo</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Select onValueChange={setSelectedRecipeId} value={selectedRecipeId}>
                <SelectTrigger className="w-full border-blue-200">
                  <SelectValue placeholder="Pilih Produk/Resep..." className="text-gray-600" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  {recipes.map((r) => (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      className="hover:bg-blue-50 text-gray-800"
                    >
                      {r.namaResep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            {selectedRecipe && (
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-blue-50 rounded-b-lg text-center">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(originalHpp)}</p>
                  <p className="text-sm text-gray-600">HPP</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(originalPrice)}</p>
                  <p className="text-sm text-gray-600">Harga Asli</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xl font-bold text-green-600">{formatPercentage(originalMarginPercent)}</p>
                  <p className="text-sm text-gray-600">Margin</p>
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-white border-b border-blue-100 p-4">
              <CardTitle className="text-lg font-semibold text-blue-900">2. Jenis & Kalkulasi Promo</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Select onValueChange={setPromoType} value={promoType}>
                <SelectTrigger className="w-full border-blue-200">
                  <SelectValue placeholder="Pilih Jenis Promo" className="text-gray-600" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="discount_percent" className="hover:bg-blue-50 text-gray-800">
                    Diskon (%)
                  </SelectItem>
                  <SelectItem value="discount_rp" className="hover:bg-blue-50 text-gray-800">
                    Diskon (Rp)
                  </SelectItem>
                  <SelectItem value="bogo" className="hover:bg-blue-50 text-gray-800">
                    Beli X Gratis Y
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedRecipe ? renderPromoForm() : <p className="text-sm text-gray-600 text-center py-4">Pilih produk terlebih dahulu.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Hasil */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-white border-b border-blue-100 p-4">
            <CardTitle className="text-lg font-semibold text-blue-900">3. Hasil & Simpan Estimasi</CardTitle>
            <CardDescription className="text-gray-600">Lihat potensi keuntungan dari promo Anda.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {promoResult ? (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-100 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(promoResult.price)}</p>
                    <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      Harga Efektif{' '}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle size={14} className="text-blue-700" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-white text-gray-800 border-blue-200">
                            <p>Harga jual rata-rata per item setelah promo.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: promoResult.marginPercent < 0 ? '#FFF1F2' : '#E6FFE6',
                    }}
                  >
                    <p
                      className={`text-2xl font-bold ${
                        promoResult.marginPercent < 0 ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {formatPercentage(promoResult.marginPercent)}
                    </p>
                    <p className="text-sm text-gray-600">Estimasi Margin</p>
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
                    className="flex-1 border-blue-200"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={!promoName.trim() || !selectedRecipe || !promoResult}
                    className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Save size={16} className="mr-2" /> Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-10">Hasil akan muncul di sini setelah produk & promo dipilih.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 mt-6">
        <CardHeader className="bg-white border-b border-blue-100 p-4 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-blue-900">Riwayat Estimasi Promo</CardTitle>
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
            <TableHeader className="bg-blue-50">
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
                    className="rounded border-blue-200"
                  />
                </TableHead>
                <TableHead className="text-gray-800">Nama Promo</TableHead>
                <TableHead className="text-gray-800">Produk</TableHead>
                <TableHead className="text-gray-800">Harga Asli</TableHead>
                <TableHead className="text-gray-800">Harga Promo</TableHead>
                <TableHead className="text-gray-800">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPromos.length > 0 ? (
                paginatedPromos.map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
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
                        className="rounded border-blue-200"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-800">{p.promo_name}</TableCell>
                    <TableCell className="text-gray-700">{p.base_recipe_name}</TableCell>
                    <TableCell className="text-gray-700">{formatCurrency(p.original_price)}</TableCell>
                    <TableCell className="font-semibold text-gray-800">{formatCurrency(p.promo_price_effective)}</TableCell>
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
                  <TableCell colSpan={6} className="text-center h-24 text-gray-600">
                    Belum ada riwayat promo yang disimpan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <CardFooter className="flex justify-between items-center p-4 bg-white border-t border-blue-100">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-blue-700 hover:bg-blue-50 border-blue-200"
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
                className="text-blue-700 hover:bg-blue-50 border-blue-200"
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