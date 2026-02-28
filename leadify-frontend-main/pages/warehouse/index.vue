<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('warehouse.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('warehouse.subtitle') }}
    .flex.items-center.gap-3
      el-button(
        size="large"
        @click="activeTab === 'transfers' ? exportTransfersCSV() : exportWarehousesCSV()"
        class="!rounded-xl"
      )
        Icon(name="ph:download-bold" size="16" class="mr-1")
        | {{ $t('common.export') }}
      el-button(
        type="primary"
        size="large"
        @click="openCreateDialog"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ createButtonLabel }}

  //- KPI Dashboard Cards
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:warehouse-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ kpiData.totalWarehouses }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warehouse.totalWarehouses') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:package-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ kpiData.totalStockItems }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warehouse.totalStockItems') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.15)")
          Icon(name="ph:warning-bold" size="20" style="color: #ef4444")
        div
          p.text-2xl.font-bold(style="color: #ef4444") {{ kpiData.lowStockAlerts }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warehouse.lowStockAlerts') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:arrows-left-right-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: #f59e0b") {{ kpiData.pendingTransfers }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warehouse.pendingTransfers') }}

  //- Low Stock Alerts Panel
  .glass-card.p-5.rounded-2xl.mb-6(v-if="lowStockItems.length")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:warning-octagon-bold" size="20" class="mr-2" style="color: #ef4444")
        | {{ $t('warehouse.lowStockAlertsPanel') }}
      el-tag(type="danger" size="small" effect="dark" round) {{ lowStockItems.length }} {{ $t('warehouse.items') }}
    .space-y-2
      .flex.items-center.justify-between.p-3.rounded-xl(
        v-for="(item, idx) in lowStockItems"
        :key="idx"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
      )
        .flex.items-center.gap-3
          .w-9.h-9.rounded-lg.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.1)")
            Icon(name="ph:cube-bold" size="16" style="color: #ef4444")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ item.productName || item.name || '--' }}
            p.text-xs(style="color: var(--text-muted)") {{ item.warehouseName || item.warehouse || '--' }}
        .text-end
          p.text-sm.font-bold(:style="{ color: (item.currentQuantity || item.quantity || 0) <= 5 ? '#ef4444' : '#f59e0b' }") {{ item.currentQuantity || item.quantity || 0 }} {{ $t('warehouse.units') }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warehouse.threshold') }}: {{ item.threshold || 10 }}

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card" class="warehouse-tabs")
    //- ========== WAREHOUSES TAB ==========
    el-tab-pane(:label="$t('warehouse.warehouses')" name="warehouses")
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="warehouseSearch"
          :placeholder="$t('warehouse.searchWarehouses')"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

      //- Bulk Actions Bar
      .flex.items-center.gap-2.mb-3(v-if="selectedWarehouses.length")
        span.text-sm.font-medium(style="color: var(--text-primary)") {{ selectedWarehouses.length }} {{ $t('common.selected') }}
        el-button(size="small" type="danger" @click="bulkDeleteWarehouses" class="!rounded-xl")
          Icon(name="ph:trash-bold" size="14")
          span.ml-1 {{ $t('common.delete') }}
        el-button(size="small" @click="bulkChangeWarehouseStatus('INACTIVE')" class="!rounded-xl")
          Icon(name="ph:pause-bold" size="14")
          span.ml-1 Deactivate
        el-button(size="small" @click="exportWarehousesCSV" class="!rounded-xl")
          Icon(name="ph:download-bold" size="14")
          span.ml-1 {{ $t('common.export') }}

      el-table(:data="filteredWarehouses" v-loading="loadingWarehouses" stripe style="width: 100%" @selection-change="handleWarehouseSelectionChange")
        el-table-column(type="selection" width="40")
        el-table-column(:label="$t('warehouse.name')" prop="name" min-width="180" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:warehouse-bold" size="18" style="color: #7849ff")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name || '--' }}
        el-table-column(:label="$t('warehouse.location')" prop="location" width="200")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.location || '--' }}
        el-table-column(:label="$t('warehouse.manager')" prop="manager" width="160")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.managerName || row.manager || '--' }}
        el-table-column(:label="$t('warehouse.capacity')" width="140" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.capacity || 0 }}
        el-table-column(:label="$t('warehouse.occupancy')" width="180" align="center")
          template(#default="{ row }")
            .flex.items-center.gap-2
              el-progress(
                :percentage="row.capacity ? Math.round((row.currentOccupancy / row.capacity) * 100) : 0"
                :stroke-width="8"
                :color="getOccupancyColor(row)"
                style="width: 100px"
              )
              span.text-xs(style="color: var(--text-muted)") {{ row.currentOccupancy || 0 }}/{{ row.capacity || 0 }}
        el-table-column(:label="$t('warehouse.status')" width="130" align="center")
          template(#default="{ row }")
            el-tag(
              :type="row.status === 'ACTIVE' ? 'success' : row.status === 'MAINTENANCE' ? 'warning' : 'info'"
              size="small"
              effect="dark"
              round
            ) {{ row.status || 'ACTIVE' }}
        el-table-column(:label="$t('common.actions')" width="120" align="center" fixed="right")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(size="small" @click="openEditWarehouse(row)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
              el-button(size="small" type="danger" plain @click="deleteWarehouse(row)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-if="!filteredWarehouses.length && !loadingWarehouses")
        Icon(name="ph:warehouse" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('warehouse.noWarehouses') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="warehousesPagination.page"
          :page-size="warehousesPagination.limit"
          :total="warehousesPagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { warehousesPagination.page = p; loadWarehouses() }"
        )

    //- ========== ZONES TAB ==========
    el-tab-pane(:label="$t('warehouse.zones')" name="zones")
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="zoneSearch"
          :placeholder="$t('warehouse.searchZones')"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

      el-table(:data="filteredZones" v-loading="loadingZones" stripe style="width: 100%")
        el-table-column(:label="$t('warehouse.warehouseName')" prop="warehouseName" width="200")
          template(#default="{ row }")
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.warehouseName || row.warehouseId || '--' }}
        el-table-column(:label="$t('warehouse.zoneName')" prop="name" min-width="180" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:squares-four-bold" size="16" style="color: #f59e0b")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name || '--' }}
        el-table-column(:label="$t('warehouse.zoneType')" prop="type" width="150")
          template(#default="{ row }")
            el-tag(size="small" effect="plain" round) {{ row.type || '--' }}
        el-table-column(:label="$t('warehouse.capacity')" prop="capacity" width="130" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.capacity || 0 }}
        el-table-column(:label="$t('common.actions')" width="100" align="center" fixed="right")
          template(#default="{ row }")
            el-button(size="small" type="danger" plain @click="deleteZone(row)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-if="!filteredZones.length && !loadingZones")
        Icon(name="ph:squares-four" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('warehouse.noZones') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="zonesPagination.page"
          :page-size="zonesPagination.limit"
          :total="zonesPagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { zonesPagination.page = p; loadZones() }"
        )

    //- ========== TRANSFERS TAB ==========
    el-tab-pane(:label="$t('warehouse.transfers')" name="transfers")
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="transferSearch"
          :placeholder="$t('warehouse.searchTransfers')"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

      //- Bulk Actions Bar
      .flex.items-center.gap-2.mb-3(v-if="selectedTransfers.length")
        span.text-sm.font-medium(style="color: var(--text-primary)") {{ selectedTransfers.length }} {{ $t('common.selected') }}
        el-button(size="small" @click="exportTransfersCSV" class="!rounded-xl")
          Icon(name="ph:download-bold" size="14")
          span.ml-1 {{ $t('common.export') }}

      el-table(:data="filteredTransfers" v-loading="loadingTransfers" stripe style="width: 100%" @selection-change="handleTransferSelectionChange")
        el-table-column(type="selection" width="40")
        el-table-column(:label="$t('warehouse.transferNumber')" prop="transferNumber" width="160" sortable)
          template(#default="{ row }")
            span.font-mono.font-bold(style="color: #7849ff") {{ row.transferNumber || '--' }}
        el-table-column(:label="$t('warehouse.fromWarehouse')" prop="fromWarehouseName" width="180")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.fromWarehouseName || row.fromWarehouseId || '--' }}
        el-table-column(:label="$t('warehouse.toWarehouse')" prop="toWarehouseName" width="180")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.toWarehouseName || row.toWarehouseId || '--' }}
        el-table-column(:label="$t('warehouse.items')" width="100" align="center")
          template(#default="{ row }")
            el-tag(size="small" effect="plain" round) {{ row.items?.length || row.itemCount || 0 }}
        el-table-column(:label="$t('warehouse.status')" width="140" align="center")
          template(#default="{ row }")
            el-tag(
              :type="getTransferStatusType(row.status)"
              size="small"
              effect="dark"
              round
            ) {{ row.status || '--' }}
        el-table-column(:label="$t('warehouse.createdAt')" width="140" sortable)
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
        el-table-column(:label="$t('warehouse.completedAt')" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.completedAt ? formatDate(row.completedAt) : '--' }}
        el-table-column(:label="$t('common.actions')" width="100" align="center" fixed="right")
          template(#default="{ row }")
            el-button(
              v-if="row.status === 'PENDING' || row.status === 'IN_TRANSIT'"
              size="small"
              @click="updateTransferStatus(row)"
              class="!rounded-lg"
            )
              Icon(name="ph:check-bold" size="14")

      .text-center.py-12(v-if="!filteredTransfers.length && !loadingTransfers")
        Icon(name="ph:arrows-left-right" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('warehouse.noTransfers') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="transfersPagination.page"
          :page-size="transfersPagination.limit"
          :total="transfersPagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { transfersPagination.page = p; loadTransfers() }"
        )

  //- ========== CREATE / EDIT WAREHOUSE DIALOG ==========
  el-dialog(
    v-model="warehouseDialogVisible"
    :title="editingWarehouse ? $t('warehouse.editWarehouse') : $t('warehouse.newWarehouse')"
    width="550px"
    :close-on-click-modal="false"
  )
    el-form(:model="warehouseForm" label-position="top")
      el-form-item(:label="$t('warehouse.name')" required)
        el-input(v-model="warehouseForm.name" :placeholder="$t('warehouse.name')")
      el-form-item(:label="$t('warehouse.location')")
        el-input(v-model="warehouseForm.location" :placeholder="$t('warehouse.location')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('warehouse.manager')")
          el-input(v-model="warehouseForm.manager" :placeholder="$t('warehouse.manager')")
        el-form-item(:label="$t('warehouse.capacity')")
          el-input-number(v-model="warehouseForm.capacity" :min="0" style="width: 100%")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('warehouse.occupancy')")
          el-input-number(v-model="warehouseForm.currentOccupancy" :min="0" style="width: 100%")
        el-form-item(:label="$t('warehouse.status')")
          el-select(v-model="warehouseForm.status" style="width: 100%")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Inactive" value="INACTIVE")
            el-option(label="Maintenance" value="MAINTENANCE")
    template(#footer)
      el-button(@click="warehouseDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveWarehouse") {{ $t('common.save') }}

  //- ========== CREATE ZONE DIALOG ==========
  el-dialog(
    v-model="zoneDialogVisible"
    :title="$t('warehouse.newZone')"
    width="500px"
    :close-on-click-modal="false"
  )
    el-form(:model="zoneForm" label-position="top")
      el-form-item(:label="$t('warehouse.warehouseName')" required)
        el-select(v-model="zoneForm.warehouseId" :placeholder="$t('warehouse.selectWarehouse')" style="width: 100%" filterable)
          el-option(
            v-for="wh in warehouses"
            :key="wh.id"
            :label="wh.name"
            :value="wh.id"
          )
      el-form-item(:label="$t('warehouse.zoneName')" required)
        el-input(v-model="zoneForm.name" :placeholder="$t('warehouse.zoneName')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('warehouse.zoneType')")
          el-select(v-model="zoneForm.type" style="width: 100%")
            el-option(label="Storage" value="STORAGE")
            el-option(label="Picking" value="PICKING")
            el-option(label="Receiving" value="RECEIVING")
            el-option(label="Shipping" value="SHIPPING")
            el-option(label="Quarantine" value="QUARANTINE")
        el-form-item(:label="$t('warehouse.capacity')")
          el-input-number(v-model="zoneForm.capacity" :min="0" style="width: 100%")
    template(#footer)
      el-button(@click="zoneDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveZone") {{ $t('common.save') }}

  //- ========== CREATE TRANSFER DIALOG ==========
  el-dialog(
    v-model="transferDialogVisible"
    :title="$t('warehouse.newTransfer')"
    width="550px"
    :close-on-click-modal="false"
  )
    el-form(:model="transferForm" label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('warehouse.fromWarehouse')" required)
          el-select(v-model="transferForm.fromWarehouseId" :placeholder="$t('warehouse.selectWarehouse')" style="width: 100%" filterable)
            el-option(
              v-for="wh in warehouses"
              :key="wh.id"
              :label="wh.name"
              :value="wh.id"
            )
        el-form-item(:label="$t('warehouse.toWarehouse')" required)
          el-select(v-model="transferForm.toWarehouseId" :placeholder="$t('warehouse.selectWarehouse')" style="width: 100%" filterable)
            el-option(
              v-for="wh in warehouses"
              :key="wh.id"
              :label="wh.name"
              :value="wh.id"
            )
      el-form-item(:label="$t('warehouse.notes')")
        el-input(v-model="transferForm.notes" type="textarea" :rows="3" :placeholder="$t('warehouse.transferNotes')")
    template(#footer)
      el-button(@click="transferDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveTransfer") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const activeTab = ref('warehouses');
const saving = ref(false);

// Bulk Selection
const selectedWarehouses = ref<any[]>([]);
const selectedTransfers = ref<any[]>([]);
const handleWarehouseSelectionChange = (rows: any[]) => { selectedWarehouses.value = rows; };
const handleTransferSelectionChange = (rows: any[]) => { selectedTransfers.value = rows; };

// KPI Dashboard
const kpiData = reactive({
  totalWarehouses: 0,
  totalStockItems: 0,
  lowStockAlerts: 0,
  pendingTransfers: 0
});
const lowStockItems = ref<any[]>([]);

// Warehouses
const loadingWarehouses = ref(false);
const warehouses = ref<any[]>([]);
const warehousesPagination = reactive({ page: 1, limit: 20, total: 0 });
const warehouseSearch = ref('');
const warehouseDialogVisible = ref(false);
const editingWarehouse = ref<any>(null);
const warehouseForm = reactive({
  name: '',
  location: '',
  manager: '',
  capacity: 0,
  currentOccupancy: 0,
  status: 'ACTIVE'
});

// Zones
const loadingZones = ref(false);
const zones = ref<any[]>([]);
const zonesPagination = reactive({ page: 1, limit: 20, total: 0 });
const zoneSearch = ref('');
const zoneDialogVisible = ref(false);
const zoneForm = reactive({
  warehouseId: '' as any,
  name: '',
  type: 'STORAGE',
  capacity: 0
});

// Transfers
const loadingTransfers = ref(false);
const transfers = ref<any[]>([]);
const transfersPagination = reactive({ page: 1, limit: 20, total: 0 });
const transferSearch = ref('');
const transferDialogVisible = ref(false);
const transferForm = reactive({
  fromWarehouseId: '' as any,
  toWarehouseId: '' as any,
  notes: ''
});

// Create button label based on active tab
const createButtonLabel = computed(() => {
  if (activeTab.value === 'zones') return t('warehouse.newZone');
  if (activeTab.value === 'transfers') return t('warehouse.newTransfer');
  return t('warehouse.newWarehouse');
});

function openCreateDialog() {
  if (activeTab.value === 'warehouses') openCreateWarehouse();
  else if (activeTab.value === 'zones') openCreateZone();
  else if (activeTab.value === 'transfers') openCreateTransfer();
}

// Helpers
function getOccupancyColor(row: any): string {
  const pct = row.capacity ? (row.currentOccupancy / row.capacity) * 100 : 0;
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}

function getTransferStatusType(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    IN_TRANSIT: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Filtered data
const filteredWarehouses = computed(() => {
  if (!warehouseSearch.value) return warehouses.value;
  const q = warehouseSearch.value.toLowerCase();
  return warehouses.value.filter((w: any) => {
    return (w.name || '').toLowerCase().includes(q) || (w.location || '').toLowerCase().includes(q);
  });
});

const filteredZones = computed(() => {
  if (!zoneSearch.value) return zones.value;
  const q = zoneSearch.value.toLowerCase();
  return zones.value.filter((z: any) => {
    return (z.name || '').toLowerCase().includes(q) || (z.warehouseName || '').toLowerCase().includes(q);
  });
});

const filteredTransfers = computed(() => {
  if (!transferSearch.value) return transfers.value;
  const q = transferSearch.value.toLowerCase();
  return transfers.value.filter((tr: any) => {
    return (tr.transferNumber || '').toLowerCase().includes(q) ||
      (tr.fromWarehouseName || '').toLowerCase().includes(q) ||
      (tr.toWarehouseName || '').toLowerCase().includes(q);
  });
});

// ========== WAREHOUSE CRUD ==========
async function loadWarehouses() {
  loadingWarehouses.value = true;
  try {
    const res = await useApiFetch(`warehouse?page=${warehousesPagination.page}&limit=${warehousesPagination.limit}`);
    if (res?.success) {
      const data = res.body as any;
      warehouses.value = data?.rows || data?.docs || data || [];
      warehousesPagination.total = data?.count ?? data?.total ?? warehouses.value.length;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingWarehouses.value = false;
  }
}

function openCreateWarehouse() {
  editingWarehouse.value = null;
  warehouseForm.name = '';
  warehouseForm.location = '';
  warehouseForm.manager = '';
  warehouseForm.capacity = 0;
  warehouseForm.currentOccupancy = 0;
  warehouseForm.status = 'ACTIVE';
  warehouseDialogVisible.value = true;
}

function openEditWarehouse(wh: any) {
  editingWarehouse.value = wh;
  warehouseForm.name = wh.name || '';
  warehouseForm.location = wh.location || '';
  warehouseForm.manager = wh.manager || '';
  warehouseForm.capacity = wh.capacity || 0;
  warehouseForm.currentOccupancy = wh.currentOccupancy || 0;
  warehouseForm.status = wh.status || 'ACTIVE';
  warehouseDialogVisible.value = true;
}

async function saveWarehouse() {
  if (!warehouseForm.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...warehouseForm };
    if (editingWarehouse.value) {
      await useApiFetch(`warehouse/${editingWarehouse.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('warehouse', 'POST', payload);
    }
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    warehouseDialogVisible.value = false;
    await loadWarehouses();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function deleteWarehouse(wh: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.warning'),
      { type: 'warning' }
    );
    await useApiFetch(`warehouse/${wh.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadWarehouses();
  } catch {
    // cancelled
  }
}

// ========== ZONE CRUD ==========
async function loadZones() {
  loadingZones.value = true;
  try {
    const res = await useApiFetch(`warehouse/zones?page=${zonesPagination.page}&limit=${zonesPagination.limit}`);
    if (res?.success) {
      const data = res.body as any;
      zones.value = data?.rows || data?.docs || data || [];
      zonesPagination.total = data?.count ?? data?.total ?? zones.value.length;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingZones.value = false;
  }
}

function openCreateZone() {
  zoneForm.warehouseId = '';
  zoneForm.name = '';
  zoneForm.type = 'STORAGE';
  zoneForm.capacity = 0;
  zoneDialogVisible.value = true;
}

async function saveZone() {
  if (!zoneForm.name.trim() || !zoneForm.warehouseId) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    await useApiFetch('warehouse/zones', 'POST', { ...zoneForm });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    zoneDialogVisible.value = false;
    await loadZones();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function deleteZone(zone: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.warning'),
      { type: 'warning' }
    );
    await useApiFetch(`warehouse/zones/${zone.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadZones();
  } catch {
    // cancelled
  }
}

// ========== TRANSFER CRUD ==========
async function loadTransfers() {
  loadingTransfers.value = true;
  try {
    const res = await useApiFetch(`warehouse/transfers?page=${transfersPagination.page}&limit=${transfersPagination.limit}`);
    if (res?.success) {
      const data = res.body as any;
      transfers.value = data?.rows || data?.docs || data || [];
      transfersPagination.total = data?.count ?? data?.total ?? transfers.value.length;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingTransfers.value = false;
  }
}

function openCreateTransfer() {
  transferForm.fromWarehouseId = '';
  transferForm.toWarehouseId = '';
  transferForm.notes = '';
  transferDialogVisible.value = true;
}

async function saveTransfer() {
  if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('warehouse.sameWarehouseError') });
    return;
  }
  saving.value = true;
  try {
    await useApiFetch('warehouse/transfers', 'POST', { ...transferForm });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    transferDialogVisible.value = false;
    await loadTransfers();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function updateTransferStatus(transfer: any) {
  const nextStatus = transfer.status === 'PENDING' ? 'IN_TRANSIT' : 'COMPLETED';
  try {
    await useApiFetch(`warehouse/transfers/${transfer.id}`, 'PUT', { status: nextStatus });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    await loadTransfers();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

// KPI Computation (derived from loaded data)
function computeKpis() {
  kpiData.totalWarehouses = warehouses.value.length;
  kpiData.pendingTransfers = transfers.value.filter((t: any) => t.status === 'PENDING').length;
}

// Low Stock Alerts
async function loadLowStock() {
  try {
    const res = await useApiFetch('warehouse/low-stock?threshold=10');
    if (res?.success) {
      const data = res.body as any;
      lowStockItems.value = data?.rows || data?.docs || data || [];
      kpiData.lowStockAlerts = lowStockItems.value.length;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

// Stock Items count
async function loadStockCount() {
  try {
    const res = await useApiFetch('warehouse/stock?limit=1');
    if (res?.success) {
      const data = res.body as any;
      kpiData.totalStockItems = data?.count ?? data?.total ?? 0;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

// ========== BULK ACTIONS ==========
async function bulkDeleteWarehouses() {
  if (!selectedWarehouses.value.length) return;
  try {
    await ElMessageBox.confirm(
      t('common.confirmBulkDelete', { count: selectedWarehouses.value.length }),
      t('common.warning'),
      { type: 'warning' }
    );
    for (const row of selectedWarehouses.value) {
      await useApiFetch(`warehouse/${row.id}`, 'DELETE');
    }
    selectedWarehouses.value = [];
    await loadWarehouses();
    computeKpis();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch {
    // cancelled
  }
}

async function bulkChangeWarehouseStatus(newStatus: string) {
  if (!selectedWarehouses.value.length) return;
  try {
    await ElMessageBox.confirm(
      `Change ${selectedWarehouses.value.length} warehouse(s) to ${newStatus}?`,
      t('common.warning'),
      { type: 'warning' }
    );
    for (const row of selectedWarehouses.value) {
      await useApiFetch(`warehouse/${row.id}`, 'PUT', { status: newStatus });
    }
    selectedWarehouses.value = [];
    await loadWarehouses();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    // cancelled
  }
}

function exportWarehousesCSV() {
  const data = selectedWarehouses.value.length ? selectedWarehouses.value : filteredWarehouses.value;
  if (!data.length) return;
  const headers = ['Name', 'Location', 'Manager', 'Capacity', 'Occupancy', 'Status'];
  const csv = [headers.join(','), ...data.map((row: any) =>
    [
      `"${row.name || ''}"`,
      `"${row.location || ''}"`,
      `"${row.managerName || row.manager || ''}"`,
      row.capacity || 0,
      row.currentOccupancy || 0,
      `"${row.status || 'ACTIVE'}"`
    ].join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `warehouses-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

function exportTransfersCSV() {
  const data = selectedTransfers.value.length ? selectedTransfers.value : filteredTransfers.value;
  if (!data.length) return;
  const headers = ['Transfer #', 'From Warehouse', 'To Warehouse', 'Items', 'Status', 'Created', 'Completed'];
  const csv = [headers.join(','), ...data.map((row: any) =>
    [
      `"${row.transferNumber || ''}"`,
      `"${row.fromWarehouseName || row.fromWarehouseId || ''}"`,
      `"${row.toWarehouseName || row.toWarehouseId || ''}"`,
      row.items?.length || row.itemCount || 0,
      `"${row.status || ''}"`,
      `"${formatDate(row.createdAt)}"`,
      `"${row.completedAt ? formatDate(row.completedAt) : ''}"`
    ].join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `warehouse-transfers-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

onMounted(async () => {
  await Promise.all([loadWarehouses(), loadZones(), loadTransfers()]);
  computeKpis();
  loadLowStock();
  loadStockCount();
});
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warehouse-tabs {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;

  :deep(.el-tabs__header) {
    background: transparent;
    border-bottom: 1px solid var(--border-default);
  }

  :deep(.el-tabs__content) {
    padding: 16px 0;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);

    &.is-active {
      color: #7849ff;
    }
  }
}
</style>
