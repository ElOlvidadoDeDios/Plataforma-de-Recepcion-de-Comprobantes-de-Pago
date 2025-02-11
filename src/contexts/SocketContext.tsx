import React, { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

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
      token: localStorage.getItem('token'),
    },
    path: '/socket.io/',
    forceNew: true,
    autoConnect: true
  });

  socket.io.on("error", (error: Error) => {
    console.log('Error de Socket.IO:', error);
  });

  socket.on('connect_error', (error: Error) => {
    console.log('Error de conexión Socket.IO:', error.message);
  });

  socket.on('connect', () => {
    console.log('Socket.IO conectado');
  });

  socket.on('disconnect', (reason: string) => {
    console.log('Socket.IO desconectado:', reason);
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
        console.log('Desconectando socket');
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