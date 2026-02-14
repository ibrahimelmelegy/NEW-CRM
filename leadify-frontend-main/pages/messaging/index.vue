<template lang="pug">
.messaging-page.flex(style="height: calc(100vh - 80px)")
  //- Conversation List Sidebar
  .conversation-sidebar.flex.flex-col(class="w-[360px] min-w-[300px]")
    .sidebar-header.p-4
      h2.text-xl.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('messaging.title') }}
      .flex.gap-2
        el-input(
          v-model="searchQuery"
          :placeholder="$t('messaging.searchContacts')"
          prefix-icon="Search"
          clearable
          class="glass-input"
        )
        el-button(type="primary" @click="showNewChat = true" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
          Icon(name="ph:plus-bold" size="18" aria-label="New message")

    .conversation-list.flex-1.overflow-y-auto
      .p-4.text-center(v-if="loadingConversations" style="color: var(--text-muted)")
        el-skeleton(:rows="4" animated)

      template(v-else-if="filteredConversations.length")
        .conversation-item(
          v-for="conv in filteredConversations"
          :key="conv.contactPhone"
          :class="{ active: activePhone === conv.contactPhone }"
          @click="selectConversation(conv)"
        )
          .flex.items-center.gap-3.p-4.cursor-pointer
            .avatar.flex-shrink-0
              .w-12.h-12.rounded-full.flex.items-center.justify-center.text-white.font-bold(
                :style="{ background: getAvatarColor(conv.contactName) }"
              ) {{ getInitials(conv.contactName) }}
            .flex-1.min-w-0
              .flex.justify-between.items-start
                span.font-medium.truncate(style="color: var(--text-primary)") {{ conv.contactName }}
                span.text-xs.flex-shrink-0(style="color: var(--text-muted)") {{ formatTime(conv.lastMessageTime) }}
              .flex.justify-between.items-center.mt-1
                p.text-sm.truncate(style="color: var(--text-muted)") {{ conv.lastMessage }}
                el-badge(v-if="conv.unreadCount > 0" :value="conv.unreadCount" type="primary" class="unread-badge")

      .p-8.text-center(v-else)
        Icon(name="ph:chat-circle-dots" size="48" style="color: var(--text-muted)" aria-hidden="true")
        p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('messaging.noConversations') }}

  //- Chat Window
  .chat-window.flex-1.flex.flex-col(v-if="activePhone")
    //- Chat Header
    .chat-header.p-4.flex.items-center.gap-3
      .w-10.h-10.rounded-full.flex.items-center.justify-center.text-white.font-bold.text-sm(
        :style="{ background: getAvatarColor(activeConversation?.contactName || '') }"
      ) {{ getInitials(activeConversation?.contactName || '') }}
      div
        h3.font-bold(style="color: var(--text-primary)") {{ activeConversation?.contactName || activePhone }}
        p.text-xs(style="color: var(--text-muted)") {{ activePhone }}

    //- Messages
    .messages-container.flex-1.overflow-y-auto.p-4(ref="messagesContainer")
      .text-center.py-4(v-if="loadingMessages")
        el-skeleton(:rows="6" animated)
      template(v-else)
        .message-bubble(
          v-for="msg in messages"
          :key="msg.id"
          :class="msg.direction === 'OUTBOUND' ? 'outbound' : 'inbound'"
        )
          .bubble-content
            p {{ msg.content }}
            .bubble-meta
              span.text-xs {{ formatTime(msg.createdAt) }}
              Icon(
                v-if="msg.direction === 'OUTBOUND'"
                :name="getStatusIcon(msg.status)"
                size="14"
                :class="msg.status === 'READ' ? 'text-blue-400' : ''"
                :aria-label="msg.status"
              )

    //- Message Input
    .message-input-area.p-4
      .flex.gap-3.items-end
        el-input(
          v-model="newMessage"
          type="textarea"
          :rows="1"
          :autosize="{ minRows: 1, maxRows: 4 }"
          :placeholder="$t('messaging.typeMessage')"
          class="glass-input flex-1"
          @keydown.enter.exact.prevent="handleSend"
        )
        el-button(
          type="primary"
          :loading="sending"
          :disabled="!newMessage.trim()"
          @click="handleSend"
          circle
          class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !w-12 !h-12"
        )
          Icon(name="ph:paper-plane-tilt-bold" size="20" aria-label="Send message")

  //- Empty State
  .flex-1.flex.items-center.justify-center(v-else)
    .text-center
      Icon(name="ph:chat-circle-dots" size="80" style="color: var(--text-muted); opacity: 0.3" aria-hidden="true")
      h3.mt-4.text-lg.font-medium(style="color: var(--text-muted)") {{ $t('messaging.selectConversation') }}
      p.text-sm.mt-1(style="color: var(--text-muted); opacity: 0.7") {{ $t('messaging.selectConversationDesc') }}

  //- New Chat Dialog
  el-dialog(v-model="showNewChat" :title="$t('messaging.newMessage')" width="420px" class="glass-dialog")
    .space-y-4
      el-input(
        v-model="newChatPhone"
        :placeholder="$t('messaging.enterPhone')"
        prefix-icon="Phone"
      )
      el-input(
        v-model="newChatName"
        :placeholder="$t('messaging.contactNameOptional')"
        prefix-icon="User"
      )
    template(#footer)
      el-button(@click="showNewChat = false") {{ $t('common.cancel') }}
      el-button(type="primary" :disabled="!newChatPhone.trim()" @click="startNewChat" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('messaging.startChat') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { Conversation, ChatMessage } from '~/composables/useMessaging';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationRead
} from '~/composables/useMessaging';

definePageMeta({
  title: 'Messaging'
});

const conversations = ref<Conversation[]>([]);
const messages = ref<ChatMessage[]>([]);
const activePhone = ref('');
const searchQuery = ref('');
const newMessage = ref('');
const loadingConversations = ref(true);
const loadingMessages = ref(false);
const sending = ref(false);
const showNewChat = ref(false);
const newChatPhone = ref('');
const newChatName = ref('');
const messagesContainer = ref<HTMLElement>();

const activeConversation = computed(() =>
  conversations.value.find(c => c.contactPhone === activePhone.value)
);

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value;
  const q = searchQuery.value.toLowerCase();
  return conversations.value.filter(c =>
    c.contactName.toLowerCase().includes(q) || c.contactPhone.includes(q)
  );
});

