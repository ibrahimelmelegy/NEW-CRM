import { defineStore } from 'pinia';
import { io as socketIo, type Socket } from 'socket.io-client';
import logger from '~/utils/logger'

type EventCallback = (...args: unknown[]) => void;

let socket: Socket | null = null;

export const useSocketStore = defineStore('socket', {
  state: () => ({
    connected: false,
    socketId: null as string | null
  }),

  actions: {
    connect() {
      if (socket?.connected) return;

      const config = useRuntimeConfig();
      const baseUrl = config.public.API_BASE_URL ? String(config.public.API_BASE_URL).replace(/\/api\/?$/, '') : '';

      socket = socketIo(baseUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        this.connected = true;
        this.socketId = socket?.id || null;
      });

      socket.on('disconnect', () => {
        this.connected = false;
        this.socketId = null;
      });

      socket.on('connect_error', (error: Error) => {
        logger.error('Socket connection error:', error.message);
        this.connected = false;
        this.socketId = null;
      });
    },

    disconnect() {
      if (socket) {
        socket.disconnect();
        socket = null;
        this.connected = false;
        this.socketId = null;
      }
    },

    emit(event: string, data: unknown) {
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        logger.error('Socket is not connected. Cannot emit event:', event);
      }
    },

    on(event: string, callback: EventCallback) {
      if (socket) {
        socket.on(event, callback);
      } else {
        logger.error('Socket is not initialized. Cannot listen to event:', event);
      }
    },

    off(event: string, callback?: EventCallback) {
      if (socket) {
        if (callback) {
          socket.off(event, callback);
        } else {
          socket.off(event);
        }
      }
    }
  }
});
