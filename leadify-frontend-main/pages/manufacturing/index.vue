<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-400">
            Manufacturing & BOM
          </h1>
          <p class="text-slate-400 text-sm mt-1">Bill of Materials, work orders, production planning, and quality control.</p>
        </div>
        <div class="flex gap-2">
          <el-button @click="showBomDialog = true" class="!rounded-xl">
            <Icon name="ph:tree-structure-bold" class="w-4 h-4 mr-2" />
            New BOM
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showWorkOrderDialog = true">
            <Icon name="ph:factory-bold" class="w-4 h-4 mr-2" />
            Work Order
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ boms.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Bill of Materials</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ workOrders.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Work Orders</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ workOrders.filter(w => w.status === 'COMPLETED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Completed</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ productionEfficiency }}%</div>
        <div class="text-xs text-slate-500 mt-1">Efficiency</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ qualityIssues }}</div>
        <div class="text-xs text-slate-500 mt-1">Quality Issues</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Bill of Materials -->
      <el-tab-pane label="Bill of Materials" name="bom">
        <div class="space-y-4">
          <div v-for="bom in boms" :key="bom.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Icon name="ph:tree-structure-bold" class="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ bom.productName }}</h4>
                  <p class="text-xs text-slate-500">{{ bom.code }} - Version {{ bom.version }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <el-tag :type="bom.isActive ? 'success' : 'info'" effect="dark" size="small">{{ bom.isActive ? 'Active' : 'Draft' }}</el-tag>
                <span class="text-xs text-slate-500">Cost: {{ formatCurrency(bom.totalCost) }}</span>
              </div>
            </div>

            <!-- BOM Tree -->
            <div class="pl-4 border-l-2 border-slate-700/50 space-y-2">
              <div v-for="item in bom.items" :key="item.id" class="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                <div class="flex items-center gap-2">
                  <Icon :name="item.type === 'RAW' ? 'ph:cube' : 'ph:gear'" class="w-4 h-4" :class="item.type === 'RAW' ? 'text-blue-400' : 'text-purple-400'" />
                  <span class="text-sm text-slate-300">{{ item.name }}</span>
                  <el-tag effect="plain" size="small" class="!text-[10px]">{{ item.type }}</el-tag>
                </div>
                <div class="flex items-center gap-4 text-xs text-slate-400">
                  <span>Qty: {{ item.quantity }} {{ item.unit }}</span>
                  <span>{{ formatCurrency(item.unitCost) }}/{{ item.unit }}</span>
                  <span class="font-medium text-slate-200">{{ formatCurrency(item.quantity * item.unitCost) }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-800/60">
              <el-button size="small" text type="primary" @click="editBom(bom)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" /> Edit
              </el-button>
              <el-button size="small" text @click="duplicateBom(bom)">
                <Icon name="ph:copy" class="w-4 h-4 mr-1" /> Duplicate
              </el-button>
              <el-button size="small" text @click="createWOFromBom(bom)">
                <Icon name="ph:factory" class="w-4 h-4 mr-1" /> Create Work Order
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Work Orders -->
      <el-tab-pane label="Work Orders" name="workorders">
        <el-table :data="workOrders" class="glass-table" stripe>
          <el-table-column prop="woNumber" label="WO #" width="120" />
          <el-table-column label="Product" min-width="200">
            <template #default="{ row }">
              <div class="text-sm text-slate-200">{{ row.productName }}</div>
              <div class="text-xs text-slate-500">BOM: {{ row.bomCode }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Quantity" width="120" align="center">
            <template #default="{ row }">
              <div class="text-sm text-slate-200">{{ row.produced }}/{{ row.planned }}</div>
              <el-progress :percentage="Math.round(row.produced / row.planned * 100)" :stroke-width="3" :show-text="false"
                :color="row.produced === row.planned ? '#10B981' : '#6366F1'" class="mt-1" />
            </template>
          </el-table-column>
          <el-table-column label="Priority" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === 'URGENT' ? 'danger' : row.priority === 'HIGH' ? 'warning' : undefined" effect="dark" size="small">
                {{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getWOStatus(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Due Date" width="120">
            <template #default="{ row }">
              <span class="text-sm text-slate-400" :class="new Date(row.dueDate) < new Date() && row.status !== 'COMPLETED' ? 'text-red-400' : ''">
                {{ formatDate(row.dueDate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="100" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewWorkOrder(row)">
                <Icon name="ph:eye-bold" class="w-4 h-4" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Production Planning -->
      <el-tab-pane label="Production Plan" name="planning">
        <div class="glass-panel p-6 rounded-xl">
          <h3 class="text-sm font-medium text-slate-300 mb-4">Production Schedule</h3>
          <div class="space-y-3">
            <div v-for="plan in productionPlan" :key="plan.id" class="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30">
              <div class="w-16 text-center">
                <div class="text-xs text-slate-500">{{ plan.day }}</div>
                <div class="text-lg font-bold text-slate-200">{{ plan.date }}</div>
              </div>
              <div class="flex-1">
                <div class="flex flex-wrap gap-2">
                  <div v-for="item in plan.items" :key="item.product" class="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    :class="item.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20' : item.status === 'in_progress' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-800/40 border border-slate-700/30'"
                  >
                    <div class="w-2 h-2 rounded-full" :class="item.status === 'completed' ? 'bg-emerald-400' : item.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-500'"></div>
                    <span class="text-xs text-slate-300">{{ item.product }}</span>
                    <span class="text-[10px] text-slate-500">x{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium" :class="plan.capacity > 90 ? 'text-red-400' : plan.capacity > 70 ? 'text-amber-400' : 'text-emerald-400'">{{ plan.capacity }}%</div>
                <div class="text-[10px] text-slate-500">Capacity</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Quality Control -->
      <el-tab-pane label="Quality Control" name="quality">
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
                <div class="text-[10px] text-slate-500">Inspected</div>
              </div>
              <div>
                <div class="text-sm font-bold text-emerald-400">{{ check.passed }}</div>
                <div class="text-[10px] text-slate-500">Passed</div>
              </div>
              <div>
                <div class="text-sm font-bold text-red-400">{{ check.defects }}</div>
                <div class="text-[10px] text-slate-500">Defects</div>
              </div>
            </div>
            <el-progress :percentage="Math.round(check.passed / check.inspected * 100)" :stroke-width="4"
              :color="check.passed / check.inspected > 0.95 ? '#10B981' : '#F59E0B'" class="mt-2" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- BOM Dialog -->
    <el-dialog v-model="showBomDialog" title="Create Bill of Materials" width="600px">
      <el-form label-position="top">
        <el-form-item label="Product Name">
          <el-input v-model="newBom.productName" placeholder="Finished product name" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="BOM Code">
            <el-input v-model="newBom.code" placeholder="BOM-001" />
          </el-form-item>
          <el-form-item label="Version">
            <el-input-number v-model="newBom.version" :min="1" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item label="Components">
          <div class="space-y-2 w-full">
            <div v-for="(item, idx) in newBom.items" :key="idx" class="flex gap-2">
              <el-input v-model="item.name" placeholder="Component name" class="flex-1" />
              <el-input-number v-model="item.quantity" :min="1" class="!w-24" />
              <el-input-number v-model="item.unitCost" :min="0" :step="10" class="!w-32" placeholder="Cost" />
              <el-button text type="danger" @click="newBom.items.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newBom.items.push({ name: '', quantity: 1, unitCost: 0 })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" /> Add Component
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBomDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveBom">Save BOM</el-button>
      </template>
    </el-dialog>

    <!-- Work Order Dialog -->
    <el-dialog v-model="showWorkOrderDialog" title="Create Work Order" width="500px">
      <el-form label-position="top">
        <el-form-item label="BOM">
          <el-select v-model="newWO.bomId" class="w-full" filterable>
            <el-option v-for="b in boms" :key="b.id" :label="`${b.code} - ${b.productName}`" :value="b.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Quantity">
            <el-input-number v-model="newWO.quantity" :min="1" class="!w-full" />
          </el-form-item>
          <el-form-item label="Priority">
            <el-select v-model="newWO.priority" class="w-full">
              <el-option label="Urgent" value="URGENT" />
              <el-option label="High" value="HIGH" />
              <el-option label="Normal" value="NORMAL" />
              <el-option label="Low" value="LOW" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Due Date">
          <el-date-picker v-model="newWO.dueDate" type="date" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWorkOrderDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createWorkOrder">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const activeTab = ref('bom');
const showBomDialog = ref(false);
const showWorkOrderDialog = ref(false);

const newBom = ref({ productName: '', code: '', version: 1, items: [{ name: '', quantity: 1, unitCost: 0 }] });
const newWO = ref({ bomId: '', quantity: 1, priority: 'NORMAL', dueDate: '' });

const productionEfficiency = ref(87);
const qualityIssues = ref(3);

const boms = ref([
  { id: 1, productName: 'Smart Office Hub', code: 'BOM-001', version: 2, isActive: true, totalCost: 2450,
    items: [
      { id: 1, name: 'Processor Board', type: 'SUB_ASSEMBLY', quantity: 1, unit: 'pc', unitCost: 850 },
      { id: 2, name: 'Display Panel 7"', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 320 },
      { id: 3, name: 'Aluminum Housing', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 180 },
      { id: 4, name: 'Power Supply Unit', type: 'SUB_ASSEMBLY', quantity: 1, unit: 'pc', unitCost: 150 },
      { id: 5, name: 'WiFi/BT Module', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 45 }
    ]},
  { id: 2, productName: 'Industrial Sensor Kit', code: 'BOM-002', version: 1, isActive: true, totalCost: 680,
    items: [
      { id: 1, name: 'Temperature Sensor', type: 'RAW', quantity: 4, unit: 'pc', unitCost: 35 },
      { id: 2, name: 'Humidity Sensor', type: 'RAW', quantity: 2, unit: 'pc', unitCost: 42 },
      { id: 3, name: 'Controller Board', type: 'SUB_ASSEMBLY', quantity: 1, unit: 'pc', unitCost: 180 },
      { id: 4, name: 'Enclosure IP67', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 95 },
      { id: 5, name: 'Cabling Kit', type: 'RAW', quantity: 1, unit: 'set', unitCost: 60 }
    ]},
  { id: 3, productName: 'Solar Power Bank', code: 'BOM-003', version: 3, isActive: false, totalCost: 125,
    items: [
      { id: 1, name: 'Solar Panel 5W', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 28 },
      { id: 2, name: 'Li-Po Battery 10000mAh', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 45 },
      { id: 3, name: 'Charge Controller', type: 'RAW', quantity: 1, unit: 'pc', unitCost: 12 },
      { id: 4, name: 'USB-C Port Module', type: 'RAW', quantity: 2, unit: 'pc', unitCost: 8 }
    ]}
]);

const workOrders = ref([
  { id: 1, woNumber: 'WO-001', productName: 'Smart Office Hub', bomCode: 'BOM-001', planned: 50, produced: 42, priority: 'HIGH', status: 'IN_PROGRESS', dueDate: '2026-02-28' },
  { id: 2, woNumber: 'WO-002', productName: 'Industrial Sensor Kit', bomCode: 'BOM-002', planned: 200, produced: 200, priority: 'NORMAL', status: 'COMPLETED', dueDate: '2026-02-15' },
  { id: 3, woNumber: 'WO-003', productName: 'Smart Office Hub', bomCode: 'BOM-001', planned: 100, produced: 0, priority: 'URGENT', status: 'PLANNED', dueDate: '2026-03-15' },
  { id: 4, woNumber: 'WO-004', productName: 'Solar Power Bank', bomCode: 'BOM-003', planned: 500, produced: 125, priority: 'NORMAL', status: 'IN_PROGRESS', dueDate: '2026-03-10' },
  { id: 5, woNumber: 'WO-005', productName: 'Industrial Sensor Kit', bomCode: 'BOM-002', planned: 100, produced: 0, priority: 'LOW', status: 'PLANNED', dueDate: '2026-03-20' }
]);

const productionPlan = ref([
  { id: 1, day: 'Mon', date: '24', capacity: 85, items: [
    { product: 'Smart Hub', quantity: 10, status: 'completed' },
    { product: 'Sensor Kit', quantity: 40, status: 'in_progress' }
  ]},
  { id: 2, day: 'Tue', date: '25', capacity: 92, items: [
    { product: 'Smart Hub', quantity: 12, status: 'planned' },
    { product: 'Power Bank', quantity: 50, status: 'planned' }
  ]},
  { id: 3, day: 'Wed', date: '26', capacity: 78, items: [
    { product: 'Sensor Kit', quantity: 60, status: 'planned' },
    { product: 'Power Bank', quantity: 30, status: 'planned' }
  ]},
  { id: 4, day: 'Thu', date: '27', capacity: 65, items: [
    { product: 'Smart Hub', quantity: 8, status: 'planned' }
  ]},
  { id: 5, day: 'Fri', date: '28', capacity: 45, items: [
    { product: 'Power Bank', quantity: 25, status: 'planned' }
  ]}
]);

const qualityChecks = ref([
  { id: 1, woNumber: 'WO-001', product: 'Smart Office Hub', inspector: 'Khalid I.', inspected: 42, passed: 40, defects: 2, result: 'PASS' },
  { id: 2, woNumber: 'WO-002', product: 'Sensor Kit', inspector: 'Fatima A.', inspected: 200, passed: 196, defects: 4, result: 'PASS' },
  { id: 3, woNumber: 'WO-004', product: 'Solar Power Bank', inspector: 'Ahmed F.', inspected: 50, passed: 43, defects: 7, result: 'FAIL' }
]);

const formatCurrency = (val: number) => {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-';

const getWOStatus = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = { COMPLETED: 'success', IN_PROGRESS: undefined, PLANNED: 'info', ON_HOLD: 'warning', CANCELLED: 'danger' };
  return m[s] || 'info';
};

const editBom = (bom: any) => ElMessage.info(`Editing: ${bom.productName}`);
const duplicateBom = (bom: any) => ElMessage.info(`Duplicating: ${bom.code}`);
const createWOFromBom = (bom: any) => { newWO.value.bomId = bom.id; showWorkOrderDialog.value = true; };
const viewWorkOrder = (wo: any) => ElMessage.info(`Viewing: ${wo.woNumber}`);

const saveBom = () => {
  if (!newBom.value.productName) { ElMessage.warning('Product name required'); return; }
  ElMessage.success('BOM created'); showBomDialog.value = false;
};

const createWorkOrder = () => {
  ElMessage.success('Work order created'); showWorkOrderDialog.value = false;
};
</script>
