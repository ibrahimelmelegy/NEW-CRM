<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('procurement.rfq.title') }}
      .subtitle.text-muted.text-sm.tracking-wide {{ $t('procurement.rfq.subtitle') }}

    .flex.items-center.gap-x-4
      ExportButton(:data="rfqs" :columns="exportColumns" :filename="'rfq-export'" :title="$t('procurement.rfq.title')")
      el-button(
        size='large',
        @click="router.push('/procurement/rfq/create')",
        type="primary",
        :icon="Plus",
        class="premium-btn !rounded-2xl px-8 glow-purple"
      ) {{ $t('procurement.rfq.newRfq') }}

  //- List
  .glass-card.p-4(class="!rounded-3xl shadow-glow")
    el-table(:data="rfqs" style="width: 100%" class="premium-table")
        el-table-column(prop="rfqNumber" :label="$t('procurement.rfq.rfqNumber')" width="180")
          template(#default="{row}")
             span.font-bold.text-white {{ row.rfqNumber }}
        el-table-column(prop="title" :label="$t('procurement.rfq.titleCol')" width="250")
        el-table-column(prop="project" :label="$t('procurement.rfq.project')")
             template(#default="{row}")
                span.text-purple-300 {{ row.project?.name || '---' }}
        el-table-column(prop="status" :label="$t('procurement.rfq.status')" width="150")
           template(#default="{row}")
              el-tag(:type="getStatusType(row.status)" effect="dark" class="!border-none") {{ row.status }}
        el-table-column(prop="deadLine" :label="$t('procurement.rfq.deadline')" width="150")
            template(#default="{row}")
                span.text-muted {{ new Date(row.deadLine).toLocaleDateString() }}
        el-table-column(width="100")
            template(#default="{row}")
                el-button(size="small" circle :icon="View" class="premium-btn-outline" @click="openRFQ(row.id)")

</template>

<script setup lang="ts">
import { Plus, View } from '@element-plus/icons-vue';
import logger from '~/utils/logger';

const router = useRouter();
const { t } = useI18n();
const rfqs = ref([]);

// Export columns
const exportColumns = computed(() => [
  { prop: 'rfqNumber', label: t('procurement.rfq.rfqNumber') },
  { prop: 'title', label: t('procurement.rfq.titleCol') },
  { prop: 'status', label: t('procurement.rfq.status') },
  { prop: 'deadLine', label: t('procurement.rfq.deadline') }
]);

const getStatusType = (status: string) => {
  const map: unknown = {
    Draft: 'info',
    Sent: 'warning',
    'Partially Received': 'primary',
    Completed: 'success',
    'Converted to PO': 'success',
    Archived: 'info'
  };
  return map[status] || 'info';
};

onMounted(async () => {
  try {
    const res = await useApiFetch('rfq'); // Fetch from the new endpoint
    rfqs.value = res?.body?.docs || [];
  } catch (e) {
    logger.error('Failed to fetch RFQs', e);
  }
});

function openRFQ(id: string) {
  // Navigate to details/comparison page (to be built)
  // router.push(`/procurement/rfq/${id}`);
  ElNotification({ title: t('common.comingSoon'), message: t('procurement.rfq.comparisonNext'), type: 'info' });
}
</script>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.premium-table {
  :deep(.el-table) {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
    th.el-table__cell {
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.03) !important;
    }
  }
}
</style>
