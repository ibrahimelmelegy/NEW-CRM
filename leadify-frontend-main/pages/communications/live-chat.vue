<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('liveChat.title') || 'Live Chat' }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('liveChat.subtitle') || 'Manage real-time conversations with visitors and clients.' }}
    .flex.items-center.gap-3
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('liveChat.newConversation') || 'New Conversation' }}

  //- Main Chat Layout
  .chat-layout.flex.gap-4(style="height: calc(100vh - 220px)")
    //- Conversation List (Left Panel)
    .conversation-list.glass-card.flex.flex-col(style="width: 380px; min-width: 320px")
      //- Search
      .p-4.border-b(style="border-color: var(--border-default)")
        el-input(
          v-model="searchQuery"
          :placeholder="$t('liveChat.searchConversations') || 'Search conversations...'"
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
            p.text-xs.truncate(style="color: var(--text-muted)") {{ conv.lastMessage || $t('liveChat.noMessages') || 'No messages yet' }}
          .flex.flex-col.items-end.gap-1(v-if="conv.messageCount")
            .w-5.h-5.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
              style="background: #7849ff; color: #fff"
            ) {{ conv.messageCount > 9 ? '9+' : conv.messageCount }}

        //- Empty state
        .text-center.py-12(v-if="!loadingConversations && !filteredConversations.length")
          Icon(name="ph:chat-circle-dots" size="48" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('liveChat.noConversations') || 'No conversations found' }}

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
          .flex.items-center.gap-2
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
            el-button(size="small" type="danger" plain @click="deleteConversation" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

        //- Messages
        .flex-1.overflow-y-auto.p-4.space-y-4(ref="messagesContainer" v-loading="loadingMessages")
          .message-wrapper(
            v-for="msg in messages"
            :key="msg.id"
            :class="msg.senderType === 'STAFF' ? 'flex justify-end' : 'flex justify-start'"
          )
            .message-bubble.max-w-md.p-3.rounded-2xl(
              :class="msg.senderType === 'STAFF' ? 'staff-bubble' : 'client-bubble'"
            )
              p.text-sm(style="color: inherit") {{ msg.content }}
              .flex.items-center.justify-end.gap-2.mt-1
                span.text-xs.opacity-60 {{ msg.senderName || '' }}
                span.text-xs.opacity-60 {{ formatTime(msg.createdAt) }}

          .text-center.py-8(v-if="!loadingMessages && !messages.length")
            Icon(name="ph:chat-circle" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('liveChat.startConversation') || 'Start the conversation' }}

        //- Message Input
        .p-4.border-t(style="border-color: var(--border-default)")
          .flex.gap-3
            el-input(
              v-model="newMessage"
              :placeholder="$t('liveChat.typeMessage') || 'Type a message...'"
              size="large"
              class="!rounded-xl"
              @keyup.enter="sendMessage"
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
          p.text-lg.font-semibold.mt-4(style="color: var(--text-muted)") {{ $t('liveChat.selectConversation') || 'Select a conversation' }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('liveChat.selectHint') || 'Choose a conversation from the list to start chatting' }}

  //- Create Conversation Dialog
  el-dialog(
    v-model="createDialogVisible"
    :title="$t('liveChat.newConversation') || 'New Conversation'"
    width="500px"
    :close-on-click-modal="false"
  )
    el-form(:model="createForm" label-position="top")
      el-form-item(:label="$t('liveChat.visitorName') || 'Visitor Name'" required)
        el-input(v-model="createForm.visitorName" :placeholder="$t('liveChat.visitorName') || 'Visitor Name'")
      el-form-item(:label="$t('liveChat.visitorEmail') || 'Visitor Email'")
        el-input(v-model="createForm.visitorEmail" :placeholder="$t('liveChat.visitorEmail') || 'Visitor Email'" type="email")
      el-form-item(:label="$t('liveChat.channel') || 'Channel'")
        el-select(v-model="createForm.channel" style="width: 100%")
          el-option(label="Web" value="WEB")
          el-option(label="WhatsApp" value="WHATSAPP")
          el-option(label="Facebook" value="FACEBOOK")
          el-option(label="Instagram" value="INSTAGRAM")
          el-option(label="SMS" value="SMS")
      el-form-item(:label="$t('liveChat.subject') || 'Subject'")
        el-input(v-model="createForm.subject" :placeholder="$t('liveChat.subject') || 'Subject'")
    template(#footer)
      el-button(@click="createDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="createConversation") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
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

const createForm = reactive({
  visitorName: '',
  visitorEmail: '',
  channel: 'WEB',
  subject: ''
});

// Status helpers
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

// Filters
const statusFilters = computed(() => {
  const data = conversations.value;
  return [
    { value: 'ALL', label: t('common.all') || 'All', type: '', count: data.length },
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

// Time formatting
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

// API calls
async function loadConversations() {
  loadingConversations.value = true;
  try {
    const res = await useApiFetch('live-chat/conversations');
    if (res?.success) {
      conversations.value = res.body?.docs || res.body || [];
    }
  } catch {
    // silent
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
  } catch {
    // silent
  } finally {
    loadingMessages.value = false;
  }
}

function selectConversation(conv: any) {
  selectedConversation.value = conv;
  messages.value = [];
  loadMessages(conv.id);
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedConversation.value) return;
  sendingMessage.value = true;
  try {
    const payload = {
      conversationId: selectedConversation.value.id,
      content: newMessage.value.trim(),
      senderType: 'STAFF'
    };
    const res = await useApiFetch('live-chat/messages', 'POST', payload);
    if (res?.success) {
      newMessage.value = '';
      await loadMessages(selectedConversation.value.id);
      // Update last message in conversation list
      const conv = conversations.value.find((c: any) => c.id === selectedConversation.value.id);
      if (conv) {
        conv.lastMessage = payload.content;
        conv.updatedAt = new Date().toISOString();
      }
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('liveChat.sendFailed') || 'Failed to send message' });
  } finally {
    sendingMessage.value = false;
  }
}

async function updateConversationStatus() {
  if (!selectedConversation.value) return;
  try {
    await useApiFetch(`live-chat/conversations/${selectedConversation.value.id}`, 'PUT', {
      status: selectedConversation.value.status
    });
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved' });
    await loadConversations();
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'Error' });
  }
}

async function deleteConversation() {
  if (!selectedConversation.value) return;
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this conversation?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    await useApiFetch(`live-chat/conversations/${selectedConversation.value.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted' });
    selectedConversation.value = null;
    messages.value = [];
    await loadConversations();
  } catch {
    // cancelled or error
  }
}

// Create dialog
function openCreateDialog() {
  createForm.visitorName = '';
  createForm.visitorEmail = '';
  createForm.channel = 'WEB';
  createForm.subject = '';
  createDialogVisible.value = true;
}

async function createConversation() {
  if (!createForm.visitorName.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill required fields' });
    return;
  }
  saving.value = true;
  try {
    const res = await useApiFetch('live-chat/conversations', 'POST', { ...createForm });
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved' });
      createDialogVisible.value = false;
      await loadConversations();
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'Error' });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadConversations();
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
