# Simple Notification System

A simplified notification system for the BISMILLAH application.

## Overview

This is a minimal implementation of a notification system that provides basic functionality without the complexity of the original system.

## Features

- Add notifications with title, message, and type
- Mark notifications as read
- Mark all notifications as read
- Remove individual notifications
- Clear all notifications
- Display unread count
- Simple UI components

## Files

- `src/contexts/SimpleNotificationContext.tsx` - Main context provider
- `src/components/SimpleNotificationBell.tsx` - Notification bell component
- `src/services/simpleNotificationApi.ts` - Basic CRUD operations
- `src/components/SimpleNotificationExample.tsx` - Example usage component
- `src/utils/testSimpleNotifications.ts` - Test utilities

## Usage

### 1. Wrap your app with the provider

```tsx
import { SimpleNotificationProvider } from '@/contexts/SimpleNotificationContext';

function App() {
  return (
    <SimpleNotificationProvider>
      {/* Your app content */}
    </SimpleNotificationProvider>
  );
}
```

### 2. Use the notification bell in your header

```tsx
import SimpleNotificationBell from '@/components/SimpleNotificationBell';

function Header() {
  return (
    <header>
      {/* Other header content */}
      <SimpleNotificationBell />
    </header>
  );
}
```

### 3. Add notifications from anywhere in your app

```tsx
import { useSimpleNotification } from '@/contexts/SimpleNotificationContext';

function MyComponent() {
  const { addNotification } = useSimpleNotification();

  const handleClick = () => {
    addNotification({
      title: 'Hello World',
      message: 'This is a simple notification',
      type: 'info' // or 'success', 'warning', 'error'
    });
  };

  return (
    <button onClick={handleClick}>
      Show Notification
    </button>
  );
}
```

## API

### Context Methods

- `addNotification(notification)` - Add a new notification
- `markAsRead(id)` - Mark a notification as read
- `markAllAsRead()` - Mark all notifications as read
- `removeNotification(id)` - Remove a notification
- `clearAll()` - Clear all notifications

### Notification Object

```ts
interface SimpleNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  isRead: boolean;
}
```

## Styling

The components use Tailwind CSS classes and are designed to be simple and clean. You can customize the appearance by modifying the components directly.

## Testing

You can test the system by importing and using the example component or by calling the test utilities in `src/utils/testSimpleNotifications.ts`.