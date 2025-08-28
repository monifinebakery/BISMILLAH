import React from 'react';
import { Plus, DollarSign, Info, Calculator, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OperationalCostHeaderProps {
  onStartOnboarding: () => void;
  onOpenAddDialog: () => void;
}

const OperationalCostHeader: React.FC<OperationalCostHeaderProps> = ({
  onStartOnboarding,
  onOpenAddDialog
}) => {
  return (
    <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-12 right-8 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-8 left-16 w-20 h-20 bg-white bg-opacity-5 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-20 rounded-full blur-xl animate-pulse"></div>
      </div>
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm border border-white border-opacity-20 shadow-2xl">
                <div className="relative">
                  <DollarSign className="h-10 w-10 text-white drop-shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl blur opacity-30 animate-pulse"></div>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent drop-shadow-lg">
                💰 Biaya Operasional
              </h1>
              <p className="text-white text-opacity-90 text-lg">
                Kelola biaya operasional dan hitung overhead per produk
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-15 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Calculator className="h-4 w-4" />
                  <span>Smart Calculator</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-15 px-3 py-1 rounded-full backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Real-time Analysis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex gap-4">
            <Button
              onClick={onStartOnboarding}
              className="group flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 border-0 hover:from-yellow-300 hover:to-orange-300 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
            >
              <Zap className="h-5 w-5 group-hover:animate-bounce" />
              <span>Setup Cepat</span>
            </Button>
            <Button
              onClick={onOpenAddDialog}
              className="group flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Tambah Biaya</span>
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-4 mt-8">
          <Button
            onClick={onStartOnboarding}
            className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 border-0 hover:from-yellow-300 hover:to-orange-300 font-semibold px-6 py-4 rounded-xl transition-all duration-300 transform active:scale-95 shadow-xl"
          >
            <Zap className="h-5 w-5 group-active:animate-bounce" />
            <span>Setup Cepat</span>
          </Button>
          <Button
            onClick={onOpenAddDialog}
            className="group w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-semibold px-6 py-4 rounded-xl transition-all duration-300 transform active:scale-95 backdrop-blur-sm shadow-xl"
          >
            <Plus className="h-5 w-5 group-active:rotate-90 transition-transform duration-300" />
            <span>Tambah Biaya</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OperationalCostHeader;