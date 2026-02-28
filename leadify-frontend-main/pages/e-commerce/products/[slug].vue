<template lang="pug">
div.p-4.space-y-6.animate-fade-in(class="md_p-6")
  //- Breadcrumb
  el-breadcrumb(separator="/")
    el-breadcrumb-item(:to="{ path: '/e-commerce' }") {{ $t('ecommerce.title') }}
    el-breadcrumb-item(:to="{ path: '/e-commerce/products' }") {{ $t('ecommerce.products.title') }}
    el-breadcrumb-item {{ product?.name || $t('common.loading') }}

  //- Loading State
  div(v-loading="loading" v-if="loading" style="min-height: 400px;")

  //- Not Found
  .text-center.py-16(v-else-if="!product && !loading")
    Icon(name="ph:warning" size="64" style="color: var(--text-muted);")
    h2.text-xl.font-bold.mt-4(style="color: var(--text-primary);") {{ $t('ecommerce.products.productNotFound') }}
    p.text-sm.mt-2(style="color: var(--text-muted);") {{ $t('ecommerce.products.productNotFoundDesc') }}
    el-button.mt-4(type="primary" @click="navigateTo('/e-commerce/products')" class="!rounded-xl")
      Icon(name="ph:arrow-left-bold" size="16" class="mr-1")
      | {{ $t('ecommerce.products.backToProducts') }}

  //- Product Content
  template(v-else-if="product")
    //- Header with Actions
    .flex.flex-col.gap-4(class="md_flex-row md_items-center md_justify-between")
      .flex.items-center.gap-3
        .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:package-bold" size="24" style="color: #7849ff")
        div
          h1.text-2xl.font-bold(style="color: var(--text-primary);") {{ product.name }}
          .flex.items-center.gap-2.mt-1
            el-tag(size="small" round effect="plain") {{ product.category || 'General' }}
            el-tag(
              :type="product.isActive ? 'success' : 'danger'"
              size="small"
              effect="dark"
              round
            ) {{ product.isActive ? $t('ecommerce.products.active') : $t('ecommerce.products.inactive') }}
            span.text-xs.font-mono(style="color: var(--text-muted);") SKU: {{ product.sku || '--' }}
      .flex.items-center.gap-2
        el-button(size="large" @click="navigateTo('/e-commerce/products')" class="!rounded-xl")
          Icon(name="ph:arrow-left-bold" size="16" class="mr-1")
          | {{ $t('common.back') }}
        el-button(type="danger" size="large" plain @click="showDeleteConfirm = true" class="!rounded-xl")
          Icon(name="ph:trash-bold" size="16" class="mr-1")
          | {{ $t('common.delete') }}
        el-button(type="primary" size="large" :loading="saving" @click="handleSave" class="!rounded-xl")
          Icon(name="ph:floppy-disk-bold" size="16" class="mr-1")
          | {{ $t('common.save') }}

    //- Product Info Section
    .grid.grid-cols-1.gap-6(class="lg_grid-cols-3")
      //- Image Section (Left)
      .rounded-2xl.border.overflow-hidden(style="border-color: var(--border-default); background: var(--bg-elevated);")
        .h-64.flex.items-center.justify-center.relative(
          style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);"
          class="lg_h-80"
        )
          Icon(name="ph:image-bold" size="64" style="color: #7849ff; opacity: 0.4;")
          .absolute.inset-0.flex.items-center.justify-center.opacity-0.transition-opacity(
            class="hover_opacity-100"
            style="background: rgba(0,0,0,0.2); cursor: pointer;"
          )
            .text-center
              Icon(name="ph:upload-bold" size="32" style="color: white;")
              p.text-sm.mt-2(style="color: white;") {{ $t('ecommerce.products.uploadImage') }}
        .p-4
          p.text-xs.text-center(style="color: var(--text-muted);") {{ $t('ecommerce.products.imageHint') }}

      //- Details Form (Right - spans 2 cols)
      .rounded-2xl.border.p-5(class="lg_col-span-2" style="border-color: var(--border-default); background: var(--bg-elevated);")
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary);")
          Icon(name="ph:info-bold" size="20" class="mr-2" style="color: #7849ff")
          | {{ $t('ecommerce.products.productDetails') }}
        el-form(ref="formRef" :model="form" :rules="formRules" label-position="top" size="large")
          el-form-item(:label="$t('ecommerce.products.productName')" prop="name")
            el-input(v-model="form.name")
          .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
            el-form-item(:label="$t('ecommerce.products.sku')")
              el-input(v-model="form.sku" placeholder="SKU-001")
            el-form-item(:label="$t('common.category')")
              el-select(v-model="form.category" class="w-full" allow-create filterable)
                el-option(v-for="cat in categories" :key="cat" :value="cat" :label="cat")
          .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
            el-form-item(:label="$t('ecommerce.products.price')" prop="unitPrice")
              el-input-number(v-model="form.unitPrice" :min="0" :precision="2" class="!w-full")
            el-form-item(:label="$t('ecommerce.products.currency')")
              el-select(v-model="form.currency" class="w-full")
                el-option(label="SAR" value="SAR")
                el-option(label="USD" value="USD")
                el-option(label="EUR" value="EUR")
                el-option(label="GBP" value="GBP")
          el-form-item(:label="$t('common.description')")
            el-input(v-model="form.description" type="textarea" :rows="4")
          el-form-item
            el-switch(v-model="form.isActive" :active-text="$t('ecommerce.products.active')" :inactive-text="$t('ecommerce.products.inactive')")

    //- Tabs Section
    el-tabs(v-model="activeTab" type="border-card" class="product-tabs")
      //- Overview Tab
      el-tab-pane(:label="$t('ecommerce.products.overview')" name="overview")
        .grid.grid-cols-1.gap-6(class="md_grid-cols-2")
          //- Product Metadata
          .rounded-xl.p-5(style="background: var(--bg-base); border: 1px solid var(--border-default);")
            h4.font-bold.mb-4(style="color: var(--text-primary);")
              Icon(name="ph:list-bullets-bold" size="18" class="mr-2" style="color: #7849ff")
              | {{ $t('ecommerce.products.metadata') }}
            .space-y-3
              .flex.items-center.justify-between.py-2.border-b(style="border-color: var(--border-default);")
                span.text-sm(style="color: var(--text-muted);") {{ $t('ecommerce.products.productId') }}
                span.text-sm.font-mono.font-bold(style="color: var(--text-primary);") {{ product.id }}
              .flex.items-center.justify-between.py-2.border-b(style="border-color: var(--border-default);")
                span.text-sm(style="color: var(--text-muted);") {{ $t('ecommerce.products.createdAt') }}
                span.text-sm(style="color: var(--text-primary);") {{ formatDate(product.createdAt) }}
              .flex.items-center.justify-between.py-2.border-b(style="border-color: var(--border-default);")
                span.text-sm(style="color: var(--text-muted);") {{ $t('ecommerce.products.updatedAt') }}
                span.text-sm(style="color: var(--text-primary);") {{ formatDate(product.updatedAt) }}
              .flex.items-center.justify-between.py-2
                span.text-sm(style="color: var(--text-muted);") {{ $t('common.status') }}
                el-tag(:type="product.isActive ? 'success' : 'danger'" size="small" effect="dark" round) {{ product.isActive ? 'Active' : 'Inactive' }}

          //- Pricing Summary
          .rounded-xl.p-5(style="background: var(--bg-base); border: 1px solid var(--border-default);")
            h4.font-bold.mb-4(style="color: var(--text-primary);")
              Icon(name="ph:money-bold" size="18" class="mr-2" style="color: #22c55e")
              | {{ $t('ecommerce.products.pricingSummary') }}
            .space-y-3
              .flex.items-center.justify-between.py-2.border-b(style="border-color: var(--border-default);")
                span.text-sm(style="color: var(--text-muted);") {{ $t('ecommerce.products.basePrice') }}
                span.text-lg.font-black(style="color: #7c3aed;") {{ formatCurrency(product.unitPrice || 0) }}
              .flex.items-center.justify-between.py-2.border-b(style="border-color: var(--border-default);")
                span.text-sm(style="color: var(--text-muted);") {{ $t('ecommerce.products.currency') }}
                span.text-sm.font-bold(style="color: var(--text-primary);") {{ product.currency || 'SAR' }}
              .flex.items-center.justify-between.py-2
                span.text-sm(style="color: var(--text-muted);") {{ $t('common.category') }}
                el-tag(size="small" round effect="plain") {{ product.category || 'General' }}

      //- Reviews Tab
      el-tab-pane(:label="$t('ecommerce.products.reviews')" name="reviews")
        //- Review Stats
        .grid.grid-cols-1.gap-4.mb-6(class="md_grid-cols-3")
          .rounded-xl.p-5.text-center(style="background: var(--bg-base); border: 1px solid var(--border-default);")
            p.text-4xl.font-black(style="color: #f59e0b;") {{ avgRating.toFixed(1) }}
            .flex.items-center.justify-center.gap-1.mt-1
              Icon(v-for="i in 5" :key="i" name="ph:star-fill" size="16" :style="{ color: i <= Math.round(avgRating) ? '#f59e0b' : '#e5e7eb' }")
            p.text-xs.mt-1(style="color: var(--text-muted);") {{ reviews.length }} {{ $t('ecommerce.products.totalReviews') }}
          .rounded-xl.p-5(class="md_col-span-2" style="background: var(--bg-base); border: 1px solid var(--border-default);")
            h4.font-bold.mb-3(style="color: var(--text-primary);") {{ $t('ecommerce.products.ratingDistribution') }}
            .space-y-2
              .flex.items-center.gap-3(v-for="star in [5, 4, 3, 2, 1]" :key="star")
                span.text-xs.font-bold.w-8.text-right(style="color: var(--text-muted);") {{ star }}
                Icon(name="ph:star-fill" size="12" style="color: #f59e0b")
                .flex-1.h-3.rounded-full.overflow-hidden(style="background: var(--bg-elevated);")
                  .h-full.rounded-full.transition-all(
                    :style="{ width: ratingDistribution[star] + '%', background: '#f59e0b' }"
                  )
                span.text-xs.font-bold.w-8(style="color: var(--text-muted);") {{ getStarCount(star) }}

        //- Reviews List
        .space-y-3(v-loading="loadingReviews")
          .rounded-xl.p-4(
            v-for="review in reviews"
            :key="review.id"
            style="background: var(--bg-base); border: 1px solid var(--border-default);"
          )
            .flex.items-center.justify-between.mb-2
              .flex.items-center.gap-2
                .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                  Icon(name="ph:user-bold" size="14" style="color: #7849ff")
                span.font-bold.text-sm(style="color: var(--text-primary);") {{ review.customerName || review.author || 'Anonymous' }}
              .flex.items-center.gap-1
                Icon(v-for="i in 5" :key="i" name="ph:star-fill" size="14" :style="{ color: i <= (review.rating || 0) ? '#f59e0b' : '#e5e7eb' }")
            p.text-sm(style="color: var(--text-muted);") {{ review.comment || review.text || $t('ecommerce.products.noComment') }}
            p.text-xs.mt-2(style="color: var(--text-muted);") {{ formatDate(review.createdAt) }}
          .text-center.py-8(v-if="!loadingReviews && reviews.length === 0")
            Icon(name="ph:star" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.products.noReviews') }}

      //- Price Rules Tab
      el-tab-pane(:label="$t('ecommerce.products.priceRules')" name="priceRules")
        .flex.items-center.justify-between.mb-4
          h4.font-bold(style="color: var(--text-primary);") {{ $t('ecommerce.products.priceRulesDesc') }}
          el-button(type="primary" size="default" @click="showPriceRuleDialog = true" class="!rounded-xl")
            Icon(name="ph:plus-bold" size="14" class="mr-1")
            | {{ $t('ecommerce.products.addPriceRule') }}
        el-table(:data="priceRules" v-loading="loadingPriceRules" style="width: 100%")
          el-table-column(:label="$t('ecommerce.products.ruleName')" min-width="180")
            template(#default="{ row }")
              span.font-bold(style="color: var(--text-primary);") {{ row.name || row.ruleName || '--' }}
          el-table-column(:label="$t('ecommerce.products.discountType')" width="140")
            template(#default="{ row }")
              el-tag(size="small" effect="plain" round) {{ row.discountType || row.type || '--' }}
          el-table-column(:label="$t('ecommerce.products.discountValue')" width="120" align="center")
            template(#default="{ row }")
              span.font-bold(style="color: #7c3aed;") {{ row.discountValue || row.value || 0 }}{{ row.discountType === 'percentage' ? '%' : '' }}
          el-table-column(:label="$t('ecommerce.products.validUntil')" width="140")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted);") {{ formatDate(row.validUntil || row.endDate) }}
          el-table-column(:label="$t('common.status')" width="100" align="center")
            template(#default="{ row }")
              el-tag(:type="row.isActive ? 'success' : 'info'" size="small" effect="dark" round) {{ row.isActive ? 'Active' : 'Expired' }}
          template(#empty)
            .text-center.py-8
              Icon(name="ph:tag" size="40" style="color: var(--text-muted)")
              p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.products.noPriceRules') }}

      //- Activity Tab
      el-tab-pane(:label="$t('ecommerce.products.activity')" name="activity")
        .space-y-3(v-loading="loadingActivity")
          .flex.items-start.gap-3.p-3.rounded-xl(
            v-for="(entry, idx) in activityLog"
            :key="idx"
            style="background: var(--bg-base); border: 1px solid var(--border-default);"
          )
            .w-8.h-8.rounded-full.flex.items-center.justify-center.flex-shrink-0(:style="{ background: getActivityColor(entry.type) + '25' }")
              Icon(:name="getActivityIcon(entry.type)" size="14" :style="{ color: getActivityColor(entry.type) }")
            .flex-1.min-w-0
              p.text-sm.font-medium(style="color: var(--text-primary);") {{ entry.description || entry.action || '--' }}
              .flex.items-center.gap-2.mt-1
                span.text-xs(style="color: var(--text-muted);") {{ formatDate(entry.createdAt || entry.date) }}
                span.text-xs(v-if="entry.user || entry.userName" style="color: var(--text-muted);") &middot; {{ entry.userName || entry.user }}
          .text-center.py-8(v-if="!loadingActivity && activityLog.length === 0")
            Icon(name="ph:clock-counter-clockwise" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.products.noActivity') }}

  //- Delete Confirmation Dialog
  el-dialog(v-model="showDeleteConfirm" :title="$t('common.confirm')" width="400px")
    .text-center.py-4
      Icon(name="ph:warning-bold" size="48" style="color: #ef4444;")
      p.mt-4.text-sm(style="color: var(--text-primary);") {{ $t('ecommerce.products.deleteProductConfirm') }}
      p.text-xs.mt-1(style="color: var(--text-muted);") {{ product?.name }}
    template(#footer)
      el-button(@click="showDeleteConfirm = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="deleting" @click="handleDeleteProduct" class="!rounded-xl") {{ $t('common.delete') }}

  //- Price Rule Dialog
  el-dialog(v-model="showPriceRuleDialog" :title="$t('ecommerce.products.addPriceRule')" width="500px" :close-on-click-modal="false")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('ecommerce.products.ruleName')")
        el-input(v-model="priceRuleForm.name" :placeholder="$t('ecommerce.products.ruleNamePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('ecommerce.products.discountType')")
          el-select(v-model="priceRuleForm.discountType" class="w-full")
            el-option(label="Percentage" value="percentage")
            el-option(label="Fixed Amount" value="fixed")
        el-form-item(:label="$t('ecommerce.products.discountValue')")
          el-input-number(v-model="priceRuleForm.discountValue" :min="0" class="!w-full")
      el-form-item(:label="$t('ecommerce.products.validUntil')")
        el-date-picker(v-model="priceRuleForm.validUntil" type="date" style="width: 100%" value-format="YYYY-MM-DD")
      el-form-item
        el-checkbox(v-model="priceRuleForm.isActive") {{ $t('ecommerce.products.active') }}
    template(#footer)
      el-button(@click="showPriceRuleDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingPriceRule" @click="savePriceRule" class="!rounded-xl") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import type { FormRules } from 'element-plus';
import {
  fetchProducts,
  updateProduct,
  deleteProduct,
  type CatalogProduct
} from '~/composables/useProductCatalog';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

const productId = computed(() => route.params.slug as string);

// State
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const loadingReviews = ref(false);
const loadingPriceRules = ref(false);
const loadingActivity = ref(false);
const savingPriceRule = ref(false);

const product = ref<CatalogProduct | null>(null);
const activeTab = ref('overview');
const showDeleteConfirm = ref(false);
const showPriceRuleDialog = ref(false);

// Form
const formRef = ref();
const form = reactive({
  name: '',
  sku: '',
  category: '',
  unitPrice: 0,
  currency: 'SAR',
  description: '',
  isActive: true
});

const formRules: FormRules = {
  name: [{ required: true, message: t('common.fillRequired'), trigger: 'blur' }],
  unitPrice: [{ type: 'number', min: 0, message: t('ecommerce.products.pricePositive'), trigger: 'blur' }]
};

// Categories for select
const categories = ref<string[]>(['Electronics', 'Software', 'Services', 'Hardware', 'Accessories', 'General']);

// Reviews
const reviews = ref<any[]>([]);

const avgRating = computed(() => {
  if (reviews.value.length === 0) return 0;
  const sum = reviews.value.reduce((s, r) => s + (r.rating || 0), 0);
  return sum / reviews.value.length;
});

const ratingDistribution = computed(() => {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const total = reviews.value.length || 1;
  reviews.value.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
    dist[star] = (dist[star] || 0) + 1;
  });
  return {
    1: Math.round(((dist[1] || 0) / total) * 100),
    2: Math.round(((dist[2] || 0) / total) * 100),
    3: Math.round(((dist[3] || 0) / total) * 100),
    4: Math.round(((dist[4] || 0) / total) * 100),
    5: Math.round(((dist[5] || 0) / total) * 100)
  };
});

function getStarCount(star: number): number {
  return reviews.value.filter(r => Math.round(r.rating || 0) === star).length;
}

// Price Rules
const priceRules = ref<any[]>([]);
const priceRuleForm = reactive({
  name: '',
  discountType: 'percentage',
  discountValue: 10,
  validUntil: '',
  isActive: true
});

// Activity
const activityLog = ref<any[]>([]);

// Helpers
function formatDate(dateStr?: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: product.value?.currency || 'SAR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);
}

function getActivityIcon(type: string): string {
  const map: Record<string, string> = {
    created: 'ph:plus-circle-bold',
    updated: 'ph:pencil-bold',
    deleted: 'ph:trash-bold',
    price_change: 'ph:money-bold',
    status_change: 'ph:toggle-right-bold'
  };
  return map[type] || 'ph:clock-bold';
}

function getActivityColor(type: string): string {
  const map: Record<string, string> = {
    created: '#22c55e',
    updated: '#3b82f6',
    deleted: '#ef4444',
    price_change: '#f59e0b',
    status_change: '#7849ff'
  };
  return map[type] || '#6b7280';
}

// Data Loading
async function loadProduct() {
  loading.value = true;
  try {
    const res = await useApiFetch(`catalog/products/${productId.value}`);
    if (res?.success && res.body) {
      product.value = res.body as CatalogProduct;
      // Populate form
      Object.assign(form, {
        name: product.value.name,
        sku: product.value.sku || '',
        category: product.value.category || '',
        unitPrice: product.value.unitPrice || 0,
        currency: product.value.currency || 'SAR',
        description: product.value.description || '',
        isActive: product.value.isActive !== false
      });
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function loadReviews() {
  loadingReviews.value = true;
  try {
    const res = await useApiFetch(`ecommerce/products/${productId.value}/reviews`);
    if (res?.success && res.body) {
      const data = res.body as any;
      reviews.value = data?.docs || data?.rows || data || [];
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingReviews.value = false;
  }
}

async function loadPriceRules() {
  loadingPriceRules.value = true;
  try {
    const res = await useApiFetch(`ecommerce/products/${productId.value}/price-rules`);
    if (res?.success && res.body) {
      const data = res.body as any;
      priceRules.value = data?.docs || data?.rows || data || [];
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingPriceRules.value = false;
  }
}

async function loadActivity() {
  loadingActivity.value = true;
  try {
    const res = await useApiFetch(`ecommerce/products/${productId.value}/activity`);
    if (res?.success && res.body) {
      const data = res.body as any;
      activityLog.value = data?.docs || data?.rows || data || [];
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingActivity.value = false;
  }
}

async function loadCategories() {
  try {
    const res = await useApiFetch('ecommerce/categories');
    if (res?.success && res.body) {
      const data = res.body as any;
      const cats = data?.docs || data?.rows || data || [];
      if (cats.length > 0) {
        categories.value = cats.map((c: any) => c.name || c);
      }
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

// Actions
async function handleSave() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    const res = await updateProduct(productId.value, { ...form });
    if (res.success) {
      // Update local product data
      if (product.value) {
        Object.assign(product.value, form);
      }
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDeleteProduct() {
  deleting.value = true;
  try {
    const res = await deleteProduct(productId.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      navigateTo('/e-commerce/products');
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    deleting.value = false;
  }
}

async function savePriceRule() {
  if (!priceRuleForm.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  savingPriceRule.value = true;
  try {
    const res = await useApiFetch(`ecommerce/products/${productId.value}/price-rules`, 'POST', { ...priceRuleForm });
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showPriceRuleDialog.value = false;
      priceRuleForm.name = '';
      priceRuleForm.discountValue = 10;
      priceRuleForm.validUntil = '';
      await loadPriceRules();
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    savingPriceRule.value = false;
  }
}

onMounted(async () => {
  await loadProduct();
  // Load tab data in parallel
  await Promise.all([loadReviews(), loadPriceRules(), loadActivity(), loadCategories()]);
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

.product-tabs {
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
