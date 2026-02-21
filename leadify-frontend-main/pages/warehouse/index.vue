<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-400">Warehouse Management</h1>
          <p class="text-slate-400 text-sm mt-1">Manage warehouse locations, bin storage, stock transfers, and receiving.</p>
        </div>
        <div class="flex gap-2">
          <el-button class="!rounded-xl" @click="showTransferDialog = true">
            <Icon name="ph:arrows-left-right-bold" class="w-4 h-4 mr-2" />
            Transfer Stock
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showReceiveDialog = true">
            <Icon name="ph:package-bold" class="w-4 h-4 mr-2" />
            Receive Stock
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ warehouses.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Warehouses</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ totalBins }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Bins</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ totalSKUs }}</div>
        <div class="text-xs text-slate-500 mt-1">Active SKUs</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ pendingTransfers }}</div>
        <div class="text-xs text-slate-500 mt-1">Pending Transfers</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ lowStockItems }}</div>
        <div class="text-xs text-slate-500 mt-1">Low Stock Alerts</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Warehouses -->
      <el-tab-pane label="Warehouses" name="warehouses">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="wh in warehouses" :key="wh.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center" :class="wh.gradient">
                  <Icon name="ph:warehouse-bold" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ wh.name }}</h4>
                  <p class="text-xs text-slate-500">{{ wh.location }}</p>
                </div>
              </div>
              <el-tag :type="wh.isActive ? 'success' : 'info'" effect="dark" size="small">
                {{ wh.isActive ? 'Active' : 'Inactive' }}
              </el-tag>
            </div>

            <!-- Capacity Bar -->
            <div class="mb-3">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>Capacity</span>
                <span>{{ wh.usedBins }}/{{ wh.totalBins }} bins</span>
              </div>
              <el-progress
                :percentage="Math.round((wh.usedBins / wh.totalBins) * 100)"
                :stroke-width="6"
                :color="wh.usedBins / wh.totalBins > 0.9 ? '#EF4444' : wh.usedBins / wh.totalBins > 0.7 ? '#F59E0B' : '#10B981'"
                :show-text="false"
              />
            </div>

            <!-- Warehouse Stats -->
            <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/60">
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ wh.skuCount }}</div>
                <div class="text-[10px] text-slate-500">SKUs</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ wh.zones }}</div>
                <div class="text-[10px] text-slate-500">Zones</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ wh.staff }}</div>
                <div class="text-[10px] text-slate-500">Staff</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Bin Locations -->
      <el-tab-pane label="Bin Locations" name="bins">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <div class="flex gap-2">
              <el-select v-model="selectedWarehouse" placeholder="Warehouse" class="w-44">
                <el-option v-for="wh in warehouses" :key="wh.id" :label="wh.name" :value="wh.id" />
              </el-select>
              <el-input v-model="binSearch" placeholder="Search bins..." prefix-icon="Search" clearable class="!w-48" />
            </div>
            <el-button type="primary" size="small" @click="showBinDialog = true">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
              Add Bin
            </el-button>
          </div>

          <!-- Bin Grid Visualization -->
          <div class="mb-6">
            <h4 class="text-xs text-slate-500 mb-3">Zone A - Receiving</h4>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="bin in binGrid.slice(0, 20)"
                :key="bin.code"
                class="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-[10px] cursor-pointer transition-all hover:scale-105"
                :class="getBinClass(bin)"
                @click="selectBin(bin)"
              >
                <div class="font-medium">{{ bin.code }}</div>
                <div class="text-[8px] mt-0.5">{{ bin.items }}items</div>
              </div>
            </div>
          </div>
          <div>
            <h4 class="text-xs text-slate-500 mb-3">Zone B - Storage</h4>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="bin in binGrid.slice(20, 40)"
                :key="bin.code"
                class="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-[10px] cursor-pointer transition-all hover:scale-105"
                :class="getBinClass(bin)"
                @click="selectBin(bin)"
              >
                <div class="font-medium">{{ bin.code }}</div>
                <div class="text-[8px] mt-0.5">{{ bin.items }}items</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Stock Transfers -->
      <el-tab-pane label="Transfers" name="transfers">
        <el-table :data="transfers" class="glass-table" stripe>
          <el-table-column prop="transferId" label="Transfer ID" width="130" />
          <el-table-column label="From" min-width="150">
            <template #default="{ row }">
              <div class="text-sm text-slate-200">{{ row.fromWarehouse }}</div>
              <div class="text-xs text-slate-500">{{ row.fromBin }}</div>
            </template>
          </el-table-column>
          <el-table-column label="To" min-width="150">
            <template #default="{ row }">
              <div class="text-sm text-slate-200">{{ row.toWarehouse }}</div>
              <div class="text-xs text-slate-500">{{ row.toBin }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Items" width="100" align="center">
            <template #default="{ row }">
              <span class="text-sm text-slate-200">{{ row.itemCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getTransferStatus(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Date" width="120">
            <template #default="{ row }">
              <span class="text-sm text-slate-400">{{ formatDate(row.date) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="100" align="center">
            <template #default="{ row }">
              <el-button v-if="row.status === 'PENDING'" text type="primary" size="small" @click="approveTransfer(row)">Approve</el-button>
              <el-button v-else text type="info" size="small" @click="viewTransfer(row)">View</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Receiving -->
      <el-tab-pane label="Receiving" name="receiving">
        <div class="space-y-4">
          <div v-for="receipt in receipts" :key="receipt.id" class="glass-panel p-5 rounded-xl">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ receipt.poNumber }}</h4>
                <p class="text-xs text-slate-500">{{ receipt.vendor }} - Expected {{ formatDate(receipt.expectedDate) }}</p>
              </div>
              <el-tag
                :type="receipt.status === 'RECEIVED' ? 'success' : receipt.status === 'PARTIAL' ? 'warning' : 'info'"
                effect="dark"
                size="small"
              >
                {{ receipt.status }}
              </el-tag>
            </div>
            <el-progress
              :percentage="Math.round((receipt.received / receipt.expected) * 100)"
              :stroke-width="4"
              :color="receipt.received === receipt.expected ? '#10B981' : '#F59E0B'"
              class="mb-2"
            />
            <div class="flex justify-between text-xs text-slate-500">
              <span>{{ receipt.received }}/{{ receipt.expected }} items received</span>
              <span>{{ receipt.warehouse }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Transfer Dialog -->
    <el-dialog v-model="showTransferDialog" title="Stock Transfer" width="500px">
      <el-form label-position="top">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="From Warehouse">
            <el-select v-model="transfer.from" class="w-full">
              <el-option v-for="wh in warehouses" :key="wh.id" :label="wh.name" :value="wh.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="To Warehouse">
            <el-select v-model="transfer.to" class="w-full">
              <el-option v-for="wh in warehouses" :key="wh.id" :label="wh.name" :value="wh.name" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Items">
          <el-input v-model="transfer.items" placeholder="SKU or product name" />
        </el-form-item>
        <el-form-item label="Quantity">
          <el-input-number v-model="transfer.quantity" :min="1" class="!w-full" />
        </el-form-item>
        <el-form-item label="Notes">
          <el-input v-model="transfer.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransferDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createTransfer">Create Transfer</el-button>
      </template>
    </el-dialog>

    <!-- Receive Dialog -->
    <el-dialog v-model="showReceiveDialog" title="Receive Stock" width="500px">
      <el-form label-position="top">
        <el-form-item label="Purchase Order">
          <el-select v-model="receive.poNumber" class="w-full" filterable>
            <el-option v-for="r in receipts.filter(r => r.status !== 'RECEIVED')" :key="r.id" :label="r.poNumber" :value="r.poNumber" />
          </el-select>
        </el-form-item>
        <el-form-item label="Warehouse">
          <el-select v-model="receive.warehouse" class="w-full">
            <el-option v-for="wh in warehouses" :key="wh.id" :label="wh.name" :value="wh.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="Bin Location">
          <el-input v-model="receive.bin" placeholder="e.g., A-01-01" />
        </el-form-item>
        <el-form-item label="Quantity Received">
          <el-input-number v-model="receive.quantity" :min="1" class="!w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReceiveDialog = false">Cancel</el-button>
        <el-button type="primary" @click="receiveStock">Confirm Receipt</el-button>
      </template>
    </el-dialog>

    <!-- Bin Dialog -->
    <el-dialog v-model="showBinDialog" title="Add Bin Location" width="400px">
      <el-form label-position="top">
        <el-form-item label="Bin Code">
          <el-input v-model="newBin.code" placeholder="e.g., A-03-02" />
        </el-form-item>
        <el-form-item label="Zone">
          <el-select v-model="newBin.zone" class="w-full">
            <el-option label="Zone A - Receiving" value="A" />
            <el-option label="Zone B - Storage" value="B" />
            <el-option label="Zone C - Picking" value="C" />
            <el-option label="Zone D - Shipping" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="Max Capacity">
          <el-input-number v-model="newBin.maxCapacity" :min="1" class="!w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBinDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addBin">Add Bin</el-button>
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

const activeTab = ref('warehouses');
const selectedWarehouse = ref('');
const binSearch = ref('');
const showTransferDialog = ref(false);
const showReceiveDialog = ref(false);
const showBinDialog = ref(false);

const transfer = ref({ from: '', to: '', items: '', quantity: 1, notes: '' });
const receive = ref({ poNumber: '', warehouse: '', bin: '', quantity: 1 });
const newBin = ref({ code: '', zone: 'A', maxCapacity: 50 });

const warehouses = ref([
  {
    id: 1,
    name: 'Main Warehouse',
    location: 'Riyadh Industrial Area',
    isActive: true,
    usedBins: 145,
    totalBins: 200,
    skuCount: 342,
    zones: 4,
    staff: 12,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    name: 'East Distribution Center',
    location: 'Dammam Port Zone',
    isActive: true,
    usedBins: 78,
    totalBins: 120,
    skuCount: 186,
    zones: 3,
    staff: 8,
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 3,
    name: 'West Fulfillment Hub',
    location: 'Jeddah Free Zone',
    isActive: true,
    usedBins: 56,
    totalBins: 80,
    skuCount: 124,
    zones: 2,
    staff: 6,
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 4,
    name: 'Overflow Storage',
    location: 'Riyadh South',
    isActive: false,
    usedBins: 12,
    totalBins: 50,
    skuCount: 28,
    zones: 1,
    staff: 2,
    gradient: 'from-amber-500 to-amber-600'
  }
]);

const binGrid = ref(
  Array.from({ length: 40 }, (_, i) => ({
    code: `${i < 20 ? 'A' : 'B'}-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 4) + 1).padStart(2, '0')}`,
    items: Math.floor(Math.random() * 30),
    maxCapacity: 30,
    status: Math.random() > 0.2 ? (Math.random() > 0.5 ? 'occupied' : 'partial') : 'empty'
  }))
);

const transfers = ref([
  {
    id: 1,
    transferId: 'TRF-001',
    fromWarehouse: 'Main Warehouse',
    fromBin: 'A-01-01',
    toWarehouse: 'East Distribution',
    toBin: 'B-02-03',
    itemCount: 50,
    status: 'COMPLETED',
    date: '2026-02-18'
  },
  {
    id: 2,
    transferId: 'TRF-002',
    fromWarehouse: 'Main Warehouse',
    fromBin: 'B-03-02',
    toWarehouse: 'West Fulfillment',
    toBin: 'A-01-01',
    itemCount: 25,
    status: 'IN_TRANSIT',
    date: '2026-02-19'
  },
  {
    id: 3,
    transferId: 'TRF-003',
    fromWarehouse: 'East Distribution',
    fromBin: 'A-02-01',
    toWarehouse: 'Main Warehouse',
    toBin: 'C-01-04',
    itemCount: 15,
    status: 'PENDING',
    date: '2026-02-20'
  },
  {
    id: 4,
    transferId: 'TRF-004',
    fromWarehouse: 'West Fulfillment',
    fromBin: 'A-03-01',
    toWarehouse: 'East Distribution',
    toBin: 'B-01-02',
    itemCount: 100,
    status: 'COMPLETED',
    date: '2026-02-15'
  }
]);

const receipts = ref([
  {
    id: 1,
    poNumber: 'PO-2026-001',
    vendor: 'Tech Supplies Co.',
    expectedDate: '2026-02-22',
    warehouse: 'Main Warehouse',
    expected: 200,
    received: 200,
    status: 'RECEIVED'
  },
  {
    id: 2,
    poNumber: 'PO-2026-002',
    vendor: 'Office World',
    expectedDate: '2026-02-25',
    warehouse: 'East Distribution',
    expected: 150,
    received: 80,
    status: 'PARTIAL'
  },
  {
    id: 3,
    poNumber: 'PO-2026-003',
    vendor: 'Industrial Parts Ltd.',
    expectedDate: '2026-02-28',
    warehouse: 'Main Warehouse',
    expected: 75,
    received: 0,
    status: 'PENDING'
  }
]);

const totalBins = computed(() => warehouses.value.reduce((s, w) => s + w.totalBins, 0));
const totalSKUs = computed(() => warehouses.value.reduce((s, w) => s + w.skuCount, 0));
const pendingTransfers = computed(() => transfers.value.filter(t => t.status === 'PENDING' || t.status === 'IN_TRANSIT').length);
const lowStockItems = ref(12);

const getBinClass = (bin: any) => {
  if (bin.status === 'empty') return 'bg-slate-800/30 text-slate-600 border border-slate-700/30';
  if (bin.items / bin.maxCapacity > 0.8) return 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (bin.items / bin.maxCapacity > 0.5) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
};

const getTransferStatus = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    COMPLETED: 'success',
    IN_TRANSIT: 'warning',
    PENDING: 'info',
    CANCELLED: 'danger'
  };
  return m[s] || 'info';
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

const selectBin = (bin: any) => ElMessage.info(`Selected bin: ${bin.code} (${bin.items} items)`);
const approveTransfer = (t: any) => {
  t.status = 'IN_TRANSIT';
  ElMessage.success('Transfer approved');
};
const viewTransfer = (t: any) => ElMessage.info(`Viewing transfer: ${t.transferId}`);

const createTransfer = () => {
  ElMessage.success('Stock transfer created');
  showTransferDialog.value = false;
};

const receiveStock = () => {
  ElMessage.success('Stock received');
  showReceiveDialog.value = false;
};

const addBin = () => {
  ElMessage.success(`Bin ${newBin.value.code} added`);
  showBinDialog.value = false;
};
</script>
