import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from 'react-oidc-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Creates and manages a Socket.io connection with automatic JWT Bearer auth.
 * Returns the socket instance (may be null on first render).
 *
 * @returns {import('socket.io-client').Socket | null}
 */
export function useSocket() {
  const auth = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!auth.user?.access_token) return;

    socketRef.current = io(API_URL, {
      auth: { token: auth.user.access_token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [auth.user?.access_token]);

  return socketRef.current;
}

export default useSocket;
