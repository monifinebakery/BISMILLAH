// components/promo/PromoConfigurationCard.tsx
import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Package, Percent, TrendingDown, Gift } from 'lucide-react';

// 🚀 Lazy load the form component
const PromoForm = lazy(() => import('./PromoForm'));

interface Recipe {
  id: string;
  namaResep: string;
}

interface Props {
  promoType: string;
  setPromoType: (type: string) => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  bogoBuy: number;
  setBogoBuy: (value: number) => void;
  bogoGet: number;
  setBogoGet: (value: number) => void;
  selectedRecipe: Recipe | null;
}

// 📋 Promo type options
const promoTypeOptions = [
  {
    value: 'discount_percent',
    label: 'Diskon Persentase (%)',
    icon: Percent,
    color: 'text-orange-500'
  },
  {
    value: 'discount_rp',
    label: 'Diskon Nominal (Rp)',
    icon: TrendingDown,
    color: 'text-red-500'
  },
  {
    value: 'bogo',
    label: 'Beli X Gratis Y (BOGO)',
    icon: Gift,
    color: 'text-green-500'
  }
];

// 📦 Form Loading Fallback
const FormLoader: React.FC = () => (
  <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 animate-pulse">
    <div className="h-6 w-6 bg-gray-300 rounded mx-auto mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
  </div>
);

const PromoConfigurationCard: React.FC<Props> = ({
  promoType,
  setPromoType,
  discountValue,
  setDiscountValue,
  bogoBuy,
  setBogoBuy,
  bogoGet,
  setBogoGet,
  selectedRecipe
}) => {
  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* ⚙️ Header */}
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
        <CardTitle className="text-xl font-semibold flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Calculator className="h-5 w-5" />
          </div>
          2. Konfigurasi Promo
        </CardTitle>
        <CardDescription className="text-orange-100">
          Tentukan jenis dan nilai promo
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* 🎯 Promo Type Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Jenis Promo
          </label>
          <Select onValueChange={setPromoType} value={promoType}>
            <SelectTrigger className="w-full border-orange-200 hover:border-orange-300 transition-colors h-12">
              <SelectValue className="text-gray-600" />
            </SelectTrigger>
            <SelectContent className="bg-white border-orange-200 shadow-xl">
              {promoTypeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:bg-orange-50 text-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${option.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* 📝 Promo Form */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Pengaturan Promo
          </label>
          
          {selectedRecipe ? (
            <Suspense fallback={<FormLoader />}>
              <PromoForm
                promoType={promoType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                bogoBuy={bogoBuy}
                setBogoBuy={setBogoBuy}
                bogoGet={bogoGet}
                setBogoGet={setBogoGet}
              />
            </Suspense>
          ) : (
            // 📦 No Product Selected State
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Pilih produk terlebih dahulu</p>
              <p className="text-sm mt-1">untuk mengatur promo</p>
            </div>
          )}
        </div>

        {/* 💡 Tips */}
        {selectedRecipe && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">💡 Tips Promo:</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• Diskon 10-20% biasanya paling efektif</li>
                  <li>• Pastikan margin tetap positif</li>
                  <li>• BOGO cocok untuk produk dengan margin tinggi</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromoConfigurationCard;