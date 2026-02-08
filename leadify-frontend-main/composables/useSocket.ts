import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const config = useRuntimeConfig();
  const socket = ref<Socket | null>(null);

  onMounted(() => {
    // Connect to backend (adjust URL based on environment)
    const socketUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000';

    socket.value = io(socketUrl);

    socket.value.on('connect', () => {
      console.log('[Socket] Connected to server:', socket.value?.id);
    });

    socket.value.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
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
