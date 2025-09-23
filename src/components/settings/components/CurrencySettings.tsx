// src/components/settings/components/CurrencySettings.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCurrency, type Currency } from '@/contexts/CurrencyContext';
import { Check, DollarSign } from 'lucide-react';

interface CurrencySettingsProps {
  className?: string;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({ className = '' }) => {
  const { currentCurrency, currencies, setCurrency, formatCurrency } = useCurrency();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCurrencyChange = async (currencyCode: string) => {
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      setIsLoading(true);
      try {
        await setCurrency(selectedCurrency);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Pengaturan Mata Uang
        </CardTitle>
        <CardDescription>
          Pilih mata uang utama untuk semua tampilan harga di aplikasi.
          Perubahan akan langsung diterapkan ke seluruh aplikasi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Currency Display */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentCurrency.flag}</div>
            <div>
              <div className="font-medium text-green-900">
                {currentCurrency.name} ({currentCurrency.code})
              </div>
              <div className="text-sm text-green-700">
                Contoh: {formatCurrency(15000)}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Aktif
          </Badge>
        </div>

        {/* Currency Selector */}
        <div className="space-y-2">
          <Label htmlFor="currency-select" className="text-sm font-medium">
            Pilih Mata Uang
          </Label>
          <Select value={currentCurrency.code} onValueChange={handleCurrencyChange} disabled={isLoading}>
            <SelectTrigger id="currency-select" className="w-full">
              <SelectValue placeholder="Pilih mata uang" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium">{currency.name}</div>
                      <div className="text-xs text-gray-500">
                        {currency.code} • {currency.symbol}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatCurrency(1000, { showSymbol: false })}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Popular Currencies Quick Select */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Mata Uang Populer</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['IDR', 'USD', 'EUR', 'JPY', 'CNY', 'TWD'].map((code) => {
              const currency = currencies.find(c => c.code === code);
              if (!currency) return null;

              const isSelected = currentCurrency.code === code;

              return (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currency.flag}</span>
                    <div>
                      <div className="text-sm font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-500">{currency.symbol}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pratinjau Format</Label>
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Harga kecil:</span>
              <span className="font-medium">{formatCurrency(500)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Harga sedang:</span>
              <span className="font-medium">{formatCurrency(15000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Harga besar:</span>
              <span className="font-medium">{formatCurrency(150000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Format kompak:</span>
              <span className="font-medium">{formatCurrency(1500000)} → {formatCurrency(1500000)}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-900 mb-1">💡 Info</div>
          <ul className="space-y-1 text-blue-800">
            <li>• Perubahan mata uang langsung diterapkan ke seluruh aplikasi</li>
            <li>• Preferensi tersimpan secara otomatis di browser</li>
            <li>• Format mata uang mengikuti standar lokal negara</li>
            <li>• Rupiah Indonesia menggunakan format tanpa desimal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
