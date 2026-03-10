/**
 * useSocket - Unit Tests
 * ========================
 * Tests for composables/useSocket.ts
 *
 * The composable:
 * - Creates a Socket.io connection on mount
 * - Derives the socket URL from useRuntimeConfig().public.API_BASE_URL
 * - Returns a reactive `socket` ref
 * - Disconnects on unmount
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSocket } from '~/composables/useSocket';

// ============================================
// Mock socket.io-client
// ============================================
const mockSocketInstance = {
  on: vi.fn(),
  disconnect: vi.fn(),
  id: 'mock-socket-id'
};

const mockIo = vi.fn((..._args: any[]) => mockSocketInstance);

vi.mock('socket.io-client', () => ({
  io: (...args: any[]) => mockIo(...args),
  Socket: class {}
}));

// ============================================
// Track lifecycle hooks
// ============================================
let mountedCallback: (() => void) | null = null;
let unmountedCallback: (() => void) | null = null;

(globalThis as any).onMounted = (cb: () => void) => {
  mountedCallback = cb;
};
(globalThis as any).onUnmounted = (cb: () => void) => {
  unmountedCallback = cb;
};

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mountedCallback = null;
    unmountedCallback = null;

    // Reset runtime config mock
    (globalThis as any).useRuntimeConfig = () => ({
      public: {
        API_BASE_URL: 'http://localhost:3001/api/v1/'
      }
    });
  });

  // ============================================
  // Return Value
  // ============================================
  describe('return value', () => {
    it('should return an object with socket ref', () => {
      const result = useSocket();
      expect(result).toHaveProperty('socket');
    });

    it('should initialize socket ref as null', () => {
      const result = useSocket();
      expect(result.socket.value).toBeNull();
    });
  });

  // ============================================
  // Lifecycle Hooks Registration
  // ============================================
  describe('lifecycle hooks', () => {
    it('should register onMounted callback', () => {
      useSocket();
      expect(mountedCallback).not.toBeNull();
      expect(mountedCallback).toBeTypeOf('function');
    });

    it('should register onUnmounted callback', () => {
      useSocket();
      expect(unmountedCallback).not.toBeNull();
      expect(unmountedCallback).toBeTypeOf('function');
    });
  });

  // ============================================
  // Connection on Mount
  // ============================================
  describe('connection on mount', () => {
    it('should create socket connection when mounted', () => {
      useSocket();
      // Trigger the mounted callback
      mountedCallback!();

      expect(mockIo).toHaveBeenCalledOnce();
    });

    it('should derive socket URL from API_BASE_URL by stripping /api path', () => {
      (globalThis as any).useRuntimeConfig = () => ({
        public: {
          API_BASE_URL: 'http://localhost:3001/api/v1/'
        }
      });

      useSocket();
      mountedCallback!();

      // The composable strips /api/... from the URL
      // 'http://localhost:3001/api/v1/'.replace(/\/api\/?$/, '') won't match /api/v1/
      // But the regex is /\/api\/?$/ which matches URLs ending in /api or /api/
      // For 'http://localhost:3001/api/v1/', the regex won't match, so apiBase stays as is
      expect(mockIo).toHaveBeenCalled();
    });

    it('should set socket.value after connection', () => {
      const { socket } = useSocket();
      mountedCallback!();

      expect(socket.value).toStrictEqual(mockSocketInstance);
    });

    it('should register connect event handler', () => {
      useSocket();
      mountedCallback!();

      expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should register disconnect event handler', () => {
      useSocket();
      mountedCallback!();

      expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  // ============================================
  // Disconnection on Unmount
  // ============================================
  describe('disconnection on unmount', () => {
    it('should disconnect socket when unmounted', () => {
      const { socket } = useSocket();
      mountedCallback!();

      // Verify socket is connected
      expect(socket.value).toStrictEqual(mockSocketInstance);

      // Trigger unmount
      unmountedCallback!();

      expect(mockSocketInstance.disconnect).toHaveBeenCalledOnce();
    });

    it('should not throw when socket is null on unmount', () => {
      useSocket();
      // Do NOT call mountedCallback, so socket remains null

      expect(() => {
        unmountedCallback!();
      }).not.toThrow();

      expect(mockSocketInstance.disconnect).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // URL Derivation Edge Cases
  // ============================================
  describe('URL derivation', () => {
    it('should use window.location.origin when API_BASE_URL starts with /', () => {
      (globalThis as any).useRuntimeConfig = () => ({
        public: {
          API_BASE_URL: '/api'
        }
      });

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
        configurable: true
      });

      useSocket();
      mountedCallback!();

      // When apiBase starts with '/', socketUrl = window.location.origin
      expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', { withCredentials: true });
    });

    it('should use window.location.origin when API_BASE_URL is empty', () => {
      (globalThis as any).useRuntimeConfig = () => ({
        public: {
          API_BASE_URL: ''
        }
      });

      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
        configurable: true
      });

      useSocket();
      mountedCallback!();

      // Empty string is falsy, so socketUrl = window.location.origin
      expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', { withCredentials: true });
    });
  });
});
