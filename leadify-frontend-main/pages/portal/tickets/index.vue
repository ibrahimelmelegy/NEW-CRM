<template lang="pug">
.portal-tickets
  ModuleHeader(
    :title="$t('portal.tickets.title')"
    :subtitle="$t('portal.tickets.subtitle')"
  )
    template(#actions)
      NuxtLink(to="/portal/tickets/create")
        el-button(type="primary" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl")
          Icon(name="ph:plus-bold" size="14" aria-label="Create")
          span.ml-1 {{ $t('portal.tickets.create') }}

  .glass-card.p-6
    el-table(:data="tickets" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('portal.tickets.subject')" prop="subject" min-width="240")
      el-table-column(:label="$t('portal.tickets.priority')" width="120" align="center")
        template(#default="{ row }")
          el-tag(:type="priorityType(row.priority)" size="small" effect="dark") {{ row.priority }}
      el-table-column(:label="$t('portal.tickets.status')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="statusType(row.status)" size="small" effect="dark") {{ row.status }}
      el-table-column(:label="$t('portal.tickets.date')" width="140")
        template(#default="{ row }")
          span {{ new Date(row.createdAt).toLocaleDateString() }}
      el-table-column(:label="$t('common.actions')" width="100" align="center")
        template(#default="{ row }")
          el-button(size="small" @click="viewTicket(row)" class="!rounded-lg")
            Icon(name="ph:chat-circle-text-bold" size="14" aria-label="View")

    .text-center.py-8(v-if="!loading && !tickets.length")
      Icon(name="ph:ticket" size="48" style="color: var(--text-muted)" aria-label="No tickets")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.tickets.noTickets') }}

  //- Ticket Detail + Messages Dialog
  el-dialog(v-model="showDetail" :title="ticketThread?.subject" width="700px" destroy-on-close)
    .ticket-detail-dialog(v-if="ticketThread")
      //- Ticket Info Header
      .flex.items-center.gap-2.mb-4
        el-tag(:type="statusType(ticketThread.status)" size="small" effect="dark") {{ ticketThread.status }}
        el-tag(:type="priorityType(ticketThread.priority)" size="small") {{ ticketThread.priority }}
        span.text-xs.ml-auto(style="color: var(--text-muted)") {{ new Date(ticketThread.createdAt).toLocaleString() }}

      //- Message Thread
      .message-thread.space-y-3.mb-4(ref="messageListRef" style="max-height: 400px; overflow-y: auto")
        .message-loading.text-center.py-4(v-if="threadLoading")
          el-skeleton(:rows="3" animated)

        template(v-else-if="ticketThread.messages?.length")
          .message-item(
            v-for="msg in ticketThread.messages"
            :key="msg.id"
            :class="msg.senderType === 'client' ? 'message-client' : 'message-staff'"
          )
            .message-bubble
              .flex.items-center.justify-between.mb-1
                span.text-xs.font-semibold(:style="msg.senderType === 'staff' ? 'color: #7849ff' : 'color: var(--text-primary)'")
                  | {{ msg.senderType === 'staff' ? $t('portal.tickets.staffResponse') : (msg.portalUser?.name || $t('portal.tickets.you')) }}
                span.text-xs(style="color: var(--text-muted)") {{ formatMessageDate(msg.createdAt) }}
              p.text-sm(style="color: var(--text-primary); white-space: pre-wrap") {{ msg.message }}

        //- Legacy single response (if no messages but has response)
        template(v-else-if="ticketThread.response")
          .p-4.rounded-xl.mb-3(style="background: var(--bg-input)")
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('portal.tickets.description') }}
            p(style="color: var(--text-primary); white-space: pre-wrap") {{ ticketThread.description }}
          .p-4.rounded-xl(style="background: rgba(120,73,255,0.08); border: 1px solid rgba(120,73,255,0.2)")
            p.text-sm.font-medium.mb-1(style="color: #7849ff") {{ $t('portal.tickets.staffResponse') }}
            p(style="color: var(--text-primary); white-space: pre-wrap") {{ ticketThread.response }}

        //- Empty state for messages
        template(v-else)
          .p-4.rounded-xl(style="background: var(--bg-input)")
            p(style="color: var(--text-primary); white-space: pre-wrap") {{ ticketThread.description }}

      //- Reply Box (only if ticket is not CLOSED)
      .reply-box(v-if="ticketThread.status !== 'CLOSED'")
        el-divider
        .flex.gap-2
          el-input(
            v-model="replyMessage"
            type="textarea"
            :rows="2"
            :placeholder="$t('portal.tickets.replyPlaceholder')"
            :disabled="sendingReply"
          )
          el-button(
            type="primary"
            :loading="sendingReply"
            :disabled="!replyMessage.trim()"
            class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl self-end"
            @click="handleSendReply"
          )
            Icon(name="ph:paper-plane-right-bold" size="16" aria-label="Send")

    template(#footer)
      el-button(@click="showDetail = false") {{ $t('common.close') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useEnhancedPortal, type TicketWithMessages } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { t } = useI18n();
const { portalFetch, init, isAuthenticated } = usePortalAuth();
const { fetchTicketWithMessages, sendTicketMessage } = useEnhancedPortal();

const tickets = ref<Record<string, unknown>[]>([]);
const loading = ref(true);
const showDetail = ref(false);
const ticketThread = ref<TicketWithMessages | null>(null);
const threadLoading = ref(false);
const replyMessage = ref('');
const sendingReply = ref(false);
const messageListRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
    return;
  }
  await loadTickets();
});

async function loadTickets() {
  loading.value = true;
  const res = await portalFetch('tickets');
  if (res.success && res.body) {
    tickets.value = res.body as Record<string, unknown>[];
  }
  loading.value = false;
}

async function viewTicket(ticket: Record<string, unknown>) {
  showDetail.value = true;
  threadLoading.value = true;
  replyMessage.value = '';

  const thread = await fetchTicketWithMessages(ticket.id as string);
  if (thread) {
    ticketThread.value = thread;
  } else {
    // Fallback to basic ticket data
    ticketThread.value = {
      ...ticket,
      messages: []
    } as unknown as TicketWithMessages;
  }
  threadLoading.value = false;

  // Scroll to bottom of messages
  await nextTick();
  scrollToBottom();
}

async function handleSendReply() {
  if (!replyMessage.value.trim() || !ticketThread.value) return;

  sendingReply.value = true;
  const result = await sendTicketMessage(ticketThread.value.id, replyMessage.value.trim());

  if (result.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('portal.tickets.replySent') });
    replyMessage.value = '';

    // Reload the thread
    const thread = await fetchTicketWithMessages(ticketThread.value.id);
    if (thread) {
      ticketThread.value = thread;
    }

    await nextTick();
    scrollToBottom();
  } else {
    ElNotification({ type: 'error', title: t('common.error'), message: result.message || t('portal.tickets.replyFailed') });
  }

  sendingReply.value = false;
}

function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);

  if (diffHrs < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  }
  if (diffHrs < 24) {
    return `${Math.floor(diffHrs)}h ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusType(status: string): string {
  const map: Record<string, string> = { OPEN: 'danger', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'info' };
  return map[status] || '';
}

function priorityType(priority: string): string {
  const map: Record<string, string> = { LOW: 'info', MEDIUM: '', HIGH: 'warning', URGENT: 'danger' };
  return map[priority] || '';
}
</script>

<style scoped>
.message-thread {
  padding: 4px;
}

.message-item {
  display: flex;
}

.message-client {
  justify-content: flex-end;
}

.message-staff {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
}

.message-client .message-bubble {
  background: var(--bg-input);
  border-bottom-right-radius: 4px;
}

.message-staff .message-bubble {
  background: rgba(120, 73, 255, 0.08);
  border: 1px solid rgba(120, 73, 255, 0.15);
  border-bottom-left-radius: 4px;
}
</style>
