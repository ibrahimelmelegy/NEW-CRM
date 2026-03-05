export interface UserPresence {
  userId: number;
  name: string;
  profilePicture?: string;
  currentPage: string;
  lastSeen: Date;
  status: 'online' | 'away' | 'busy';
}

export function usePresence() {
  const { socket } = useSocket();
  const onlineUsers = ref<UserPresence[]>([]);
  const currentPageViewers = ref<UserPresence[]>([]);

  const route = useRoute();

  // Watch for page changes and emit to server
  watch(
    () => route.path,
    newPath => {
      socket.value?.emit('presence:page', { page: newPath });
    }
  );

  // Listen for presence events once socket is available
  watch(socket, s => {
    if (!s) return;

    s.on('presence:update', (users: UserPresence[]) => {
      onlineUsers.value = users;
    });

    s.on('presence:page-viewers', (viewers: UserPresence[]) => {
      currentPageViewers.value = viewers;
    });

    // Announce presence with user info
    const currentUser = user.value;
    s.emit('presence:join', {
      page: route.path,
      userId: currentUser?.id,
      name: (currentUser as unknown)?.firstName
        ? `${(currentUser as unknown).firstName} ${(currentUser as unknown).lastName || ''}`.trim()
        : currentUser?.email || 'Anonymous',
      profilePicture: currentUser?.profilePicture || undefined
    });
  });

  // Heartbeat every 30 seconds to signal activity
  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null);

  onMounted(() => {
    heartbeatInterval.value = setInterval(() => {
      socket.value?.emit('presence:heartbeat');
    }, 30000);
  });

  onUnmounted(() => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value);
    }
    socket.value?.emit('presence:leave');
  });

  // Helper: check if a specific user is online
  function isUserOnline(userId: number): boolean {
    return onlineUsers.value.some(u => u.userId === userId);
  }

  // Helper: get a specific user's status
  function getUserStatus(userId: number): 'online' | 'away' | 'busy' | 'offline' {
    const found = onlineUsers.value.find(u => u.userId === userId);
    return found ? found.status : 'offline';
  }

  return {
    onlineUsers,
    currentPageViewers,
    isUserOnline,
    getUserStatus
  };
}
