<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-400">
            {{ $t('manufacturing.manufacturingAndBom') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('manufacturing.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <ExportButton :data="exportData" :columns="exportColumns" filename="manufacturing-export" :title="$t('manufacturing.reportTitle')" />
          <el-button class="!rounded-xl" @click="showBomDialog = true">
            <Icon name="ph:tree-structure-bold" class="w-4 h-4 mr-2" />
            {{ $t('manufacturing.newBom') }}
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showWorkOrderDialog = true">
            <Icon name="ph:factory-bold" class="w-4 h-4 mr-2" />
            {{ $t('manufacturing.workOrder') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ boms.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('manufacturing.billOfMaterials') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ workOrders.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('manufacturing.workOrders') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ workOrders.filter(w => w.status === 'COMPLETED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('manufacturing.completed') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ productionEfficiency }}%</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('manufacturing.efficiency') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ qualityIssues }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('manufacturing.qualityIssues') }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Bill of Materials -->
      <el-tab-pane :label="$t('manufacturing.billOfMaterials')" name="bom">
        <div class="space-y-4">
          <div v-for="bom in boms" :key="bom.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Icon name="ph:tree-structure-bold" class="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ bom.productName }}</h4>
                  <p class="text-xs text-slate-500">{{ bom.code }} - {{ $t('manufacturing.version') }} {{ bom.version }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <el-tag :type="bom.isActive ? 'success' : 'info'" effect="dark" size="small">
                  {{ bom.isActive ? $t('manufacturing.statusActive') : $t('manufacturing.statusDraft') }}
                </el-tag>
                <span class="text-xs text-slate-500">Cost: {{ formatCurrency(bom.totalCost) }}</span>
              </div>
            </div>

            <!-- BOM Tree -->
            <div class="pl-4 border-l-2 border-slate-700/50 space-y-2">
              <div v-for="item in bom.items" :key="item.id" class="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                <div class="flex items-center gap-2">
                  <Icon
                    :name="item.type === 'RAW' ? 'ph:cube' : 'ph:gear'"
                    class="w-4 h-4"
                    :class="item.type === 'RAW' ? 'text-blue-400' : 'text-purple-400'"
                  />
                  <span class="text-sm text-slate-300">{{ item.name }}</span>
                  <el-tag effect="plain" size="small" class="!text-[10px]">{{ item.type }}</el-tag>
                </div>
                <div class="flex items-center gap-4 text-xs text-slate-400">
                  <span>{{ $t('manufacturing.quantity') }}: {{ item.quantity }} {{ item.unit }}</span>
                  <span>{{ formatCurrency(item.unitCost) }}/{{ item.unit }}</span>
                  <span class="font-medium text-slate-200">{{ formatCurrency(item.quantity * item.unitCost) }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-800/60">
              <el-button size="small" text type="primary" @click="editBom(bom)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" text @click="duplicateBom(bom)">
                <Icon name="ph:copy" class="w-4 h-4 mr-1" />
                {{ $t('manufacturing.duplicate') }}
              </el-button>
              <el-button size="small" text @click="createWOFromBom(bom)">
                <Icon name="ph:factory" class="w-4 h-4 mr-1" />
                {{ $t('manufacturing.createWorkOrder') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Work Orders -->
      <el-tab-pane :label="$t('manufacturing.workOrders')" name="workorders">
        <el-table :data="workOrders" class="glass-table" stripe>
          <el-table-column prop="woNumber" :label="$t('manufacturing.woNumber')" width="120" />
          <el-table-column :label="$t('manufacturing.product')" min-width="200">
            <template #default="{ row }">
              <div class="text-sm text-slate-200">{{ row.productName }}</div>
              <div class="text-xs text-slate-500">BOM: {{ row.bomCode }}</div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('manufacturing.quantity')" width="120" align="center">
            <template #default="{ row }">
              <div class="text-sm text-slate-200">{{ row.produced }}/{{ row.planned }}</div>
              <el-progress
                :percentage="Math.round((row.produced / row.planned) * 100)"
                :stroke-width="3"
                :show-text="false"
                :color="row.produced === row.planned ? '#10B981' : '#6366F1'"
                class="mt-1"
              />
            </template>
          </el-table-column>
          <el-table-column :label="$t('manufacturing.priority')" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === 'URGENT' ? 'danger' : row.priority === 'HIGH' ? 'warning' : undefined" effect="dark" size="small">
                {{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('manufacturing.status')" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getWOStatus(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('manufacturing.dueDate')" width="120">
            <template #default="{ row }">
              <span class="text-sm text-slate-400" :class="new Date(row.dueDate) < new Date() && row.status !== 'COMPLETED' ? 'text-red-400' : ''">
                {{ formatDate(row.dueDate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="100" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewWorkOrder(row)">
                <Icon name="ph:eye-bold" class="w-4 h-4" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Production Planning -->
      <el-tab-pane :label="$t('manufacturing.productionPlan')" name="planning">
        <div class="glass-panel p-6 rounded-xl">
          <h3 class="text-sm font-medium text-slate-300 mb-4">{{ $t('manufacturing.productionSchedule') }}</h3>
          <div class="space-y-3">
            <div v-for="plan in productionPlan" :key="plan.id" class="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30">
              <div class="w-16 text-center">
                <div class="text-xs text-slate-500">{{ plan.day }}</div>
                <div class="text-lg font-bold text-slate-200">{{ plan.date }}</div>
              </div>
              <div class="flex-1">
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="item in plan.items"
                    :key="item.product"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    :class="
                      item.status === 'completed'
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : item.status === 'in_progress'
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'bg-slate-800/40 border border-slate-700/30'
                    "
                  >
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="item.status === 'completed' ? 'bg-emerald-400' : item.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-500'"
                    ></div>
                    <span class="text-xs text-slate-300">{{ item.product }}</span>
                    <span class="text-[10px] text-slate-500">x{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div
                  class="text-sm font-medium"
                  :class="plan.capacity > 90 ? 'text-red-400' : plan.capacity > 70 ? 'text-amber-400' : 'text-emerald-400'"
                >
                  {{ plan.capacity }}%
                </div>
                <div class="text-[10px] text-slate-500">{{ $t('manufacturing.capacity') }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Quality Control -->
      <el-tab-pane :label="$t('manufacturing.qualityControl')" name="quality">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="check in qualityChecks" :key="check.id" class="glass-panel p-5 rounded-xl">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ check.woNumber }} - {{ check.product }}</h4>
                <p class="text-xs text-slate-500">Inspector: {{ check.inspector }}</p>
              </div>
              <el-tag :type="check.result === 'PASS' ? 'success' : check.result === 'FAIL' ? 'danger' : 'warning'" effect="dark" size="small">
                {{ check.result }}
              </el-tag>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center py-2">
              <div>
                <div class="text-sm font-bold text-slate-200">{{ check.inspected }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('manufacturing.inspected') }}</div>
              </div>
              <div>
                <div class="text-sm font-bold text-emerald-400">{{ check.passed }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('manufacturing.passed') }}</div>
              </div>
              <div>
                <div class="text-sm font-bold text-red-400">{{ check.defects }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('manufacturing.defects') }}</div>
              </div>
            </div>
            <el-progress
              :percentage="Math.round((check.passed / check.inspected) * 100)"
              :stroke-width="4"
              :color="check.passed / check.inspected > 0.95 ? '#10B981' : '#F59E0B'"
              class="mt-2"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- BOM Dialog -->
    <el-dialog v-model="showBomDialog" :title="$t('manufacturing.createBom')" width="600px">
      <el-form label-position="top">
        <el-form-item :label="$t('manufacturing.productName')">
          <el-input v-model="newBom.productName" :placeholder="$t('manufacturing.finishedProductName')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('manufacturing.bomCode')">
            <el-input v-model="newBom.code" placeholder="BOM-001" />
          </el-form-item>
          <el-form-item :label="$t('manufacturing.version')">
            <el-input-number v-model="newBom.version" :min="1" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('manufacturing.components')">
          <div class="space-y-2 w-full">
            <div v-for="(item, idx) in newBom.items" :key="idx" class="flex gap-2">
              <el-input v-model="item.name" :placeholder="$t('manufacturing.componentNamePlaceholder')" class="flex-1" />
              <el-input-number v-model="item.quantity" :min="1" class="!w-24" />
              <el-input-number v-model="item.unitCost" :min="0" :step="10" class="!w-32" :placeholder="$t('manufacturing.cost')" />
              <el-button text type="danger" @click="newBom.items.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newBom.items.push({ name: '', quantity: 1, unitCost: 0 })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              {{ $t('manufacturing.addComponent') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBomDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveBom">{{ $t('manufacturing.saveBom') }}</el-button>
      </template>
    </el-dialog>

    <!-- Work Order Dialog -->
    <el-dialog v-model="showWorkOrderDialog" :title="$t('manufacturing.createWorkOrder')" width="500px">
      <el-form label-position="top">
        <el-form-item :label="$t('manufacturing.bom')">
          <el-select v-model="newWO.bomId" class="w-full" filterable>
            <el-option v-for="b in boms" :key="b.id" :label="`${b.code} - ${b.productName}`" :value="b.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('manufacturing.quantity')">
            <el-input-number v-model="newWO.quantity" :min="1" class="!w-full" />
          </el-form-item>
          <el-form-item :label="$t('manufacturing.priority')">
            <el-select v-model="newWO.priority" class="w-full">
              <el-option :label="$t('manufacturing.priorityUrgent')" value="URGENT" />
              <el-option :label="$t('manufacturing.priorityHigh')" value="HIGH" />
              <el-option :label="$t('manufacturing.priorityNormal')" value="NORMAL" />
              <el-option :label="$t('manufacturing.priorityLow')" value="LOW" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('manufacturing.dueDate')">
          <el-date-picker v-model="newWO.dueDate" type="date" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWorkOrderDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="createWorkOrder">{{ $t('manufacturing.createWorkOrder') }}</el-button>
      </template>
    </el-dialog>

    <!-- Work Order Detail Dialog -->
    <el-dialog v-model="showWODetailDialog" :title="t('manufacturing.workOrderDetails')" width="480px">
      <div v-if="selectedWO" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="text-slate-400">{{ t('manufacturing.woNumber') }}</div>
          <div class="font-medium">{{ selectedWO.woNumber }}</div>
          <div class="text-slate-400">{{ t('manufacturing.productName') }}</div>
          <div class="font-medium">{{ selectedWO.productName }}</div>
          <div class="text-slate-400">{{ t('manufacturing.plannedQty') }}</div>
          <div class="font-medium">{{ selectedWO.planned }}</div>
          <div class="text-slate-400">{{ t('manufacturing.producedQty') }}</div>
          <div class="font-medium">{{ selectedWO.produced }}</div>
          <div class="text-slate-400">{{ t('manufacturing.dueDate') }}</div>
          <div class="font-medium">{{ formatDate(selectedWO.dueDate) }}</div>
          <div class="text-slate-400">{{ t('manufacturing.priority') }}</div>
          <div class="font-medium">{{ selectedWO.priority }}</div>
          <div class="text-slate-400">{{ t('manufacturing.status') }}</div>
          <div>
            <el-tag :type="getWOStatus(selectedWO.status)" size="small">{{ selectedWO.status }}</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showWODetailDialog = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useManufacturing } from '~/composables/useManufacturing';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const {
  boms,
  workOrders,
  qualityChecks,
  productionEfficiency,
  qualityIssues,
  init,
  createBOM,
  updateBOM,
  duplicateBOM,
  createWorkOrder: apiCreateWorkOrder
} = useManufacturing();

onMounted(() => {
  init();
});

const activeTab = ref('bom');
const showBomDialog = ref(false);
const showWorkOrderDialog = ref(false);

const newBom = ref({ productName: '', code: '', version: 1, items: [{ name: '', quantity: 1, unitCost: 0 }] });
const newWO = ref({ bomId: 0 as number, quantity: 1, priority: 'NORMAL', dueDate: '' });
const editingBomId = ref<number | null>(null);
const selectedWO = ref<any>(null);
const showWODetailDialog = ref(false);

// Production plan is derived from active work orders
const productionPlan = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const plan = [];
  const now = new Date();
  const activeWOs = workOrders.value.filter(w => w.status !== 'COMPLETED' && w.status !== 'CANCELLED');
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    plan.push({
      id: i + 1,
      day: days[d.getDay()],
      date: String(d.getDate()),
      capacity: activeWOs.length > 0 ? Math.min(100, Math.round(activeWOs.length * 25)) : 0,
      items: activeWOs.slice(0, 2).map(w => ({
        product: w.productName,
        quantity: Math.ceil(w.planned / 5),
        status: w.status === 'IN_PROGRESS' ? 'in_progress' : 'planned'
      }))
    });
  }
  return plan;
});

const formatCurrency = (val: number) => {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};
const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

const getWOStatus = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    COMPLETED: 'success',
    IN_PROGRESS: undefined,
    PLANNED: 'info',
    ON_HOLD: 'warning',
    CANCELLED: 'danger'
  };
  return m[s] || 'info';
};

const editBom = (bom: any) => {
  editingBomId.value = bom.id;
  newBom.value = {
    productName: bom.productName,
    code: bom.code,
    version: bom.version,
    items: (bom.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity, unitCost: i.unitCost || 0 }))
  };
  showBomDialog.value = true;
};
const duplicateBom = async (bom: any) => {
  await duplicateBOM(bom.id);
  ElMessage.success(t('manufacturing.bomDuplicated'));
};
const createWOFromBom = (bom: any) => {
  newWO.value.bomId = bom.id;
  showWorkOrderDialog.value = true;
};
const viewWorkOrder = (wo: any) => {
  selectedWO.value = wo;
  showWODetailDialog.value = true;
};

const exportColumns = [
  { prop: 'woNumber', label: 'WO #' },
  { prop: 'productName', label: 'Product' },
  { prop: 'bomCode', label: 'BOM Code' },
  { prop: 'planned', label: 'Planned Qty' },
  { prop: 'produced', label: 'Produced Qty' },
  { prop: 'priority', label: 'Priority' },
  { prop: 'status', label: 'Status' },
  { prop: 'dueDateFormatted', label: 'Due Date' }
];

const exportData = computed(() =>
  workOrders.value.map(w => ({
    woNumber: w.woNumber || '',
    productName: w.productName || '',
    bomCode: w.bomCode || '',
    planned: w.planned ?? '',
    produced: w.produced ?? '',
    priority: w.priority || '',
    status: w.status || '',
    dueDateFormatted: formatDate(w.dueDate || '')
  }))
);

const saveBom = async () => {
  if (!newBom.value.productName) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  const bomData = {
    productName: newBom.value.productName,
    code: newBom.value.code,
    version: newBom.value.version,
    items: newBom.value.items.map(i => ({
      name: i.name,
      type: 'RAW' as const,
      quantity: i.quantity,
      unit: 'pc',
      unitCost: i.unitCost
    }))
  };
  if (editingBomId.value) {
    await updateBOM(editingBomId.value, bomData);
    ElMessage.success(t('manufacturing.bomUpdated'));
  } else {
    await createBOM(bomData);
    ElMessage.success(t('manufacturing.bomCreated'));
  }
  newBom.value = { productName: '', code: '', version: 1, items: [{ name: '', quantity: 1, unitCost: 0 }] };
  editingBomId.value = null;
  showBomDialog.value = false;
};

const createWorkOrder = async () => {
  await apiCreateWorkOrder({
    bomId: newWO.value.bomId || undefined,
    quantity: newWO.value.quantity,
    priority: newWO.value.priority,
    dueDate: newWO.value.dueDate || undefined
  });
  newWO.value = { bomId: 0, quantity: 1, priority: 'NORMAL', dueDate: '' };
  showWorkOrderDialog.value = false;
  ElMessage.success(t('manufacturing.workOrderCreated'));
};
</script>
