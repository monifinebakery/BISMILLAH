import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Tetap import supabase jika digunakan di tempat lain
import { safeParseDate } from '@/utils/dateUtils'; 

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  read: boolean;
  timestamp: Date; // Pastikan ini Date karena diharapkan selalu valid
}

const NotificationBell = () => {
  const { bahanBaku, activities, loadFromCloud } = useAppData();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const lowStockItems = bahanBaku.filter(item => item.stok <= item.minimum);
    const currentTime = new Date();
    
    // Generate low stock notifications
    const lowStockNotifications: Notification[] = lowStockItems.map(item => ({
      id: `low-stock-${item.id}`,
      title: 'Stok Menipis',
      message: `${item.nama} tersisa ${item.stok} ${item.satuan}`,
      type: 'warning' as const,
      read: false,
      timestamp: currentTime, // currentTime selalu Date valid
    }));

    // Generate activity notifications (latest 3)
    const activityNotifications: Notification[] = activities.slice(0, 3).map(activity => ({
      id: `activity-${activity.id}`,
      title: activity.title,
      message: activity.description,
      type: activity.type === 'hpp' ? 'success' : 
           activity.type === 'stok' ? 'info' : 
           activity.type === 'resep' ? 'info' : 'info',
      read: false,
      // Pastikan activity.timestamp selalu Date yang valid dari AppDataContext.
      // Jika masih ada kemungkinan null/undefined, perlu fallback di sini juga.
      // (Berdasarkan AppDataContext, activity.timestamp sudah Date || new Date())
      timestamp: activity.timestamp, 
    }));

    // Combine and sort by timestamp
    const allNotifications = [...lowStockNotifications, ...activityNotifications]
      .sort((a, b) => {
        // MODIFIKASI DISINI: Defensif check untuk memastikan timestamp adalah Date yang valid
        const timeA = (a.timestamp instanceof Date && !isNaN(a.timestamp.getTime())) ? a.timestamp.getTime() : 0;
        const timeB = (b.timestamp instanceof Date && !isNaN(b.timestamp.getTime())) ? b.timestamp.getTime() : 0;
        return timeB - timeA; // Sort descending (terbaru di atas)
      })
      .slice(0, 10); // Keep only latest 10

    setNotifications(allNotifications);
  }, [bahanBaku, activities]);

  // MODIFIED: Hapus seluruh blok useEffect yang berisi supabase.channel('notification-updates').on(...)
  // Karena manajemen realtime sudah disentralisasi di useSupabaseSync.ts

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      case 'info': return 'outline'; // Tambahkan case 'info' jika Anda ingin badge berbeda
      default: return 'outline';
    }
  };

  const formatTime = (date: Date) => {
    // Pastikan date adalah objek Date yang valid
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Tanggal tidak valid'; // Fallback jika tanggal tidak valid
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
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
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tandai Semua
            </Button>
          )}
        </div>
        <ScrollArea className="h-64">
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Tidak ada notifikasi
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
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <Badge variant={getTypeColor(notification.type)} className="ml-2 text-xs">
                      {notification.type === 'warning' ? 'Peringatan' :
                        notification.type === 'error' ? 'Error' :
                        notification.type === 'success' ? 'Berhasil' : 'Info'}
                    </Badge>
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