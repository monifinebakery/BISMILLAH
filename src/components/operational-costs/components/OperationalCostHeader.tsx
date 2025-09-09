import React from 'react';
import { Plus, DollarSign, Zap, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOperationalCost } from '../context';
import { type AppSettings } from '../types/operationalCost.types';
import { formatCurrency, formatNumber } from '../utils/costHelpers';

interface OperationalCostHeaderProps {
  onStartOnboarding: () => void;
  onOpenAddDialog: () => void;
  appSettings?: AppSettings | null;
  onUpdateTarget?: (target: number) => void | Promise<void>;
}

const OperationalCostHeader: React.FC<OperationalCostHeaderProps> = ({
  onStartOnboarding,
  onOpenAddDialog,
  appSettings = null,
  onUpdateTarget,
}) => {
  const { state } = useOperationalCost();
  const hasOperationalData = state.costs.length > 0;

  // Prefer props appSettings (from page) then fallback to context (if available)
  const settings = appSettings || (state as any).appSettings || null;
  const hasOverheadSetup = !!settings?.overhead_per_pcs;

  // Local state for inline target editing
  const [editing, setEditing] = React.useState(false);
  const [targetValue, setTargetValue] = React.useState<number>(settings?.target_output_monthly || 0);
  React.useEffect(() => {
    setTargetValue(settings?.target_output_monthly || 0);
  }, [settings?.target_output_monthly]);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold">
                Biaya Operasional
              </h1>
            </div>
            <p className="text-white text-opacity-90">
              Kelola biaya operasional dan hitung overhead per produk dengan akurat
            </p>
            {/* ✅ Info */}
            <div className="mt-2 text-xs text-white text-opacity-85">
              {hasOperationalData ? (
                <>
                  {state.costs.length} biaya • Overhead: {formatCurrency(settings?.overhead_per_pcs || 0)}/pcs · Operasional: {formatCurrency(settings?.operasional_per_pcs || 0)}/pcs
                </>
              ) : (
                'Belum ada biaya operasional. Tambahkan untuk mulai perhitungan.'
              )}
            </div>

            {/* ✅ Target bulanan */}
            <div className="mt-3">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value) || 0)}
                    className="w-40 bg-white text-gray-900"
                  />
                  <Button
                    size="sm"
                    className="bg-white text-orange-600 hover:bg-gray-100"
                    onClick={async () => {
                      const next = Math.max(1, Number(targetValue) || 0);
                      await onUpdateTarget?.(next);
                      setEditing(false);
                    }}
                  >
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white"
                    onClick={() => {
                      setTargetValue(settings?.target_output_monthly || 0);
                      setEditing(false);
                    }}
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-white text-opacity-90">
                  Target bulanan: <strong>{formatNumber(settings?.target_output_monthly || 0)} pcs</strong>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-3 bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => setEditing(true)}
                  >
                    Ubah
                  </Button>
                </div>
              )}
            </div>
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
            className="flex items-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-2 rounded-lg transition-all"
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
          className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-3 rounded-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Tambah Biaya
        </Button>
      </div>
    </div>
  );
};

export default OperationalCostHeader;
