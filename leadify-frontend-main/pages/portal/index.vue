<template lang="pug">
.portal-dashboard
  //- Loading State
  .glass-card.p-12.text-center(v-if="pageLoading")
    el-skeleton(:rows="6" animated)

  template(v-else)
    //- Enhanced Dashboard
    PortalPortalDashboard(
      :dashboard="enhancedDashboard"
      :client-name="portalUser?.name || ''"
      :loading="enhancedLoading"
      @navigate="handleNavigate"
      @sign="handleSign"
    )

    //- Summary Stats Bar (Invoices, Tickets, Projects, Deals)
    .grid.grid-cols-1.gap-4.mt-6(class="sm:grid-cols-2 lg:grid-cols-4" v-if="stats")
      .glass-card.p-5.cursor-pointer.stat-card(@click="handleNavigate('invoices')")
        .flex.items-center.gap-3
          .w-11.h-11.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.12)")
            Icon(name="ph:currency-circle-dollar-bold" size="22" class="text-red-500" aria-label="Invoices")
          div
            p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.stats.outstandingInvoices') }}
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.outstandingInvoices?.count || 0 }}
            p.text-xs.font-semibold(v-if="stats.outstandingInvoices?.total" style="color: #ef4444") {{ formatCurrency(stats.outstandingInvoices.total) }}

      .glass-card.p-5.cursor-pointer.stat-card(@click="handleNavigate('tickets')")
        .flex.items-center.gap-3
          .w-11.h-11.rounded-xl.flex.items-center.justify-center(style="background: rgba(249, 115, 22, 0.12)")
            Icon(name="ph:ticket-bold" size="22" class="text-orange-500" aria-label="Tickets")
          div
            p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.stats.openTickets') }}
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.openTickets || 0 }}

      .glass-card.p-5.cursor-pointer.stat-card(@click="handleNavigate('projects')")
        .flex.items-center.gap-3
          .w-11.h-11.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.12)")
            Icon(name="ph:kanban-bold" size="22" class="text-[#7849ff]" aria-label="Projects")
          div
            p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.stats.activeProjects') }}
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.activeProjects || 0 }}

      .glass-card.p-5.cursor-pointer.stat-card(@click="handleNavigate('deals')")
        .flex.items-center.gap-3
          .w-11.h-11.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.12)")
            Icon(name="ph:handshake-bold" size="22" class="text-green-500" aria-label="Deals")
          div
            p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.stats.totalDeals') }}
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.totalDeals || 0 }}

    //- Original Dashboard Content (deals + tickets)
    .mt-8
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
import { useEnhancedPortal, type PortalDashboardStats } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { portalUser, portalFetch, init, isAuthenticated } = usePortalAuth();
const { dashboard: enhancedDashboard, dashboardStats, loading: enhancedLoading, fetchDashboard, fetchDashboardStats } = useEnhancedPortal();

const dashboard = ref<{ deals: Record<string, unknown>[]; tickets: Record<string, unknown>[] }>({ deals: [], tickets: [] });
const stats = ref<PortalDashboardStats | null>(null);
const pageLoading = ref(true);

onMounted(async () => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
    return;
  }

  // Load all dashboards in parallel
  const [basicRes] = await Promise.all([portalFetch('dashboard'), fetchDashboard(), fetchDashboardStats()]);

  if (basicRes.success && basicRes.body) {
    dashboard.value = basicRes.body as { deals: Record<string, unknown>[]; tickets: Record<string, unknown>[] };
  }

  stats.value = dashboardStats.value;
  pageLoading.value = false;
});

function handleNavigate(section: string) {
  const routes: Record<string, string> = {
    invoices: '/portal/invoices',
    projects: '/portal/projects',
    documents: '/portal/documents',
    signatures: '/portal/signatures',
    tickets: '/portal/tickets',
    deals: '/portal/deals'
  };
  if (routes[section]) {
    navigateTo(routes[section]);
  }
}

function handleSign(documentId: string) {
  navigateTo('/portal/signatures');
}

function dealStatusType(status: string): string {
  const map: Record<string, string> = { WON: 'success', LOST: 'danger', NEGOTIATION: 'warning' };
  return map[status] || 'info';
}

function ticketStatusType(status: string): string {
  const map: Record<string, string> = { OPEN: 'danger', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'info' };
  return map[status] || '';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>

<style scoped>
.stat-card {
  transition: all 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
</style>
