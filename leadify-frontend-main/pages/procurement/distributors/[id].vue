<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.gap-4.mb-8
    el-button(circle size="large" @click="goBack" class="premium-btn-outline !w-12 !h-12")
      Icon(name="ph:arrow-left-bold" size="18")
    div(v-if="vendor")
      h1.text-2xl.font-bold.text-gradient {{ vendor.name }}
      .text-sm.mt-1(style="color: var(--text-muted)") {{ $t('procurement.distributors.title') }}
    div(v-else)
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('procurement.detail.notFound') }}

  template(v-if="loading")
    .glass-card.p-12.text-center
      el-skeleton(:rows="6" animated)

  template(v-else-if="vendor")
    .grid.gap-8(class="grid-cols-1 lg:grid-cols-3")
      //- Main Info (2 columns)
      .space-y-8(class="lg:col-span-2")
        //- Business Details
        .glass-card.p-8.rounded-3xl
          .flex.items-center.gap-2.mb-6
            Icon(name="ph:briefcase-bold" size="22" class="text-purple-400")
            h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('procurement.detail.businessDetails') }}

          .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
            .info-field
              .field-label
                Icon(name="ph:buildings-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.companyName') }}
              p.field-value {{ vendor.name }}

            .info-field
              .field-label
                Icon(name="ph:tag-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.entityType') }}
              p.field-value
                el-tag(size="small" effect="dark" round class="!bg-purple-500/20 !border-purple-500/30 !text-white") {{ vendor.type }}

            .info-field
              .field-label
                Icon(name="ph:wrench-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.serviceType') }}
              p.field-value {{ vendor.serviceType || '---' }}

            .info-field
              .field-label
                Icon(name="ph:hash-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.taxId') }}
              p.field-value {{ vendor.taxId || '---' }}

            .info-field
              .field-label
                Icon(name="ph:file-text-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.crNumber') }}
              p.field-value {{ vendor.commercialRegistration || '---' }}

            .info-field
              .field-label
                Icon(name="ph:credit-card-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.paymentMethod') }}
              p.field-value {{ vendor.defaultPaymentMethod || '---' }}

          //- Brands
          .mt-6(v-if="vendor.brands && vendor.brands.length")
            .field-label.mb-3
              Icon(name="ph:trademark-registered-bold" size="18" class="mr-2")
              span {{ $t('procurement.detail.brands') }}
            .flex.flex-wrap.gap-2
              el-tag(v-for="brand in vendor.brands" :key="brand" size="small" effect="dark" round class="!bg-purple-500/15 !border-purple-500/20 !text-purple-300") {{ brand }}

        //- Contact Information
        .glass-card.p-8.rounded-3xl
          .flex.items-center.gap-2.mb-6
            Icon(name="ph:address-book-bold" size="22" class="text-green-400")
            h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('procurement.detail.contactInfo') }}

          .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
            .info-field
              .field-label
                Icon(name="ph:user-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.contactPerson') }}
              p.field-value {{ contactFullName || '---' }}

            .info-field
              .field-label
                Icon(name="ph:phone-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.phone') }}
              p.field-value {{ vendor.phone || '---' }}

            .info-field
              .field-label
                Icon(name="ph:envelope-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.email') }}
              p.field-value {{ vendor.email || '---' }}

        //- Address
        .glass-card.p-8.rounded-3xl(v-if="hasAddress")
          .flex.items-center.gap-2.mb-6
            Icon(name="ph:map-pin-bold" size="22" class="text-red-400")
            h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('procurement.detail.address') }}

          .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
            .info-field(v-if="vendor.address?.street")
              .field-label
                Icon(name="ph:road-horizon-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.street') }}
              p.field-value {{ vendor.address.street }}

            .info-field(v-if="vendor.address?.street2")
              .field-label
                Icon(name="ph:road-horizon-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.street2') }}
              p.field-value {{ vendor.address.street2 }}

            .info-field(v-if="vendor.address?.city")
              .field-label
                Icon(name="ph:buildings-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.city') }}
              p.field-value {{ vendor.address.city }}

            .info-field(v-if="vendor.address?.state")
              .field-label
                Icon(name="ph:map-trifold-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.state') }}
              p.field-value {{ vendor.address.state }}

            .info-field(v-if="vendor.address?.zip")
              .field-label
                Icon(name="ph:mailbox-bold" size="18" class="mr-2")
                span {{ $t('procurement.detail.zip') }}
              p.field-value {{ vendor.address.zip }}

      //- Sidebar
      .space-y-8
        //- Quick Info Card
        .glass-card.p-6.rounded-3xl
          .flex.items-center.gap-3.mb-6
            Icon(name="ph:info-bold" size="20" class="text-purple-400")
            span.text-xs.uppercase.font-bold.tracking-widest(style="color: var(--text-muted)") {{ $t('procurement.detail.quickInfo') }}

          .space-y-4
            .meta-item
              .text-xs(style="color: var(--text-muted)") {{ $t('procurement.detail.created') }}
              .font-bold(style="color: var(--text-primary)") {{ formatDate(vendor.createdAt) }}

            .meta-item
              .text-xs(style="color: var(--text-muted)") {{ $t('procurement.detail.lastUpdated') }}
              .font-bold(style="color: var(--text-primary)") {{ formatDate(vendor.updatedAt) }}

    //- Recent Purchase Orders
    .glass-card.p-8.rounded-3xl.mt-8
      .flex.items-center.gap-2.mb-6
        Icon(name="ph:file-text-bold" size="22" class="text-orange-400")
        h2.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('procurement.detail.recentPurchaseOrders') }}

      template(v-if="purchaseOrders.length")
        el-table(:data="purchaseOrders" style="width: 100%" class="premium-table" :row-style="{cursor:'pointer'}" @row-click="goToPO")
          el-table-column(:label="$t('procurement.purchaseOrders.poNumber')" prop="poNumber" width="160")
          el-table-column(:label="$t('procurement.purchaseOrders.project')" min-width="180")
            template(#default="{ row }")
              span {{ row.project?.name || '---' }}
          el-table-column(:label="$t('procurement.purchaseOrders.amount')" width="140" align="right")
            template(#default="{ row }")
              span.font-bold {{ formatCurrency(row.totalAmount) }}
          el-table-column(:label="$t('procurement.purchaseOrders.status')" width="120" align="center")
            template(#default="{ row }")
              el-tag(:type="getStatusType(row.status)" size="small" round) {{ row.status }}
          el-table-column(:label="$t('procurement.purchaseOrders.date')" width="140")
            template(#default="{ row }")
              span {{ formatDate(row.createdAt) }}

      template(v-else)
        .text-center.py-8
          Icon(name="ph:file-dashed-bold" size="48" style="color: var(--text-muted)")
          p.mt-2(style="color: var(--text-muted)") {{ $t('procurement.detail.noPurchaseOrders') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import { useSafeBack } from '~/composables/useSafeBack';

interface VendorAddress {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface VendorEntity {
  id: number;
  name: string;
  type: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  commercialRegistration?: string;
  serviceType?: string;
  brands?: string[];
  address?: VendorAddress;
  defaultPaymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  project?: { name: string };
}

definePageMeta({ middleware: 'permissions' });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { goBack } = useSafeBack('/procurement/distributors');

const loading = ref(true);
const vendor = ref<VendorEntity | null>(null);
const purchaseOrders = ref<PurchaseOrder[]>([]);

const contactFullName = computed(() => {
  if (!vendor.value) return '';
  const parts = [vendor.value.firstName, vendor.value.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : '';
});

const hasAddress = computed(() => {
  if (!vendor.value?.address) return false;
  const addr = vendor.value.address;
  return addr.street || addr.street2 || addr.city || addr.state || addr.zip;
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatCurrency(amount?: number): string {
  if (!amount) return 'SAR 0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}

function getStatusType(status: string): string {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'Pending':
      return 'warning';
    default:
      return 'info';
  }
}

function goToPO(row: PurchaseOrder) {
  router.push(`/procurement/purchase-orders/${row.id}`);
}

onMounted(async () => {
  try {
    const res = await useApiFetch(`vendor/${route.params.id}`);
    if (res.success && res.body) {
      vendor.value = res.body as VendorEntity;
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: t('procurement.detail.loadError') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('procurement.detail.loadError') });
  }

  // Fetch related purchase orders
  try {
    const poRes = await useApiFetch(`procurement?vendorId=${route.params.id}&limit=10`);
    if (poRes.success && poRes.body) {
      const body = poRes.body as { docs?: PurchaseOrder[] };
      purchaseOrders.value = body.docs || [];
    }
  } catch {
    // Silently handle - POs are supplementary
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
