import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialise la connexion Socket.IO avec authentification JWT
 * Singleton - reutilise la connexion existante si deja initialisee
 */
export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connecte:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Deconnecte:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Erreur de connexion:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
