import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return 'http://localhost:5000';
  }
};

export const getSocket = (): Socket | null => {
  if (socket) return socket;

  const state = useAuthStore.getState();
  const token = state.accessToken;

  if (!token) return null;

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    if (error.message && error.message.includes('Authentication error')) {
      disconnectSocket();
      useAuthStore.getState().clearAuth();
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Listen for auth state changes to connect/disconnect automatically
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state) => {
    const token = state.accessToken;
    if (token) {
      if (!socket) {
        getSocket();
      }
    } else {
      if (socket) {
        disconnectSocket();
      }
    }
  });
}
