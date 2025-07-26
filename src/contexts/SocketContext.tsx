import React, { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SessionManager } from '../utils/sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define el tipo del contexto
export interface SocketContextType {
  socket: Socket | null;
}

// Crea el contexto con exportación directa
export const SocketContext = createContext<SocketContextType>({ 
  socket: null 
});

// Función para inicializar el socket (no necesita exportarse)
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
    autoConnect: true
  });

  socket.io.on("error", () => {
    // Error handling sin console log
  });

  socket.on('connect_error', () => {
    // Error handling sin console log
  });

  socket.on('connect', () => {
    // Conexión establecida
  });

  socket.on('disconnect', () => {
    // Desconexión manejada silenciosamente
  });

  socket.on('auth_error', () => {
    // Error de autenticación manejado silenciosamente
  });

  return socket;
};

// Componente proveedor del contexto con exportación nombrada
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user) {
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
      }

      const newSocket = initializeSocket();
      setSocket(newSocket);

      return () => {
        if (newSocket && newSocket.connected) {
          newSocket.disconnect();
        }
        newSocket?.removeAllListeners();
      };
    } else {
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        setSocket(null);
      }
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};