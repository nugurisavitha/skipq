import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext(null);

const SOCKET_URL = 'https://beta.skipqapp.com';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket'],
    });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated]);

  const joinRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('join', roomId);
    },
    [socket, isConnected],
  );

  const leaveRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('leave', roomId);
    },
    [socket, isConnected],
  );

  const emitEvent = useCallback(
    (event, data) => {
      if (socket && isConnected) socket.emit(event, data);
    },
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, joinRoom, leaveRoom, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
};
