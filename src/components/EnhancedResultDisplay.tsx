// src/components/EnhancedResultDisplay.tsx
// 🧮 UPDATED WITH HPP PER PCS CALCULATION SUPPORT

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calculator, DollarSign, Package, Users, PieChart } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/utils/formatUtils";

// 🧮 Updated interface to match new HPP system
interface HPPCalculationResult {
  // Input values
  totalBahanBaku: number;
  biayaTenagaKerja: number;
  biayaOverhead: number;
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  marginKeuntunganPersen: number;
  
  // Calculated values
  totalHPP: number;
  hppPerPorsi: number;
  hppPerPcs: number;
  hargaJualPorsi: number;
  hargaJualPerPcs: number;
  marginKeuntungan: number;
  profitabilitas: number;
}

interface EnhancedResultDisplayProps {
  hppData: HPPCalculationResult;
  namaResep?: string;
}

const EnhancedResultDisplay = ({ hppData, namaResep }: EnhancedResultDisplayProps) => {
  const profitPerPorsi = hppData.hargaJualPorsi - hppData.hppPerPorsi;
  const profitPerPcs = hppData.hargaJualPerPcs - hppData.hppPerPcs;
  const totalPcsProduced = hppData.jumlahPorsi * hppData.jumlahPcsPerPorsi;
  const totalProfit = profitPerPorsi * hppData.jumlahPorsi;

  // Cost breakdown percentages
  const totalCost = hppData.totalBahanBaku + hppData.biayaTenagaKerja + hppData.biayaOverhead;
  const bahanBakuPercent = totalCost > 0 ? (hppData.totalBahanBaku / totalCost) * 100 : 0;
  const tenagaKerjaPercent = totalCost > 0 ? (hppData.biayaTenagaKerja / totalCost) * 100 : 0;
  const overheadPercent = totalCost > 0 ? (hppData.biayaOverhead / totalCost) * 100 : 0;

  if (hppData.totalHPP === 0) {
    return (
      <div className="text-center py-12">
        <Calculator className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Perhitungan</h3>
        <p className="text-gray-500">Masukkan data bahan baku dan biaya untuk melihat hasil perhitungan HPP</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Recipe Name */}
      {namaResep && (
        <div className="text-center pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{namaResep}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{hppData.jumlahPorsi} porsi</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>{totalPcsProduced} pcs total</span>
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 text-lg flex items-center mb-4">
            <PieChart className="h-5 w-5 mr-2" />
            Rincian Biaya Produksi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Bahan Baku:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {bahanBakuPercent.toFixed(1)}%
                </Badge>
              </div>
              <p className="font-bold text-lg text-blue-600 mt-1">
                {formatCurrency(hppData.totalBahanBaku)}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Tenaga Kerja:</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {tenagaKerjaPercent.toFixed(1)}%
                </Badge>
              </div>
              <p className="font-bold text-lg text-orange-600 mt-1">
                {formatCurrency(hppData.biayaTenagaKerja)}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Overhead:</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {overheadPercent.toFixed(1)}%
                </Badge>
              </div>
              <p className="font-bold text-lg text-purple-600 mt-1">
                {formatCurrency(hppData.biayaOverhead)}
              </p>
            </div>
          </div>

          {/* Total HPP */}
          <div className="bg-gray-800 text-white p-4 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1 flex items-center justify-center">
                <Calculator className="h-4 w-4 mr-1" />
                Total HPP Produksi
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(hppData.totalHPP)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per Porsi & Per PCS Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per Porsi */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 text-green-700 font-semibold mb-2">
                <Users className="h-5 w-5" />
                <span className="text-lg">Per Porsi</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">HPP per Porsi:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency(hppData.hppPerPorsi)}
                  </span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Harga Jual:</span>
                  <span className="font-bold text-green-600 text-xl">
                    {formatCurrency(hppData.hargaJualPorsi)}
                  </span>
                </div>
                {hppData.marginKeuntunganPersen > 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Margin {hppData.marginKeuntunganPersen}%
                  </p>
                )}
              </div>
              
              <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Profit per Porsi:</span>
                  <span className="font-bold text-green-700 text-lg">
                    {formatCurrency(profitPerPorsi)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per PCS */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 text-orange-700 font-semibold mb-2">
                <Package className="h-5 w-5" />
                <span className="text-lg">Per Pcs</span>
              </div>
              <p className="text-xs text-gray-600">
                {hppData.jumlahPcsPerPorsi} pcs per porsi
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">HPP per Pcs:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency(hppData.hppPerPcs)}
                  </span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Harga Jual:</span>
                  <span className="font-bold text-green-600 text-xl">
                    {formatCurrency(hppData.hargaJualPerPcs)}
                  </span>
                </div>
              </div>
              
              <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-orange-700 font-medium">Profit per Pcs:</span>
                  <span className="font-bold text-orange-700 text-lg">
                    {formatCurrency(profitPerPcs)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Analysis */}
      {hppData.marginKeuntunganPersen > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 text-lg flex items-center mb-4">
              <TrendingUp className="h-5 w-5 mr-2" />
              Analisis Profitabilitas
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border text-center">
                <p className="text-gray-600 text-xs mb-1">Total Profit</p>
                <p className="font-bold text-green-600 text-lg">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border text-center">
                <p className="text-gray-600 text-xs mb-1">ROI</p>
                <p className="font-bold text-blue-600 text-lg">
                  {formatPercentage(hppData.profitabilitas / 100)}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border text-center">
                <p className="text-gray-600 text-xs mb-1">Break Even</p>
                <p className="font-bold text-purple-600 text-lg">
                  {formatCurrency(hppData.hppPerPorsi)}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border text-center">
                <p className="text-gray-600 text-xs mb-1">Margin Status</p>
                <Badge 
                  variant={hppData.marginKeuntunganPersen >= 30 ? "default" : hppData.marginKeuntunganPersen >= 20 ? "secondary" : "destructive"}
                  className={
                    hppData.marginKeuntunganPersen >= 30 
                      ? "bg-green-500 hover:bg-green-600" 
                      : hppData.marginKeuntunganPersen >= 20 
                      ? "bg-yellow-500 hover:bg-yellow-600" 
                      : "bg-red-500 hover:bg-red-600"
                  }
                >
                  {hppData.marginKeuntunganPersen >= 30 ? "Excellent" : hppData.marginKeuntunganPersen >= 20 ? "Good" : "Low"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-gray-50 border">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4 text-lg">📋 Ringkasan Perhitungan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700 mb-2">💰 Biaya Produksi:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Total HPP: <span className="font-medium">{formatCurrency(hppData.totalHPP)}</span></li>
                <li>• HPP per porsi: <span className="font-medium">{formatCurrency(hppData.hppPerPorsi)}</span></li>
                <li>• HPP per pcs: <span className="font-medium">{formatCurrency(hppData.hppPerPcs)}</span></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700 mb-2">💵 Harga Jual & Profit:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Harga jual per porsi: <span className="font-medium text-green-600">{formatCurrency(hppData.hargaJualPorsi)}</span></li>
                <li>• Harga jual per pcs: <span className="font-medium text-green-600">{formatCurrency(hppData.hargaJualPerPcs)}</span></li>
                <li>• Total profit: <span className="font-medium text-green-600">{formatCurrency(totalProfit)}</span></li>
                <li>• Margin keuntungan: <span className="font-medium">{hppData.marginKeuntunganPersen}%</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Tips:</strong> 
              {hppData.marginKeuntunganPersen < 20 && " Pertimbangkan untuk menaikkan margin keuntungan atau mengurangi biaya produksi."}
              {hppData.marginKeuntunganPersen >= 20 && hppData.marginKeuntunganPersen < 30 && " Margin keuntungan sudah cukup baik, bisa dioptimalkan lebih lanjut."}
              {hppData.marginKeuntunganPersen >= 30 && " Margin keuntungan sangat baik! Pertahankan kualitas dan efisiensi produksi."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedResultDisplay;