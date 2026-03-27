import React, { createContext, useState, useCallback, useEffect } from 'react';

export const NotificationContext = createContext();

const STORAGE_KEY = 'skipq_notifications';
const MAX_NOTIFICATIONS = 50;

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    } catch {
      // storage full, ignore
    }
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  // Add a new notification
  const addNotification = useCallback(({ title, message, type = 'info', orderId = null, link = null }) => {
    const newNotification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      type, // 'order_update' | 'order_ready' | 'order_placed' | 'promo' | 'info'
      orderId,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));

    // Request browser notification permission and show if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: newNotification.id,
        });
      } catch {
        // SW not available, ignore
      }
    }

    return newNotification;
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Remove a notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Request browser notification permission
  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestBrowserPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
