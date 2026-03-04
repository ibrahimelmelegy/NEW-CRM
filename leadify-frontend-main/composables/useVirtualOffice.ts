/* eslint-disable no-use-before-define */
/**
 * Virtual Office System
 * Team presence, rooms, status, and virtual workspace management.
 * Backed by /api/virtual-office REST endpoints + Socket.io real-time events.
 */
import { ref, computed, watch } from 'vue';
import { useApiFetch } from './useApiFetch';
import { user } from './useUser';

export interface VirtualRoom {
  id: number;
  name: string;
  type: 'office' | 'meeting' | 'lounge' | 'focus' | 'call';
  icon: string;
  color: string;
  capacity: number;
  occupants: RoomOccupant[];
  isLocked: boolean;
  description?: string;
}

export interface RoomOccupant {
  id: number;
  name: string;
  avatar?: string;
  status: 'available' | 'busy' | 'away' | 'dnd' | 'offline';
  joinedAt: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export interface VirtualOfficePresence {
  userId: number;
  name: string;
  status: 'available' | 'busy' | 'away' | 'dnd' | 'offline';
  statusMessage?: string;
  currentRoomId?: number;
  lastSeen: string;
  focusMode: boolean;
  avatar?: string;
}

const rooms = ref<VirtualRoom[]>([]);
const currentUser = ref<VirtualOfficePresence>({
  userId: 0,
  name: 'You',
  status: 'available',
  statusMessage: '',
  currentRoomId: undefined,
  lastSeen: new Date().toISOString(),
  focusMode: false
});
const loading = ref(false);

export function useVirtualOffice() {
  const { socket } = useSocket();

  const onlineCount = computed(() => rooms.value.reduce((s, r) => s + r.occupants.length, 0));
  const currentRoom = computed(() => rooms.value.find(r => r.id === currentUser.value.currentRoomId));

  const stats = computed(() => ({
    totalRooms: rooms.value.length,
    onlineNow: onlineCount.value,
    meetingRooms: rooms.value.filter(r => r.type === 'meeting').length,
    activeMeetings: rooms.value.filter(r => r.type === 'meeting' && r.occupants.length > 0).length
  }));

  // ── Initialize ──
  async function init() {
    loading.value = true;

    // Set current user from auth
    const u = user.value;
    if (u?.id) {
      currentUser.value.userId = u.id;
      currentUser.value.name = (u as any).firstName ? `${(u as any).firstName} ${(u as any).lastName || ''}`.trim() : u.email || 'You';
      currentUser.value.avatar = u.profilePicture;
    }

    // Load rooms from API (seeds defaults on first call)
    const { body, success } = await useApiFetch('virtual-office/rooms');
    if (success && Array.isArray(body)) {
      rooms.value = body.map((r: any) => ({ ...r, occupants: [] }));
    }

    // Announce presence and sync current state via socket
    socket.value?.emit('vo:presence', {
      userId: currentUser.value.userId,
      name: currentUser.value.name,
      avatar: currentUser.value.avatar
    });
    socket.value?.emit('vo:sync');

    loading.value = false;
  }

  // ── Socket listeners ──
  watch(socket, s => {
    if (!s) return;

    // Sync response (initial state)
    s.on('vo:sync-response', (data: { rooms: Record<number, RoomOccupant[]>; presence: VirtualOfficePresence[] }) => {
      for (const room of rooms.value) {
        room.occupants = data.rooms[room.id] || [];
      }
      // Check if current user is already in a room
      const myPresence = data.presence.find(p => p.userId === currentUser.value.userId);
      if (myPresence?.currentRoomId) {
        currentUser.value.currentRoomId = myPresence.currentRoomId;
      }
    });

    // Room occupant updates
    s.on('vo:room-update', (data: { roomId: number; occupants: RoomOccupant[] }) => {
      const room = rooms.value.find(r => r.id === data.roomId);
      if (room) room.occupants = data.occupants;
    });

    // Presence updates
    s.on('vo:presence-update', (_presence: VirtualOfficePresence[]) => {
      // Could update an online users list if needed
    });

    // Announce presence
    s.emit('vo:presence', {
      userId: currentUser.value.userId,
      name: currentUser.value.name,
      avatar: currentUser.value.avatar
    });
    s.emit('vo:sync');
  });

  // ── Room Actions (via Socket.io for real-time) ──
  function joinRoom(roomId: number) {
    const room = rooms.value.find(r => r.id === roomId);
    if (!room || room.occupants.length >= room.capacity) return;

    socket.value?.emit('vo:join', {
      roomId,
      userId: currentUser.value.userId,
      name: currentUser.value.name,
      avatar: currentUser.value.avatar
    });
    currentUser.value.currentRoomId = roomId;
  }

  function leaveRoom() {
    if (!currentUser.value.currentRoomId) return;
    socket.value?.emit('vo:leave');
    currentUser.value.currentRoomId = undefined;
  }

  function setStatus(status: VirtualOfficePresence['status'], message?: string) {
    currentUser.value.status = status;
    if (message !== undefined) currentUser.value.statusMessage = message;
    currentUser.value.lastSeen = new Date().toISOString();
    socket.value?.emit('vo:status', { status, statusMessage: message });
  }

  function toggleMute() {
    socket.value?.emit('vo:toggle', { field: 'isMuted' });
  }

  function toggleCamera() {
    socket.value?.emit('vo:toggle', { field: 'isCameraOn' });
  }

  function toggleScreenShare() {
    socket.value?.emit('vo:toggle', { field: 'isScreenSharing' });
  }

  // ── Room CRUD (via REST API) ──
  async function addRoom(data: Omit<VirtualRoom, 'id' | 'occupants'>) {
    const { body, success } = await useApiFetch('virtual-office/rooms', 'POST', data as any);
    if (success && body) {
      rooms.value.push({ ...(body as any), occupants: [] });
    }
  }

  async function removeRoom(id: number) {
    const { success } = await useApiFetch(`virtual-office/rooms/${id}`, 'DELETE');
    if (success) rooms.value = rooms.value.filter(r => r.id !== id);
  }

  function toggleFocusMode() {
    currentUser.value.focusMode = !currentUser.value.focusMode;
    socket.value?.emit('vo:focus', { focusMode: currentUser.value.focusMode });
    if (currentUser.value.focusMode) {
      currentUser.value.status = 'dnd';
      currentUser.value.statusMessage = '🎯 Focus Mode';
    } else {
      currentUser.value.status = 'available';
      currentUser.value.statusMessage = '';
    }
  }

  return {
    rooms,
    currentUser,
    currentRoom,
    stats,
    onlineCount,
    loading,
    init,
    joinRoom,
    leaveRoom,
    setStatus,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    addRoom,
    removeRoom,
    toggleFocusMode
  };
}
