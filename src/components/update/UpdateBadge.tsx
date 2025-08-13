import React from 'react';
import { Bell } from 'lucide-react';
import { useUpdates } from './UpdateContext';

interface UpdateBadgeProps {
  className?: string;
  showCount?: boolean;
}

export const UpdateBadge: React.FC<UpdateBadgeProps> = ({ className = '', showCount = true }) => {
  const { hasUnseenUpdates, unseenUpdates } = useUpdates();

  if (!hasUnseenUpdates) {
    return (
      <div className={`relative ${className}`}>
        <Bell className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

  const criticalCount = unseenUpdates.filter(u => u.priority === 'critical').length;
  const highCount = unseenUpdates.filter(u => u.priority === 'high').length;
  const totalCount = unseenUpdates.length;

  // Determine badge color based on highest priority
  const getBadgeColor = () => {
    if (criticalCount > 0) return 'bg-red-500';
    if (highCount > 0) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`relative ${className}`}>
      <Bell className="w-5 h-5 text-gray-700" />
      
      {/* Badge indicator */}
      <div className={`absolute -top-1 -right-1 ${getBadgeColor()} rounded-full min-w-[18px] h-[18px] flex items-center justify-center`}>
        {showCount && totalCount <= 99 ? (
          <span className="text-white text-xs font-semibold leading-none">
            {totalCount}
          </span>
        ) : (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        )}
      </div>
    </div>
  );
};