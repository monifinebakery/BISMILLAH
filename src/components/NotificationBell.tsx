import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';

// --- Impor Hook Baru ---
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { useActivity } from '@/contexts/ActivityContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  read: boolean;
  timestamp: Date;
}

const NotificationBell = () => {
  // --- Panggil Hook Baru ---
  const { bahanBaku } = useBahanBaku();
  const { activities } = useActivity();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // ✅ PERBAIKAN: Logika disesuaikan dengan data dari hook baru
    const lowStockItems = bahanBaku.filter(item => item.stok <= item.minimum);
    const currentTime = new Date();
    
    const lowStockNotifications: Notification[] = lowStockItems.map(item => ({
      id: `low-stock-${item.id}`,
      title: 'Stok Menipis',
      message: `${item.nama} tersisa ${item.stok} ${item.satuan}`,
      type: 'warning' as const,
      read: false,
      timestamp: currentTime,
    }));

    const activityNotifications: Notification[] = activities.slice(0, 5).map(activity => ({
      id: `activity-${activity.id}`,
      title: activity.title,
      message: activity.description,
      type: 'info' as const,
      read: false,
      timestamp: activity.timestamp, 
    }));

    const allNotifications = [...lowStockNotifications, ...activityNotifications]
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, 10);

    setNotifications(allNotifications);
  }, [bahanBaku, activities]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs">
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <ScrollArea className="h-64">
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Tidak ada notifikasi baru
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${notification.type === 'warning' ? 'text-orange-600' : ''}`}>{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1 ml-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
