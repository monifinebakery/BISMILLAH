// src/components/operational-costs/components/EmptyState.tsx

import React from 'react';
import { Plus, FileText, Settings, BarChart3, ChartBar } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-costs' | 'no-results' | 'no-settings' | 'no-data';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-costs',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'no-costs':
        return {
          icon: FileText,
          title: title || 'Belum Ada Biaya Operasional',
          description: description || 'Mulai tambahkan biaya operasional untuk menghitung overhead produksi Anda.',
          actionLabel: actionLabel || 'Tambah Biaya Pertama',
          iconColor: 'text-orange-400',
          bgColor: 'bg-orange-50',
        };
      
      case 'no-results':
        return {
          icon: FileText,
          title: title || 'Tidak Ada Hasil',
          description: description || 'Tidak ada biaya yang sesuai dengan kriteria pencarian Anda.',
          actionLabel: actionLabel || 'Reset Filter',
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50',
        };
      
      case 'no-settings':
        return {
          icon: Cog,
          title: title || 'Pengaturan Alokasi Belum Dikonfigurasi',
          description: description || 'Atur metode alokasi biaya untuk menghitung overhead per unit produksi.',
          actionLabel: actionLabel || 'Atur Sekarang',
          iconColor: 'text-orange-400',
          bgColor: 'bg-orange-50',
        };
      
      case 'no-data':
        return {
          icon: ChartBar,
          title: title || 'Belum Ada Data',
          description: description || 'Data akan ditampilkan setelah Anda menambahkan biaya operasional.',
          actionLabel: actionLabel || 'Mulai',
          iconColor: 'text-purple-400',
          bgColor: 'bg-purple-50',
        };
      
      default:
        return {
          icon: FileText,
          title: title || 'Tidak Ada Data',
          description: description || 'Belum ada data untuk ditampilkan.',
          actionLabel: actionLabel || 'Tambah Data',
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const config = getEmptyStateConfig();
  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className={`${config.bgColor} rounded-full p-6 mb-6`}>
        <IconComponent className={`h-12 w-12 ${config.iconColor}`} />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {config.title}
      </h3>
      
      <p className="text-gray-500 text-center max-w-md mb-6">
        {config.description}
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          {config.actionLabel}
        </button>
      )}
      
      {type === 'no-costs' && !onAction && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-4">
            Contoh biaya operasional yang bisa ditambahkan:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Gaji Karyawan',
              'Listrik Pabrik',
              'Sewa Gedung',
              'Pemeliharaan Mesin',
              'Bahan Bakar'
            ].map((example) => (
              <span
                key={example}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-gray-800"
              >
                {example}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;