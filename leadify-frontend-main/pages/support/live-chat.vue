<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">{{ $t('liveChat.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('liveChat.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="filterStatus" class="w-36" :placeholder="$t('common.filter')">
            <el-option :label="$t('liveChat.allChats')" value="" />
            <el-option :label="$t('liveChat.active')" value="active" />
            <el-option :label="$t('liveChat.waiting')" value="waiting" />
            <el-option :label="$t('liveChat.resolved')" value="resolved" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="toggleAvailability">
            <Icon
              :name="isAvailable ? 'ph:circle-fill' : 'ph:circle'"
              class="w-4 h-4 mr-2"
              :class="isAvailable ? 'text-emerald-300' : 'text-red-300'"
            />
            {{ isAvailable ? $t('liveChat.online') : $t('liveChat.offline') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ metrics.activeChats ?? activeChatsCount }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('liveChat.activeChats') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-cyan-400">{{ metrics.avgResponseTime ?? '—' }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('liveChat.avgResponseTime') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ metrics.satisfaction ?? '—' }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('liveChat.satisfaction') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ metrics.resolvedToday ?? resolvedTodayCount }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('liveChat.resolvedToday') }}</div>
      </div>
    </div>

    <!-- Chat Interface -->
    <div class="grid grid-cols-12 gap-4" style="height: calc(100vh - 380px); min-height: 500px">
      <!-- Left Panel: Chat List -->
      <div class="col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden">
        <div class="p-3 border-b border-slate-800/60">
          <el-input v-model="chatSearch" :placeholder="$t('liveChat.searchConversations')" size="small" clearable @change="loadConversations">
            <template #prefix>
              <Icon name="ph:magnifying-glass" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="loadingConversations" class="p-4 text-center text-slate-500 text-sm">
            <Icon name="ph:spinner-bold" class="w-5 h-5 animate-spin mx-auto" />
          </div>
          <div
            v-for="chat in filteredChats"
            :key="chat.id"
            class="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-800/30 transition border-b border-slate-800/30"
            :class="selectedChatId === chat.id ? 'bg-slate-800/50 border-l-2 border-l-blue-400' : ''"
            @click="selectChat(chat.id)"
          >
            <div class="relative flex-shrink-0">
              <el-avatar :size="36" class="bg-slate-700">{{ chat.visitorName.charAt(0) }}</el-avatar>
              <div
                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
                :class="chat.status === 'active' ? 'bg-emerald-400' : chat.status === 'waiting' ? 'bg-amber-400' : 'bg-slate-500'"
              ></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-200 truncate">{{ chat.visitorName }}</span>
                <span class="text-[10px] text-slate-500 flex-shrink-0">{{ chat.lastMessageTime }}</span>
              </div>
              <p class="text-xs text-slate-400 truncate mt-0.5">{{ chat.lastMessage }}</p>
              <div class="flex items-center gap-1 mt-1">
                <el-tag :type="getChatStatusType(chat.status)" effect="dark" size="small" class="!text-[10px] !px-1.5 !py-0">
                  {{ chat.status }}
                </el-tag>
                <span
                  v-if="chat.unreadCount > 0"
                  class="ml-auto w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold"
                >
                  {{ chat.unreadCount }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="!loadingConversations && filteredChats.length === 0" class="p-4 text-center text-slate-500 text-sm">
            {{ $t('liveChat.noConversations') }}
          </div>
        </div>
      </div>

      <!-- Center: Conversation Area -->
      <div class="col-span-6 glass-panel rounded-xl flex flex-col overflow-hidden">
        <template v-if="activeChat">
          <!-- Chat Header -->
          <div class="p-4 border-b border-slate-800/60 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" class="bg-slate-700">{{ activeChat.visitorName.charAt(0) }}</el-avatar>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ activeChat.visitorName }}</div>
                <div class="text-xs text-slate-500">{{ activeChat.visitorEmail }}</div>
              </div>
            </div>
            <div class="flex gap-1">
              <el-tooltip :content="$t('liveChat.transfer')">
                <el-button text size="small" @click="showTransferDialog = true">
                  <Icon name="ph:user-switch-bold" class="w-4 h-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('liveChat.resolve')">
                <el-button text size="small" type="success" @click="resolveChat">
                  <Icon name="ph:check-circle-bold" class="w-4 h-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('liveChat.close')">
                <el-button text size="small" type="danger" @click="endChat">
                  <Icon name="ph:x-circle-bold" class="w-4 h-4" />
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <!-- Messages -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-if="loadingMessages" class="text-center text-slate-500 text-sm py-4">
              <Icon name="ph:spinner-bold" class="w-5 h-5 animate-spin mx-auto" />
            </div>
            <div v-for="msg in activeChat.messages" :key="msg.id" class="flex" :class="msg.sender === 'agent' ? 'justify-end' : 'justify-start'">
              <div
                class="max-w-[75%] rounded-2xl px-4 py-2.5"
                :class="msg.sender === 'agent' ? 'bg-blue-500/20 text-slate-200 rounded-br-sm' : 'bg-slate-800/60 text-slate-300 rounded-bl-sm'"
              >
                <p class="text-sm">{{ msg.text }}</p>
                <div class="flex items-center justify-end gap-1 mt-1">
                  <span class="text-[10px] text-slate-500">{{ msg.time }}</span>
                  <Icon v-if="msg.sender === 'agent'" name="ph:checks-bold" class="w-3 h-3" :class="msg.read ? 'text-blue-400' : 'text-slate-600'" />
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="activeChat.isTyping" class="flex justify-start">
              <div class="bg-slate-800/60 rounded-2xl rounded-bl-sm px-4 py-3">
                <div class="flex gap-1">
                  <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="p-4 border-t border-slate-800/60">
            <div class="flex gap-2">
              <el-input v-model="messageText" :placeholder="$t('liveChat.typeMessage')" class="flex-1" @keyup.enter="sendMessage">
                <template #prefix>
                  <el-tooltip :content="$t('liveChat.attachFile')">
                    <Icon name="ph:paperclip-bold" class="w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-200" />
                  </el-tooltip>
                </template>
              </el-input>
              <el-button type="primary" :disabled="!messageText.trim() || sendingMessage" @click="sendMessage">
                <Icon name="ph:paper-plane-tilt-bold" class="w-4 h-4" />
              </el-button>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex flex-col items-center justify-center">
          <Icon name="ph:chats-circle-bold" class="w-20 h-20 text-slate-600 mb-4" />
          <h3 class="text-lg font-medium text-slate-400">{{ $t('liveChat.selectConversation') }}</h3>
          <p class="text-sm text-slate-500 mt-1">{{ $t('liveChat.selectHint') }}</p>
        </div>
      </div>

      <!-- Right Panel: Visitor Info -->
      <div class="col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden">
        <template v-if="activeChat">
          <div class="p-4 border-b border-slate-800/60">
            <h4 class="text-sm font-medium text-slate-300">{{ $t('liveChat.visitorInfo') }}</h4>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Visitor Details -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <Icon name="ph:user-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-200">{{ activeChat.visitorName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:envelope-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-200">{{ activeChat.visitorEmail }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:browser-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-400">{{ activeChat.visitorInfo.browser }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:globe-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-400">{{ activeChat.visitorInfo.location }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:link-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-blue-400 truncate">{{ activeChat.visitorInfo.currentPage }}</span>
              </div>
            </div>

            <!-- Quick Replies -->
            <div class="pt-4 border-t border-slate-800/60">
              <h5 class="text-xs font-medium text-slate-400 mb-2">{{ $t('liveChat.quickReplies') }}</h5>
              <div class="space-y-1.5">
                <div
                  v-for="reply in quickReplies"
                  :key="reply.id"
                  class="text-xs text-slate-300 p-2 rounded-lg bg-slate-800/30 cursor-pointer hover:bg-slate-800/60 transition"
                  @click="useQuickReply(reply.text)"
                >
                  {{ reply.label }}
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="pt-4 border-t border-slate-800/60">
              <h5 class="text-xs font-medium text-slate-400 mb-2">{{ $t('liveChat.notes') }}</h5>
              <el-input v-model="chatNotes" type="textarea" :rows="3" :placeholder="$t('liveChat.addNotes')" size="small" />
              <el-button size="small" type="primary" class="mt-2 w-full" @click="saveNotes">
                <Icon name="ph:floppy-disk-bold" class="w-3 h-3 mr-1" />
                {{ $t('liveChat.saveNotes') }}
              </el-button>
            </div>

            <!-- Assignment -->
            <div class="pt-4 border-t border-slate-800/60">
              <h5 class="text-xs font-medium text-slate-400 mb-2">{{ $t('liveChat.assignedTo') }}</h5>
              <el-select
                v-model="activeChat.assignedAgent"
                :placeholder="$t('liveChat.selectAgent')"
                class="w-full"
                size="small"
                @change="handleAgentAssign"
              >
                <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id" />
              </el-select>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex flex-col items-center justify-center p-4">
          <Icon name="ph:info-bold" class="w-12 h-12 text-slate-600 mb-3" />
          <p class="text-xs text-slate-500 text-center">{{ $t('liveChat.visitorDetailsHint') }}</p>
        </div>
      </div>
    </div>

    <!-- Transfer Dialog -->
    <el-dialog v-model="showTransferDialog" :title="$t('liveChat.transferChat')" width="400px">
      <el-form label-position="top">
        <el-form-item :label="$t('liveChat.transferTo')">
          <el-select v-model="transferTarget" :placeholder="$t('liveChat.selectAgent')" class="w-full">
            <el-option v-for="agent in agents" :key="agent.id" :label="`${agent.name} (${agent.activeChats} active)`" :value="agent.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('liveChat.reason')">
          <el-input v-model="transferReason" type="textarea" :rows="2" :placeholder="$t('liveChat.reasonPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransferDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="transferChat">{{ $t('liveChat.transfer') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useLiveChat } from '~/composables/liveChat';
import { user } from '~/composables/useUser';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const { t } = useI18n();

const {
  getConversations,
  getMessages,
  sendMessage: apiSendMessage,
  markAsRead,
  assignAgent,
  transferConversation,
  resolveConversation,
  closeConversation,
  getCannedResponses,
  getMetrics
} = useLiveChat();

// ─── State ────────────────────────────────────────────────────────────────────
const filterStatus = ref('');
const chatSearch = ref('');
const selectedChatId = ref<number | null>(null);
const messageText = ref('');
const chatNotes = ref('');
const isAvailable = ref(true);
const showTransferDialog = ref(false);
const transferTarget = ref<number | null>(null);
const transferReason = ref('');
const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sendingMessage = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// ─── Metrics ──────────────────────────────────────────────────────────────────
const metrics = ref<{
  activeChats?: number;
  avgResponseTime?: string;
  satisfaction?: string | number;
  resolvedToday?: number;
}>({});

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  sender: 'agent' | 'visitor';
  text: string;
  time: string;
  read: boolean;
}

interface Chat {
  id: number;
  visitorName: string;
  visitorEmail: string;
  status: 'active' | 'waiting' | 'resolved';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTyping: boolean;
  assignedAgent: number | null;
  visitorInfo: {
    browser: string;
    location: string;
    currentPage: string;
  };
  messages: ChatMessage[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const chats = ref<Chat[]>([]);
const agents = ref<{ id: number; name: string; activeChats: number }[]>([]);
const quickReplies = ref<{ id: number; label: string; text: string }[]>([]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeConversation = (raw: any): Chat => ({
  id: raw.id,
  visitorName: raw.visitorName || raw.visitorInfo?.name || 'Visitor',
  visitorEmail: raw.visitorEmail || raw.visitorInfo?.email || '',
  status: raw.status || 'waiting',
  lastMessage: raw.lastMessage || raw.lastMessagePreview || '',
  lastMessageTime:
    raw.lastMessageTime || raw.updatedAt
      ? new Date(raw.lastMessageTime || raw.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '',
  unreadCount: raw.unreadCount ?? 0,
  isTyping: false,
  assignedAgent: raw.assignedAgent || raw.agentId || null,
  visitorInfo: {
    browser: raw.visitorInfo?.browser || raw.browser || '',
    location: raw.visitorInfo?.location || raw.location || '',
    currentPage: raw.visitorInfo?.currentPage || raw.currentPage || ''
  },
  messages: []
});

const normalizeMessage = (raw: any): ChatMessage => ({
  id: raw.id,
  sender: raw.senderType === 'STAFF' || raw.sender === 'agent' ? 'agent' : 'visitor',
  text: raw.content || raw.text || '',
  time: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : raw.time || '',
  read: raw.readAt != null || raw.read === true
});

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// ─── Load data ────────────────────────────────────────────────────────────────
const loadConversations = async () => {
  loadingConversations.value = true;
  try {
    const params: Record<string, string> = {};
    if (filterStatus.value) params.status = filterStatus.value;
    if (chatSearch.value) params.search = chatSearch.value;

    const res = await getConversations(params);
    if (res.success && res.body) {
      const raw = Array.isArray(res.body) ? res.body : (res.body as any).rows || (res.body as any).data || [];
      chats.value = raw.map(normalizeConversation);
    }
  } catch (e) {
    console.error('Failed to load conversations', e);
  } finally {
    loadingConversations.value = false;
  }
};

const loadMessages = async (conversationId: number) => {
  loadingMessages.value = true;
  try {
    const res = await getMessages(conversationId);
    if (res.success && res.body) {
      const raw = Array.isArray(res.body) ? res.body : (res.body as any).rows || (res.body as any).data || [];
      const chat = chats.value.find(c => c.id === conversationId);
      if (chat) {
        chat.messages = raw.map(normalizeMessage);
      }
    }
  } catch (e) {
    console.error('Failed to load messages', e);
  } finally {
    loadingMessages.value = false;
    scrollToBottom();
  }
};

const loadAgents = async () => {
  try {
    const res = await useApiFetch('users?role=support', 'GET');
    if (res.success && res.body) {
      const raw = Array.isArray(res.body) ? res.body : (res.body as any).rows || (res.body as any).data || (res.body as any).users || [];
      agents.value = raw.map((u: any) => ({
        id: u.id,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        activeChats: u.activeChats ?? 0
      }));
    }
  } catch (e) {
    console.error('Failed to load agents', e);
  }
};

const loadCannedResponses = async () => {
  try {
    const res = await getCannedResponses();
    if (res.success && res.body) {
      const raw = Array.isArray(res.body) ? res.body : (res.body as any).rows || (res.body as any).data || [];
      quickReplies.value = raw.map((r: any, idx: number) => ({
        id: r.id || idx + 1,
        label: r.label || r.name || r.shortcut || `Reply ${idx + 1}`,
        text: r.text || r.content || r.message || ''
      }));
    }
  } catch (e) {
    console.error('Failed to load canned responses', e);
  }
};

const loadMetrics = async () => {
  try {
    const res = await getMetrics();
    if (res.success && res.body) {
      metrics.value = res.body as any;
    }
  } catch (e) {
    console.error('Failed to load metrics', e);
  }
};

// ─── Socket ───────────────────────────────────────────────────────────────────
const { socket } = useSocket();

watch(socket, sock => {
  if (!sock) return;

  sock.on('chat:message', (data: any) => {
    const conversationId = data.conversationId || data.conversation_id;
    const chat = chats.value.find(c => c.id === conversationId);
    if (chat) {
      const msg = normalizeMessage(data.message || data);
      chat.messages.push(msg);
      chat.lastMessage = msg.text;
      chat.lastMessageTime = msg.time;
      if (selectedChatId.value !== conversationId) {
        chat.unreadCount++;
      } else {
        scrollToBottom();
        markAsRead(conversationId).catch(() => {});
      }
    } else {
      // New conversation arrived - reload list
      loadConversations();
    }
  });

  sock.on('chat:conversation_updated', (data: any) => {
    const id = data.id || data.conversationId;
    const chat = chats.value.find(c => c.id === id);
    if (chat) {
      if (data.status) chat.status = data.status;
      if (data.assignedAgent !== undefined) chat.assignedAgent = data.assignedAgent;
    } else {
      loadConversations();
    }
  });

  sock.on('chat:typing', (data: any) => {
    const chat = chats.value.find(c => c.id === data.conversationId);
    if (chat) {
      chat.isTyping = data.isTyping ?? true;
      if (chat.isTyping) {
        setTimeout(() => {
          chat.isTyping = false;
        }, 3000);
      }
    }
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.off('chat:message');
    socket.value.off('chat:conversation_updated');
    socket.value.off('chat:typing');
  }
});

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredChats = computed(() => {
  let result = chats.value;
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value);
  }
  if (chatSearch.value) {
    const s = chatSearch.value.toLowerCase();
    result = result.filter(c => c.visitorName.toLowerCase().includes(s) || c.visitorEmail.toLowerCase().includes(s));
  }
  return result;
});

const activeChat = computed(() => {
  if (selectedChatId.value === null) return null;
  return chats.value.find(c => c.id === selectedChatId.value) || null;
});

const activeChatsCount = computed(() => chats.value.filter(c => c.status === 'active').length);
const resolvedTodayCount = computed(() => chats.value.filter(c => c.status === 'resolved').length);

// ─── Actions ──────────────────────────────────────────────────────────────────
const getChatStatusType = (status: string): 'success' | 'warning' | 'info' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | undefined> = {
    active: 'success',
    waiting: 'warning',
    resolved: 'info'
  };
  return map[status];
};

const selectChat = async (id: number) => {
  selectedChatId.value = id;
  const chat = chats.value.find(c => c.id === id);
  if (chat) {
    chat.unreadCount = 0;
  }
  await loadMessages(id);
  await markAsRead(id).catch(() => {});
};

const sendMessage = async () => {
  if (!messageText.value.trim() || !activeChat.value || sendingMessage.value) return;

  const chat = activeChat.value;
  const text = messageText.value.trim();
  const currentUser = user.value;

  // Optimistic update
  const tempMsg: ChatMessage = {
    id: Date.now(),
    sender: 'agent',
    text,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    read: false
  };
  chat.messages.push(tempMsg);
  chat.lastMessage = text;
  chat.lastMessageTime = 'Just now';
  messageText.value = '';
  scrollToBottom();

  sendingMessage.value = true;
  try {
    const res = await apiSendMessage({
      conversationId: chat.id,
      content: text,
      senderType: 'STAFF',
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.email || 'Agent'
    });

    if (res.success && res.body) {
      // Replace temp message with server response
      const serverMsg = normalizeMessage(res.body as any);
      const idx = chat.messages.findIndex(m => m.id === tempMsg.id);
      if (idx !== -1) {
        chat.messages.splice(idx, 1, serverMsg);
      }
    } else if (!res.success) {
      // Remove optimistic message on failure
      chat.messages = chat.messages.filter(m => m.id !== tempMsg.id);
      ElMessage.error(t('liveChat.sendFailed'));
    }
  } catch (e) {
    chat.messages = chat.messages.filter(m => m.id !== tempMsg.id);
    ElMessage.error(t('liveChat.sendFailed'));
  } finally {
    sendingMessage.value = false;
  }
};

const useQuickReply = (text: string) => {
  messageText.value = text;
};

const saveNotes = () => {
  ElMessage.success(t('common.saved'));
};

const resolveChat = async () => {
  if (!activeChat.value) return;
  const chat = activeChat.value;
  try {
    const res = await resolveConversation(chat.id);
    if (res.success) {
      chat.status = 'resolved';
      ElMessage.success(t('liveChat.conversationResolved'));
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

const endChat = async () => {
  if (!activeChat.value) return;
  const chat = activeChat.value;
  try {
    const res = await closeConversation(chat.id);
    if (res.success) {
      chat.status = 'resolved';
      ElMessage.info(t('liveChat.conversationClosed'));
      selectedChatId.value = null;
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

const toggleAvailability = () => {
  isAvailable.value = !isAvailable.value;
  ElMessage.info(isAvailable.value ? t('liveChat.online') : t('liveChat.offline'));
};

const handleAgentAssign = async (agentId: number) => {
  if (!activeChat.value) return;
  try {
    const res = await assignAgent(activeChat.value.id, agentId);
    if (res.success) {
      ElMessage.success(t('liveChat.agentAssigned'));
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

const transferChat = async () => {
  if (!transferTarget.value) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  if (!activeChat.value) return;
  try {
    const res = await transferConversation(activeChat.value.id, transferTarget.value, transferReason.value);
    if (res.success) {
      const agent = agents.value.find(a => a.id === transferTarget.value);
      ElMessage.success(t('liveChat.conversationTransferred'));
      showTransferDialog.value = false;
      transferTarget.value = null;
      transferReason.value = '';
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

// ─── Watch filter changes to reload ──────────────────────────────────────────
watch(filterStatus, loadConversations);

// ─── Init ─────────────────────────────────────────────────────────────────────
await Promise.allSettled([loadConversations(), loadAgents(), loadCannedResponses(), loadMetrics()]);
</script>
