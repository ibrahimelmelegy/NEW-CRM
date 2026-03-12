<template lang="pug">
.tickets-kanban-page.p-6
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('support.ticketsBoard') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('support.kanbanSubtitle') }}
    .flex.items-center.gap-3
      NuxtLink(to="/support/tickets")
        el-button
          Icon(name="ph:list" size="16")
          span.ml-1 {{ $t('support.listView') }}
      NuxtLink(to="/support/tickets/create")
        el-button(type="primary" class="!bg-[#7849ff] !border-none")
          Icon(name="ph:plus" size="16")
          span.ml-1 {{ $t('support.newTicket') }}

  //- Kanban Board
  .kanban-board.flex.gap-4.overflow-x-auto.pb-4(v-loading="loading")
    .kanban-column.flex-shrink-0(
      v-for="column in columns"
      :key="column.status"
      style="width: 300px"
    )
      //- Column Header
      .glass-card.p-3.rounded-t-2xl.flex.items-center.justify-between(
        :style="{ borderBottom: '3px solid ' + column.color }"
      )
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ background: column.color }")
          span.text-sm.font-bold(style="color: var(--text-primary)") {{ column.label }}
        el-tag(round size="small" effect="plain") {{ getColumnTickets(column.status).length }}

      //- Cards Container
      .kanban-cards.space-y-3.p-2.rounded-b-2xl.min-h-48(
        style="background: var(--bg-input, rgba(255,255,255,0.02))"
        @dragover.prevent
        @drop="onDrop($event, column.status)"
      )
        .ticket-card.glass-card.p-4.rounded-xl.cursor-grab(
          v-for="ticket in getColumnTickets(column.status)"
          :key="ticket.id"
          draggable="true"
          @dragstart="onDragStart($event, ticket)"
          @click="router.push(`/support/tickets/${ticket.id}`)"
        )
          .flex.items-start.justify-between.mb-2
            span.text-xs.font-mono.font-bold(style="color: #7849ff") {{ ticket.ticketNumber }}
            el-tag(:type="getPriorityType(ticket.priority)" size="small" round effect="dark") {{ ticket.priority }}
          p.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ ticket.subject }}
          p.text-xs.mb-3(v-if="ticket.description" style="color: var(--text-muted)") {{ ticket.description?.substring(0, 80) }}{{ ticket.description?.length > 80 ? '...' : '' }}
          .flex.items-center.justify-between
            .flex.items-center.gap-2
              .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs(
                v-if="ticket.assignee"
                style="background: rgba(120,73,255,0.15); color: #7849ff; font-size: 10px"
              ) {{ ticket.assignee?.name?.charAt(0) || '?' }}
              span.text-xs(v-if="ticket.assignee" style="color: var(--text-muted)") {{ ticket.assignee?.name }}
              span.text-xs(v-else style="color: var(--text-muted); font-style: italic") {{ $t('support.unassigned') }}
            span.text-xs(style="color: var(--text-muted)") {{ formatDate(ticket.createdAt) }}

        //- Empty column placeholder
        .text-center.py-8(v-if="!getColumnTickets(column.status).length && !loading")
          Icon(name="ph:ticket" size="24" :style="{ color: column.color, opacity: 0.4 }")
          p.text-xs.mt-2(style="color: var(--text-muted)") {{ $t('support.noColumnTickets', { status: column.label.toLowerCase() }) }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchTickets } from '@/composables/useSupport';

definePageMeta({ middleware: 'permissions' });

const router = useRouter();
const { t } = useI18n();
const loading = ref(false);
const tickets = ref<Record<string, unknown>[]>([]);
let draggedTicket: unknown = null;

const columns = [
  { status: 'OPEN', label: 'Open', color: '#ef4444' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { status: 'WAITING_CUSTOMER', label: 'Waiting', color: '#f59e0b' },
  { status: 'RESOLVED', label: 'Resolved', color: '#10b981' },
  { status: 'CLOSED', label: 'Closed', color: '#64748b' }
];

function getColumnTickets(status: string) {
  return tickets.value.filter(t => t.status === status);
}

function getPriorityType(priority: string): string {
  if (priority === 'URGENT' || priority === 'CRITICAL') return 'danger';
  if (priority === 'HIGH') return 'warning';
  return 'info';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function onDragStart(event: DragEvent, ticket: unknown) {
  draggedTicket = ticket;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', ticket.id);
  }
}

async function onDrop(event: DragEvent, newStatus: string) {
  event.preventDefault();
  if (!draggedTicket || draggedTicket.status === newStatus) return;

  const oldStatus = draggedTicket.status;
  draggedTicket.status = newStatus;

  try {
    await useApiFetch(`support/tickets/${draggedTicket.id}`, 'PUT', { status: newStatus });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    draggedTicket.status = oldStatus;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }

  draggedTicket = null;
}

async function loadTickets() {
  loading.value = true;
  try {
    const { body, success } = await fetchTickets({ limit: 200 });
    if (success && body) {
      tickets.value = (body as unknown).docs || [];
    }
  } catch {
    /* silent */
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTickets();
});
</script>

<style scoped>
.tickets-kanban-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.ticket-card {
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    border-color 0.15s;
}
.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(120, 73, 255, 0.15);
  border-color: rgba(120, 73, 255, 0.3);
}
.ticket-card:active {
  cursor: grabbing;
}

.kanban-board {
  min-height: calc(100vh - 200px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
