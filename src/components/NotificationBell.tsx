// components/NotificationBell.tsx
import React, { useState } from 'react';
import { 
  Bell, MoreHorizontal, Check, CheckCheck, Trash2, Archive, Settings, 
  AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw, ShoppingCart, 
  Package, User, Calendar, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotification, type Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = {
  'bell': Bell, 'alert-circle': AlertCircle, 'alert-triangle': AlertTriangle,
  'info': Info, 'check-circle': CheckCircle, 'refresh-cw': RefreshCw,
  'shopping-cart': ShoppingCart, 'package': Package, 'user': User,
  'calendar': Calendar, 'welcome': CheckCircle
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

  const getNotificationIcon = (notification: Notification) => {
    const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  const getTypeColor = (type: string, priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-50 border-red-200';
    if (priority >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'info': default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleAction = async (e: React.MouseEvent, action: Promise<boolean>, successMessage: string) => {
    e.stopPropagation();
    const success = await action;
    if (success) {
      toast.success(successMessage);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: localeId });
    } catch (e) {
      return 'beberapa saat lalu';
    }
  };

  const displayNotifications = notifications.slice(0, 50);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors" title="Notifikasi">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className={cn("absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs font-bold", urgentCount > 0 ? "bg-red-600 animate-pulse" : "bg-orange-500")}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 shadow-xl border-gray-200 rounded-lg" align="end" sideOffset={8}>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">Notifikasi</h3>
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount} baru</Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => refreshNotifications()} className="text-gray-500 hover:text-gray-800 h-8 w-8 p-0" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="text-blue-600 text-xs px-2 h-8">
                  Baca Semua
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-gray-500"><RefreshCw className="h-5 w-5 animate-spin mr-2" /><span>Memuat...</span></div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Bell className="h-10 w-10 text-gray-300 mb-3" />
              <h4 className="font-medium text-gray-700">Tidak ada notifikasi</h4>
              <p className="text-sm">Notifikasi baru akan muncul di sini.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-gray-100">
                {displayNotifications.map((notification) => (
                  <div key={notification.id} className={cn("group flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer", !notification.is_read && "bg-blue-50/50")} onClick={() => handleNotificationClick(notification)}>
                    <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border", getTypeColor(notification.type, notification.priority))}>
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-sm font-medium truncate", !notification.is_read ? "text-gray-900" : "text-gray-700")}>{notification.title}</h4>
                          {notification.message && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>}
                          <time className="text-xs text-gray-500 mt-2 block">{formatRelativeTime(notification.created_at)}</time>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.is_read && <DropdownMenuItem onClick={(e) => handleAction(e, markAsRead(notification.id), 'Ditandai dibaca')}><Check className="h-4 w-4 mr-2" />Tandai Dibaca</DropdownMenuItem>}
                            <DropdownMenuItem onClick={(e) => handleAction(e, archiveNotification(notification.id), 'Notifikasi diarsipkan')}><Archive className="h-4 w-4 mr-2" />Arsipkan</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleAction(e, deleteNotification(notification.id), 'Notifikasi dihapus')} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {displayNotifications.length > 0 && (
            <div className="border-t bg-gray-50 p-3 text-center">
              <Button variant="link" size="sm" onClick={() => { navigate('/notifications'); setIsOpen(false); }} className="text-sm text-blue-600 h-auto">Lihat Semua Notifikasi</Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;