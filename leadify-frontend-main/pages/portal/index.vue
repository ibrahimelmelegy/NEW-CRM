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
import { useEnhancedPortal } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { portalUser, portalFetch, init, isAuthenticated } = usePortalAuth();
const { dashboard: enhancedDashboard, loading: enhancedLoading, fetchDashboard } = useEnhancedPortal();

const dashboard = ref<{ deals: any[]; tickets: any[] }>({ deals: [], tickets: [] });
const pageLoading = ref(true);

onMounted(async () => {
  init();
  if (!isAuthenticated()) { navigateTo('/portal/login'); return; }

  // Load both dashboards in parallel
  const [basicRes] = await Promise.all([
    portalFetch('dashboard'),
    fetchDashboard()
  ]);

  if (basicRes.success && basicRes.body) {
    dashboard.value = basicRes.body as any;
  }

  pageLoading.value = false;
});

function handleNavigate(section: string) {
  const routes: Record<string, string> = {
    invoices: '/portal/invoices',
    projects: '/portal/projects',
    documents: '/portal/documents',
    signatures: '/portal/signatures'
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
</script>
