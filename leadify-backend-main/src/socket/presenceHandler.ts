import { Server, Socket } from 'socket.io';
import logger from '../config/logger';

interface PresenceUser {
  socketId: string;
  userId: number;
  tenantId: string;
  name: string;
  profilePicture?: string;
  currentPage: string;
  lastSeen: Date;
  status: 'online' | 'away' | 'busy';
}

const activeUsers = new Map<string, PresenceUser>();

function getTenantRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

export function setupPresenceHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('presence:join', (data: { page: string; name?: string; profilePicture?: string }) => {
      // Use server-verified data from JWT (set by io.use() auth middleware)
      const userId = socket.data.userId || 0;
      const tenantId = socket.data.tenantId;
      if (!tenantId) return;

      activeUsers.set(socket.id, {
        socketId: socket.id,
        userId,
        tenantId,
        name: data.name || 'Anonymous',
        profilePicture: data.profilePicture,
        currentPage: data.page,
        lastSeen: new Date(),
        status: 'online'
      });
      broadcastPresence(io, tenantId);
    });

    socket.on('presence:page', (data: { page: string }) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.currentPage = data.page;
        user.lastSeen = new Date();
        broadcastPresence(io, user.tenantId);
      }
    });

    socket.on('presence:heartbeat', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.lastSeen = new Date();
        user.status = 'online';
      }
    });

    socket.on('presence:leave', () => {
      const user = activeUsers.get(socket.id);
      const tenantId = user?.tenantId;
      activeUsers.delete(socket.id);
      if (tenantId) broadcastPresence(io, tenantId);
    });

    socket.on('disconnect', () => {
      try {
        const user = activeUsers.get(socket.id);
        const tenantId = user?.tenantId;
        activeUsers.delete(socket.id);
        if (tenantId) broadcastPresence(io, tenantId);
      } catch (err) {
        logger.error({ err }, 'Socket event disconnect error:');
      }
    });

    // Cursor collaboration events - scoped to tenant room
    socket.on('cursor:move', (data: { userId: number; name: string; page: string; x: number; y: number; color: string }) => {
      const tenantId = socket.data.tenantId;
      if (!tenantId) return;
      // Broadcast to other users in the same tenant only
      socket.to(getTenantRoom(tenantId)).emit('cursor:move', {
        socketId: socket.id,
        ...data,
        timestamp: Date.now()
      });
    });

    socket.on('cursor:leave', (data: { page: string }) => {
      const tenantId = socket.data.tenantId;
      if (!tenantId) return;
      socket.to(getTenantRoom(tenantId)).emit('cursor:leave', {
        socketId: socket.id,
        page: data.page
      });
    });
  });

  // Clean up stale connections every 60 seconds
  const presenceCleanupInterval = setInterval(() => {
    const now = Date.now();
    const changedTenants = new Set<string>();

    for (const [id, user] of activeUsers) {
      if (now - user.lastSeen.getTime() > 120000) {
        // No heartbeat for 2 minutes - remove
        activeUsers.delete(id);
        changedTenants.add(user.tenantId);
      } else if (now - user.lastSeen.getTime() > 60000) {
        // No heartbeat for 1 minute - mark away
        if (user.status !== 'away') {
          user.status = 'away';
          changedTenants.add(user.tenantId);
        }
      }
    }

    for (const tenantId of changedTenants) {
      broadcastPresence(io, tenantId);
    }
  }, 60000);

  process.on('SIGTERM', () => clearInterval(presenceCleanupInterval));
  process.on('SIGINT', () => clearInterval(presenceCleanupInterval));
}

function broadcastPresence(io: Server, tenantId: string) {
  // Filter users by tenant - never leak cross-tenant presence
  const tenantRoom = getTenantRoom(tenantId);
  const users = Array.from(activeUsers.values()).filter(u => u.tenantId === tenantId);
  io.to(tenantRoom).emit('presence:update', users);

  // Group users by page and emit page-specific viewer lists
  const pageGroups = new Map<string, PresenceUser[]>();
  for (const user of users) {
    const group = pageGroups.get(user.currentPage) || [];
    group.push(user);
    pageGroups.set(user.currentPage, group);
  }

  for (const [_page, viewers] of pageGroups) {
    // Send each user on the page the list of OTHER viewers on the same page
    for (const viewer of viewers) {
      const socket = io.sockets.sockets.get(viewer.socketId);
      if (socket) {
        socket.emit(
          'presence:page-viewers',
          viewers.filter(v => v.socketId !== viewer.socketId)
        );
      }
    }
  }
}
