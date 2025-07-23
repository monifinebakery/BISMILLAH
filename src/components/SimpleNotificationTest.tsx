// components/SimpleNotificationTest.tsx
// TEST COMPONENT - ADD THIS TO SETTINGS PAGE TEMPORARILY

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Test if basic notification context works
const SimpleNotificationTest = () => {
  const testBasicImport = () => {
    console.log('🧪 Basic component loaded successfully');
    alert('Basic component works! Check console for more info.');
  };

  const testNotificationImport = async () => {
    try {
      // Test if we can import useNotification
      const { useNotification } = await import('@/contexts/NotificationContext');
      console.log('✅ NotificationContext import successful');
      alert('NotificationContext import works!');
    } catch (error) {
      console.error('❌ NotificationContext import failed:', error);
      alert('NotificationContext import FAILED - check console');
    }
  };

  const testAuthImport = async () => {
    try {
      // Test if we can import useAuth
      const { useAuth } = await import('@/contexts/AuthContext');
      console.log('✅ AuthContext import successful');
      alert('AuthContext import works!');
    } catch (error) {
      console.error('❌ AuthContext import failed:', error);
      alert('AuthContext import FAILED - check console');
    }
  };

  return (
    <Card className="mt-6 border-2 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800">🧪 Simple Test Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-700">
          If you can see this, the component import is working.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testBasicImport} size="sm" variant="outline">
            Test Basic
          </Button>
          <Button onClick={testNotificationImport} size="sm" variant="outline">
            Test Notification Import
          </Button>
          <Button onClick={testAuthImport} size="sm" variant="outline">
            Test Auth Import
          </Button>
        </div>
        <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
          <p><strong>Check:</strong></p>
          <ul className="list-disc list-inside">
            <li>Browser console (F12)</li>
            <li>Network tab for import errors</li>
            <li>Build errors in terminal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleNotificationTest;