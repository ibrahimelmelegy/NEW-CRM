import { Server, Socket } from 'socket.io';

interface RoomOccupant {
  socketId: string;
  userId: number;
  name: string;
  avatar?: string;
  status: 'available' | 'busy' | 'away' | 'dnd' | 'offline';
  joinedAt: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  roomId: number;
}

interface UserPresence {
  socketId: string;
  userId: number;
  name: string;
  status: 'available' | 'busy' | 'away' | 'dnd' | 'offline';
  statusMessage: string;
  currentRoomId?: number;
  focusMode: boolean;
  lastSeen: string;
}

// In-memory stores for real-time presence
const roomOccupants = new Map<string, RoomOccupant>(); // socketId → occupant
const userPresence = new Map<string, UserPresence>();   // socketId → presence

function getRoomOccupants(roomId: number): RoomOccupant[] {
  return Array.from(roomOccupants.values()).filter(o => o.roomId === roomId);
}

function getAllPresence(): UserPresence[] {
  return Array.from(userPresence.values());
}

export function setupVirtualOfficeHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {

    // User announces presence in virtual office
    socket.on('vo:presence', (data: { userId: number; name: string; avatar?: string }) => {
      userPresence.set(socket.id, {
        socketId: socket.id,
        userId: data.userId,
        name: data.name,
        status: 'available',
        statusMessage: '',
        currentRoomId: undefined,
        focusMode: false,
        lastSeen: new Date().toISOString(),
      });
      io.emit('vo:presence-update', getAllPresence());
    });

    // Join a room
    socket.on('vo:join', (data: { roomId: number; userId: number; name: string; avatar?: string }) => {
      // Leave current room first
      const existing = roomOccupants.get(socket.id);
      if (existing) {
        const oldRoomId = existing.roomId;
        roomOccupants.delete(socket.id);
        socket.leave(`vo-room-${oldRoomId}`);
        io.emit('vo:room-update', { roomId: oldRoomId, occupants: getRoomOccupants(oldRoomId) });
      }

      // Join new room
      const presence = userPresence.get(socket.id);
      roomOccupants.set(socket.id, {
        socketId: socket.id,
        userId: data.userId,
        name: data.name,
        avatar: data.avatar,
        status: presence?.status || 'available',
        joinedAt: new Date().toISOString(),
        isMuted: false,
        isCameraOn: false,
        isScreenSharing: false,
        roomId: data.roomId,
      });

      socket.join(`vo-room-${data.roomId}`);

      if (presence) {
        presence.currentRoomId = data.roomId;
        presence.lastSeen = new Date().toISOString();
      }

      io.emit('vo:room-update', { roomId: data.roomId, occupants: getRoomOccupants(data.roomId) });
      io.emit('vo:presence-update', getAllPresence());
    });

    // Leave room
    socket.on('vo:leave', () => {
      const occupant = roomOccupants.get(socket.id);
      if (!occupant) return;

      const roomId = occupant.roomId;
      roomOccupants.delete(socket.id);
      socket.leave(`vo-room-${roomId}`);

      const presence = userPresence.get(socket.id);
      if (presence) {
        presence.currentRoomId = undefined;
        presence.lastSeen = new Date().toISOString();
      }

      io.emit('vo:room-update', { roomId, occupants: getRoomOccupants(roomId) });
      io.emit('vo:presence-update', getAllPresence());
    });

    // Update status
    socket.on('vo:status', (data: { status: string; statusMessage?: string }) => {
      const presence = userPresence.get(socket.id);
      if (presence) {
        presence.status = data.status as any;
        if (data.statusMessage !== undefined) presence.statusMessage = data.statusMessage;
        presence.lastSeen = new Date().toISOString();
      }

      const occupant = roomOccupants.get(socket.id);
      if (occupant) {
        occupant.status = data.status as any;
        io.emit('vo:room-update', { roomId: occupant.roomId, occupants: getRoomOccupants(occupant.roomId) });
      }

      io.emit('vo:presence-update', getAllPresence());
    });

    // Toggle focus mode
    socket.on('vo:focus', (data: { focusMode: boolean }) => {
      const presence = userPresence.get(socket.id);
      if (presence) {
        presence.focusMode = data.focusMode;
        presence.status = data.focusMode ? 'dnd' : 'available';
        presence.statusMessage = data.focusMode ? '🎯 Focus Mode' : '';
        presence.lastSeen = new Date().toISOString();
      }

      const occupant = roomOccupants.get(socket.id);
      if (occupant) {
        occupant.status = data.focusMode ? 'dnd' : 'available';
        io.emit('vo:room-update', { roomId: occupant.roomId, occupants: getRoomOccupants(occupant.roomId) });
      }

      io.emit('vo:presence-update', getAllPresence());
    });

    // Toggle mute/camera/screenshare
    socket.on('vo:toggle', (data: { field: 'isMuted' | 'isCameraOn' | 'isScreenSharing' }) => {
      const occupant = roomOccupants.get(socket.id);
      if (!occupant) return;

      occupant[data.field] = !occupant[data.field];
      io.emit('vo:room-update', { roomId: occupant.roomId, occupants: getRoomOccupants(occupant.roomId) });
    });

    // Get current state (for initial load)
    socket.on('vo:sync', () => {
      // Send all room occupants grouped by roomId
      const roomMap: Record<number, RoomOccupant[]> = {};
      for (const occ of roomOccupants.values()) {
        if (!roomMap[occ.roomId]) roomMap[occ.roomId] = [];
        roomMap[occ.roomId].push(occ);
      }
      socket.emit('vo:sync-response', { rooms: roomMap, presence: getAllPresence() });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      const occupant = roomOccupants.get(socket.id);
      if (occupant) {
        const roomId = occupant.roomId;
        roomOccupants.delete(socket.id);
        io.emit('vo:room-update', { roomId, occupants: getRoomOccupants(roomId) });
      }

      userPresence.delete(socket.id);
      io.emit('vo:presence-update', getAllPresence());
    });
  });
}
