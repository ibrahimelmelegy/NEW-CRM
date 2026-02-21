<template lang="pug">
.portal-deals
  ModuleHeader(
    :title="$t('portal.deals.title')"
    :subtitle="$t('portal.deals.subtitle')"
  )

  .glass-card.p-6
    el-table(:data="deals" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('portal.deals.name')" prop="name" min-width="200")
      el-table-column(:label="$t('portal.deals.status')" width="140" align="center")
        template(#default="{ row }")
          el-tag(:type="statusType(row.status)" size="small" effect="dark") {{ row.status }}
      el-table-column(:label="$t('portal.deals.amount')" width="150" align="right")
        template(#default="{ row }")
          span.font-bold {{ row.totalAmount ? formatCurrency(row.totalAmount) : '—' }}
      el-table-column(:label="$t('portal.deals.date')" width="140")
        template(#default="{ row }")
          span {{ new Date(row.createdAt).toLocaleDateString() }}

    .text-center.py-8(v-if="!loading && !deals.length")
      Icon(name="ph:handshake" size="48" style="color: var(--text-muted)" aria-label="No deals")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.deals.noDeals') }}
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' });

const { portalFetch, init, isAuthenticated } = usePortalAuth();

const deals = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  init();
  if (!isAuthenticated()) { navigateTo('/portal/login'); return; }
  const res = await portalFetch('deals');
  if (res.success && res.body) {
    deals.value = res.body as any[];
  }
  loading.value = false;
});

function statusType(status: string): string {
  const map: Record<string, string> = { WON: 'success', LOST: 'danger', NEGOTIATION: 'warning' };
  return map[status] || 'info';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>
