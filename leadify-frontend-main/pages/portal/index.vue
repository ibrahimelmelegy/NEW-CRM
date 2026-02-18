<template lang="pug">
.portal-dashboard
  .mb-8
    h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.dashboard.welcome', { name: portalUser?.name || '' }) }}
    p.text-sm(style="color: var(--text-muted)") {{ $t('portal.dashboard.subtitle') }}

  //- Summary Cards
  .grid.grid-cols-1.gap-4.mb-8(class="md:grid-cols-3")
    .glass-card.p-5
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120,73,255,0.15)")
          Icon(name="ph:handshake-bold" size="20" class="text-[#7849ff]" aria-label="Deals")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.dashboard.activeDeals') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ dashboard.deals?.length || 0 }}
    .glass-card.p-5
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34,197,94,0.15)")
          Icon(name="ph:ticket-bold" size="20" class="text-green-500" aria-label="Tickets")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.dashboard.openTickets') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ openTicketCount }}
    .glass-card.p-5
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(249,115,22,0.15)")
          Icon(name="ph:buildings-bold" size="20" class="text-orange-500" aria-label="Company")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.dashboard.company') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ portalUser?.client?.clientName || '—' }}

  .grid.grid-cols-1.gap-6(class="lg:grid-cols-2")
    //- Recent Deals
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        h3.font-bold(style="color: var(--text-primary)") {{ $t('portal.dashboard.recentDeals') }}
        NuxtLink.text-xs.font-medium(to="/portal/deals" style="color: #7849ff") {{ $t('portal.dashboard.viewAll') }}
      .space-y-3(v-if="dashboard.deals?.length")
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="deal in dashboard.deals"
          :key="deal.id"
          style="background: var(--bg-input)"
        )
          div
            p.font-medium.text-sm(style="color: var(--text-primary)") {{ deal.name }}
            p.text-xs(style="color: var(--text-muted)") {{ new Date(deal.createdAt).toLocaleDateString() }}
          el-tag(:type="dealStatusType(deal.status)" size="small" effect="dark") {{ deal.status }}
      .text-center.py-8(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('portal.dashboard.noDeals') }}

    //- Recent Tickets
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        h3.font-bold(style="color: var(--text-primary)") {{ $t('portal.dashboard.recentTickets') }}
        NuxtLink.text-xs.font-medium(to="/portal/tickets" style="color: #7849ff") {{ $t('portal.dashboard.viewAll') }}
      .space-y-3(v-if="dashboard.tickets?.length")
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="ticket in dashboard.tickets"
          :key="ticket.id"
          style="background: var(--bg-input)"
        )
          div
            p.font-medium.text-sm(style="color: var(--text-primary)") {{ ticket.subject }}
            p.text-xs(style="color: var(--text-muted)") {{ new Date(ticket.createdAt).toLocaleDateString() }}
          el-tag(:type="ticketStatusType(ticket.status)" size="small" effect="dark") {{ ticket.status }}
      .text-center.py-8(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('portal.dashboard.noTickets') }}
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' });

const { portalUser, portalFetch, init, isAuthenticated } = usePortalAuth();

const dashboard = ref<{ deals: any[]; tickets: any[] }>({ deals: [], tickets: [] });

const openTicketCount = computed(() =>
  dashboard.value.tickets?.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length || 0
);

onMounted(async () => {
  init();
  if (!isAuthenticated()) { navigateTo('/portal/login'); return; }
  const res = await portalFetch('dashboard');
  if (res.success && res.body) {
    dashboard.value = res.body as any;
  }
});

function dealStatusType(status: string): string {
  const map: Record<string, string> = { WON: 'success', LOST: 'danger', NEGOTIATION: 'warning' };
  return map[status] || 'info';
}

function ticketStatusType(status: string): string {
  const map: Record<string, string> = { OPEN: 'danger', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'info' };
  return map[status] || '';
}
</script>
