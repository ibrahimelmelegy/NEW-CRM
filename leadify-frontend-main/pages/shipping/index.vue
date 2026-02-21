<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Shipping & Logistics
          </h1>
          <p class="text-slate-400 text-sm mt-1">Manage shipments, carriers, and track deliveries in real time.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showShipmentDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          Create Shipment
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ totalShipments }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Shipments</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ inTransit }}</div>
        <div class="text-xs text-slate-500 mt-1">In Transit</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ delivered }}</div>
        <div class="text-xs text-slate-500 mt-1">Delivered</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ avgDeliveryTime }}d</div>
        <div class="text-xs text-slate-500 mt-1">Avg Delivery Time</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Shipments -->
      <el-tab-pane label="Shipments" name="shipments">
        <div class="flex items-center gap-3 mb-4">
          <el-input v-model="shipmentSearch" placeholder="Search shipments..." clearable class="!w-64">
            <template #prefix>
              <Icon name="ph:magnifying-glass" class="w-4 h-4" />
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="All Statuses" clearable class="w-44">
            <el-option label="All Statuses" value="" />
            <el-option v-for="status in shipmentStatuses" :key="status" :label="status" :value="status" />
          </el-select>
        </div>

        <div class="glass-panel p-1 rounded-xl">
          <el-table :data="filteredShipments" stripe>
            <el-table-column label="Shipment ID" width="130">
              <template #default="{ row }">
                <span class="text-sm font-medium text-indigo-400">{{ row.shipmentId }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Order Ref" width="120">
              <template #default="{ row }">
                <span class="text-sm text-slate-300">{{ row.orderRef }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Route" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-slate-300">{{ row.origin }}</span>
                  <Icon name="ph:arrow-right-bold" class="w-3 h-3 text-slate-600" />
                  <span class="text-slate-300">{{ row.destination }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Carrier" width="130">
              <template #default="{ row }">
                <span class="text-sm text-slate-300">{{ row.carrier }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Status" width="130">
              <template #default="{ row }">
                <el-tag :type="getShipmentStatusType(row.status)" effect="dark" size="small" round>{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Tracking #" width="150">
              <template #default="{ row }">
                <span class="text-xs font-mono text-slate-400">{{ row.trackingNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column label="ETA" width="120">
              <template #default="{ row }">
                <span class="text-sm text-slate-400">{{ row.eta }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Cost" width="110" align="right">
              <template #default="{ row }">
                <span class="text-sm font-medium text-slate-200">{{ formatCurrency(row.cost) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="80" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="trackShipment(row)">
                  <Icon name="ph:map-pin-bold" class="w-4 h-4" />
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Carriers -->
      <el-tab-pane label="Carriers" name="carriers">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="carrier in carriers" :key="carrier.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center" :style="{ background: carrier.brandColor + '20' }">
                  <Icon name="ph:truck-bold" class="w-6 h-6" :style="{ color: carrier.brandColor }" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ carrier.name }}</h4>
                  <div class="flex items-center gap-1 mt-0.5">
                    <Icon name="ph:star-fill" class="w-3 h-3 text-amber-400" />
                    <span class="text-xs text-slate-400">{{ carrier.rating }}/5</span>
                  </div>
                </div>
              </div>
              <el-tag :type="carrier.isActive ? 'success' : 'info'" effect="dark" size="small">
                {{ carrier.isActive ? 'Active' : 'Inactive' }}
              </el-tag>
            </div>

            <div class="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-800/60 text-center">
              <div>
                <div class="text-sm font-bold text-slate-200">{{ carrier.avgDeliveryTime }}d</div>
                <div class="text-[10px] text-slate-500">Avg Delivery</div>
              </div>
              <div>
                <div class="text-sm font-bold text-slate-200">{{ formatCurrency(carrier.costPerKg) }}</div>
                <div class="text-[10px] text-slate-500">Cost/kg</div>
              </div>
              <div>
                <div class="text-sm font-bold text-indigo-400">{{ carrier.activeShipments }}</div>
                <div class="text-[10px] text-slate-500">Active</div>
              </div>
            </div>

            <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>{{ carrier.totalShipments }} total shipments</span>
              <el-button text type="primary" size="small" @click="editCarrier(carrier)">
                <Icon name="ph:pencil-simple-bold" class="w-3 h-3 mr-1" /> Edit
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tracking -->
      <el-tab-pane label="Tracking" name="tracking">
        <div class="glass-panel p-6 rounded-xl mb-6">
          <div class="flex items-center gap-3 mb-6">
            <el-input v-model="trackingInput" placeholder="Enter Tracking Number" clearable class="!w-80" size="large">
              <template #prefix>
                <Icon name="ph:magnifying-glass" class="w-4 h-4" />
              </template>
            </el-input>
            <el-button type="primary" class="!rounded-xl" size="large" @click="lookupTracking">
              <Icon name="ph:map-pin-bold" class="w-4 h-4 mr-2" />
              Track
            </el-button>
          </div>

          <!-- Tracking Result -->
          <div v-if="trackingResult" class="mt-4">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-medium text-slate-200">{{ trackingResult.shipmentId }}</h3>
                <p class="text-sm text-slate-500">{{ trackingResult.origin }} &rarr; {{ trackingResult.destination }}</p>
              </div>
              <el-tag :type="getShipmentStatusType(trackingResult.status)" effect="dark" round>{{ trackingResult.status }}</el-tag>
            </div>

            <!-- Timeline Steps -->
            <div class="relative pl-8">
              <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-800"></div>
              <div v-for="(step, index) in trackingResult.timeline" :key="index" class="relative mb-6 last:mb-0">
                <div class="absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center"
                  :class="step.completed ? 'bg-indigo-500' : 'bg-slate-700'"
                >
                  <Icon :name="step.icon" class="w-3 h-3" :class="step.completed ? 'text-white' : 'text-slate-500'" />
                </div>
                <div class="ml-4">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium" :class="step.completed ? 'text-slate-200' : 'text-slate-500'">{{ step.label }}</span>
                    <span v-if="step.current" class="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Current</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">{{ step.timestamp }}</p>
                  <p v-if="step.location" class="text-xs text-slate-600 mt-0.5">{{ step.location }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12">
            <Icon name="ph:package-bold" class="w-16 h-16 text-slate-600 mx-auto" />
            <p class="text-slate-500 mt-3">Enter a tracking number to view shipment progress.</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Shipment Dialog -->
    <el-dialog v-model="showShipmentDialog" title="Create Shipment" width="560px">
      <el-form label-position="top">
        <el-form-item label="Order Reference">
          <el-select v-model="shipmentForm.orderRef" class="w-full" placeholder="Select order">
            <el-option label="ORD-2026-0091" value="ORD-2026-0091" />
            <el-option label="ORD-2026-0090" value="ORD-2026-0090" />
            <el-option label="ORD-2026-0089" value="ORD-2026-0089" />
            <el-option label="ORD-2026-0088" value="ORD-2026-0088" />
          </el-select>
        </el-form-item>
        <el-form-item label="Carrier">
          <el-select v-model="shipmentForm.carrier" class="w-full" placeholder="Select carrier">
            <el-option v-for="carrier in carriers" :key="carrier.id" :label="carrier.name" :value="carrier.name" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-3 gap-4">
          <el-form-item label="Weight (kg)">
            <el-input-number v-model="shipmentForm.weight" :min="0.1" :precision="1" class="w-full" />
          </el-form-item>
          <el-form-item label="Length (cm)">
            <el-input-number v-model="shipmentForm.length" :min="1" class="w-full" />
          </el-form-item>
          <el-form-item label="Width (cm)">
            <el-input-number v-model="shipmentForm.width" :min="1" class="w-full" />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Height (cm)">
            <el-input-number v-model="shipmentForm.height" :min="1" class="w-full" />
          </el-form-item>
          <el-form-item label="Estimated Cost">
            <div class="text-lg font-bold text-indigo-400 pt-2">{{ formatCurrency(estimatedCost) }}</div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showShipmentDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createShipment">Create Shipment</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const activeTab = ref('shipments');
const showShipmentDialog = ref(false);
const shipmentSearch = ref('');
const statusFilter = ref('');
const trackingInput = ref('');

const totalShipments = ref(142);
const inTransit = ref(23);
const delivered = ref(108);
const avgDeliveryTime = ref(3.2);

const shipmentStatuses = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

const shipmentForm = ref({
  orderRef: '',
  carrier: '',
  weight: 1.0,
  length: 30,
  width: 20,
  height: 15
});

const estimatedCost = computed(() => {
  const volumetric = (shipmentForm.value.length * shipmentForm.value.width * shipmentForm.value.height) / 5000;
  const chargeableWeight = Math.max(shipmentForm.value.weight, volumetric);
  return chargeableWeight * 18.5;
});

const shipments = ref([
  { id: 1, shipmentId: 'SHP-2026-0042', orderRef: 'ORD-2026-0091', origin: 'Riyadh', destination: 'Jeddah', carrier: 'SMSA Express', status: 'IN_TRANSIT', trackingNumber: 'TRK9847562310', eta: 'Feb 22', cost: 145 },
  { id: 2, shipmentId: 'SHP-2026-0041', orderRef: 'ORD-2026-0090', origin: 'Riyadh', destination: 'Dammam', carrier: 'Aramex', status: 'DELIVERED', trackingNumber: 'TRK9847562309', eta: 'Feb 19', cost: 98 },
  { id: 3, shipmentId: 'SHP-2026-0040', orderRef: 'ORD-2026-0089', origin: 'Jeddah', destination: 'Riyadh', carrier: 'DHL', status: 'PICKED_UP', trackingNumber: 'TRK9847562308', eta: 'Feb 23', cost: 210 },
  { id: 4, shipmentId: 'SHP-2026-0039', orderRef: 'ORD-2026-0088', origin: 'Riyadh', destination: 'Abha', carrier: 'SMSA Express', status: 'PENDING', trackingNumber: 'TRK9847562307', eta: 'Feb 25', cost: 175 },
  { id: 5, shipmentId: 'SHP-2026-0038', orderRef: 'ORD-2026-0087', origin: 'Dammam', destination: 'Riyadh', carrier: 'Naqel', status: 'DELIVERED', trackingNumber: 'TRK9847562306', eta: 'Feb 17', cost: 89 },
  { id: 6, shipmentId: 'SHP-2026-0037', orderRef: 'ORD-2026-0086', origin: 'Riyadh', destination: 'Madinah', carrier: 'Aramex', status: 'IN_TRANSIT', trackingNumber: 'TRK9847562305', eta: 'Feb 21', cost: 132 },
  { id: 7, shipmentId: 'SHP-2026-0036', orderRef: 'ORD-2026-0085', origin: 'Jeddah', destination: 'Tabuk', carrier: 'DHL', status: 'DELIVERED', trackingNumber: 'TRK9847562304', eta: 'Feb 16', cost: 265 },
  { id: 8, shipmentId: 'SHP-2026-0035', orderRef: 'ORD-2026-0084', origin: 'Riyadh', destination: 'Khobar', carrier: 'FedEx', status: 'PENDING', trackingNumber: 'TRK9847562303', eta: 'Feb 26', cost: 195 }
]);

const carriers = ref([
  { id: 1, name: 'SMSA Express', rating: 4.5, avgDeliveryTime: 2, costPerKg: 18.5, activeShipments: 8, totalShipments: 342, isActive: true, brandColor: '#E11D48' },
  { id: 2, name: 'Aramex', rating: 4.2, avgDeliveryTime: 3, costPerKg: 15.0, activeShipments: 5, totalShipments: 278, isActive: true, brandColor: '#F97316' },
  { id: 3, name: 'DHL', rating: 4.7, avgDeliveryTime: 2, costPerKg: 25.0, activeShipments: 4, totalShipments: 195, isActive: true, brandColor: '#EAB308' },
  { id: 4, name: 'FedEx', rating: 4.4, avgDeliveryTime: 3, costPerKg: 22.0, activeShipments: 3, totalShipments: 156, isActive: true, brandColor: '#7C3AED' },
  { id: 5, name: 'Naqel', rating: 4.0, avgDeliveryTime: 4, costPerKg: 12.0, activeShipments: 3, totalShipments: 120, isActive: true, brandColor: '#059669' },
  { id: 6, name: 'Zajel', rating: 3.6, avgDeliveryTime: 5, costPerKg: 10.0, activeShipments: 0, totalShipments: 45, isActive: false, brandColor: '#6B7280' }
]);

const trackingResult = ref<{
  shipmentId: string;
  origin: string;
  destination: string;
  status: string;
  timeline: { label: string; timestamp: string; location?: string; icon: string; completed: boolean; current?: boolean }[];
} | null>(null);

const filteredShipments = computed(() => {
  return shipments.value.filter(s => {
    const matchesSearch = !shipmentSearch.value ||
      s.shipmentId.toLowerCase().includes(shipmentSearch.value.toLowerCase()) ||
      s.orderRef.toLowerCase().includes(shipmentSearch.value.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(shipmentSearch.value.toLowerCase());
    const matchesStatus = !statusFilter.value || s.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

function getShipmentStatusType(status: string): 'info' | 'warning' | 'success' | undefined {
  const map: Record<string, 'info' | 'warning' | 'success'> = {
    PENDING: 'info',
    PICKED_UP: 'warning',
    IN_TRANSIT: 'warning',
    DELIVERED: 'success'
  };
  return map[status] ?? undefined;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

function trackShipment(shipment: any) {
  trackingInput.value = shipment.trackingNumber;
  activeTab.value = 'tracking';
  lookupTracking();
}

function lookupTracking() {
  const shipment = shipments.value.find(s => s.trackingNumber === trackingInput.value);
  if (!shipment) {
    // Show sample tracking for demo
    trackingResult.value = {
      shipmentId: 'SHP-2026-0042',
      origin: 'Riyadh',
      destination: 'Jeddah',
      status: 'IN_TRANSIT',
      timeline: [
        { label: 'Order Placed', timestamp: 'Feb 18, 2026 09:00 AM', location: 'Riyadh', icon: 'ph:shopping-cart-bold', completed: true },
        { label: 'Picked Up', timestamp: 'Feb 19, 2026 11:30 AM', location: 'Riyadh Warehouse', icon: 'ph:package-bold', completed: true },
        { label: 'In Transit', timestamp: 'Feb 19, 2026 03:45 PM', location: 'Riyadh Distribution Center', icon: 'ph:truck-bold', completed: true, current: true },
        { label: 'Out for Delivery', timestamp: 'Estimated Feb 22', icon: 'ph:map-pin-bold', completed: false },
        { label: 'Delivered', timestamp: 'Estimated Feb 22', icon: 'ph:check-circle-bold', completed: false }
      ]
    };
    return;
  }

  const statusIndex = shipmentStatuses.indexOf(shipment.status);
  const timelineSteps = [
    { label: 'Order Placed', timestamp: 'Feb 18, 2026 09:00 AM', location: shipment.origin, icon: 'ph:shopping-cart-bold' },
    { label: 'Picked Up', timestamp: 'Feb 19, 2026 11:30 AM', location: `${shipment.origin} Warehouse`, icon: 'ph:package-bold' },
    { label: 'In Transit', timestamp: 'Feb 19, 2026 03:45 PM', location: `${shipment.origin} Distribution Center`, icon: 'ph:truck-bold' },
    { label: 'Out for Delivery', timestamp: `Estimated ${shipment.eta}`, location: shipment.destination, icon: 'ph:map-pin-bold' },
    { label: 'Delivered', timestamp: shipment.status === 'DELIVERED' ? shipment.eta : `Estimated ${shipment.eta}`, icon: 'ph:check-circle-bold' }
  ];

  trackingResult.value = {
    shipmentId: shipment.shipmentId,
    origin: shipment.origin,
    destination: shipment.destination,
    status: shipment.status,
    timeline: timelineSteps.map((step, i) => ({
      ...step,
      completed: i <= statusIndex,
      current: i === statusIndex
    }))
  };
}

function editCarrier(carrier: any) {
  ElMessage.info(`Editing carrier: ${carrier.name}`);
}

function createShipment() {
  if (!shipmentForm.value.orderRef || !shipmentForm.value.carrier) {
    ElMessage.warning('Order and carrier are required');
    return;
  }
  ElMessage.success('Shipment created successfully!');
  showShipmentDialog.value = false;
  shipmentForm.value = { orderRef: '', carrier: '', weight: 1.0, length: 30, width: 20, height: 15 };
}
</script>
