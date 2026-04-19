import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { NotificationContext } from './NotificationContext';

export const SocketContext = createContext();

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const notifCtx = useContext(NotificationContext);

  useEffect(() => {
    // Initialize socket connection
    // Use VITE_SOCKET_URL if set, otherwise connect to same origin
    // (nginx proxies /socket.io to the backend in production)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle order status updates → push to notification center + show toast
    socketInstance.on('order_status_updated', (data) => {
      console.log('Order status updated:', data);
      const statusLabels = {
        confirmed: 'Order Confirmed',
        preparing: 'Being Prepared',
        ready: 'Ready for Pickup',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        completed: 'Completed',
        cancelled: 'Cancelled',
      };
      const label = statusLabels[data.status] || data.status;

      // Build token label for self-service display
      const tokenLabel = data.tokenNumber ? ` | Token #${data.tokenNumber}` : '';

      // Push to notification center
      if (notifCtx?.addNotification) {
        notifCtx.addNotification({
          title: `Order #${data.orderNumber || ''}${tokenLabel} — ${label}`,
          message: data.restaurantName
            ? `${data.restaurantName}: ${label}${data.estimatedTime ? ` (~${data.estimatedTime} min)` : ''}`
            : `Your order status has been updated to ${label}`,
          type: data.status === 'ready' ? 'order_ready' : 'order_update',
          orderId: data.orderId,
        });
      }

      // Show prominent toast for key statuses
      if (data.status === 'ready') {
        toast.success(
          data.tokenNumber
            ? `Token #${data.tokenNumber} is ready! Please pick up your order.`
            : `Your order${data.orderNumber ? ` #${data.orderNumber}` : ''} is ready! Please pick it up.`,
          { duration: 8000, icon: '🔔' },
        );
      } else if (data.status === 'confirmed') {
        const etaText = data.estimatedTime ? ` (~${data.estimatedTime} min)` : '';
        toast.success(
          `Order${data.orderNumber ? ` #${data.orderNumber}` : ''}${tokenLabel} confirmed!${etaText}`,
          { duration: 4000 },
        );
      } else if (data.status === 'preparing') {
        const etaText = data.estimatedTime ? ` (~${data.estimatedTime} min)` : '';
        toast(
          data.tokenNumber
            ? `Token #${data.tokenNumber} — Your order is being prepared...${etaText}`
            : `Your order is being prepared...${etaText}`,
          { duration: 4000, icon: '👨‍🍳' },
        );
      } else if (data.status === 'cancelled') {
        toast.error(
          `Order${data.orderNumber ? ` #${data.orderNumber}` : ''} was cancelled`,
          { duration: 6000 },
        );
      }
    });

    // Handle food court pickup ready → push to notification center
    socketInstance.on('food_court_pickup_ready', (data) => {
      console.log('Food court pickup ready:', data);
      if (notifCtx?.addNotification) {
        notifCtx.addNotification({
          title: `Food Ready at ${data.restaurantName}!`,
          message: data.message || `Your food from ${data.restaurantName} is ready for pickup at the counter!`,
          type: 'order_ready',
          orderId: data.orderId,
        });
      }
    });

    // Handle delivery status updates
    socketInstance.on('delivery_status_updated', (data) => {
      console.log('Delivery status updated:', data);
      if (notifCtx?.addNotification) {
        notifCtx.addNotification({
          title: 'Delivery Update',
          message: `Your delivery is ${data.status?.replace('_', ' ')}`,
          type: 'order_update',
          orderId: data.orderId,
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [notifCtx]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', { roomId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave_room', { roomId });
    }
  };

  const emitEvent = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
