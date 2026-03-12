import { Server, Socket } from 'socket.io';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

interface TenantUser {
  socketId: string;
  userId: number;
  tenantId: string;
  name: string;
  joinedAt: Date;
}

interface TypingPayload {
  entityType: 'lead' | 'deal' | 'opportunity' | 'client' | 'project' | 'task';
  entityId: string;
  userId: number;
  userName: string;
}

interface DocumentLockPayload {
  documentId: string;
  userId: number;
  userName: string;
  action: 'lock' | 'unlock';
}

interface MessagePayload {
  conversationId: string;
  senderId: number;
  senderName: string;
  content: string;
  attachments?: string[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// CRM Entity Event Payloads
// ---------------------------------------------------------------------------

export interface LeadEventPayload {
  id: string;
  name?: string;
  status?: string;
  assignedTo?: number;
  userId?: number;
  tenantId?: string;
}

export interface DealEventPayload {
  id: string;
  name?: string;
  stage?: string;
  fromStage?: string;
  toStage?: string;
  price?: number;
  userId?: number;
  tenantId?: string;
}

export interface OpportunityEventPayload {
  id: string;
  name?: string;
  stage?: string;
  fromStage?: string;
  toStage?: string;
  userId?: number;
  tenantId?: string;
}

export interface ClientEventPayload {
  id: string;
  clientName?: string;
  companyName?: string;
  userId?: number;
  tenantId?: string;
}

export interface NotificationEventPayload {
  id: string;
  userId: number;
  type: string;
  title?: string;
  message?: string;
  tenantId?: string;
}

export interface TaskEventPayload {
  id: string;
  title?: string;
  assignedTo?: number;
  status?: string;
  userId?: number;
  tenantId?: string;
}

export interface CommentEventPayload {
  id: string;
  entityType: string;
  entityId: string;
  userId: number;
  userName?: string;
  content?: string;
  tenantId?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

/** Track online users grouped by tenant */
const tenantUsers = new Map<string, Map<string, TenantUser>>(); // tenantId -> (socketId -> user)

/** Track active typing indicators with auto-expire timers */
const typingTimers = new Map<string, NodeJS.Timeout>();

/** Track document editing locks: tenantId:documentId -> lock info */
const documentLocks = new Map<string, { userId: number; userName: string; lockedAt: Date }>();

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function getTenantRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

function getEntityRoom(entityType: string, entityId: string): string {
  return `entity:${entityType}:${entityId}`;
}

function getOnlineUsers(tenantId: string): TenantUser[] {
  const users = tenantUsers.get(tenantId);
  return users ? Array.from(users.values()) : [];
}

function removeUserFromAllTenants(socketId: string): string | null {
  for (const [tenantId, users] of tenantUsers) {
    if (users.has(socketId)) {
      users.delete(socketId);
      if (users.size === 0) {
        tenantUsers.delete(tenantId);
      }
      return tenantId;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main Socket Handler Setup
// ---------------------------------------------------------------------------

export function setupCrmSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    // ─── 1. Connection Management ─────────────────────────────────────

    /**
     * User joins their tenant room for isolated real-time updates.
     * All CRM entity events are broadcast to the tenant room.
     */
    socket.on('crm:join', (data: { name: string }) => {
      try {
        // Use server-verified data from JWT (set by io.use() auth middleware)
        const userId = socket.data.userId;
        const tenantId = socket.data.tenantId;
        if (!userId || !tenantId) return;

        const tenantRoom = getTenantRoom(tenantId);
        socket.join(tenantRoom);

        // Track user in tenant
        if (!tenantUsers.has(tenantId)) {
          tenantUsers.set(tenantId, new Map());
        }
        tenantUsers.get(tenantId)!.set(socket.id, {
          socketId: socket.id,
          userId,
          tenantId,
          name: data.name,
          joinedAt: new Date()
        });

        // Broadcast updated online users list to tenant
        io.to(tenantRoom).emit('crm:online_users', getOnlineUsers(tenantId));

        // Send current document locks for this tenant to newly joined user
        const locks: Record<string, { userId: number; userName: string }> = {};
        const lockPrefix = `${tenantId}:`;
        for (const [lockKey, lock] of documentLocks) {
          if (lockKey.startsWith(lockPrefix)) {
            const documentId = lockKey.substring(lockPrefix.length);
            locks[documentId] = { userId: lock.userId, userName: lock.userName };
          }
        }
        socket.emit('document:locks_sync', locks);
      } catch (err) {
        logger.error({ err }, 'Socket event crm:join error:');
      }
    });

    /**
     * User leaves their tenant room.
     */
    socket.on('crm:leave', () => {
      try {
        const tenantId = removeUserFromAllTenants(socket.id);
        if (tenantId) {
          const tenantRoom = getTenantRoom(tenantId);
          socket.leave(tenantRoom);
          io.to(tenantRoom).emit('crm:online_users', getOnlineUsers(tenantId));
        }
      } catch (err) {
        logger.error({ err }, 'Socket event crm:leave error:');
      }
    });

    /**
     * Heartbeat/ping - client sends periodically to confirm connection is alive.
     */
    socket.on('crm:ping', () => {
      try {
        socket.emit('crm:pong', { timestamp: Date.now() });
      } catch (err) {
        logger.error({ err }, 'Socket event crm:ping error:');
      }
    });

    // ─── 2. Entity Subscription ───────────────────────────────────────

    /**
     * Subscribe to updates for a specific entity (e.g., viewing a deal detail page).
     * This enables granular per-record real-time updates.
     */
    socket.on('entity:subscribe', (data: { entityType: string; entityId: string }) => {
      try {
        socket.join(getEntityRoom(data.entityType, data.entityId));
      } catch (err) {
        logger.error({ err }, 'Socket event entity:subscribe error:');
      }
    });

    socket.on('entity:unsubscribe', (data: { entityType: string; entityId: string }) => {
      try {
        socket.leave(getEntityRoom(data.entityType, data.entityId));
      } catch (err) {
        logger.error({ err }, 'Socket event entity:unsubscribe error:');
      }
    });

    // ─── 3. Collaboration - Typing Indicators ─────────────────────────

    /**
     * Typing indicator for entity-level collaboration (e.g., editing a lead's notes).
     * Auto-expires after 3 seconds of inactivity.
     */
    socket.on('typing:start', (data: TypingPayload) => {
      try {
        const timerKey = `${data.entityType}:${data.entityId}:${data.userId}`;
        const room = getEntityRoom(data.entityType, data.entityId);

        // Clear existing auto-stop timer
        const existing = typingTimers.get(timerKey);
        if (existing) clearTimeout(existing);

        socket.to(room).emit('typing:start', {
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          userName: data.userName,
          timestamp: Date.now()
        });

        // Auto-stop after 3 seconds
        const timer = setTimeout(() => {
          socket.to(room).emit('typing:stop', {
            entityType: data.entityType,
            entityId: data.entityId,
            userId: data.userId,
            userName: data.userName
          });
          typingTimers.delete(timerKey);
        }, 3000);

        typingTimers.set(timerKey, timer);
      } catch (err) {
        logger.error({ err }, 'Socket event typing:start error:');
      }
    });

    socket.on('typing:stop', (data: TypingPayload) => {
      try {
        const timerKey = `${data.entityType}:${data.entityId}:${data.userId}`;
        const room = getEntityRoom(data.entityType, data.entityId);

        const existing = typingTimers.get(timerKey);
        if (existing) clearTimeout(existing);
        typingTimers.delete(timerKey);

        socket.to(room).emit('typing:stop', {
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          userName: data.userName
        });
      } catch (err) {
        logger.error({ err }, 'Socket event typing:stop error:');
      }
    });

    // ─── 4. Collaboration - Document Editing Lock ─────────────────────

    /**
     * Lock/unlock a document for collaborative editing.
     * Prevents simultaneous edits by multiple users.
     */
    socket.on('document:editing', (data: DocumentLockPayload) => {
      try {
        const tenantId = socket.data.tenantId;
        const lockKey = tenantId ? `${tenantId}:${data.documentId}` : data.documentId;

        if (data.action === 'lock') {
          const existing = documentLocks.get(lockKey);
          if (existing && existing.userId !== data.userId) {
            // Document is already locked by another user
            socket.emit('document:lock_denied', {
              documentId: data.documentId,
              lockedBy: existing.userName,
              lockedByUserId: existing.userId
            });
            return;
          }
          documentLocks.set(lockKey, {
            userId: data.userId,
            userName: data.userName,
            lockedAt: new Date()
          });
        } else {
          const existing = documentLocks.get(lockKey);
          if (existing && existing.userId === data.userId) {
            documentLocks.delete(lockKey);
          }
        }

        // Broadcast lock status to tenant room
        if (tenantId) {
          io.to(getTenantRoom(tenantId)).emit('document:editing', {
            documentId: data.documentId,
            userId: data.userId,
            userName: data.userName,
            action: data.action,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        logger.error({ err }, 'Socket event document:editing error:');
      }
    });

    // ─── 5. Chat/Messaging Events ─────────────────────────────────────

    /**
     * Real-time messaging within CRM context (internal team chat).
     * Uses conversation rooms for scoped message delivery.
     */
    socket.on('message:new', (data: MessagePayload) => {
      try {
        const room = `chat:${data.conversationId}`;
        socket.to(room).emit('message:new', {
          ...data,
          timestamp: data.timestamp || new Date().toISOString()
        });
      } catch (err) {
        logger.error({ err }, 'Socket event message:new error:');
      }
    });

    socket.on('message:read', (data: { conversationId: string; userId: number; messageId?: string }) => {
      try {
        const room = `chat:${data.conversationId}`;
        socket.to(room).emit('message:read', {
          conversationId: data.conversationId,
          userId: data.userId,
          messageId: data.messageId,
          timestamp: Date.now()
        });
      } catch (err) {
        logger.error({ err }, 'Socket event message:read error:');
      }
    });

    socket.on('chat:typing', (data: { conversationId: string; userId: number; userName: string; isTyping: boolean }) => {
      try {
        const room = `chat:${data.conversationId}`;
        socket.to(room).emit('chat:typing', {
          conversationId: data.conversationId,
          userId: data.userId,
          userName: data.userName,
          isTyping: data.isTyping
        });
      } catch (err) {
        logger.error({ err }, 'Socket event chat:typing error:');
      }
    });

    /**
     * Join/leave a chat conversation room.
     */
    socket.on('chat:join_room', (data: { conversationId: string }) => {
      try {
        socket.join(`chat:${data.conversationId}`);
      } catch (err) {
        logger.error({ err }, 'Socket event chat:join_room error:');
      }
    });

    socket.on('chat:leave_room', (data: { conversationId: string }) => {
      try {
        socket.leave(`chat:${data.conversationId}`);
      } catch (err) {
        logger.error({ err }, 'Socket event chat:leave_room error:');
      }
    });

    // ─── 6. Disconnect Cleanup ────────────────────────────────────────

    socket.on('disconnect', () => {
      try {
        // Remove from tenant tracking
        const tenantId = removeUserFromAllTenants(socket.id);
        if (tenantId) {
          const tenantRoom = getTenantRoom(tenantId);
          io.to(tenantRoom).emit('crm:online_users', getOnlineUsers(tenantId));
        }

        // Release any document locks held by this socket's user
        const disconnectedUserId = socket.data.userId;
        const disconnectedTenantId = socket.data.tenantId;
        if (disconnectedUserId) {
          for (const [lockKey, lock] of documentLocks) {
            if (lock.userId === disconnectedUserId) {
              documentLocks.delete(lockKey);
              // Extract documentId from lock key (format: tenantId:documentId)
              const colonIdx = lockKey.indexOf(':');
              const documentId = colonIdx > -1 ? lockKey.substring(colonIdx + 1) : lockKey;
              if (disconnectedTenantId) {
                io.to(getTenantRoom(disconnectedTenantId)).emit('document:editing', {
                  documentId,
                  userId: lock.userId,
                  userName: lock.userName,
                  action: 'unlock',
                  timestamp: Date.now()
                });
              }
            }
          }
        }

        // Clean up typing timers for this socket
        for (const [key, timer] of typingTimers.entries()) {
          if (key.includes(socket.id)) {
            clearTimeout(timer);
            typingTimers.delete(key);
          }
        }
      } catch (err) {
        logger.error({ err }, 'Socket event disconnect error:');
      }
    });
  });

  // ─── Periodic Cleanup ─────────────────────────────────────────────

  // Clean up stale document locks every 5 minutes (locks older than 30 minutes)
  const lockCleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [lockKey, lock] of documentLocks) {
        if (now - lock.lockedAt.getTime() > 30 * 60 * 1000) {
          documentLocks.delete(lockKey);
          // Extract tenantId from lock key (format: tenantId:documentId)
          const colonIdx = lockKey.indexOf(':');
          const tenantId = colonIdx > -1 ? lockKey.substring(0, colonIdx) : null;
          const documentId = colonIdx > -1 ? lockKey.substring(colonIdx + 1) : lockKey;

          if (tenantId) {
            io.to(getTenantRoom(tenantId)).emit('document:editing', {
              documentId,
              userId: lock.userId,
              userName: lock.userName,
              action: 'unlock',
              reason: 'timeout',
              timestamp: now
            });
          } else {
            io.emit('document:editing', {
              documentId,
              userId: lock.userId,
              userName: lock.userName,
              action: 'unlock',
              reason: 'timeout',
              timestamp: now
            });
          }
        }
      }
    },
    5 * 60 * 1000
  );

  process.on('SIGTERM', () => clearInterval(lockCleanupInterval));
  process.on('SIGINT', () => clearInterval(lockCleanupInterval));
}

// ---------------------------------------------------------------------------
// Helper: Emit to tenant room (used by services to broadcast CRM events)
// ---------------------------------------------------------------------------

/**
 * Emit a CRM event scoped to a specific tenant room.
 * Falls back to global emit if no tenantId is provided.
 *
 * Usage from services:
 *   import { emitCrmEvent } from '../socket/socketHandlers';
 *   emitCrmEvent(io, 'lead:created', { id: lead.id, tenantId: lead.tenantId });
 */
export function emitCrmEvent(io: Server, event: string, payload: Record<string, unknown>): void {
  try {
    if (payload.tenantId) {
      io.to(getTenantRoom(payload.tenantId)).emit(event, payload);
    } else {
      io.emit(event, payload);
    }
  } catch (err) {
    logger.error({ err }, 'Socket emission error');
  }
}
