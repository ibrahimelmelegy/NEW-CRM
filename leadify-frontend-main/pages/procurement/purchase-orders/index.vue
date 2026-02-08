<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('procurement.purchaseOrders.title') }}
      .subtitle.text-muted.text-sm.tracking-wide {{ $t('procurement.subtitle') }}
      
    .flex.items-center.gap-x-4
      NuxtLink(to="/procurement/purchase-orders/create")
        el-button(
          size='large', 
          type="primary", 
          :icon="Plus", 
          class="premium-btn !rounded-2xl px-8 glow-purple"
        ) {{ $t('procurement.purchaseOrders.create') }}
  
  .glass-card.p-4(class="!rounded-3xl shadow-glow")
    el-tabs.mb-4(v-model="activeTab" @tab-change="handleTabChange" class="premium-tabs")
        el-tab-pane(label="Active Orders" name="active")
        el-tab-pane(label="Archived" name="archived")
    
    AppTable(
      v-slot="{data}", 
      :columns="table.columns", 
      position="procurement", 
      :pageInfo="response.pagination", 
      :data="table.data", 
      :searchPlaceholder="$t('procurement.purchaseOrders.title')",
      @handleRowClick="handleRowClick",
      class="premium-table"
    )
      .flex.items-center.py-2(@click.stop)
        el-dropdown(class="outline-0", trigger="click")
          span(class="el-dropdown-link")
            .toggle-icon.text-md.hover-scale
              Icon(name="ph:dots-three-outline-vertical-fill", size="20", class="text-purple-400")
          template(#dropdown='')
            el-dropdown-menu(class="glass-dropdown")
              el-dropdown-item
                NuxtLink.flex.items-center.gap-2(:to="`/procurement/purchase-orders/${data?.id}`")
                  Icon.text-md(name="IconEye")
                  p.text-sm View Details
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';

import { useI18n } from 'vue-i18n';

const { hasPermission } = await usePermissions();
const response = await useTableFilter('procurement');
const { t } = useI18n();

const table = reactive({
  columns: [
    { prop: 'poNumber', label: 'PO Number', component: 'Text', sortable: true, type: 'font-bold', width: 180 },
    { prop: 'vendor.name', label: t('procurement.purchaseOrders.vendor'), component: 'Text', sortable: false, type: 'font-default', width: 200 },
    { prop: 'project.name', label: 'Project', component: 'Text', sortable: false, type: 'font-default', width: 200 },
    { prop: 'status', label: t('procurement.purchaseOrders.status'), component: 'Label', sortable: true, type: 'outline', width: 140 },
    { prop: 'totalAmount', label: t('procurement.purchaseOrders.amount'), component: 'Text', sortable: true, type: 'font-bold', width: 150 },
    { prop: 'createdAt', label: t('procurement.purchaseOrders.date'), component: 'Text', sortable: true, type: 'font-default', width: 180 }
  ],
  data: response.formattedData
});

const router = useRouter();
function handleRowClick(val: any) {
  router.push(`/procurement/purchase-orders/${val.id}`);
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
    --el-table-tr-bg-color: transparent;

    th.el-table__cell {
      background: rgba(168, 85, 247, 0.05) !important;
      color: var(--text-secondary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
    }

    td.el-table__cell {
      border-bottom: 1px solid rgba(168, 85, 247, 0.05) !important;
      padding: 16px 0;
    }

    .el-tag {
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      padding: 4px 10px;
      border: none;
      &.el-tag--success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
      }
      &.el-tag--warning {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
      }
      &.el-tag--danger {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
      }
    }
  }
}

.hover-scale {
  transition: transform 0.2s ease;
  cursor: pointer;
  &:hover {
    transform: scale(1.2);
  }
}

.glass-dropdown {
  background: rgba(30, 18, 48, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 12px;
}
</style>
