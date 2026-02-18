export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  const config = useRuntimeConfig();
  const apiBase = config.public.API_BASE_URL?.replace('/api/', '') || 'http://localhost:5000';

  // Dynamically import socket.io-client to avoid SSR issues
  import('socket.io-client').then(({ io }) => {
    const socket = io(apiBase, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socket.on('achievement:unlocked', (data: any) => {
      // Dispatch custom event that AchievementUnlock component listens for
      window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: data }));
    });

    socket.on('connect_error', () => {
      // Silently handle connection errors
    });
  }).catch(() => {
    // socket.io-client not available
  });
});
