// src/components/SimpleNotificationBell.tsx
// ✅ SIMPLE NOTIFICATION BELL - Minimal implementation

import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useSimpleNotification } from '@/contexts/SimpleNotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

// Simple icon component based on notification type
const getNotificationIcon = (type: string, icon?: string) => {
  // First check if there's a specific icon specified
  if (icon) {
    switch (icon) {
      case 'check-circle':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'alert-circle':
        return <Bell className="h-4 w-4 text-orange-600" />;
      case 'x-circle':
        return <X className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  }
  
  // Fallback to type-based icons
  switch (type) {
    case 'success':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <Bell className="h-4 w-4 text-orange-600" />;
    case 'error':
      return <X className="h-4 w-4 text-red-600" />;
    default:
      return <Bell className="h-4 w-4 text-blue-600" />;
  }
};

// Format time
const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
  } catch {
    return 'baru saja';
  }
};

// Get priority indicator
const getPriorityIndicator = (priority: number) => {
  if (priority >= 4) return <span className="w-2 h-2 bg-red-500 rounded-full"></span>;
  if (priority >= 3) return <span className="w-2 h-2 bg-orange-500 rounded-full"></span>;
  if (priority >= 2) return <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>;
  return null;
};

const SimpleNotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearAll,
    archiveNotification
  } = useSimpleNotification();
  
  const [isOpen, setIsOpen] = useState(false);

  // Handle notification click
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle clear all
  const handleClearAll = () => {
    clearAll();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
      >
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notifikasi</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} baru</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0" 
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={markAllAsRead} 
                  className="text-blue-600 text-xs px-2 h-8"
                >
                  Baca Semua
                </Button>
              )}
              {notifications.length > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={clearAll} 
                  className="text-red-600 text-xs px-2 h-8"
                >
                  Hapus Semua
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Bell className="h-10 w-10 text-gray-300 mb-3" />
              <h4 className="font-medium">Tidak ada notifikasi</h4>
              <p className="text-sm">Notifikasi baru akan muncul di sini</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      // Handle action URL if present
                      if (notification.action_url) {
                        window.location.href = notification.action_url;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5 flex items-center gap-1">
                        {getNotificationIcon(notification.type, notification.icon)}
                        {getPriorityIndicator(notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            {notification.message && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <time className="text-xs text-gray-500 mt-2 block">
                              {formatTime(notification.created_at)}
                            </time>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SimpleNotificationBell;