onMounted(async () => {
  await loadConversations();
});

async function loadConversations() {
  loadingConversations.value = true;
  try {
    conversations.value = await fetchConversations();
  } finally {
    loadingConversations.value = false;
  }
}

async function selectConversation(conv: Conversation) {
  activePhone.value = conv.contactPhone;
  loadingMessages.value = true;
  try {
    const result = await fetchMessages(conv.contactPhone);
    messages.value = result.messages;
    if (conv.unreadCount > 0) {
      await markConversationRead(conv.contactPhone);
      conv.unreadCount = 0;
    }
    scrollToBottom();
  } finally {
    loadingMessages.value = false;
  }
}

async function handleSend() {
  const content = newMessage.value.trim();
  if (!content || sending.value) return;

  sending.value = true;
  try {
    const { success, body } = await sendMessage(
      activePhone.value,
      content,
      activeConversation.value?.contactName
    );

    if (success && body) {
      messages.value.push(body as unknown as ChatMessage);
      newMessage.value = '';
      scrollToBottom();

      // Update conversation last message
      const conv = conversations.value.find(c => c.contactPhone === activePhone.value);
      if (conv) {
        conv.lastMessage = content;
        conv.lastMessageTime = new Date().toISOString();
      }
    }
  } catch {
    ElNotification({ type: 'error', title: 'Error', message: 'Failed to send message' });
  } finally {
    sending.value = false;
  }
}

function startNewChat() {
  const phone = newChatPhone.value.trim();
  if (!phone) return;

  // Add to conversations if not exists
  if (!conversations.value.find(c => c.contactPhone === phone)) {
    conversations.value.unshift({
      contactPhone: phone,
      contactName: newChatName.value.trim() || phone,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    });
  }

  activePhone.value = phone;
  messages.value = [];
  showNewChat.value = false;
  newChatPhone.value = '';
  newChatName.value = '';
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#ff7b00', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'SENT': return 'ph:check';
    case 'DELIVERED': return 'ph:checks';
    case 'READ': return 'ph:checks';
    case 'FAILED': return 'ph:warning';
    default: return 'ph:clock';
  }
}
</script>

<style lang="scss" scoped>
.messaging-page {
  animation: fadeIn 0.4s ease-out;
}

.conversation-sidebar {
  border-right: 1px solid var(--border-default);
  background: var(--glass-bg);
}

.conversation-item {
  border-bottom: 1px solid var(--border-default);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.05);
  }

  &.active {
    background: rgba(120, 73, 255, 0.1);
    border-left: 3px solid #7849ff;
  }
}

.chat-header {
  border-bottom: 1px solid var(--border-default);
  background: var(--glass-bg);
}

.message-input-area {
  border-top: 1px solid var(--border-default);
  background: var(--glass-bg);
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-bubble {
  display: flex;
  max-width: 70%;

  &.outbound {
    align-self: flex-end;

    .bubble-content {
      background: #7849ff;
      color: white;
      border-radius: 18px 18px 4px 18px;
    }

    .bubble-meta {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  &.inbound {
    align-self: flex-start;

    .bubble-content {
      background: var(--bg-input);
      color: var(--text-primary);
      border-radius: 18px 18px 18px 4px;
    }

    .bubble-meta {
      color: var(--text-muted);
    }
  }
}

.bubble-content {
  padding: 10px 14px;
  word-break: break-word;

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 4px;
}

.unread-badge {
  :deep(.el-badge__content) {
    background: #7849ff;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
