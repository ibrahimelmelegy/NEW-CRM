<template lang="pug">
div.p-4.space-y-6.animate-fade-in(class="md_p-6")
  //- Header
  .flex.flex-col.gap-4(class="md_flex-row md_items-center md_justify-between")
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary);") {{ $t('ecommerce.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('ecommerce.subtitle') }}
    .flex.flex-wrap.gap-2
      el-button(type="primary" size="large" @click="navigateTo('/e-commerce/products?action=new')" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16")
        span.ms-1 {{ $t('ecommerce.newProduct') }}
      el-button(size="large" @click="navigateTo('/e-commerce/orders/create')" class="!rounded-xl")
        Icon(name="ph:shopping-cart-bold" size="16")
        span.ms-1 {{ $t('ecommerce.newOrder') }}
      el-button(size="large" @click="showCouponDialog = true" class="!rounded-xl")
        Icon(name="ph:ticket-bold" size="16")
        span.ms-1 {{ $t('ecommerce.createCoupon') }}

  //- KPI Cards -- all wired to real analytics data
  .grid.grid-cols-1.gap-4(class="sm_grid-cols-2 lg_grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:currency-dollar-bold" size="20" style="color: #22c55e")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.totalRevenue') }}
          p.text-2xl.font-black.mt-1(style="color: #22c55e;") {{ formatCurrency(kpi.totalRevenue) }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:shopping-bag-bold" size="20" style="color: #7849ff")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.totalOrders') }}
          p.text-2xl.font-black.mt-1(style="color: #7849ff;") {{ kpi.totalOrders }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:package-bold" size="20" style="color: #3b82f6")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.activeProducts') }}
          p.text-2xl.font-black.mt-1(style="color: #3b82f6;") {{ kpi.activeProducts }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:chart-line-up-bold" size="20" style="color: #f59e0b")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.conversionRate') }}
          p.text-2xl.font-black.mt-1(style="color: #f59e0b;") {{ kpi.conversionRate }}%

  //- Charts Row
  .grid.grid-cols-1.gap-6(class="lg_grid-cols-2")
    //- Revenue Chart -- real data from analytics
    .rounded-2xl.border.p-5(style="border-color: var(--border-default); background: var(--bg-elevated);")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary);")
        Icon(name="ph:chart-bar-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('ecommerce.revenueOverview') }}
      .flex.items-end.gap-3.h-48
        .flex.flex-col.items-center.flex-1(v-for="(bar, idx) in revenueChartData" :key="idx")
          .w-full.rounded-t-lg.transition-all.duration-300(
            :style="{ height: bar.height + '%', background: 'linear-gradient(180deg, #7849ff 0%, #a78bfa 100%)', minHeight: '4px' }"
            class="hover_opacity-80"
          )
          p.text-xs.mt-2.text-center.font-medium(style="color: var(--text-muted);") {{ bar.label }}
          p.text-xs.text-center.font-bold(style="color: var(--text-primary);") {{ formatCompact(bar.value) }}

    //- Order Status Donut -- real counts from analytics
    .rounded-2xl.border.p-5(style="border-color: var(--border-default); background: var(--bg-elevated);")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary);")
        Icon(name="ph:chart-donut-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('ecommerce.orderStatus') }}
      .flex.items-center.justify-center.gap-8
        //- CSS Donut
        .relative.w-40.h-40
          svg.w-full.h-full(viewBox="0 0 36 36")
            circle(
              cx="18" cy="18" r="15.915"
              fill="none"
              stroke="#e5e7eb"
              stroke-width="3"
            )
            circle(
              v-for="(segment, idx) in donutSegments"
              :key="idx"
              cx="18" cy="18" r="15.915"
              fill="none"
              :stroke="segment.color"
              stroke-width="3"
              :stroke-dasharray="segment.dash"
              :stroke-dashoffset="segment.offset"
              stroke-linecap="round"
              style="transition: all 0.6s ease"
            )
          .absolute.inset-0.flex.flex-col.items-center.justify-center
            p.text-2xl.font-black(style="color: var(--text-primary);") {{ kpi.totalOrders }}
            p.text-xs(style="color: var(--text-muted);") {{ $t('ecommerce.orders') }}
        //- Legend
        .space-y-3
          .flex.items-center.gap-2(v-for="(item, idx) in orderStatusData" :key="idx")
            .w-3.h-3.rounded-full(:style="{ backgroundColor: item.color }")
            .text-sm
              span.font-medium(style="color: var(--text-primary);") {{ item.label }}
              span.ml-2.font-bold(style="color: var(--text-muted);") {{ item.count }}

  //- Recent Orders
  .rounded-2xl.border.overflow-hidden(style="border-color: var(--border-default); background: var(--bg-elevated);")
    .flex.items-center.justify-between.p-5.border-b(style="border-color: var(--border-default);")
      span.font-bold.text-lg(style="color: var(--text-primary);")
        Icon(name="ph:receipt-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('ecommerce.recentOrders') }}
      el-button(text type="primary" @click="navigateTo('/e-commerce/orders')") {{ $t('common.viewAll') }}
    el-table(
      :data="recentOrders"
      v-loading="loadingOrders"
      style="width: 100%"
      :row-style="{ cursor: 'pointer' }"
      @row-click="(row: any) => navigateTo(`/e-commerce/orders/${row.id}`)"
    )
      el-table-column(:label="$t('ecommerce.orderNumber')" width="160")
        template(#default="{ row }")
          span.font-mono.font-bold(style="color: #7849ff;") {{ row.orderNumber || row.documentNumber || `#${row.id?.slice(-6) || '--'}` }}
      el-table-column(:label="$t('ecommerce.client')" min-width="180")
        template(#default="{ row }")
          span.font-medium(style="color: var(--text-primary);") {{ row.clientName || row.client?.clientName || row.client?.name || '--' }}
      el-table-column(:label="$t('common.status')" width="140" align="center")
        template(#default="{ row }")
          el-tag(
            :type="getOrderStatusType(row.status)"
            size="small"
            effect="dark"
            round
          ) {{ row.status || 'Draft' }}
      el-table-column(:label="$t('ecommerce.total')" width="140" align="right")
        template(#default="{ row }")
          span.font-bold(style="color: var(--text-primary);") {{ formatCurrency(row.totalAmount || row.total || 0) }}
      el-table-column(:label="$t('common.date')" width="140")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted);") {{ formatDate(row.createdAt) }}
      template(#empty)
        .text-center.py-8
          Icon(name="ph:receipt" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.noOrders') }}

  //- Top Products & Low Stock
  .grid.grid-cols-1.gap-6(class="lg_grid-cols-2")
    //- Top Products
    .rounded-2xl.border.p-5(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.justify-between.mb-4
        h3.font-bold.text-lg(style="color: var(--text-primary);")
          Icon(name="ph:star-bold" size="20" class="mr-2" style="color: #f59e0b")
          | {{ $t('ecommerce.topProducts') }}
        el-button(text type="primary" @click="navigateTo('/e-commerce/products')") {{ $t('common.viewAll') }}
      .space-y-3(v-loading="loadingProducts")
        .flex.items-center.gap-3.p-3.rounded-xl.transition-all(
          v-for="prod in topProducts"
          :key="prod.id"
          style="background: var(--bg-base);"
          class="hover_shadow-md cursor-pointer"
          @click="navigateTo(`/e-commerce/products/${prod.id}`)"
        )
          .w-10.h-10.rounded-lg.flex.items-center.justify-center.flex-shrink-0(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);")
            Icon(name="ph:package-bold" size="20" style="color: #7849ff;")
          .flex-1.min-w-0
            p.font-bold.text-sm.truncate(style="color: var(--text-primary);") {{ prod.name }}
            div.flex.items-center.gap-2(class="mt-0.5")
              el-tag(size="small" effect="plain" round) {{ prod.category || 'General' }}
              .w-2.h-2.rounded-full(:style="{ backgroundColor: prod.isActive ? '#22c55e' : '#ef4444' }")
          span.font-black.text-sm.flex-shrink-0(style="color: #7c3aed;") {{ formatCurrency(prod.unitPrice || 0) }}
        .text-center.py-6(v-if="!loadingProducts && topProducts.length === 0")
          Icon(name="ph:package" size="36" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.noProducts') }}

    //- Low Stock Alerts
    .rounded-2xl.border.p-5(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.justify-between.mb-4
        h3.font-bold.text-lg(style="color: var(--text-primary);")
          Icon(name="ph:warning-bold" size="20" class="mr-2" style="color: #ef4444")
          | {{ $t('ecommerce.lowStockAlerts') }}
        el-button(text type="primary" @click="navigateTo('/inventory')") {{ $t('common.viewAll') }}
      .space-y-3(v-loading="loadingLowStock")
        .flex.items-center.gap-3.p-3.rounded-xl(
          v-for="item in lowStockItems"
          :key="item.id"
          style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15);"
        )
          .w-10.h-10.rounded-lg.flex.items-center.justify-center.flex-shrink-0(style="background: rgba(239, 68, 68, 0.15)")
            Icon(name="ph:warning-bold" size="20" style="color: #ef4444;")
          .flex-1.min-w-0
            p.font-bold.text-sm.truncate(style="color: var(--text-primary);") {{ item.name }}
            p.text-xs(style="color: var(--text-muted);") {{ $t('ecommerce.reorderPoint') }}: {{ item.reorderPoint || 5 }}
          .text-right.flex-shrink-0
            p.text-lg.font-black(style="color: #ef4444;") {{ item.quantity ?? item.stock ?? 0 }}
            p.text-xs(style="color: var(--text-muted);") {{ $t('ecommerce.inStock') }}
        .text-center.py-6(v-if="!loadingLowStock && lowStockItems.length === 0")
          Icon(name="ph:check-circle" size="36" style="color: #22c55e")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.noLowStock') }}

  //- Quick Stats Footer
  .grid.grid-cols-1.gap-4(class="sm_grid-cols-3")
    .p-4.rounded-2xl.border.flex.items-center.gap-3(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(168, 85, 247, 0.15)")
        Icon(name="ph:ticket-bold" size="20" style="color: #a855f7")
      div
        p.text-xl.font-black(style="color: var(--text-primary);") {{ kpi.activeCoupons }}
        p.text-xs(style="color: var(--text-muted);") {{ $t('ecommerce.activeCoupons') }}
    .p-4.rounded-2xl.border.flex.items-center.gap-3(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(251, 191, 36, 0.15)")
        Icon(name="ph:star-bold" size="20" style="color: #fbbf24")
      div
        p.text-xl.font-black(style="color: var(--text-primary);") {{ kpi.pendingReviews }}
        p.text-xs(style="color: var(--text-muted);") {{ $t('ecommerce.pendingReviews') }}
    .p-4.rounded-2xl.border.flex.items-center.gap-3(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.15)")
        Icon(name="ph:shopping-cart-simple-bold" size="20" style="color: #ef4444")
      div
        p.text-xl.font-black(style="color: var(--text-primary);") {{ kpi.abandonedCarts }}
        p.text-xs(style="color: var(--text-muted);") {{ $t('ecommerce.abandonedCarts') }}

  //- Create Coupon Dialog
  el-dialog(v-model="showCouponDialog" :title="$t('ecommerce.createCoupon')" width="500px" :close-on-click-modal="false")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('ecommerce.couponCode')")
        el-input(v-model="couponForm.code" placeholder="SAVE20")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('ecommerce.discountType')")
          el-select(v-model="couponForm.discountType" class="w-full")
            el-option(:label="$t('common.percentage')" value="percentage")
            el-option(:label="$t('common.fixedAmount')" value="fixed")
        el-form-item(:label="$t('ecommerce.discountValue')")
          el-input-number(v-model="couponForm.discountValue" :min="0" class="!w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('ecommerce.startDate')")
          el-date-picker(v-model="couponForm.startDate" type="date" style="width: 100%" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('ecommerce.endDate')")
          el-date-picker(v-model="couponForm.endDate" type="date" style="width: 100%" value-format="YYYY-MM-DD")
      el-form-item(:label="$t('ecommerce.usageLimit')")
        el-input-number(v-model="couponForm.usageLimit" :min="0" class="!w-full")
      el-form-item
        el-checkbox(v-model="couponForm.isActive") {{ $t('ecommerce.active') }}
    template(#footer)
      el-button(@click="showCouponDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingCoupon" @click="saveCoupon" class="!rounded-xl") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { fetchProducts, type CatalogProduct } from '~/composables/useProductCatalog';
import { fetchCoupons, fetchReviews, fetchCarts, fetchAbandonedCarts, CouponStatusEnum, ReviewStatusEnum } from '~/composables/useEcommerce';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Loading states
const loadingOrders = ref(false);
const loadingProducts = ref(false);
const loadingLowStock = ref(false);
const savingCoupon = ref(false);

// Reactive KPIs from real API data
const kpi = reactive({
  totalRevenue: 0,
  totalOrders: 0,
  activeProducts: 0,
  conversionRate: 0,
  activeCoupons: 0,
  pendingReviews: 0,
  abandonedCarts: 0,
  totalCarts: 0,
  convertedCarts: 0,
  ordersByStatus: {} as Record<string, number>,
  revenueByDayOfWeek: {} as Record<string, number>
});

// Data
const recentOrders = ref<any[]>([]);
const allProducts = ref<CatalogProduct[]>([]);
const lowStockItems = ref<any[]>([]);

// Coupon dialog
const showCouponDialog = ref(false);
const couponForm = reactive({
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  startDate: '',
  endDate: '',
  usageLimit: 100,
  isActive: true
});

const topProducts = computed(() => {
  return [...allProducts.value]
    .filter(p => p.isActive)
    .sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0))
    .slice(0, 5);
});

// Revenue chart -- driven by real analytics API data
const revenueChartData = computed(() => {
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = kpi.revenueByDayOfWeek;
  const values = dayOrder.map(d => data[d] || 0);
  const maxVal = Math.max(...values, 1);
  return dayOrder.map((label, i) => ({
    label,
    value: values[i]!,
    height: Math.max((values[i]! / maxVal) * 100, 5)
  }));
});

// Order status donut -- driven by real analytics API data
const orderStatusData = computed(() => {
  const statuses = [
    { key: 'CONFIRMED', label: t('ecommerce.confirmed'), color: '#22c55e' },
    { key: 'DRAFT', label: t('ecommerce.pending'), color: '#f59e0b' },
    { key: 'PROCESSING', label: t('ecommerce.processing'), color: '#3b82f6' },
    { key: 'SHIPPED', label: t('ecommerce.shipped'), color: '#7849ff' },
    { key: 'CANCELLED', label: t('ecommerce.cancelled'), color: '#ef4444' }
  ];
  return statuses.map(s => ({
    ...s,
    count: kpi.ordersByStatus[s.key] || 0
  }));
});

const donutSegments = computed(() => {
  const totalStatusCount = orderStatusData.value.reduce((sum, s) => sum + s.count, 0) || 1;
  const circumference = 100;
  let cumulativeOffset = 25; // Start from top
  return orderStatusData.value
    .filter(s => s.count > 0)
    .map(s => {
      const pct = (s.count / totalStatusCount) * circumference;
      const segment = {
        color: s.color,
        dash: `${pct} ${circumference - pct}`,
        offset: String(-cumulativeOffset)
      };
      cumulativeOffset += pct;
      return segment;
    });
});

// Helpers
function getOrderStatusType(status: string): string {
  const map: Record<string, string> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    PROCESSING: 'primary',
    SHIPPED: '',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    DRAFT: 'info'
  };
  return map[(status || '').toUpperCase()] || 'info';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    amount || 0
  );
}

function formatCompact(amount: number): string {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
  return String(amount);
}

// Data fetching
async function loadDashboardData() {
  await Promise.all([loadAnalytics(), loadProducts(), loadLowStock(), loadQuickStats()]);
}

/**
 * Load order analytics from the real backend endpoint.
 * This replaces the old approach of fetching 50 orders and computing client-side.
 */
async function loadAnalytics() {
  loadingOrders.value = true;
  try {
    const { body, success } = await useApiFetch('sales-orders/analytics');
    if (success && body) {
      const data = body as any;
      kpi.totalRevenue = Number(data.totalRevenue || 0);
      kpi.totalOrders = Number(data.totalOrders || 0);
      kpi.ordersByStatus = data.ordersByStatus || {};
      kpi.revenueByDayOfWeek = data.revenueByDayOfWeek || {};

      // Recent orders from analytics response
      recentOrders.value = (data.recentOrders || []).slice(0, 5);
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingOrders.value = false;
  }
}

async function loadProducts() {
  loadingProducts.value = true;
  try {
    const result = await fetchProducts({ limit: '50', isActive: 'true' });
    allProducts.value = result.docs || [];
    kpi.activeProducts = result.pagination?.totalItems ?? allProducts.value.length;
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingProducts.value = false;
  }
}

async function loadLowStock() {
  loadingLowStock.value = true;
  try {
    const res = await useApiFetch('catalog/products/low-stock');
    if (res?.success && res.body) {
      const data = res.body as any;
      lowStockItems.value = (data?.docs || data?.rows || data || []).slice(0, 5);
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingLowStock.value = false;
  }
}

async function loadQuickStats() {
  try {
    const [couponsResult, reviewsResult, cartsResult, abandonedResult] = await Promise.allSettled([
      fetchCoupons({ status: CouponStatusEnum.ACTIVE, limit: '1' } as Record<string, string>),
      fetchReviews({ status: ReviewStatusEnum.PENDING, limit: '1' } as Record<string, string>),
      fetchCarts({ limit: '1' }),
      fetchAbandonedCarts({ limit: '1' })
    ]);
    if (couponsResult.status === 'fulfilled') {
      kpi.activeCoupons = couponsResult.value.pagination?.totalItems ?? 0;
    }
    if (reviewsResult.status === 'fulfilled') {
      kpi.pendingReviews = reviewsResult.value.pagination?.totalItems ?? 0;
    }
    if (cartsResult.status === 'fulfilled') {
      kpi.totalCarts = cartsResult.value.pagination?.totalItems ?? 0;
    }
    if (abandonedResult.status === 'fulfilled') {
      kpi.abandonedCarts = abandonedResult.value.pagination?.totalItems ?? 0;
    }
    kpi.convertedCarts = Math.max(kpi.totalCarts - kpi.abandonedCarts, 0);
    kpi.conversionRate = kpi.totalCarts > 0 ? Math.round((kpi.convertedCarts / kpi.totalCarts) * 100) : 0;
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

async function saveCoupon() {
  if (!couponForm.code.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  savingCoupon.value = true;
  try {
    const res = await useApiFetch('ecommerce/coupons', 'POST', { ...couponForm });
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showCouponDialog.value = false;
      couponForm.code = '';
      couponForm.discountValue = 10;
      couponForm.usageLimit = 100;
      kpi.activeCoupons++;
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    savingCoupon.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
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
</style>
