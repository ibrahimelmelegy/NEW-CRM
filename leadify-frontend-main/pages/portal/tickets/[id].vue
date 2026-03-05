<template lang="pug">
.portal-ticket-detail
  //- Back button + Header
  .flex.items-center.gap-3.mb-6
    el-button(text @click="navigateTo('/portal/tickets')" class="!rounded-xl")
      Icon(name="ph:arrow-left-bold" size="16" aria-label="Back")
    div
      h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ ticket?.subject || $t('portal.tickets.title') }}
      .flex.items-center.gap-2.mt-1(v-if="ticket")
        el-tag(:type="statusType(ticket.status)" size="small" effect="dark") {{ ticket.status }}
        el-tag(:type="priorityType(ticket.priority)" size="small") {{ ticket.priority }}
        span.text-xs(style="color: var(--text-muted)") {{ $t('portal.tickets.date') }}: {{ new Date(ticket.createdAt).toLocaleString() }}

  //- Loading
  .glass-card.p-12.text-center(v-if="loading")
    el-skeleton(:rows="6" animated)

  template(v-else-if="ticket")
    //- Messages Thread
    .glass-card.p-6
      h3.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('portal.tickets.conversation') }}

      .message-thread.space-y-3(ref="messageListRef" style="max-height: 500px; overflow-y: auto")
        template(v-if="ticket.messages?.length")
          .message-item(
            v-for="msg in ticket.messages"
            :key="msg.id"
            :class="msg.senderType === 'client' ? 'message-client' : 'message-staff'"
          )
            .message-bubble
              .flex.items-center.justify-between.mb-1
                span.text-xs.font-semibold(:style="msg.senderType === 'staff' ? 'color: #7849ff' : 'color: var(--text-primary)'")
                  | {{ msg.senderType === 'staff' ? $t('portal.tickets.staffResponse') : (msg.portalUser?.name || $t('portal.tickets.you')) }}
                span.text-xs(style="color: var(--text-muted)") {{ formatDate(msg.createdAt) }}
              p.text-sm(style="color: var(--text-primary); white-space: pre-wrap") {{ msg.message }}

        //- Legacy fallback
        template(v-else)
          .p-4.rounded-xl(style="background: var(--bg-input)")
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('portal.tickets.description') }}
            p(style="color: var(--text-primary); white-space: pre-wrap") {{ ticket.description }}
          .p-4.rounded-xl.mt-3(v-if="ticket.response" style="background: rgba(120,73,255,0.08); border: 1px solid rgba(120,73,255,0.2)")
            p.text-sm.font-medium.mb-1(style="color: #7849ff") {{ $t('portal.tickets.staffResponse') }}
            p(style="color: var(--text-primary); white-space: pre-wrap") {{ ticket.response }}

    //- Reply Section
    .glass-card.p-6.mt-4(v-if="ticket.status !== 'CLOSED'")
      h3.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('portal.tickets.sendReply') }}
      .flex.flex-col.gap-3
        el-input(
          v-model="replyMessage"
          type="textarea"
          :rows="3"
          :placeholder="$t('portal.tickets.replyPlaceholder')"
          :disabled="sendingReply"
        )
        .flex.justify-end
          el-button(
            type="primary"
            :loading="sendingReply"
            :disabled="!replyMessage.trim()"
            class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl"
            @click="handleSendReply"
          )
            Icon(name="ph:paper-plane-right-bold" size="16" aria-label="Send")
            span.ml-2 {{ $t('portal.tickets.sendMessage') }}

    //- Closed notice
    .glass-card.p-4.mt-4.text-center(v-else)
      p.text-sm(style="color: var(--text-muted)") {{ $t('portal.tickets.ticketClosed') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useEnhancedPortal, type TicketWithMessages } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { t } = useI18n();
const route = useRoute();
const { init, isAuthenticated } = usePortalAuth();
const { fetchTicketWithMessages, sendTicketMessage } = useEnhancedPortal();

const ticket = ref<TicketWithMessages | null>(null);
const loading = ref(true);
const replyMessage = ref('');
const sendingReply = ref(false);
const messageListRef = ref<HTMLElement | null>(null);

const ticketId = computed(() => route.params.id as string);

onMounted(async () => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
    return;
  }
  await loadTicket();
});

async function loadTicket() {
  loading.value = true;
  const thread = await fetchTicketWithMessages(ticketId.value);
  if (thread) {
    ticket.value = thread;
  }
  loading.value = false;
  await nextTick();
  scrollToBottom();
}

async function handleSendReply() {
  if (!replyMessage.value.trim()) return;

  sendingReply.value = true;
  const result = await sendTicketMessage(ticketId.value, replyMessage.value.trim());

  if (result.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('portal.tickets.replySent') });
    replyMessage.value = '';
    await loadTicket();
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
