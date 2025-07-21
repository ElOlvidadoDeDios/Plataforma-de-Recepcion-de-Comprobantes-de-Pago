import React, { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SessionManager } from '../utils/sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define el tipo del contexto
export interface SocketContextType {
  socket: Socket | null;
}

// Crea y exporta el contexto
const SocketContextValue = createContext<SocketContextType>({ socket: null });
export { SocketContextValue as SocketContext };

// Función para inicializar el socket
const initializeSocket = () => {
  const socket = io(API_BASE_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    withCredentials: true,
    auth: {
      token: SessionManager.getItem('token'),
    },
    path: '/socket.io/',
    forceNew: true,
    autoConnect: true
  });

  socket.io.on("error", (_error: Error) => {
  });

  socket.on('connect_error', (_error: Error) => {
  });

  socket.on('connect', () => {
  });

  socket.on('disconnect', () => {
  });

  return socket;
};

// Componente proveedor del contexto
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    let newSocket: Socket | null = null;
    if (user && !socket) {
      newSocket = initializeSocket();
      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        newSocket.removeAllListeners();
      }
    };
  }, [user]);

  return (
    <SocketContextValue.Provider value={{ socket }}>
      {children}
    </SocketContextValue.Provider>
  );
}