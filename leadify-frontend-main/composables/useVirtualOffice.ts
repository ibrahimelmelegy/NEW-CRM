/**
 * Virtual Office System
 * Team presence, rooms, status, and virtual workspace management.
 */
import { ref, computed } from 'vue';

export interface VirtualRoom {
    id: string;
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
    id: string;
    name: string;
    avatar?: string;
    status: 'available' | 'busy' | 'away' | 'dnd' | 'offline';
    joinedAt: string;
    isMuted: boolean;
    isCameraOn: boolean;
    isScreenSharing: boolean;
}

export interface VirtualOfficePresence {
    userId: string;
    name: string;
    status: 'available' | 'busy' | 'away' | 'dnd' | 'offline';
    statusMessage?: string;
    currentRoomId?: string;
    lastSeen: string;
    focusMode: boolean;
    avatar?: string;
}

const ROOMS_KEY = 'crm_virtual_rooms';
const PRESENCE_KEY = 'crm_user_presence';

function loadRooms(): VirtualRoom[] {
    try { return JSON.parse(localStorage.getItem(ROOMS_KEY) || 'null') || getDefaultRooms(); }
    catch { return getDefaultRooms(); }
}

function getDefaultRooms(): VirtualRoom[] {
    return [
        { id: 'main-office', name: 'Main Office', type: 'office', icon: '🏢', color: '#7c3aed', capacity: 50, occupants: [], isLocked: false, description: 'General workspace — open for everyone' },
        { id: 'meeting-1', name: 'Meeting Room A', type: 'meeting', icon: '🤝', color: '#3b82f6', capacity: 10, occupants: [], isLocked: false, description: 'Client calls & team meetings' },
        { id: 'meeting-2', name: 'Meeting Room B', type: 'meeting', icon: '📋', color: '#06b6d4', capacity: 8, occupants: [], isLocked: false, description: 'Internal syncs' },
        { id: 'lounge', name: 'Coffee Lounge', type: 'lounge', icon: '☕', color: '#f59e0b', capacity: 20, occupants: [], isLocked: false, description: 'Casual chat — take a break!' },
        { id: 'focus', name: 'Focus Zone', type: 'focus', icon: '🎯', color: '#22c55e', capacity: 15, occupants: [], isLocked: false, description: 'Deep work — minimal interruptions' },
        { id: 'call-room', name: 'Phone Booth', type: 'call', icon: '📞', color: '#ef4444', capacity: 1, occupants: [], isLocked: false, description: 'Private calls' },
    ];
}

function saveRooms(rooms: VirtualRoom[]) { localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)); }

const rooms = ref<VirtualRoom[]>(loadRooms());
const currentUser = ref<VirtualOfficePresence>({
    userId: 'me', name: 'You', status: 'available',
    statusMessage: '', currentRoomId: undefined, lastSeen: new Date().toISOString(), focusMode: false,
});

export function useVirtualOffice() {
    const onlineCount = computed(() => rooms.value.reduce((s, r) => s + r.occupants.length, 0));
    const currentRoom = computed(() => rooms.value.find(r => r.id === currentUser.value.currentRoomId));

    const stats = computed(() => ({
        totalRooms: rooms.value.length,
        onlineNow: onlineCount.value,
        meetingRooms: rooms.value.filter(r => r.type === 'meeting').length,
        activeMeetings: rooms.value.filter(r => r.type === 'meeting' && r.occupants.length > 0).length,
    }));

    function joinRoom(roomId: string) {
        // Leave current room first
        if (currentUser.value.currentRoomId) leaveRoom();
        const room = rooms.value.find(r => r.id === roomId);
        if (!room) return;
        if (room.occupants.length >= room.capacity) return;

        room.occupants.push({
            id: currentUser.value.userId, name: currentUser.value.name,
            status: currentUser.value.status, joinedAt: new Date().toISOString(),
            isMuted: false, isCameraOn: false, isScreenSharing: false,
        });
        currentUser.value.currentRoomId = roomId;
        saveRooms(rooms.value);
    }

    function leaveRoom() {
        if (!currentUser.value.currentRoomId) return;
        const room = rooms.value.find(r => r.id === currentUser.value.currentRoomId);
        if (room) room.occupants = room.occupants.filter(o => o.id !== currentUser.value.userId);
        currentUser.value.currentRoomId = undefined;
        saveRooms(rooms.value);
    }

    function setStatus(status: VirtualOfficePresence['status'], message?: string) {
        currentUser.value.status = status;
        if (message !== undefined) currentUser.value.statusMessage = message;
        currentUser.value.lastSeen = new Date().toISOString();
        // Update in room
        if (currentUser.value.currentRoomId) {
            const room = rooms.value.find(r => r.id === currentUser.value.currentRoomId);
            const occ = room?.occupants.find(o => o.id === currentUser.value.userId);
            if (occ) occ.status = status;
            saveRooms(rooms.value);
        }
    }

    function toggleMute() {
        const room = rooms.value.find(r => r.id === currentUser.value.currentRoomId);
        const occ = room?.occupants.find(o => o.id === currentUser.value.userId);
        if (occ) { occ.isMuted = !occ.isMuted; saveRooms(rooms.value); }
    }

    function toggleCamera() {
        const room = rooms.value.find(r => r.id === currentUser.value.currentRoomId);
        const occ = room?.occupants.find(o => o.id === currentUser.value.userId);
        if (occ) { occ.isCameraOn = !occ.isCameraOn; saveRooms(rooms.value); }
    }

    function toggleScreenShare() {
        const room = rooms.value.find(r => r.id === currentUser.value.currentRoomId);
        const occ = room?.occupants.find(o => o.id === currentUser.value.userId);
        if (occ) { occ.isScreenSharing = !occ.isScreenSharing; saveRooms(rooms.value); }
    }

    function addRoom(data: Omit<VirtualRoom, 'id' | 'occupants'>) {
        rooms.value.push({ ...data, id: `room_${Date.now()}`, occupants: [] });
        saveRooms(rooms.value);
    }

    function removeRoom(id: string) {
        rooms.value = rooms.value.filter(r => r.id !== id);
        saveRooms(rooms.value);
    }

    function toggleFocusMode() {
        currentUser.value.focusMode = !currentUser.value.focusMode;
        if (currentUser.value.focusMode) setStatus('dnd', '🎯 Focus Mode');
        else setStatus('available', '');
    }

    return {
        rooms, currentUser, currentRoom, stats, onlineCount,
        joinRoom, leaveRoom, setStatus, toggleMute, toggleCamera,
        toggleScreenShare, addRoom, removeRoom, toggleFocusMode,
    };
}
