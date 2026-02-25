import { Server, Socket } from 'socket.io';

interface PresenceUser {
  socketId: string;
  userId: number;
  name: string;
  profilePicture?: string;
  currentPage: string;
  lastSeen: Date;
  status: 'online' | 'away' | 'busy';
}

const activeUsers = new Map<string, PresenceUser>();

export function setupPresenceHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('presence:join', (data: { page: string; userId?: number; name?: string; profilePicture?: string }) => {
      activeUsers.set(socket.id, {
        socketId: socket.id,
        userId: data.userId || 0,
        name: data.name || 'Anonymous',
        profilePicture: data.profilePicture,
        currentPage: data.page,
        lastSeen: new Date(),
        status: 'online'
      });
      broadcastPresence(io);
    });

    socket.on('presence:page', (data: { page: string }) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.currentPage = data.page;
        user.lastSeen = new Date();
        broadcastPresence(io);
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
      activeUsers.delete(socket.id);
      broadcastPresence(io);
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      broadcastPresence(io);
    });

    // Cursor collaboration events
    socket.on('cursor:move', (data: { userId: number; name: string; page: string; x: number; y: number; color: string }) => {
      // Broadcast to all other users on the same page
      socket.broadcast.emit('cursor:move', {
        socketId: socket.id,
        ...data,
        timestamp: Date.now()
      });
    });

    socket.on('cursor:leave', (data: { page: string }) => {
      socket.broadcast.emit('cursor:leave', {
        socketId: socket.id,
        page: data.page
      });
    });
  });

  // Clean up stale connections every 60 seconds
  setInterval(() => {
    const now = Date.now();
    let changed = false;

    for (const [id, user] of activeUsers) {
      if (now - user.lastSeen.getTime() > 120000) {
        // No heartbeat for 2 minutes - remove
        activeUsers.delete(id);
        changed = true;
      } else if (now - user.lastSeen.getTime() > 60000) {
        // No heartbeat for 1 minute - mark away
        if (user.status !== 'away') {
          user.status = 'away';
          changed = true;
        }
      }
    }

    if (changed) {
      broadcastPresence(io);
    }
  }, 60000);
}

function broadcastPresence(io: Server) {
  const users = Array.from(activeUsers.values());
  io.emit('presence:update', users);

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
