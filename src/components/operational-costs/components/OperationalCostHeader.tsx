import React from 'react';
import { Plus, DollarSign, Zap, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOperationalCost } from '../context';
import { type AppSettings } from '../types/operationalCost.types';
import { formatCurrency } from '../utils/costHelpers';

interface OperationalCostHeaderProps {
  onStartOnboarding: () => void;
  onOpenAddDialog: () => void;
  appSettings?: AppSettings | null;
  syncStatus?: 'idle' | 'syncing' | 'updated' | 'error';
  lastSyncedAt?: string | null;
}

const OperationalCostHeader: React.FC<OperationalCostHeaderProps> = ({
  onStartOnboarding,
  onOpenAddDialog,
  appSettings = null,
  syncStatus = 'idle',
  lastSyncedAt = null,
}) => {
  const { state } = useOperationalCost();
  const hasOperationalData = state.costs.length > 0;

  // Prefer props appSettings (from page) then fallback to context (if available)
  const settings = appSettings || (state as any).appSettings || null;
  const hasOverheadSetup = !!settings?.overhead_per_pcs;
  
  // Determine system status
  const getSystemStatus = () => {
    if (!hasOperationalData) {
      return {
        status: 'not_started',
        label: '🌱 Belum Dimulai',
        color: 'text-gray-200',
        bgColor: 'bg-white bg-opacity-10'
      };
    } else if (!hasOverheadSetup) {
      return {
        status: 'setup_needed', 
        label: '⚙️ Setup Diperlukan',
        color: 'text-amber-200',
        bgColor: 'bg-amber-500 bg-opacity-20'
      };
    } else {
      return {
        status: 'active',
        label: '🚀 Sistem Aktif',
        color: 'text-green-200',
        bgColor: 'bg-green-500 bg-opacity-20'
      };
    }
  };
  
  const systemStatus = getSystemStatus();

  const renderSyncBadge = () => {
    const base = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-white border-opacity-30 backdrop-blur-sm';
    if (syncStatus === 'syncing') {
      return (
        <div className={`${base} bg-white/10 text-white`}>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Auto-sync berjalan
        </div>
      );
    }
    if (syncStatus === 'updated') {
      return (
        <div className={`${base} bg-green-500/20 text-green-100`}>
          <CheckCircle className="h-3.5 w-3.5" /> Sinkron terbaru {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('id-ID') : ''}
        </div>
      );
    }
    if (syncStatus === 'error') {
      return (
        <div className={`${base} bg-amber-500/20 text-amber-100`}>
          <AlertTriangle className="h-3.5 w-3.5" /> Gagal sinkron, cek koneksi
        </div>
      );
    }
    return null;
  };

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
              {/* ✅ System Status Indicator */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-white border-opacity-30 transition-all ${systemStatus.bgColor} ${systemStatus.color}`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemStatus.status === 'active' ? 'bg-green-300' :
                  systemStatus.status === 'setup_needed' ? 'bg-amber-300 animate-pulse' :
                  'bg-gray-300'
                }`}></div>
                <span>{systemStatus.label}</span>
              </div>
              {renderSyncBadge()}
            </div>
            <p className="text-white text-opacity-90">
              Kelola biaya operasional dan hitung overhead per produk dengan akurat
            </p>
            {/* ✅ Quick Status Info */}
            {hasOperationalData && (
              <div className="mt-2 text-xs text-white text-opacity-85">
                {state.costs.length} biaya •{' '}
                {hasOverheadSetup 
                  ? (
                    <span>
                      Overhead: {formatCurrency(settings?.overhead_per_pcs || 0)}/pcs · Operasional: {formatCurrency(settings?.operasional_per_pcs || 0)}/pcs
                    </span>
                  ) : 'Overhead: Belum dihitung'}
              </div>
            )}
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
