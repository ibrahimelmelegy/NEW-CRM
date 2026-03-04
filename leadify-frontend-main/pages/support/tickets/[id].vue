<template lang="pug">
div(v-loading="loading")
  //- Header
  .flex.items-center.justify-between.mb-6
    .flex.items-center.gap-4
      el-button(text @click="router.back()")
        el-icon
          ArrowLeft
        span {{ $t('common.back') }}
      .flex.flex-col
        .flex.items-center.gap-3
          span.font-mono.text-lg.font-bold(style="color: var(--el-color-primary)") {{ ticket?.ticketNumber }}
          el-tag(:color="statusOption.color" effect="dark" round size="small") {{ statusOption.label }}
          el-tag(:color="priorityOption.color" effect="dark" round size="small") {{ priorityOption.label }}
        h1.text-xl.font-bold.mt-1 {{ ticket?.subject }}
    .flex.items-center.gap-2
      el-button(v-if="ticket?.status !== 'RESOLVED' && ticket?.status !== 'CLOSED'" type="success" @click="handleResolve") {{ $t('support.resolve') }}
      el-button(v-if="ticket?.status !== 'CLOSED'" type="info" @click="handleClose") {{ $t('support.close') }}

  //- Two-column layout
  .grid.gap-6(class="grid-cols-1 lg:grid-cols-10")
    //- Left column: Conversation (70%)
    .glass-card.p-6(class="lg:col-span-7")
      h3.text-lg.font-bold.mb-4 {{ $t('support.conversation') }}

      //- Message Thread
      SupportTicketConversation(:messages="messages")

      //- Canned Response Quick-Insert
      .mt-4.flex.items-center.gap-2
        el-select(
          v-model="selectedCannedResponse"
          :placeholder="$t('support.insertCannedPlaceholder')"
          clearable
          filterable
          class="flex-1"
          size="large"
          @change="handleCannedInsert"
        )
          el-option(
            v-for="cr in cannedResponses"
            :key="cr.id"
            :value="cr.id"
            :label="cr.title"
          )
            .flex.flex-col
              span.font-semibold {{ cr.title }}
              span.text-xs(style="color: var(--text-muted)") {{ cr.body.substring(0, 60) }}...

      //- Message Input
      .mt-4
        .flex.items-center.gap-3.mb-2
          el-switch(v-model="isInternalNote" :active-text="$t('support.internalNote')" :inactive-text="$t('support.publicReply')")
          .text-xs(v-if="isInternalNote" style="color: #e6a23c") {{ $t('support.internalNoteWarning') }}
        el-input(
          v-model="newMessage"
          type="textarea"
          :rows="4"
          :placeholder="isInternalNote ? $t('support.writeInternalNote') : $t('support.typeReply')"
          size="large"
        )
        .flex.justify-end.mt-3
          el-button(type="primary" @click="handleSendMessage" :loading="sending" :disabled="!newMessage.trim()")
            span {{ isInternalNote ? $t('support.addNote') : $t('support.sendReply') }}

    //- Right column: Sidebar (30%)
    .flex.flex-col.gap-4(class="lg:col-span-3")
      //- Ticket Info
      .glass-card.p-6
        h3.text-lg.font-bold.mb-4 {{ $t('support.ticketInfo') }}

        .space-y-4
          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.assignedTo') }}
            .flex.items-center.gap-2.mt-1
              span(v-if="ticket?.assignee") {{ ticket.assignee.name }}
              span.text-gray-400(v-else) {{ $t('support.unassigned') }}
            el-button.mt-2(size="small" text type="primary" @click="showAssignDialog = true") {{ $t('support.changeAssignee') }}

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.assignedTo') }}
            span.mt-1(v-if="ticket?.client") {{ ticket.client.clientName }}
            span.mt-1.text-gray-400(v-else) --

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.category') }}
            span.mt-1(v-if="ticket?.category") {{ ticket.category.name }}
            span.mt-1.text-gray-400(v-else) --

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.source') }}
            span.mt-1 {{ ticket?.source || '--' }}

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.slaDeadline') }}
            template(v-if="ticket?.slaDeadline")
              SupportSLAIndicator(:deadline="ticket.slaDeadline" :resolvedAt="ticket.resolvedAt")
            span.mt-1.text-gray-400(v-else) {{ $t('support.noSla') }}

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.ticketCreated') }}
            span.mt-1 {{ formatDate(ticket?.createdAt) }}

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.firstResponse') }}
            span.mt-1 {{ ticket?.firstResponseAt ? formatDate(ticket.firstResponseAt) : '--' }}

          .flex.flex-col
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.resolvedAt') }}
            span.mt-1 {{ ticket?.resolvedAt ? formatDate(ticket.resolvedAt) : '--' }}

          .flex.flex-col(v-if="ticket?.tags && ticket.tags.length")
            span.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('support.tags') }}
            .flex.flex-wrap.gap-1.mt-1
              el-tag(v-for="tag in ticket.tags" :key="tag" size="small" round) {{ tag }}

      //- CSAT Rating
      .glass-card.p-6(v-if="ticket?.status === 'RESOLVED' || ticket?.status === 'CLOSED'")
        h3.text-lg.font-bold.mb-4 {{ $t('support.customerSatisfactionTitle') }}
        SupportCSATWidget(:rating="ticket?.csatRating" @rate="handleCSATSubmit")
        p.text-sm.mt-2(v-if="ticket?.csatComment" style="color: var(--text-muted)") "{{ ticket.csatComment }}"

  //- Assign Dialog
  el-dialog(v-model="showAssignDialog" :title="$t('support.assignTicket')" width="400px")
    el-select(v-model="assignUserId" filterable :placeholder="$t('support.selectAgent')" class="w-full" size="large")
      el-option(v-for="u in agents" :key="u.id" :value="u.id" :label="u.name")
    template(#footer)
      el-button(@click="showAssignDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleAssign" :loading="assigning") {{ $t('support.assign') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import {
  fetchTicketById,
  addTicketMessage,
  assignTicket,
  resolveTicket,
  closeTicket,
  submitCSAT,
  fetchCannedResponses,
  getStatusOption,
  getPriorityOption
} from '@/composables/useSupport';
import type { Ticket, TicketMessage, CannedResponse } from '@/composables/useSupport';
import { useApiFetch } from '@/composables/useApiFetch';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const ticketId = computed(() => route.params.id as string);

const loading = ref(false);
const sending = ref(false);
const assigning = ref(false);
const ticket = ref<Ticket | null>(null);
const messages = ref<TicketMessage[]>([]);
const newMessage = ref('');
const isInternalNote = ref(false);
const cannedResponses = ref<CannedResponse[]>([]);
const selectedCannedResponse = ref('');
const showAssignDialog = ref(false);
const assignUserId = ref('');
const agents = ref<Array<{ id: string; name: string }>>([]);

const statusOption = computed(() => getStatusOption(ticket.value?.status || 'OPEN'));
const priorityOption = computed(() => getPriorityOption(ticket.value?.priority || 'MEDIUM'));

async function loadTicket() {
  loading.value = true;
  try {
    const { body, success }: any = await fetchTicketById(ticketId.value);
    if (success && body) {
      ticket.value = body;
      messages.value = body.messages || [];
    }
  } finally {
    loading.value = false;
  }
}

async function loadCannedResponses() {
  const { body, success } = await fetchCannedResponses();
  if (success && body) {
    cannedResponses.value = Array.isArray(body) ? body : [];
  }
}

async function loadAgents() {
  const { body, success } = await useApiFetch('users');
  if (success && body) {
    agents.value = Array.isArray(body) ? body : (body as any)?.docs || [];
  }
}

function handleCannedInsert(crId: string) {
  if (!crId) return;
  const cr = cannedResponses.value.find(c => c.id === crId);
  if (cr) {
    newMessage.value = cr.body;
    selectedCannedResponse.value = '';
  }
}

async function handleSendMessage() {
  if (!newMessage.value.trim()) return;
  sending.value = true;
  try {
    const { success } = await addTicketMessage(ticketId.value, {
      body: newMessage.value,
      senderType: 'AGENT',
      isInternal: isInternalNote.value
    });
    if (success) {
      newMessage.value = '';
      isInternalNote.value = false;
      ElNotification({ type: 'success', title: t('common.success'), message: t('support.msgSent') });
      await loadTicket();
    }
  } finally {
    sending.value = false;
  }
}

async function handleAssign() {
  if (!assignUserId.value) return;
  assigning.value = true;
  try {
    const { success } = await assignTicket(ticketId.value, assignUserId.value);
    if (success) {
      showAssignDialog.value = false;
      ElNotification({ type: 'success', title: t('common.success'), message: t('support.ticketAssignedMsg') });
      await loadTicket();
    }
  } finally {
    assigning.value = false;
  }
}

async function handleResolve() {
  const { success } = await resolveTicket(ticketId.value);
  if (success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('support.ticketResolvedMsg') });
    await loadTicket();
  }
}

async function handleClose() {
  const { success } = await closeTicket(ticketId.value);
  if (success) {
    ElNotification({ type: 'info', title: t('common.info'), message: t('support.ticketClosedMsg') });
    await loadTicket();
  }
}

async function handleCSATSubmit(rating: number) {
  const { success } = await submitCSAT(ticketId.value, rating);
  if (success) {
    ElNotification({ type: 'success', title: t('support.csatThankYou'), message: t('support.csatRatingSubmitted') });
    await loadTicket();
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(async () => {
  await Promise.all([loadTicket(), loadCannedResponses(), loadAgents()]);
});
</script>
