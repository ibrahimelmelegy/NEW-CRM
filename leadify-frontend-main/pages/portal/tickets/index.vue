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
            Icon(name="ph:eye-bold" size="14" aria-label="View")

    .text-center.py-8(v-if="!loading && !tickets.length")
      Icon(name="ph:ticket" size="48" style="color: var(--text-muted)" aria-label="No tickets")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.tickets.noTickets') }}

  //- Ticket Detail Dialog
  el-dialog(v-model="showDetail" :title="selectedTicket?.subject" width="600px")
    .space-y-4(v-if="selectedTicket")
      .flex.gap-2
        el-tag(:type="statusType(selectedTicket.status)" size="small" effect="dark") {{ selectedTicket.status }}
        el-tag(:type="priorityType(selectedTicket.priority)" size="small") {{ selectedTicket.priority }}
      .p-4.rounded-xl(style="background: var(--bg-input)")
        p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('portal.tickets.description') }}
        p(style="color: var(--text-primary); white-space: pre-wrap") {{ selectedTicket.description }}
      .p-4.rounded-xl(v-if="selectedTicket.response" style="background: rgba(120,73,255,0.08); border: 1px solid rgba(120,73,255,0.2)")
        p.text-sm.font-medium.mb-1(style="color: #7849ff") {{ $t('portal.tickets.staffResponse') }}
        p(style="color: var(--text-primary); white-space: pre-wrap") {{ selectedTicket.response }}
        p.text-xs.mt-2(style="color: var(--text-muted)") {{ selectedTicket.respondedAt ? new Date(selectedTicket.respondedAt).toLocaleString() : '' }}
    template(#footer)
      el-button(@click="showDetail = false") {{ $t('common.close') }}
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' });

const { portalFetch, init, isAuthenticated } = usePortalAuth();

const tickets = ref<any[]>([]);
const loading = ref(true);
const showDetail = ref(false);
const selectedTicket = ref<any>(null);

onMounted(async () => {
  init();
  if (!isAuthenticated()) { navigateTo('/portal/login'); return; }
  await loadTickets();
});

async function loadTickets() {
  loading.value = true;
  const res = await portalFetch('tickets');
  if (res.success && res.body) {
    tickets.value = res.body as any[];
  }
  loading.value = false;
}

function viewTicket(ticket: any) {
  selectedTicket.value = ticket;
  showDetail.value = true;
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
