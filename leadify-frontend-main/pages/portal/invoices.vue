<template lang="pug">
.portal-invoices
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.invoices.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('portal.invoices.subtitle') }}

  .glass-card.p-6
    el-table(:data="invoices" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('portal.invoices.invoiceNo')" prop="invoiceNumber" width="160")
      el-table-column(:label="$t('portal.invoices.deal')" min-width="200")
        template(#default="{ row }")
          span {{ row.deal?.name || '—' }}
      el-table-column(:label="$t('portal.invoices.amount')" width="150" align="right")
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.amount) }}
      el-table-column(:label="$t('portal.invoices.date')" width="140")
        template(#default="{ row }")
          span {{ row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '—' }}
      el-table-column(:label="$t('portal.invoices.status')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="row.collected ? 'success' : 'warning'" size="small" effect="dark") {{ row.collected ? $t('portal.invoices.paid') : $t('portal.invoices.pending') }}

    .text-center.py-8(v-if="!loading && !invoices.length")
      Icon(name="ph:receipt" size="48" style="color: var(--text-muted)" aria-label="No invoices")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.invoices.noInvoices') }}
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' });

const { portalFetch, init, isAuthenticated } = usePortalAuth();

const invoices = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  init();
  if (!isAuthenticated()) { navigateTo('/portal/login'); return; }
  const res = await portalFetch('invoices');
  if (res.success && res.body) {
    invoices.value = res.body as any[];
  }
  loading.value = false;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>
