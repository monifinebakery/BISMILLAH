// components/NotificationDebugEnhanced.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const NotificationDebugEnhanced = () => {
  const { notifications, unreadCount, refreshNotifications, isLoading, addNotification } = useNotification();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [manualDbData, setManualDbData] = useState<any[]>([]);

  const runFullDiagnostics = async () => {
    console.log('🔍 Running full diagnostics...');
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      userInfo: {
        isLoggedIn: !!user,
        userId: user?.id || 'Not logged in',
        userEmail: user?.email || 'No email'
      },
      contextState: {
        notificationsCount: notifications.length,
        unreadCount: unreadCount,
        isLoading: isLoading,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          is_read: n.is_read,
          user_id: n.user_id,
          created_at: n.created_at
        }))
      }
    };

    // Test direct database query
    if (user) {
      try {
        console.log('🗄️ Testing direct database query...');
        const { data: dbData, error: dbError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        diagnostics.databaseQuery = {
          success: !dbError,
          error: dbError?.message || null,
          rowCount: dbData?.length || 0,
          data: dbData || []
        };

        setManualDbData(dbData || []);
        
        console.log('📊 Database query result:', dbData);
        console.log('❌ Database query error:', dbError);
      } catch (error) {
        console.error('💥 Database query failed:', error);
        diagnostics.databaseQuery = {
          success: false,
          error: `Exception: ${error}`,
          rowCount: 0,
          data: []
        };
      }

      // Test real-time subscription
      try {
        console.log('📡 Testing real-time connection...');
        const channelTest = supabase
          .channel('debug-test')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            console.log('📡 Real-time test payload received:', payload);
          })
          .subscribe((status) => {
            console.log('📡 Real-time subscription status:', status);
            diagnostics.realtimeTest = {
              status: status,
              timestamp: new Date().toISOString()
            };
          });

        // Clean up test channel after 2 seconds
        setTimeout(() => {
          supabase.removeChannel(channelTest);
        }, 2000);
      } catch (error) {
        console.error('💥 Real-time test failed:', error);
        diagnostics.realtimeTest = {
          error: `Exception: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    }

    setDebugInfo(diagnostics);
    console.log('🔍 Full diagnostics result:', diagnostics);
  };

  const testNotificationCreation = async () => {
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('🧪 Testing notification creation via addNotification...');
    
    try {
      const success = await addNotification({
        title: `🔧 Context Test ${Date.now()}`,
        message: 'This test uses addNotification from context!',
        type: 'info',
        icon: 'bell',
        priority: 2,
        is_read: false,
        is_archived: false
      });

      console.log('✅ Context addNotification result:', success);
      
      if (success) {
        // Force refresh after successful creation
        setTimeout(() => {
          refreshNotifications();
        }, 1000);
      }
    } catch (error) {
      console.error('💥 Context test notification creation failed:', error);
    }
  };

  const testDirectDatabaseInsert = async () => {
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('🧪 Testing direct database insert...');
    
    try {
      const testNotification = {
        user_id: user.id,
        title: `🗄️ Direct DB Test ${Date.now()}`,
        message: 'This is inserted directly to database!',
        type: 'success',
        icon: 'database',
        priority: 2,
        is_read: false,
        is_archived: false
      };

      console.log('📝 Inserting direct to database:', testNotification);

      const { data, error } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (error) {
        console.error('❌ Direct insert failed:', error);
      } else {
        console.log('✅ Direct insert successful:', data);
        
        // Force refresh context
        setTimeout(() => {
          refreshNotifications();
        }, 1000);
      }
    } catch (error) {
      console.error('💥 Direct database test failed:', error);
    }
  };

  const testMarkAsRead = async () => {
    if (notifications.length === 0) {
      console.log('❌ No notifications to test mark as read');
      return;
    }

    const unreadNotification = notifications.find(n => !n.is_read);
    if (!unreadNotification) {
      console.log('❌ No unread notifications to test');
      return;
    }

    console.log('🧪 Testing mark as read for:', unreadNotification.id);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', unreadNotification.id)
        .eq('user_id', user?.id)
        .select();

      console.log('📝 Mark as read result:', { data, error });
      
      if (!error) {
        setTimeout(() => {
          refreshNotifications();
        }, 500);
      }
    } catch (error) {
      console.error('💥 Mark as read test failed:', error);
    }
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing notifications...');
    await refreshNotifications();
    await runFullDiagnostics();
  };

  useEffect(() => {
    runFullDiagnostics();
  }, [user, notifications]);

  return (
    <Card className="mt-6 border-2 border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Enhanced Notification Debug 
          <Badge variant="outline" className="text-xs">
            Dev Tool
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runFullDiagnostics} size="sm" variant="outline">
            🔍 Run Diagnostics
          </Button>
          <Button onClick={testNotificationCreation} size="sm" variant="outline">
            🧪 Test Context Add
          </Button>
          <Button onClick={testDirectDatabaseInsert} size="sm" variant="outline">
            🗄️ Test Direct DB
          </Button>
          <Button onClick={testMarkAsRead} size="sm" variant="outline">
            ✅ Test Mark Read
          </Button>
          <Button onClick={forceRefresh} size="sm" variant="outline">
            🔄 Force Refresh
          </Button>
        </div>

        {/* User Info */}
        <div className="p-3 bg-blue-50 rounded">
          <h4 className="font-semibold">👤 User Info:</h4>
          <div className="text-sm space-y-1">
            <p><strong>Logged In:</strong> {user ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{user?.id || 'None'}</code></p>
            <p><strong>Email:</strong> {user?.email || 'None'}</p>
          </div>
        </div>

        {/* Context State */}
        <div className="p-3 bg-green-50 rounded">
          <h4 className="font-semibold">📊 Context State:</h4>
          <div className="text-sm space-y-1">
            <p><strong>Notifications:</strong> {notifications.length}</p>
            <p><strong>Unread:</strong> {unreadCount}</p>
            <p><strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Context Data */}
          <div className="p-3 bg-yellow-50 rounded">
            <h4 className="font-semibold">📱 Context Data ({notifications.length}):</h4>
            <div className="max-h-32 overflow-auto text-xs space-y-1">
              {notifications.length === 0 ? (
                <p className="text-gray-500 italic">No notifications in context</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="border-b pb-1">
                    <p><strong>{n.title}</strong></p>
                    <p>Read: {n.is_read ? '✅' : '❌'} | ID: {n.id.slice(0, 8)}...</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Database Data */}
          <div className="p-3 bg-purple-50 rounded">
            <h4 className="font-semibold">🗄️ Database Data ({manualDbData.length}):</h4>
            <div className="max-h-32 overflow-auto text-xs space-y-1">
              {manualDbData.length === 0 ? (
                <p className="text-gray-500 italic">No notifications in database</p>
              ) : (
                manualDbData.map((n: any) => (
                  <div key={n.id} className="border-b pb-1">
                    <p><strong>{n.title}</strong></p>
                    <p>Read: {n.is_read ? '✅' : '❌'} | ID: {n.id.slice(0, 8)}...</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Database Query Results */}
        {debugInfo.databaseQuery && (
          <div className="p-3 bg-gray-50 rounded">
            <h4 className="font-semibold">🔧 Database Query Result:</h4>
            <div className="text-xs">
              <p><strong>Success:</strong> {debugInfo.databaseQuery.success ? '✅' : '❌'}</p>
              <p><strong>Row Count:</strong> {debugInfo.databaseQuery.rowCount}</p>
              {debugInfo.databaseQuery.error && (
                <p className="text-red-600"><strong>Error:</strong> {debugInfo.databaseQuery.error}</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-orange-50 rounded text-sm border border-orange-200">
          <p><strong>📝 Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Check Browser Console (F12) for detailed logs</li>
            <li>Compare Context vs Database counts</li>
            <li>Test "Context Add" vs "Direct DB" to see which works</li>
            <li>Check if notification bell updates after tests</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDebugEnhanced;