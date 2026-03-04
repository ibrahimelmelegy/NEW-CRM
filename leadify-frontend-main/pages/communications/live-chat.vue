<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('liveChat.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('liveChat.subtitle') }}
    .flex.items-center.gap-3
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('liveChat.newConversation') }}

  //- Metrics Bar
  .grid.gap-4.mb-6(:class="'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'")
    .glass-card.p-4.animate-entrance
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('liveChat.activeConversations') }}
          p.text-2xl.font-bold(style="color: #22c55e") {{ chatMetrics.activeConversations ?? '--' }}
        .w-12.h-12.rounded-2xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:chat-circle-dots-bold" size="24" style="color: #22c55e")
    .glass-card.p-4.animate-entrance(style="animation-delay: 0.05s")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('liveChat.waitingInQueue') }}
          p.text-2xl.font-bold(:style="{ color: queueColor }") {{ chatMetrics.waitingInQueue ?? '--' }}
        .w-12.h-12.rounded-2xl.flex.items-center.justify-center(:style="{ background: queueColor + '15' }")
          Icon(name="ph:queue-bold" size="24" :style="{ color: queueColor }")
    .glass-card.p-4.animate-entrance(style="animation-delay: 0.1s")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('liveChat.avgResponseTime') }}
          p.text-2xl.font-bold(style="color: #3b82f6") {{ chatMetrics.avgResponseTime || '--' }}
        .w-12.h-12.rounded-2xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:clock-bold" size="24" style="color: #3b82f6")
    .glass-card.p-4.animate-entrance(style="animation-delay: 0.15s")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('liveChat.avgResolutionTime') }}
          p.text-2xl.font-bold(style="color: #8b5cf6") {{ chatMetrics.avgResolutionTime || '--' }}
        .w-12.h-12.rounded-2xl.flex.items-center.justify-center(style="background: rgba(139, 92, 246, 0.15)")
          Icon(name="ph:timer-bold" size="24" style="color: #8b5cf6")

  //- Main Chat Layout
  .chat-layout.flex.gap-4(style="height: calc(100vh - 220px)")
    //- Conversation List (Left Panel)
    .conversation-list.glass-card.flex.flex-col(style="width: 380px; min-width: 320px")
      //- Search
      .p-4.border-b(style="border-color: var(--border-default)")
        el-input(
          v-model="searchQuery"
          :placeholder="$t('liveChat.searchConversations')"
          clearable
          size="large"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

      //- Status Filter
      .flex.gap-2.px-4.py-3.border-b.overflow-x-auto(style="border-color: var(--border-default)")
        el-tag(
          v-for="sf in statusFilters"
          :key="sf.value"
          :type="sf.type"
          :effect="filterStatus === sf.value ? 'dark' : 'plain'"
          size="small"
          class="cursor-pointer"
          @click="filterStatus = sf.value"
        ) {{ sf.label }} ({{ sf.count }})

      //- Conversation Items
      .flex-1.overflow-y-auto(v-loading="loadingConversations")
        .conversation-item.flex.items-start.gap-3.p-4.cursor-pointer.border-b.transition-all(
          v-for="conv in filteredConversations"
          :key="conv.id"
          :class="{ 'active-conversation': selectedConversation?.id === conv.id }"
          :style="{ borderColor: 'var(--border-default)' }"
          @click="selectConversation(conv)"
        )
          .relative
            .w-10.h-10.rounded-full.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
              :style="{ background: getStatusColor(conv.status) + '20', color: getStatusColor(conv.status) }"
            ) {{ (conv.visitorName || '?').charAt(0).toUpperCase() }}
          .flex-1.min-w-0
            .flex.items-center.justify-between.mb-1
              span.text-sm.font-semibold.truncate(style="color: var(--text-primary)") {{ conv.visitorName || '--' }}
              span.text-xs(style="color: var(--text-muted)") {{ formatTime(conv.updatedAt) }}
            .flex.items-center.gap-2.mb-1
              el-tag(
                :type="getStatusTagType(conv.status)"
                size="small"
                effect="dark"
                round
              ) {{ conv.status }}
              el-tag(size="small" effect="plain" round) {{ conv.channel || 'WEB' }}
              el-tag(v-if="conv.priority && conv.priority !== 'NORMAL'" :type="getPriorityType(conv.priority)" size="small" effect="plain" round) {{ conv.priority }}
            p.text-xs.truncate(style="color: var(--text-muted)") {{ conv.lastMessage || $t('liveChat.noMessages') }}
          .flex.flex-col.items-end.gap-1(v-if="conv.unreadCount && conv.unreadCount > 0")
            .w-5.h-5.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
              style="background: #7849ff; color: #fff"
            ) {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}

        //- Empty state
        .text-center.py-12(v-if="!loadingConversations && !filteredConversations.length")
          Icon(name="ph:chat-circle-dots" size="48" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('liveChat.noConversations') }}

    //- Chat Area (Right Panel)
    .chat-area.glass-card.flex.flex-col.flex-1
      template(v-if="selectedConversation")
        //- Chat Header
        .flex.items-center.justify-between.p-4.border-b(style="border-color: var(--border-default)")
          .flex.items-center.gap-3
            .w-10.h-10.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
              :style="{ background: getStatusColor(selectedConversation.status) + '20', color: getStatusColor(selectedConversation.status) }"
            ) {{ (selectedConversation.visitorName || '?').charAt(0).toUpperCase() }}
            div
              p.text-sm.font-bold(style="color: var(--text-primary)") {{ selectedConversation.visitorName }}
              .flex.items-center.gap-2
                span.text-xs(style="color: var(--text-muted)") {{ selectedConversation.visitorEmail || '' }}
                el-tag(:type="getStatusTagType(selectedConversation.status)" size="small" effect="dark" round) {{ selectedConversation.status }}
                span.text-xs(v-if="selectedConversation.staff" style="color: var(--text-muted)")
                  Icon(name="ph:user-bold" size="12" class="mr-1" style="display: inline")
                  | {{ selectedConversation.staff?.name || '' }}
          .flex.items-center.gap-2
            //- Assign Agent
            el-dropdown(trigger="click" @command="handleAssignAgent")
              el-button(size="small" plain class="!rounded-lg")
                Icon(name="ph:user-switch-bold" size="14" class="mr-1")
                | {{ $t('liveChat.assignAgent') }}
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(command="auto")
                    Icon(name="ph:magic-wand-bold" size="14" class="mr-1")
                    | {{ $t('liveChat.autoAssign') }}
                  el-dropdown-item(v-for="agent in agents" :key="agent.id" :command="agent.id")
                    | {{ agent.name }}
            //- Status
            el-select(
              v-model="selectedConversation.status"
              size="small"
              @change="updateConversationStatus"
              style="width: 130px"
            )
              el-option(label="OPEN" value="OPEN")
              el-option(label="ACTIVE" value="ACTIVE")
              el-option(label="WAITING" value="WAITING")
              el-option(label="RESOLVED" value="RESOLVED")
              el-option(label="CLOSED" value="CLOSED")
            //- Resolve button
            el-button(
              v-if="selectedConversation.status !== 'RESOLVED' && selectedConversation.status !== 'CLOSED'"
              size="small"
              type="success"
              plain
              @click="resolveConversation"
              class="!rounded-lg"
            )
              Icon(name="ph:check-circle-bold" size="14" class="mr-1")
              | {{ $t('liveChat.resolve') }}
            //- Delete button
            el-button(size="small" type="danger" plain @click="deleteConversation" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

        //- Messages
        .flex-1.overflow-y-auto.p-4.space-y-4(ref="messagesContainer" v-loading="loadingMessages")
          .message-wrapper(
            v-for="msg in messages"
            :key="msg.id"
            :class="getMessageAlignment(msg.senderType)"
          )
            //- System messages (centered)
            .system-message.text-center.py-2(v-if="msg.senderType === 'SYSTEM' || msg.messageType === 'SYSTEM'")
              .inline-flex.items-center.gap-1.px-3.py-1.rounded-full.text-xs(style="background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border-default)")
                Icon(name="ph:info-bold" size="12")
                | {{ msg.content }}
            //- Regular messages
            .message-bubble.max-w-md.p-3.rounded-2xl(
              v-else
              :class="msg.senderType === 'STAFF' ? 'staff-bubble' : 'client-bubble'"
            )
              p.text-sm(style="color: inherit") {{ msg.content }}
              .flex.items-center.justify-end.gap-2.mt-1
                span.text-xs.opacity-60 {{ msg.senderName || '' }}
                span.text-xs.opacity-60 {{ formatTime(msg.createdAt) }}
                Icon(v-if="msg.senderType === 'STAFF' && msg.isRead" name="ph:checks-bold" size="12" style="opacity: 0.6")

          //- Typing indicator
          .flex.justify-start(v-if="typingUser")
            .typing-indicator.px-4.py-2.rounded-2xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              .flex.items-center.gap-2
                span.text-xs(style="color: var(--text-muted)") {{ typingUser }}
                .typing-dots
                  span.dot
                  span.dot
                  span.dot

          .text-center.py-8(v-if="!loadingMessages && !messages.length")
            Icon(name="ph:chat-circle" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('liveChat.startConversation') }}

        //- Canned Responses Bar
        .flex.gap-2.px-4.py-2.border-t.overflow-x-auto(v-if="cannedResponses.length" style="border-color: var(--border-default)")
          el-tag(
            v-for="cr in cannedResponses"
            :key="cr.id"
            size="small"
            effect="plain"
            class="cursor-pointer shrink-0"
            @click="useCannedResponse(cr.text)"
          )
            Icon(name="ph:lightning-bold" size="12" class="mr-1")
            | {{ cr.label }}

        //- Message Input
        .p-4.border-t(style="border-color: var(--border-default)")
          .flex.gap-3
            el-input(
              v-model="newMessage"
              :placeholder="$t('liveChat.typeMessage')"
              size="large"
              class="!rounded-xl"
              @keyup.enter="sendMessage"
              @input="handleTyping"
            )
            el-button(
              type="primary"
              size="large"
              :loading="sendingMessage"
              :disabled="!newMessage.trim()"
              @click="sendMessage"
              class="!rounded-xl"
            )
              Icon(name="ph:paper-plane-right-bold" size="18")

      //- No Conversation Selected
      .flex-1.flex.items-center.justify-center(v-else)
        .text-center
          Icon(name="ph:chat-circle-dots-bold" size="64" style="color: var(--text-muted)")
          p.text-lg.font-semibold.mt-4(style="color: var(--text-muted)") {{ $t('liveChat.selectConversation') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('liveChat.selectHint') }}

  //- Create Conversation Dialog
  el-dialog(
    v-model="createDialogVisible"
    :title="$t('liveChat.newConversation')"
    width="500px"
    :close-on-click-modal="false"
  )
    el-form(:model="createForm" label-position="top")
      el-form-item(:label="$t('liveChat.visitorName')" required)
        el-input(v-model="createForm.visitorName" :placeholder="$t('liveChat.visitorName')")
      el-form-item(:label="$t('liveChat.visitorEmail')")
        el-input(v-model="createForm.visitorEmail" :placeholder="$t('liveChat.visitorEmail')" type="email")
      el-form-item(:label="$t('liveChat.channel')")
        el-select(v-model="createForm.channel" style="width: 100%")
          el-option(label="Web" value="WEB")
          el-option(label="WhatsApp" value="WHATSAPP")
          el-option(label="Facebook" value="FACEBOOK")
          el-option(label="Instagram" value="INSTAGRAM")
          el-option(label="SMS" value="SMS")
      el-form-item(:label="$t('liveChat.priority')")
        el-select(v-model="createForm.priority" style="width: 100%")
          el-option(label="Low" value="LOW")
          el-option(label="Normal" value="NORMAL")
          el-option(label="High" value="HIGH")
          el-option(label="Urgent" value="URGENT")
      el-form-item(:label="$t('liveChat.subject')")
        el-input(v-model="createForm.subject" :placeholder="$t('liveChat.subject')")
    template(#footer)
      el-button(@click="createDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="createConversation") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import { user } from '~/composables/useUser';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ───────── Socket.io Setup ─────────────────────────────────────────────────
const { socket } = useSocket();

// ───────── State ───────────────────────────────────────────────────────────
const loadingConversations = ref(false);
const loadingMessages = ref(false);
const saving = ref(false);
const sendingMessage = ref(false);
const searchQuery = ref('');
const filterStatus = ref('ALL');
const conversations = ref<any[]>([]);
const messages = ref<any[]>([]);
const selectedConversation = ref<any>(null);
const newMessage = ref('');
const createDialogVisible = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const cannedResponses = ref<any[]>([]);
const agents = ref<any[]>([]);
const typingUser = ref<string | null>(null);
let typingTimeout: ReturnType<typeof setTimeout> | null = null;
let previousConversationId: number | null = null;

const chatMetrics = ref<any>({
  activeConversations: null,
  waitingInQueue: null,
  avgResponseTime: null,
  avgResolutionTime: null
});

const queueColor = computed(() => {
  const q = chatMetrics.value.waitingInQueue;
  if (q == null) return '#6b7280';
  if (q > 10) return '#ef4444';
  if (q >= 5) return '#f59e0b';
  return '#22c55e';
});

const createForm = reactive({
  visitorName: '',
  visitorEmail: '',
  channel: 'WEB',
  priority: 'NORMAL',
  subject: ''
});

// ───────── Status / Priority Helpers ───────────────────────────────────────

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPEN: '#f59e0b',
    ACTIVE: '#22c55e',
    WAITING: '#3b82f6',
    RESOLVED: '#6b7280',
    CLOSED: '#3b82f6'
  };
  return map[status] || '#94a3b8';
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'warning',
    ACTIVE: 'success',
    WAITING: 'info',
    RESOLVED: '',
    CLOSED: 'info'
  };
  return map[status] || 'info';
}

function getPriorityType(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'info',
    NORMAL: '',
    HIGH: 'warning',
    URGENT: 'danger'
  };
  return map[priority] || '';
}

function getMessageAlignment(senderType: string): string {
  if (senderType === 'SYSTEM') return 'flex justify-center';
  return senderType === 'STAFF' ? 'flex justify-end' : 'flex justify-start';
}

// ───────── Filters ─────────────────────────────────────────────────────────

const statusFilters = computed(() => {
  const data = conversations.value;
  return [
    { value: 'ALL', label: t('common.all'), type: '', count: data.length },
    { value: 'OPEN', label: 'Open', type: 'warning', count: data.filter((c: any) => c.status === 'OPEN').length },
    { value: 'ACTIVE', label: 'Active', type: 'success', count: data.filter((c: any) => c.status === 'ACTIVE').length },
    { value: 'WAITING', label: 'Waiting', type: 'info', count: data.filter((c: any) => c.status === 'WAITING').length },
    { value: 'RESOLVED', label: 'Resolved', type: '', count: data.filter((c: any) => c.status === 'RESOLVED').length },
    { value: 'CLOSED', label: 'Closed', type: 'info', count: data.filter((c: any) => c.status === 'CLOSED').length }
  ];
});

const filteredConversations = computed(() => {
  let data = conversations.value;
  if (filterStatus.value !== 'ALL') {
    data = data.filter((c: any) => c.status === filterStatus.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter((c: any) => {
      const name = (c.visitorName || '').toLowerCase();
      const email = (c.visitorEmail || '').toLowerCase();
      const subject = (c.subject || '').toLowerCase();
      return name.includes(q) || email.includes(q) || subject.includes(q);
    });
  }
  return data;
});

// ───────── Time Formatting ─────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ───────── API Calls ───────────────────────────────────────────────────────

async function loadConversations() {
  loadingConversations.value = true;
  try {
    const res = await useApiFetch('live-chat/conversations');
    if (res?.success) {
      conversations.value = res.body?.docs || res.body || [];
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingConversations.value = false;
  }
}

async function loadMessages(conversationId: number) {
  loadingMessages.value = true;
  try {
    const res = await useApiFetch(`live-chat/conversations/${conversationId}/messages`);
    if (res?.success) {
      messages.value = res.body?.docs || res.body || [];
      await nextTick();
      scrollToBottom();
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingMessages.value = false;
  }
}

async function loadAgents() {
  try {
    const res = await useApiFetch('users?limit=100');
    if (res?.success) {
      agents.value = (res.body?.docs || res.body || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.email
      }));
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

async function loadCannedResponses() {
  try {
    const res = await useApiFetch('live-chat/canned-responses');
    if (res?.success) {
      cannedResponses.value = Array.isArray(res.body) ? res.body : [];
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

async function loadMetrics() {
  try {
    const res = await useApiFetch('live-chat/metrics');
    if (res?.success && res.body) {
      chatMetrics.value = res.body;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

// ───────── Conversation Selection with Socket Room Management ──────────────

function selectConversation(conv: any) {
  // Leave previous conversation room
  if (previousConversationId && socket.value) {
    socket.value.emit('chat:leave', {
      conversationId: previousConversationId,
      userId: user.value?.id
    });
  }

  selectedConversation.value = conv;
  messages.value = [];
  typingUser.value = null;
  loadMessages(conv.id);

  // Join new conversation room
  if (socket.value) {
    socket.value.emit('chat:join', {
      conversationId: conv.id,
      userId: user.value?.id,
      name: user.value?.name
    });
  }

  previousConversationId = conv.id;

  // Mark messages as read
  markAsRead(conv.id);
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function markAsRead(conversationId: number) {
  try {
    await useApiFetch(`live-chat/conversations/${conversationId}/read`, 'PUT');
    // Update local unread count
    const conv = conversations.value.find((c: any) => c.id === conversationId);
    if (conv) conv.unreadCount = 0;
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

// ───────── Message Sending ─────────────────────────────────────────────────

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedConversation.value) return;
  sendingMessage.value = true;

  // Stop typing indicator
  if (socket.value && selectedConversation.value) {
    socket.value.emit('chat:typing', {
      conversationId: selectedConversation.value.id,
      userId: user.value?.id,
      name: user.value?.name,
      isTyping: false
    });
  }

  try {
    const payload = {
      conversationId: selectedConversation.value.id,
      content: newMessage.value.trim(),
      senderType: 'STAFF'
    };
    const res = await useApiFetch('live-chat/messages', 'POST', payload);
    if (res?.success) {
      newMessage.value = '';
      // The Socket.io event handler will add the message to the list,
      // but in case it is slow, also load from API
      await loadMessages(selectedConversation.value.id);
      // Update conversation list item
      const conv = conversations.value.find((c: any) => c.id === selectedConversation.value.id);
      if (conv) {
        conv.lastMessage = payload.content;
        conv.updatedAt = new Date().toISOString();
      }
    }
  } catch {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('liveChat.sendFailed')
    });
  } finally {
    sendingMessage.value = false;
  }
}

// ───────── Typing Indicator ────────────────────────────────────────────────

function handleTyping() {
  if (!socket.value || !selectedConversation.value) return;

  socket.value.emit('chat:typing', {
    conversationId: selectedConversation.value.id,
    userId: user.value?.id,
    name: user.value?.name,
    isTyping: true
  });
}

// ───────── Canned Responses ────────────────────────────────────────────────

function useCannedResponse(text: string) {
  newMessage.value = text;
}

// ───────── Agent Assignment ────────────────────────────────────────────────

async function handleAssignAgent(command: string | number) {
  if (!selectedConversation.value) return;
  const convId = selectedConversation.value.id;

  try {
    if (command === 'auto') {
      await useApiFetch(`live-chat/conversations/${convId}/auto-assign`, 'PUT');
    } else {
      await useApiFetch(`live-chat/conversations/${convId}/assign`, 'PUT', { agentId: command });
    }
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('liveChat.agentAssigned')
    });
    await loadConversations();
    // Refresh selected conversation data
    const updated = conversations.value.find((c: any) => c.id === convId);
    if (updated) selectedConversation.value = updated;
  } catch {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.error')
    });
  }
}

// ───────── Status Updates ──────────────────────────────────────────────────

async function updateConversationStatus() {
  if (!selectedConversation.value) return;
  try {
    await useApiFetch(`live-chat/conversations/${selectedConversation.value.id}`, 'PUT', {
      status: selectedConversation.value.status
    });
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('common.saved')
    });
    await loadConversations();
    await loadMetrics();
  } catch {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.error')
    });
  }
}

async function resolveConversation() {
  if (!selectedConversation.value) return;
  try {
    await useApiFetch(`live-chat/conversations/${selectedConversation.value.id}/resolve`, 'PUT', {});
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('liveChat.conversationResolved')
    });
    selectedConversation.value.status = 'RESOLVED';
    await loadConversations();
    await loadMetrics();
  } catch {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.error')
    });
  }
}

// ───────── Delete ──────────────────────────────────────────────────────────

async function deleteConversation() {
  if (!selectedConversation.value) return;
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`live-chat/conversations/${selectedConversation.value.id}`, 'DELETE');
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('common.deleted')
    });
    // Leave room
    if (socket.value && selectedConversation.value) {
      socket.value.emit('chat:leave', {
        conversationId: selectedConversation.value.id,
        userId: user.value?.id
      });
    }
    previousConversationId = null;
    selectedConversation.value = null;
    messages.value = [];
    await loadConversations();
    await loadMetrics();
  } catch {
    // cancelled or error
  }
}

// ───────── Create ──────────────────────────────────────────────────────────

function openCreateDialog() {
  createForm.visitorName = '';
  createForm.visitorEmail = '';
  createForm.channel = 'WEB';
  createForm.priority = 'NORMAL';
  createForm.subject = '';
  createDialogVisible.value = true;
}

async function createConversation() {
  if (!createForm.visitorName.trim()) {
    ElNotification({
      type: 'warning',
      title: t('common.warning'),
      message: t('common.fillRequired')
    });
    return;
  }
  saving.value = true;
  try {
    const res = await useApiFetch('live-chat/conversations', 'POST', { ...createForm });
    if (res?.success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: t('common.saved')
      });
      createDialogVisible.value = false;
      await loadConversations();
      await loadMetrics();
    }
  } catch {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.error')
    });
  } finally {
    saving.value = false;
  }
}

// ───────── Socket.io Event Handlers ────────────────────────────────────────

function setupSocketListeners() {
  if (!socket.value) return;

  // New message received in the current conversation room
  socket.value.on('chat:message', (data: any) => {
    if (selectedConversation.value && data.conversationId === selectedConversation.value.id) {
      // Avoid duplicate messages (already added by API response)
      const exists = messages.value.some((m: any) => m.id === data.id);
      if (!exists) {
        messages.value.push(data);
        nextTick(() => scrollToBottom());
      }
      // Clear typing indicator
      typingUser.value = null;
    }
  });

  // Global message sent event - update conversation list
  socket.value.on('chat:message_sent', (data: any) => {
    const conv = conversations.value.find((c: any) => c.id === data.conversationId);
    if (conv) {
      conv.lastMessage = data.content || conv.lastMessage;
      conv.updatedAt = new Date().toISOString();
      if (selectedConversation.value?.id !== data.conversationId && data.senderType !== 'STAFF') {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    }
  });

  // Typing indicator
  socket.value.on('chat:typing', (data: any) => {
    if (selectedConversation.value && data.conversationId === selectedConversation.value.id) {
      if (data.isTyping && data.userId !== user.value?.id) {
        typingUser.value = data.name || 'Someone';
        // Auto-clear after 4 seconds
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          typingUser.value = null;
        }, 4000);
      } else {
        typingUser.value = null;
      }
    }
  });

  // Conversation status updates
  socket.value.on('chat:conversation_updated', (data: any) => {
    const conv = conversations.value.find((c: any) => c.id === data.conversationId);
    if (conv) {
      if (data.status) conv.status = data.status;
      if (data.staffId) conv.staffId = data.staffId;
    }
    if (selectedConversation.value?.id === data.conversationId) {
      if (data.status) selectedConversation.value.status = data.status;
    }
  });

  // New conversation created (by another agent or visitor)
  socket.value.on('chat:new_conversation', () => {
    loadConversations();
    loadMetrics();
  });

  // Conversation deleted
  socket.value.on('chat:conversation_deleted', (data: any) => {
    conversations.value = conversations.value.filter((c: any) => c.id !== data.conversationId);
    if (selectedConversation.value?.id === data.conversationId) {
      selectedConversation.value = null;
      messages.value = [];
    }
    loadMetrics();
  });

  // Messages read
  socket.value.on('chat:messages_read', (data: any) => {
    if (selectedConversation.value && data.conversationId === selectedConversation.value.id) {
      // Mark all messages as read in the UI
      messages.value.forEach((m: any) => {
        if (!m.isRead && m.senderId !== String(data.readerId)) {
          m.isRead = true;
          m.readAt = data.readAt;
        }
      });
    }
  });

  // Agent assigned
  socket.value.on('chat:assigned', (data: any) => {
    const conv = conversations.value.find((c: any) => c.id === data.conversationId);
    if (conv) {
      conv.staffId = data.agentId;
      if (data.status) conv.status = data.status;
    }
  });

  // Register as online agent
  socket.value.emit('chat:agent_online', {
    userId: user.value?.id,
    name: user.value?.name
  });
}

