// components/promo/PromoForm.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Percent, TrendingDown, Gift } from 'lucide-react';

interface Props {
  promoType: string;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  bogoBuy: number;
  setBogoBuy: (value: number) => void;
  bogoGet: number;
  setBogoGet: (value: number) => void;
}

// 📊 Percentage Discount Form
const PercentDiscountForm: React.FC<{
  discountValue: number;
  setDiscountValue: (value: number) => void;
}> = ({ discountValue, setDiscountValue }) => (
  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
      <Percent className="h-5 w-5 text-orange-600" />
    </div>
    <div className="flex items-center gap-2 flex-1">
      <Input
        type="number"
        placeholder="10"
        value={discountValue || ''}
        onChange={(e) => setDiscountValue(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
        min="0"
        max="100"
        step="0.1"
        className="w-20 text-center border-orange-200 focus:border-orange-400 font-semibold"
      />
      <span className="font-semibold text-orange-700 text-lg">%</span>
      <span className="text-sm text-gray-600">diskon</span>
    </div>

    {/* 📊 Visual Progress */}
    <div className="hidden sm:block w-20 text-right">
      <div className="w-full bg-orange-200 rounded-full h-2 mb-1">
        <div 
          className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, discountValue)}%` }}
        ></div>
      </div>
      <span className="text-xs text-orange-600 font-medium">
        {discountValue}%
      </span>
    </div>
  </div>
);

// 💰 Rupiah Discount Form  
const RupiahDiscountForm: React.FC<{
  discountValue: number;
  setDiscountValue: (value: number) => void;
}> = ({ discountValue, setDiscountValue }) => (
  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
      <TrendingDown className="h-5 w-5 text-orange-600" />
    </div>
    <div className="flex items-center gap-2 flex-1">
      <span className="font-semibold text-orange-700">Rp</span>
      <Input
        type="number"
        placeholder="5000"
        value={discountValue || ''}
        onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value) || 0))}
        min="0"
        step="500"
        className="flex-1 max-w-32 text-center border-orange-200 focus:border-orange-400 font-semibold"
      />
      <span className="text-sm text-gray-600">potongan harga</span>
    </div>

    {/* 💡 Formatting Helper */}
    {discountValue > 0 && (
      <div className="hidden sm:block text-right">
        <div className="text-xs text-gray-500 mb-1">Potongan:</div>
        <div className="text-sm font-semibold text-orange-700">
          {discountValue.toLocaleString('id-ID')}
        </div>
      </div>
    )}
  </div>
);

// 🎁 BOGO Form
const BOGOForm: React.FC<{
  bogoBuy: number;
  setBogoBuy: (value: number) => void;
  bogoGet: number;
  setBogoGet: (value: number) => void;
}> = ({ bogoBuy, setBogoBuy, bogoGet, setBogoGet }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
      <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
        <Gift className="h-5 w-5 text-orange-600" />
      </div>
      <div className="flex items-center gap-3 flex-1 text-sm">
        <span className="text-gray-700 font-medium">Beli</span>
        <Input
          className="w-16 text-center border-orange-200 focus:border-orange-400 font-semibold"
          type="number"
          value={bogoBuy}
          onChange={(e) => setBogoBuy(Math.max(1, Number(e.target.value) || 1))}
          min="1"
          max="99"
        />
        <span className="text-gray-700 font-medium">Gratis</span>
        <Input
          className="w-16 text-center border-orange-200 focus:border-orange-400 font-semibold"
          type="number"
          value={bogoGet}
          onChange={(e) => setBogoGet(Math.max(0, Number(e.target.value) || 0))}
          min="0"
          max="99"
        />
      </div>

      {/* 📊 BOGO Visual */}
      <div className="hidden sm:block text-right">
        <div className="text-xs text-gray-500 mb-1">Rasio:</div>
        <div className="text-sm font-semibold text-orange-700">
          {bogoBuy}:{bogoGet}
        </div>
      </div>
    </div>

    {/* 💡 BOGO Explanation */}
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 text-green-700 text-sm">
        <Gift className="h-4 w-4 flex-shrink-0" />
        <span>
          Pelanggan bayar <strong>{bogoBuy} item</strong> tapi mendapat <strong>{bogoBuy + bogoGet} item</strong>
          {bogoGet > 0 && (
            <span className="ml-1">
              (hemat {Math.round((bogoGet / (bogoBuy + bogoGet)) * 100)}%)
            </span>
          )}
        </span>
      </div>
    </div>
  </div>
);

const PromoForm: React.FC<Props> = ({
  promoType,
  discountValue,
  setDiscountValue,
  bogoBuy,
  setBogoBuy,
  bogoGet,
  setBogoGet
}) => {
  switch (promoType) {
    case 'discount_percent':
      return (
        <PercentDiscountForm
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
        />
      );
      
    case 'discount_rp':
      return (
        <RupiahDiscountForm
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
        />
      );
      
    case 'bogo':
      return (
        <BOGOForm
          bogoBuy={bogoBuy}
          setBogoBuy={setBogoBuy}
          bogoGet={bogoGet}
          setBogoGet={setBogoGet}
        />
      );
      
    default:
      return (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <span>Pilih jenis promo untuk melanjutkan</span>
        </div>
      );
  }
};

export default PromoForm;