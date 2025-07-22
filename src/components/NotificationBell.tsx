// components/NotificationBell.jsx
import React, { useState } from 'react';
import { 
  Bell, 
  MoreHorizontal, 
  Check, 
  CheckCheck, 
  Trash2, 
  Archive, 
  Settings, 
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  ShoppingCart,
  Package,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotification, type Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Icon mapping for different notification types and icons
const iconMap = {
  'bell': Bell,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'info': Info,
  'check-circle': CheckCircle,
  'refresh-cw': RefreshCw,
  'shopping-cart': ShoppingCart,
  'package': Package,
  'user': User,
  'calendar': Calendar,
  'welcome': CheckCircle
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    urgentCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    refreshNotifications
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Get icon component for notification
  const getNotificationIcon = (notification: Notification) => {
    const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  // Get color based on notification type
  const getTypeColor = (type: string, priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-50 border-red-200';
    if (priority >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'info': 
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const success = await markAsRead(notificationId);
    if (success) {
      toast.success('Notifikasi ditandai sebagai dibaca');
    }
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const success = await deleteNotification(notificationId);
    if (success) {
      toast.success('Notifikasi berhasil dihapus');
    }
  };

  // Handle archive
  const handleArchive = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const success = await archiveNotification(notificationId);
    if (success) {
      toast.success('Notifikasi berhasil diarsipkan');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setIsOpen(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: localeId
    });
  };

  // Get display notifications (limit to recent 50)
  const displayNotifications = notifications.slice(0, 50);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 transition-colors"
          title="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold min-w-[20px] px-1",
                urgentCount > 0 ? "bg-red-600 animate-pulse" : "bg-orange-500"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {/* Urgent indicator */}
          {urgentCount > 0 && (
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-600 rounded-full animate-ping" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-96 p-0 shadow-xl border-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notifikasi</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {unreadCount} baru
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNotifications}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-white hover:bg-white/20 text-xs px-2 h-8"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Baca Semua
                </Button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Memuat notifikasi...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && displayNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <h4 className="font-medium text-gray-700 mb-1">Tidak ada notifikasi</h4>
              <p className="text-sm text-center">
                Notifikasi baru akan muncul di sini
              </p>
            </div>
          )}

          {/* Notifications list */}
          {!isLoading && displayNotifications.length > 0 && (
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-gray-100">
                {displayNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                      !notification.is_read && "bg-blue-50/50 border-l-4 border-l-blue-500"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
                      getTypeColor(notification.type, notification.priority)
                    )}>
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            !notification.is_read ? "text-gray-900" : "text-gray-700"
                          )}>
                            {notification.title}
                            {notification.priority >= 4 && (
                              <span className="ml-2 text-xs text-red-600 font-bold">URGENT</span>
                            )}
                            {notification.priority === 3 && (
                              <span className="ml-2 text-xs text-orange-600 font-bold">PENTING</span>
                            )}
                          </h4>
                          
                          {notification.message && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <time className="text-xs text-gray-500">
                              {formatRelativeTime(notification.created_at)}
                            </time>
                            
                            {notification.action_url && (
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Action menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {!notification.is_read && (
                              <DropdownMenuItem
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="cursor-pointer"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Tandai Dibaca
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem
                              onClick={(e) => handleArchive(e, notification.id)}
                              className="cursor-pointer"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Arsipkan
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          {displayNotifications.length > 0 && (
            <div className="border-t bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Menampilkan {Math.min(displayNotifications.length, 50)} dari {notifications.length} notifikasi
                </p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 h-auto p-1"
                >
                  Lihat Semua
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;