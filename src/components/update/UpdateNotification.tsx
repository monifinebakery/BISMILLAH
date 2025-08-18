import React from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, AlertTriangle, Info, Bell, Zap } from 'lucide-react';
import { AppUpdate } from './types';

interface UpdateNotificationProps {
  update: AppUpdate;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ update, onDismiss }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800'
        };
      case 'high':
        return {
          icon: <Zap className="w-5 h-5" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-orange-100 text-orange-800'
        };
      case 'normal':
        return {
          icon: <Bell className="w-5 h-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          badgeColor: 'bg-gray-100 text-gray-800'
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
      minute: '2-digit'
    });
  };

  return (
    <div className={`max-w-md w-full ${config.bgColor} border ${config.borderColor} rounded-lg p-4 relative`}>
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`${config.iconColor} mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${config.textColor} text-sm`}>
              {update.title}
            </h4>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badgeColor}`}>
              Versi {update.version}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badgeColor}`}>
              {update.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            {formatDate(update.release_date)}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className={`text-sm ${config.textColor} leading-relaxed line-clamp-3`}>
          {update.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link 
          to="/updates" 
          className={`inline-flex items-center gap-1 text-xs ${config.textColor} hover:opacity-80 font-medium transition-opacity`}
          onClick={onDismiss}
        >
          <ExternalLink className="w-3 h-3" />
          Lihat semua pembaruan
        </Link>
        
        <button
          onClick={onDismiss}
          className={`text-xs ${config.textColor} hover:opacity-80 font-medium transition-opacity`}
        >
          Tutup
        </button>
      </div>
    </div>
  );
};