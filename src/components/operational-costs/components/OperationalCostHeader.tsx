import React from 'react';
import { Plus, DollarSign, Calculator, TrendingUp, Zap } from 'lucide-react';
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
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mb-6 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Biaya Operasional
            </h1>
            <p className="text-white text-opacity-90">
              Kelola biaya operasional dan hitung overhead per produk dengan akurat
            </p>
          </div>
        </div>

        <div className="hidden md:flex gap-3">
          <Button
            onClick={onStartOnboarding}
            className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
          >
            <Zap className="h-4 w-4" />
            Setup Cepat
          </Button>

          <Button
            onClick={onOpenAddDialog}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Biaya
          </Button>
        </div>
      </div>

      <div className="flex md:hidden flex-col gap-3 mt-6">
        <Button
          onClick={onStartOnboarding}
          className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
        >
          <Zap className="h-4 w-4" />
          Setup Cepat
        </Button>
        <Button
          onClick={onOpenAddDialog}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Biaya
        </Button>
      </div>
    </div>
  );
};

export default OperationalCostHeader;