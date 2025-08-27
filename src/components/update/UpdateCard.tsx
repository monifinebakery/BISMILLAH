import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Bell, Zap, Calendar, User, Tag } from 'lucide-react';
import { AppUpdate } from './types';
import { useUpdates } from './UpdateContext';

interface UpdateCardProps {
  update: AppUpdate;
  isLatest?: boolean;
  isUnread?: boolean; // Tambah prop untuk konsistensi
}

export const UpdateCard: React.FC<UpdateCardProps> = ({ update, isLatest = false, isUnread }) => {
  const { unseenUpdates, markAsSeen } = useUpdates();

  // Gunakan prop isUnread jika disediakan, jika tidak gunakan logika dari unseenUpdates
  const isUnseen = isUnread ?? unseenUpdates.some(u => u.id === update.id);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800',
          label: 'CRITICAL',
        };
      case 'high':
        return {
          icon: <Zap className="w-5 h-5" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-orange-100 text-orange-800',
          label: 'HIGH',
        };
      case 'normal':
        return {
          icon: <Bell className="w-5 h-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-800',
          label: 'NORMAL',
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          badgeColor: 'bg-gray-200 text-gray-800',
          label: 'LOW',
        };
    }
  };

  const config = getPriorityConfig(update.priority);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkAsSeen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Hentikan event agar tidak mengganggu onClick card
    if (isUnseen) {
      markAsSeen(update.id);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-lg border transition-all duration-200 ${
        isUnseen ? `${config.borderColor} border-l-4` : 'border-gray-300 hover:border-gray-300'
      }`}
      onClick={handleMarkAsSeen} // Klik card untuk tandai sebagai sudah dibaca
    >
      {/* Latest badge */}
      {isLatest && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          Terbaru
        </div>
      )}

      {/* Unseen indicator */}
      {isUnseen && (
        <div className="absolute top-4 right-4">
          <div
            className={`w-3 h-3 rounded-full ${
              update.priority === 'critical'
                ? 'bg-red-500'
                : update.priority === 'high'
                ? 'bg-orange-500'
                : 'bg-blue-500'
            } animate-pulse`}
          ></div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`${config.iconColor} mt-1`}>{config.icon}</div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{update.title}</h3>
              {isUnseen && (
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                  Baru
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                <Tag className="w-3 h-3" />
                Versi {update.version}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full font-semibold ${config.badgeColor}`}>
                {config.label}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{update.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(update.release_date)}
            </div>
            {update.created_by && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Admin
              </div>
            )}
          </div>

          {isUnseen && (
            <button
              onClick={handleMarkAsSeen}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Tandai Sudah Dibaca
            </button>
          )}
        </div>
      </div>
    </div>
  );
};