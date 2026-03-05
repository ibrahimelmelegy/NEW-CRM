<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.gap-4.mb-8
    el-button(circle size="large" @click="goBack" class="premium-btn-outline !w-12 !h-12")
      Icon(name="ph:arrow-left-bold" size="18")
    div(v-if="product")
      .flex.items-center.gap-3
        .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:package-bold" size="24" style="color: #7849ff")
        div
          h1.text-2xl.font-bold.text-gradient {{ product.name }}
          .flex.items-center.gap-3.mt-1
            span.text-sm(v-if="product.sku" style="color: var(--text-muted)") {{ $t('inventory.sku') }}: {{ product.sku }}
            el-tag(v-if="product.category" size="small" effect="dark" round class="!bg-purple-500/20 !border-purple-500/30 !text-white") {{ product.category }}
            el-tag(:type="stockStatusType" size="small" round) {{ stockStatusLabel }}
    div(v-else)
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('inventory.detail.notFound') }}

  template(v-if="loading")
    .glass-card.p-12.text-center
      el-skeleton(:rows="6" animated)

  template(v-else-if="product")
    .grid.gap-8(class="grid-cols-1 lg:grid-cols-3")
      //- Main Info (2 columns)
      .space-y-8(class="lg:col-span-2")
        //- Product Details
        .glass-card.p-8.rounded-3xl
          .flex.items-center.gap-2.mb-6
            Icon(name="ph:info-bold" size="22" class="text-purple-400")
            h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('inventory.detail.productDetails') }}

          .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
            .info-field
              .field-label
                Icon(name="ph:text-t-bold" size="18" class="mr-2")
                span {{ $t('inventory.name') }}
              p.field-value {{ product.name }}

            .info-field
              .field-label
                Icon(name="ph:barcode-bold" size="18" class="mr-2")
                span {{ $t('inventory.sku') }}
              p.field-value {{ product.sku || '---' }}

            .info-field
              .field-label
                Icon(name="ph:folder-bold" size="18" class="mr-2")
                span {{ $t('inventory.category') }}
              p.field-value {{ product.category || '---' }}

            .info-field
              .field-label
                Icon(name="ph:warehouse-bold" size="18" class="mr-2")
                span {{ $t('inventory.warehouse') }}
              p.field-value {{ product.warehouse || '---' }}

          .mt-6(v-if="product.description")
            .field-label.mb-2
              Icon(name="ph:note-pencil-bold" size="18" class="mr-2")
              span {{ $t('inventory.description') }}
            p.field-value.leading-relaxed {{ product.description }}

        //- Stock & Pricing
        .glass-card.p-8.rounded-3xl
          .flex.items-center.gap-2.mb-6
            Icon(name="ph:chart-bar-bold" size="22" class="text-green-400")
            h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('inventory.detail.stockAndPricing') }}

          .grid.gap-6(class="grid-cols-1 md:grid-cols-3")
            .stat-card.p-5.rounded-2xl
              .text-xs.uppercase.tracking-wider.font-semibold.mb-2(style="color: var(--text-muted)") {{ $t('inventory.quantity') }}
              .text-3xl.font-black(:style="{ color: isLowStock ? '#ef4444' : 'var(--text-primary)' }") {{ product.quantity ?? 0 }}
              .text-xs.mt-1(v-if="isLowStock" style="color: #ef4444") {{ $t('inventory.lowStock') }}

            .stat-card.p-5.rounded-2xl
              .text-xs.uppercase.tracking-wider.font-semibold.mb-2(style="color: var(--text-muted)") {{ $t('inventory.detail.sellingPrice') }}
              .text-3xl.font-black(style="color: var(--text-primary)") {{ formatCurrency(product.price) }}

            .stat-card.p-5.rounded-2xl
              .text-xs.uppercase.tracking-wider.font-semibold.mb-2(style="color: var(--text-muted)") {{ $t('inventory.detail.totalValue') }}
              .text-3xl.font-black.text-gradient {{ formatCurrency((product.quantity ?? 0) * (product.price ?? 0)) }}

          .grid.gap-6.mt-6(class="grid-cols-1 md:grid-cols-2")
            .info-field
              .field-label
                Icon(name="ph:warning-bold" size="18" class="mr-2")
                span {{ $t('inventory.detail.reorderPoint') }}
              p.field-value {{ product.reorderPoint ?? 5 }}

            .info-field
              .field-label
                Icon(name="ph:ruler-bold" size="18" class="mr-2")
                span {{ $t('inventory.unit') }}
              p.field-value {{ product.unit || '---' }}

      //- Sidebar
      .space-y-8
        //- Quick Info Card
        .glass-card.p-6.rounded-3xl
          .flex.items-center.gap-3.mb-6
            Icon(name="ph:clock-bold" size="20" class="text-purple-400")
            span.text-xs.uppercase.font-bold.tracking-widest(style="color: var(--text-muted)") {{ $t('inventory.detail.timestamps') }}

          .space-y-4
            .meta-item
              .text-xs(style="color: var(--text-muted)") {{ $t('procurement.detail.created') }}
              .font-bold(style="color: var(--text-primary)") {{ formatDate(product.createdAt) }}

            .meta-item
              .text-xs(style="color: var(--text-muted)") {{ $t('procurement.detail.lastUpdated') }}
              .font-bold(style="color: var(--text-primary)") {{ formatDate(product.updatedAt) }}

    //- Stock Movement History
    .glass-card.p-8.rounded-3xl.mt-8
      .flex.items-center.gap-2.mb-6
        Icon(name="ph:swap-bold" size="22" class="text-orange-400")
        h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('inventory.detail.movementHistory') }}

      template(v-if="movements.length")
        el-table(:data="movements" style="width: 100%" class="premium-table")
          el-table-column(:label="$t('inventory.detail.movementType')" width="140")
            template(#default="{ row }")
              el-tag(:type="getMovementType(row.type)" size="small" round) {{ getMovementLabel(row.type) }}
          el-table-column(:label="$t('inventory.quantity')" width="120" align="center")
            template(#default="{ row }")
              span.font-bold(:class="row.type === 'OUT' ? 'text-red-400' : 'text-green-400'")
                | {{ row.type === 'OUT' ? '-' : '+' }}{{ row.quantity }}
          el-table-column(:label="$t('inventory.detail.notes')" min-width="200")
            template(#default="{ row }")
              span {{ row.notes || '---' }}
          el-table-column(:label="$t('inventory.detail.date')" width="160")
            template(#default="{ row }")
              span {{ formatDate(row.createdAt) }}

      template(v-else)
        .text-center.py-8
          Icon(name="ph:swap-bold" size="48" style="color: var(--text-muted)")
          p.mt-2(style="color: var(--text-muted)") {{ $t('inventory.detail.noMovements') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useInventory } from '~/composables/useInventory';
import { useSafeBack } from '~/composables/useSafeBack';

interface InventoryProduct {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  warehouse?: string;
  description?: string;
  quantity?: number;
  price?: number;
  reorderPoint?: number;
  unit?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  notes?: string;
  createdAt: string;
}

definePageMeta({ middleware: 'permissions' });

const route = useRoute();
const { t } = useI18n();
const { goBack } = useSafeBack('/inventory');
const { fetchProduct, fetchMovements } = useInventory();

const loading = ref(true);
const product = ref<InventoryProduct | null>(null);
const movements = ref<StockMovement[]>([]);

const isLowStock = computed(() => {
  if (!product.value) return false;
  return (product.value.quantity ?? 0) <= (product.value.reorderPoint ?? 5);
});

const stockStatusType = computed(() => (isLowStock.value ? 'danger' : 'success'));

const stockStatusLabel = computed(() => (isLowStock.value ? t('inventory.lowStock') : t('inventory.inStock')));

function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return 'SAR 0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}

function getMovementType(type: string): string {
  switch (type) {
    case 'IN':
      return 'success';
    case 'OUT':
      return 'danger';
    case 'ADJUSTMENT':
      return 'warning';
    case 'TRANSFER':
      return 'info';
    default:
      return 'info';
  }
}

function getMovementLabel(type: string): string {
  switch (type) {
    case 'IN':
      return t('inventory.stockIn');
    case 'OUT':
      return t('inventory.stockOut');
    case 'ADJUSTMENT':
      return t('inventory.adjustment');
    case 'TRANSFER':
      return t('inventory.transfer');
    default:
      return type;
  }
}

onMounted(async () => {
  const productId = Number(route.params.id);

  try {
    const res = await fetchProduct(productId);
    if (res.success && res.body) {
      product.value = res.body as InventoryProduct;
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: t('inventory.detail.loadError') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('inventory.detail.loadError') });
  }

  // Fetch stock movements
  try {
    const movRes = await fetchMovements(productId);
    if (movRes.success && movRes.body) {
      const body = movRes.body as { docs?: StockMovement[] } | StockMovement[];
      movements.value = Array.isArray(body) ? body : body.docs || [];
    }
  } catch {
    // Silently handle - movements are supplementary
  }

  loading.value = false;
});
</script>

<style scoped>
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.info-field {
  margin-bottom: 0;
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.field-value {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.meta-item + .meta-item {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.premium-btn-outline {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}
.premium-btn-outline:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.premium-table {
  :deep(.el-table) {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
  }
  :deep(th.el-table__cell) {
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--text-secondary);
    background: rgba(168, 85, 247, 0.05) !important;
  }
  :deep(td.el-table__cell) {
    border-bottom: 1px solid rgba(168, 85, 247, 0.05) !important;
  }
}
</style>
