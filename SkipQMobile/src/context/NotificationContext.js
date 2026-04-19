import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocketContext } from './SocketContext';

export const NotificationContext = createContext(null);

const STORAGE_KEY = 'skipq_notifications';
const MAX_NOTIFICATIONS = 50;

export const NotificationProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const [notifications, setNotifications] = useState([]);

  // Restore
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setNotifications(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  // Persist
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data) => {
      addNotification({
        type: 'order_update',
        title: 'Order Update',
        message: `Order #${data.orderId?.slice(-6) || ''} is now ${data.status}`,
        data,
      });
    };

    const handleDeliveryUpdate = (data) => {
      addNotification({
        type: 'delivery_update',
        title: 'Delivery Update',
        message: data.message || 'Delivery status updated',
        data,
      });
    };

    socket.on('order_status_updated', handleOrderUpdate);
    socket.on('delivery_status_updated', handleDeliveryUpdate);
    socket.on('food_court_pickup_ready', (data) => {
      addNotification({
        type: 'pickup_ready',
        title: 'Pickup Ready',
        message: data.message || 'Your food court order is ready',
        data,
      });
    });

    return () => {
      socket.off('order_status_updated', handleOrderUpdate);
      socket.off('delivery_status_updated', handleDeliveryUpdate);
      socket.off('food_court_pickup_ready');
    };
  }, [socket]);

  const addNotification = useCallback((notif) => {
    const entry = {
      id: Date.now().toString(),
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [entry, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};
