import { Server, Socket } from 'socket.io';
import logger from '../config/logger';

/**
 * Live Chat Socket.io Handler
 *
 * Manages real-time chat events:
 * - Room joining/leaving for conversations
 * - Typing indicators
 * - Online agent tracking
 */

const typingTimers = new Map<string, NodeJS.Timeout>();
const onlineAgents = new Map<string, { socketId: string; userId: number; name: string }>();

export function setupLiveChatHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // ───────── Room Management ───────────────────────────────────────────

    /**
     * Join a conversation room. Agents call this when they select a conversation.
     * This ensures they receive real-time messages for that specific conversation.
     */
    socket.on('chat:join', (data: { conversationId: number; userId?: number; name?: string }) => {
      const room = `conversation:${data.conversationId}`;
      socket.join(room);

      // Notify others in the room that an agent/visitor joined
      socket.to(room).emit('chat:user_joined', {
        conversationId: data.conversationId,
        userId: data.userId,
        name: data.name,
        socketId: socket.id
      });
    });

    /**
     * Leave a conversation room. Called when an agent deselects a conversation.
     */
    socket.on('chat:leave', (data: { conversationId: number; userId?: number }) => {
      const room = `conversation:${data.conversationId}`;
      socket.leave(room);

      socket.to(room).emit('chat:user_left', {
        conversationId: data.conversationId,
        userId: data.userId,
        socketId: socket.id
      });
    });

    // ───────── Typing Indicators ─────────────────────────────────────────

    /**
     * Typing indicator: agent or visitor is typing in a conversation.
     * Auto-expires after 3 seconds of no further typing events.
     */
    socket.on('chat:typing', (data: { conversationId: number; userId?: number; name?: string; isTyping: boolean }) => {
      const room = `conversation:${data.conversationId}`;
      const timerKey = `${data.conversationId}:${data.userId || socket.id}`;

      // Clear any existing auto-stop timer
      const existing = typingTimers.get(timerKey);
      if (existing) clearTimeout(existing);

      if (data.isTyping) {
        // Broadcast typing start to others in the room
        socket.to(room).emit('chat:typing', {
          conversationId: data.conversationId,
          userId: data.userId,
          name: data.name,
          isTyping: true
        });

        // Auto-stop after 3 seconds
        const timer = setTimeout(() => {
          socket.to(room).emit('chat:typing', {
            conversationId: data.conversationId,
            userId: data.userId,
            name: data.name,
            isTyping: false
          });
          typingTimers.delete(timerKey);
        }, 3000);

        typingTimers.set(timerKey, timer);
      } else {
        // Immediately stop typing indicator
        socket.to(room).emit('chat:typing', {
          conversationId: data.conversationId,
          userId: data.userId,
          name: data.name,
          isTyping: false
        });
        typingTimers.delete(timerKey);
      }
    });

    // ───────── Agent Online Status ───────────────────────────────────────

    /**
     * Agent goes online for live chat duty.
     */
    socket.on('chat:agent_online', (data: { userId: number; name: string }) => {
      onlineAgents.set(socket.id, {
        socketId: socket.id,
        userId: data.userId,
        name: data.name
      });

      io.emit('chat:agents_online', Array.from(onlineAgents.values()));
    });

    /**
     * Agent goes offline for live chat.
     */
    socket.on('chat:agent_offline', () => {
      onlineAgents.delete(socket.id);
      io.emit('chat:agents_online', Array.from(onlineAgents.values()));
    });

    // ───────── Cleanup on Disconnect ─────────────────────────────────────

    socket.on('disconnect', () => {
      try {
        // Clean up agent online status
        if (onlineAgents.has(socket.id)) {
          onlineAgents.delete(socket.id);
          io.emit('chat:agents_online', Array.from(onlineAgents.values()));
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
}
