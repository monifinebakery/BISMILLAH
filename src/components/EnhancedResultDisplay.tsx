
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HPPData } from "@/types/hpp";
import { TrendingUp, Calculator, DollarSign } from "lucide-react";

interface EnhancedResultDisplayProps {
  hppData: HPPData;
}

const EnhancedResultDisplay = ({ hppData }: EnhancedResultDisplayProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const profitAmount = hppData.hargaJual - hppData.totalHPP;
  const profitPercentage = hppData.totalHPP > 0 ? ((profitAmount / hppData.totalHPP) * 100) : 0;

  if (hppData.totalHPP === 0) {
    return (
      <div className="text-center py-8">
        <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Masukkan data biaya untuk melihat hasil perhitungan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Rincian Biaya */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center">
          <Calculator className="h-4 w-4 mr-2" />
          Rincian Biaya:
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Bahan Baku:</span>
            <span className="font-medium">{formatCurrency(hppData.bahanBaku)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tenaga Kerja:</span>
            <span className="font-medium">{formatCurrency(hppData.tenagaKerja)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Biaya Overhead:</span>
            <span className="font-medium">{formatCurrency(hppData.overheadPabrik)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Total HPP */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1 flex items-center justify-center">
              <Calculator className="h-4 w-4 mr-1" />
              Total HPP
            </p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {formatCurrency(hppData.totalHPP)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Harga Jual per Porsi - Always show */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1 flex items-center justify-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Harga Jual per Porsi
            </p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(hppData.hargaJual)}
            </p>
            {hppData.marginKeuntungan > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Margin {hppData.marginKeuntungan}%
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analisis Keuntungan - Show only if margin is set */}
      {hppData.marginKeuntungan > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analisis Keuntungan:
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Keuntungan per Porsi</p>
                <p className="font-bold text-green-600">{formatCurrency(profitAmount)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Persentase Keuntungan</p>
                <p className="font-bold text-blue-600">{profitPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ringkasan */}
      <Separator />
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2 text-sm">Ringkasan:</h4>
        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
          <p>• Total HPP: {formatCurrency(hppData.totalHPP)}</p>
          <p>• Harga jual per porsi: {formatCurrency(hppData.hargaJual)}</p>
          {hppData.marginKeuntungan > 0 && (
            <>
              <p>• Keuntungan per porsi: {formatCurrency(profitAmount)}</p>
              <p>• Margin keuntungan: {hppData.marginKeuntungan}%</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedResultDisplay;
