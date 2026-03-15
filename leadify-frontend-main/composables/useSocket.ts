import { io, Socket } from 'socket.io-client';
import logger from '~/utils/logger'

export const useSocket = () => {
  const config = useRuntimeConfig();
  const socket = ref<Socket | null>(null);

  onMounted(() => {
    // Connect to backend (adjust URL based on environment)
    const apiBase = config.public.API_BASE_URL?.replace(/\/api\/?$/, '') || '';
    const socketUrl = apiBase && !apiBase.startsWith('/') ? apiBase : window.location.origin;

    socket.value = io(socketUrl, { withCredentials: true });

    socket.value.on('connect', () => {
      logger.warn('[Socket] Connected to server:', socket.value?.id);
    });

    socket.value.on('disconnect', () => {
      logger.warn('[Socket] Disconnected from server');
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect();
    }
  });

  return {
    socket
  };
};
