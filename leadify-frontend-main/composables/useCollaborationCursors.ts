import { ref, computed, onUnmounted } from 'vue';

interface RemoteCursor {
  socketId: string;
  userId: number;
  name: string;
  page: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

export function useCollaborationCursors() {
  const remoteCursors = ref<Map<string, RemoteCursor>>(new Map());
  const isEnabled = ref(true);
  const currentPage = ref('');
  const MAX_CURSORS = 5;
  const THROTTLE_MS = 100;
  const HIDE_AFTER_MS = 3000;

  let socket: unknown = null;
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;
  let checkSocketInterval: ReturnType<typeof setInterval> | null = null;
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

  // Generate consistent color from userId
  function userColor(userId: number): string {
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];
    return colors[userId % colors.length] || '';
  }

  // Visible cursors: max 5, same page only, not stale
  const visibleCursors = computed(() => {
    const now = Date.now();
    return Array.from(remoteCursors.value.values())
      .filter(c => c.page === currentPage.value && now - c.lastSeen < HIDE_AFTER_MS)
      .slice(0, MAX_CURSORS);
  });

  function init(page: string, userId: number, userName: string) {
    currentPage.value = page;

    // Get socket from useSocket composable
    const { socket: socketRef } = useSocket();

    // Wait for socket to be available
    checkSocketInterval = setInterval(() => {
      if (socketRef.value) {
        socket = socketRef.value;
        if (checkSocketInterval) {
          clearInterval(checkSocketInterval);
          checkSocketInterval = null;
        }
        setupListeners(userId, userName);
      }
    }, 100);

    // Cleanup stale cursors every second
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, cursor] of remoteCursors.value) {
        if (now - cursor.lastSeen > HIDE_AFTER_MS * 2) {
          remoteCursors.value.delete(id);
          changed = true;
        }
      }
      // Trigger reactivity if entries were removed
      if (changed) {
        remoteCursors.value = new Map(remoteCursors.value);
      }
    }, 1000);
  }

  function setupListeners(userId: number, userName: string) {
    if (!socket) return;

    // Listen for remote cursor moves
    socket.on('cursor:move', (data: RemoteCursor) => {
      if (data.page === currentPage.value) {
        const updated = new Map(remoteCursors.value);
        updated.set(data.socketId, { ...data, lastSeen: Date.now() });
        remoteCursors.value = updated;
      }
    });

    socket.on('cursor:leave', (data: { socketId: string }) => {
      const updated = new Map(remoteCursors.value);
      updated.delete(data.socketId);
      remoteCursors.value = updated;
    });

    // Track local mouse and broadcast (throttled)
    mouseMoveHandler = (e: MouseEvent) => {
      if (!isEnabled.value || !socket) return;
      if (throttleTimer) return;

      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, THROTTLE_MS);

      socket.emit('cursor:move', {
        userId,
        name: userName,
        page: currentPage.value,
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
        color: userColor(userId)
      });
    };

    document.addEventListener('mousemove', mouseMoveHandler);
  }

  function destroy() {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
    if (checkSocketInterval) {
      clearInterval(checkSocketInterval);
      checkSocketInterval = null;
    }
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
    if (socket) {
      socket.emit('cursor:leave', { page: currentPage.value });
      socket.off('cursor:move');
      socket.off('cursor:leave');
    }
    remoteCursors.value.clear();
  }

  onUnmounted(() => {
    destroy();
  });

  return {
    remoteCursors,
    visibleCursors,
    isEnabled,
    currentPage,
    init,
    destroy,
    userColor
  };
}