function cleanupSocketListeners() {
  if (!socket.value) return;
  socket.value.off('chat:message');
  socket.value.off('chat:message_sent');
  socket.value.off('chat:typing');
  socket.value.off('chat:conversation_updated');
  socket.value.off('chat:new_conversation');
  socket.value.off('chat:conversation_deleted');
  socket.value.off('chat:messages_read');
  socket.value.off('chat:assigned');

  // Leave current room
  if (previousConversationId) {
    socket.value.emit('chat:leave', {
      conversationId: previousConversationId,
      userId: user.value?.id
    });
  }

  // Go offline
  socket.value.emit('chat:agent_offline');
}

// ───────── Lifecycle ───────────────────────────────────────────────────────

// Watch for socket connection (it connects asynchronously)
watch(
  () => socket.value,
  sock => {
    if (sock) {
      setupSocketListeners();
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadConversations();
  loadMetrics();
  loadCannedResponses();
  loadAgents();
});

onUnmounted(() => {
  cleanupSocketListeners();
  if (typingTimeout) clearTimeout(typingTimeout);
});
</script>

<style lang="scss" scoped>
.chat-layout {
  min-height: 500px;
}

.conversation-list {
  overflow: hidden;
}

.conversation-item {
  transition: background 0.2s;

  &:hover {
    background: rgba(120, 73, 255, 0.05);
  }
}

.active-conversation {
  background: rgba(120, 73, 255, 0.1) !important;
  border-inline-start: 3px solid #7849ff !important;
}

.staff-bubble {
  background: linear-gradient(135deg, #7849ff, #6039d6);
  color: #fff;
  border-bottom-right-radius: 6px;
}

.client-bubble {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-bottom-left-radius: 6px;
}

.system-message {
  .inline-flex {
    font-style: italic;
  }
}

// Typing indicator animation
.typing-indicator {
  .typing-dots {
    display: inline-flex;
    align-items: center;
    gap: 3px;

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: typing-bounce 1.4s infinite ease-in-out both;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .chat-layout {
    flex-direction: column;
    height: auto;
  }

  .conversation-list {
    width: 100% !important;
    min-width: 100% !important;
    max-height: 300px;
  }

  .chat-area {
    min-height: 400px;
  }
}
</style>
