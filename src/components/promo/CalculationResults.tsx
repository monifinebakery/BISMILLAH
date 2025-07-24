// components/promo/ResultsCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Save, 
  Loader2, 
  Calculator,
  HelpCircle 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';

interface PromoResult {
  price: number;
  marginRp: number;
  marginPercent: number;
  details: any;
  isNegativeMargin: boolean;
}

interface Recipe {
  id: string;
  namaResep: string;
}

interface Props {
  promoResult: PromoResult | null;
  promoName: string;
  setPromoName: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  selectedRecipe: Recipe | null;
}

// 📊 Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  isNegative?: boolean;
  icon: React.ReactNode;
  tooltip?: string;
}> = ({ title, value, subtitle, isNegative = false, icon, tooltip }) => (
  <div className={cn(
    "p-6 rounded-xl border hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
    isNegative 
      ? "bg-gradient-to-br from-red-100 to-red-50 border-red-200" 
      : "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200"
  )}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-2 rounded-lg",
          isNegative ? "bg-red-200" : "bg-blue-200"
        )}>
          <div className={cn(
            "h-4 w-4",
            isNegative ? "text-red-700" : "text-blue-700"
          )}>
            {icon}
          </div>
        </div>
        <span className={cn(
          "text-sm font-medium",
          isNegative ? "text-red-700" : "text-blue-700"
        )}>
          {title}
        </span>
      </div>
      
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle size={16} className={cn(
                "hover:opacity-80",
                isNegative ? "text-red-600" : "text-blue-600"
              )} />
            </TooltipTrigger>
            <TooltipContent className="bg-white text-gray-800 border shadow-lg max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    
    <p className={cn(
      "text-2xl font-bold",
      isNegative ? "text-red-800" : "text-blue-800"
    )}>
      {value}
    </p>
    
    {subtitle && (
      <p className={cn(
        "text-sm mt-1",
        isNegative ? "text-red-600" : "text-blue-600"
      )}>
        {subtitle}
      </p>
    )}
  </div>
);

// ⚠️ Warning Alert Component
const NegativeMarginAlert: React.FC = () => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <div>
        <p className="text-red-800 font-medium">Peringatan: Margin Negatif!</p>
        <p className="text-red-600 text-sm">
          Promo ini akan mengurangi keuntungan Anda. Pertimbangkan untuk menyesuaikan nilai promo.
        </p>
      </div>
    </div>
  </div>
);

// 📭 Empty State Component
const EmptyState: React.FC = () => (
  <div className="text-center py-16">
    <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
      <Calculator className="h-10 w-10 text-gray-400" />
    </div>
    <p className="text-gray-600 text-lg font-medium mb-2">Hasil Kalkulasi</p>
    <p className="text-gray-500">Pilih produk dan atur promo untuk melihat hasil perhitungan</p>
  </div>
);

const ResultsCard: React.FC<Props> = ({
  promoResult,
  promoName,
  setPromoName,
  onSave,
  isSaving,
  selectedRecipe
}) => {
  const canSave = promoName.trim() && selectedRecipe && promoResult && !isSaving;

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* 📈 Header */}
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
        <CardTitle className="text-xl font-semibold flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          3. Hasil Kalkulasi
        </CardTitle>
        <CardDescription className="text-orange-100">
          Lihat dampak promo terhadap keuntungan
        </CardDescription>
      </CardHeader>

      {/* 📊 Content */}
      <CardContent className="p-6">
        {promoResult ? (
          <div className="space-y-6 animate-fade-in">
            {/* 📊 Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Harga Efektif"
                value={formatCurrency(promoResult.price)}
                icon={<TrendingUp className="h-4 w-4" />}
                tooltip="Harga jual rata-rata per item setelah promo diterapkan"
              />

              <MetricCard
                title="Margin Promo"
                value={formatPercentage(promoResult.marginPercent)}
                subtitle={`${formatCurrency(promoResult.marginRp)} per item`}
                isNegative={promoResult.isNegativeMargin}
                icon={promoResult.isNegativeMargin 
                  ? <TrendingDown className="h-4 w-4" /> 
                  : <TrendingUp className="h-4 w-4" />
                }
                tooltip="Persentase keuntungan setelah promo diterapkan"
              />
            </div>

            {/* ⚠️ Negative Margin Warning */}
            {promoResult.isNegativeMargin && <NegativeMarginAlert />}

            {/* 💾 Save Section */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Nama Promo (contoh: Flash Sale Weekend)"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  className="flex-1 border-orange-200 focus:border-orange-400 h-12"
                  maxLength={100}
                />
                <Button
                  onClick={onSave}
                  disabled={!canSave}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>

              {/* 📝 Character Counter */}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {promoName.length}/100 karakter
                </span>
                {promoResult.isNegativeMargin && (
                  <Badge variant="destructive" className="text-xs">
                    Margin Negatif
                  </Badge>
                )}
              </div>
            </div>

            {/* 💡 Success Tips */}
            {!promoResult.isNegativeMargin && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <strong>Bagus!</strong> Promo ini masih menguntungkan dengan margin {formatPercentage(promoResult.marginPercent)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsCard;