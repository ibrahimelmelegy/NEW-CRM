<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ title }}
      .subtitle.text-muted.text-sm.tracking-wide {{ subtitle }}
      
    .flex.items-center.gap-x-4
      el-button(
        size='large', 
        @click="openDialog()", 
        type="primary", 
        :icon="Plus", 
        class="premium-btn !rounded-2xl px-8 glow-purple glass-button-press"
      ) {{ btnText }}
  
  .glass-card.p-4.interactive(class="!rounded-3xl shadow-glow")
    AppTable(
      v-slot="{data}", 
      :columns="table.columns", 
      :position="apiPosition", 
      :pageInfo="response.pagination", 
      :data="table.data", 
      :queryParams="queryParams",
      :searchPlaceholder="searchPlaceholder",
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
              el-dropdown-item(@click="openDialog(data)")
                .flex.items-center.gap-2
                  Icon.text-md(name="ph:eye")
                  p.text-sm View
              el-dropdown-item(@click="openDialog(data)")
                .flex.items-center.gap-2
                  Icon.text-md(name="IconEdit" )
                  p.text-sm Edit
              el-dropdown-item(@click="confirmDelete(data)")
                .flex.items-center.gap-2.text-danger
                  Icon.text-md(name="IconDelete")
                  p.text-sm Delete

  ProcurementVendorDialog(
    v-if="dialog.visible",
    v-model="dialog.visible",
    :vendor="dialog.data",
    :type="entityType",
    :title="dialogTitle",
    @success="fetchData"
  )
  
  ActionModel(
    v-model="deletePopup.visible", 
    :loading="deletePopup.loading", 
    :btn-text="'Delete ' + entityLabel + ' Permanent'", 
    :description-one="'Are you sure you want to delete this ' + entityLabel.toLowerCase() + '?'", 
    icon="/images/delete-image.png", 
    @confirm="deleteEntity"
  )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { usePermissions } from '@/composables/usePermissions';
import useTableFilter from '@/composables/useTableFilter';
import { useApiFetch } from '@/composables/useApiFetch';

const router = useRouter();

const entityTypeRouteMap: Record<string, string> = {
  Vendor: 'vendors',
  Distributor: 'distributors',
  LocalSupplier: 'local-suppliers',
  Showroom: 'showrooms'
};

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  btnText: { type: String, default: 'New Item' },
  searchPlaceholder: { type: String, default: 'Search...' },
  apiPosition: { type: String, default: 'vendor' },
  entityType: { type: String, default: 'Vendor' }, // Functionally works as a filter
  entityLabel: { type: String, default: 'Vendor' }, // For UI display (confirmation dialog)
  dialogTitle: { type: String, default: 'New Vendor Form' }
});

const { hasPermission } = await usePermissions();

const queryParams = computed(() => ({ type: props.entityType }));
const response = await useTableFilter(props.apiPosition, queryParams.value);

const table = reactive({
  columns: [
    { prop: 'name', label: 'Name', component: 'Text', sortable: true, type: 'font-bold', width: 180 },
    { prop: 'serviceType', label: 'Service', component: 'Badge', sortable: true, width: 120 },
    { prop: 'brands', label: 'Brands', component: 'Tags', sortable: false, width: 200 },
    { prop: 'firstName', label: 'Contact', component: 'Text', sortable: true, type: 'font-default', width: 130 },
    { prop: 'phone', label: 'Phone', component: 'Text', sortable: true, type: 'font-default', width: 130 },
    { prop: 'email', label: 'Email', component: 'Text', sortable: true, type: 'font-default', width: 180 },
    { prop: 'taxId', label: 'Tax ID', component: 'Text', sortable: true, type: 'font-default', width: 120 },
    { prop: 'createdAt', label: 'Created', component: 'Text', sortable: true, type: 'font-default', width: 150 }
  ],
  data: response.formattedData
});

const dialog = reactive({
  visible: false,
  data: null as unknown
});

const deletePopup = reactive({
  visible: false,
  loading: false,
  data: null as unknown
});

function openDialog(data: unknown = null) {
  dialog.data = data;
  dialog.visible = true;
}

function handleRowClick(val: Record<string, unknown>) {
  const routeSlug = entityTypeRouteMap[props.entityType] || 'vendors';
  router.push(`/procurement/${routeSlug}/${val.id}`);
}

async function fetchData() {
  const newResponse = await useTableFilter(props.apiPosition, queryParams.value);
  table.data = newResponse.formattedData;
}

function confirmDelete(data: unknown) {
  deletePopup.data = data;
  deletePopup.visible = true;
}

async function deleteEntity() {
  deletePopup.loading = true;
  try {
    await useApiFetch(`${props.apiPosition}/${deletePopup.data.id}`, 'DELETE');
    ElNotification({ title: 'Success', type: 'success', message: `${props.entityLabel} deleted successfully` });
    fetchData();
  } catch (error) {
    ElNotification({ title: 'Error', type: 'error', message: `Failed to delete ${props.entityLabel.toLowerCase()}` });
  } finally {
    deletePopup.loading = false;
    deletePopup.visible = false;
  }
}

// Watch for prop changes to re-fetch if type changes (though pages will likely recreate component)
watch(
  () => props.entityType,
  () => {
    fetchData();
  }
);
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

    tr.el-table__row {
      @include glass-table-row-hover;
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
