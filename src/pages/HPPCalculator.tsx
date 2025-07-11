
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import QuickHPPCalculator from "@/components/QuickHPPCalculator";
import EnhancedResultDisplay from "@/components/EnhancedResultDisplay";
import ReadOnlyWrapper from "@/components/ReadOnlyWrapper";
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useState } from "react";
import { HPPData } from "@/types/hpp";

const HPPCalculatorPage = () => {
  const { isPaid } = usePaymentContext();
  const [hppData, setHppData] = useState<HPPData>({
    bahanBaku: 0,
    tenagaKerja: 0,
    overheadPabrik: 0,
    totalHPP: 0,
    marginKeuntungan: 0,
    hargaJual: 0,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 sm:p-3 rounded-full mb-3 sm:mb-0 sm:mr-4">
              <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Kalkulator HPP Cepat
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Hitung HPP dan harga jual secara instan dengan input manual sederhana
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Calculator Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold">Input Data HPP</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isPaid ? (
                <QuickHPPCalculator hppData={hppData} setHppData={setHppData} />
              ) : (
                <ReadOnlyWrapper feature="kalkulator HPP unlimited">
                  <QuickHPPCalculator hppData={hppData} setHppData={setHppData} />
                </ReadOnlyWrapper>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold">Hasil Perhitungan</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <EnhancedResultDisplay hppData={hppData} />
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="bg-blue-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-blue-600 font-bold text-sm sm:text-base">1</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Input Manual</h3>
            <p className="text-xs sm:text-sm text-gray-600">Masukkan biaya bahan baku, tenaga kerja, dan overhead secara manual</p>
          </Card>

          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="bg-green-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-green-600 font-bold text-sm sm:text-base">2</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Set Margin</h3>
            <p className="text-xs sm:text-sm text-gray-600">Tentukan margin keuntungan untuk mendapatkan harga jual</p>
          </Card>

          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="bg-purple-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-purple-600 font-bold text-sm sm:text-base">3</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Hasil Instan</h3>
            <p className="text-xs sm:text-sm text-gray-600">Dapatkan HPP per porsi dan harga jual secara otomatis</p>
          </Card>

          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="bg-orange-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-orange-600 font-bold text-sm sm:text-base">4</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Simpan Jika Perlu</h3>
            <p className="text-xs sm:text-sm text-gray-600">Simpan hasil kalkulasi sebagai resep untuk penggunaan berulang</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HPPCalculatorPage;
