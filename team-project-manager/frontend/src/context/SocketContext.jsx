import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
