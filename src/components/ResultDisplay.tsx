
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HPPData } from "@/types/hpp";

interface ResultDisplayProps {
  hppData: HPPData;
}

const ResultDisplay = ({ hppData }: ResultDisplayProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HPP Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Rincian HPP:</h3>
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
            <span className="text-gray-600">Overhead Pabrik:</span>
            <span className="font-medium">{formatCurrency(hppData.overheadPabrik)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Total HPP */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total HPP</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {formatCurrency(hppData.totalHPP)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selling Price */}
      {hppData.marginKeuntungan > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Margin Keuntungan:</span>
              <span className="font-medium">{hppData.marginKeuntungan}%</span>
            </div>
            
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Harga Jual Disarankan</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(hppData.hargaJual)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Summary */}
      {hppData.totalHPP > 0 && (
        <>
          <Separator />
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Ringkasan:</h4>
            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
              <p>• HPP per unit: {formatCurrency(hppData.totalHPP)}</p>
              {hppData.marginKeuntungan > 0 && (
                <>
                  <p>• Keuntungan per unit: {formatCurrency(hppData.hargaJual - hppData.totalHPP)}</p>
                  <p>• Margin keuntungan: {hppData.marginKeuntungan}%</p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultDisplay;
