/**
 * useSocketStore - Unit Tests
 * =============================
 * Tests for stores/socket.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Hoist mock variables so vi.mock factory can reference them
const { mockSocket, mockIo, socketHandlers } = vi.hoisted(() => {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const socket = {
    connected: false,
    id: 'mock-socket-id',
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
    }),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  };
  return {
    mockSocket: socket,
    mockIo: vi.fn(() => socket),
    socketHandlers: handlers
  };
});

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: mockIo
}));

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

// We need to import the store after the mock is set up
import { useSocketStore } from '@/stores/socket';

describe('useSocketStore', () => {
  let store: ReturnType<typeof useSocketStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSocketStore();
    vi.clearAllMocks();
    // Clear handlers
    for (const key of Object.keys(socketHandlers)) {
      delete socketHandlers[key];
    }
    mockSocket.connected = false;
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.connected).toBe(false);
      expect(store.socketId).toBeNull();
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('connect', () => {
    it('should create a socket connection and register handlers', () => {
      store.connect();

      // Verify socket.io-client was called
      expect(mockIo).toHaveBeenCalled();

      // Verify event handlers were registered
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should set connected=true and socketId when connect event fires', () => {
      store.connect();

      // Simulate the socket connect event
      mockSocket.connected = true;
      if (socketHandlers['connect']) {
        socketHandlers['connect']();
      }

      expect(store.connected).toBe(true);
      expect(store.socketId).toBe('mock-socket-id');
    });

    it('should set connected=false when disconnect event fires', () => {
      store.connect();

      // First connect
      mockSocket.connected = true;
      if (socketHandlers['connect']) {
        socketHandlers['connect']();
      }

      // Then disconnect
      mockSocket.connected = false;
      if (socketHandlers['disconnect']) {
        socketHandlers['disconnect']();
      }

      expect(store.connected).toBe(false);
      expect(store.socketId).toBeNull();
    });

    it('should handle connect_error by setting state to disconnected', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.connect();

      if (socketHandlers['connect_error']) {
        socketHandlers['connect_error'](new Error('Auth failed'));
      }

      expect(store.connected).toBe(false);
      expect(store.socketId).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should disconnect the socket and reset state', () => {
      store.connect();

      // Simulate connected state
      mockSocket.connected = true;
      if (socketHandlers['connect']) {
        socketHandlers['connect']();
      }

      store.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(store.connected).toBe(false);
      expect(store.socketId).toBeNull();
    });
  });

  describe('emit', () => {
    it('should emit events when socket is connected', () => {
      store.connect();

      // Simulate connected state
      mockSocket.connected = true;

      store.emit('lead:created', { id: 'lead-1' });

      expect(mockSocket.emit).toHaveBeenCalledWith('lead:created', { id: 'lead-1' });
    });

    it('should log error when emitting on disconnected socket', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.connect();
      mockSocket.connected = false;

      store.emit('lead:created', { id: 'lead-1' });

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('on', () => {
    it('should register event listeners on the socket', () => {
      store.connect();

      const callback = vi.fn();
      store.on('deal:updated', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('deal:updated', callback);
    });

    it('should log error when socket is not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Do not call store.connect() -- socket is null
      // Note: After calling disconnect, the module-level socket is null
      store.disconnect();
      store.on('deal:updated', vi.fn());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('off', () => {
    it('should remove event listeners from the socket', () => {
      store.connect();

      const callback = vi.fn();
      store.off('deal:updated', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('deal:updated', callback);
    });

    it('should remove all listeners for an event if no callback given', () => {
      store.connect();

      store.off('deal:updated');

      expect(mockSocket.off).toHaveBeenCalledWith('deal:updated');
    });
  });
});
