<template lang="pug">
div.p-4.space-y-6.animate-fade-in(class="md_p-6")
  //- Header
  .flex.flex-col.gap-4(class="md_flex-row md_items-center md_justify-between")
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary);") {{ $t('ecommerce.products.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('ecommerce.products.subtitle') }}
    .flex.items-center.gap-3
      //- View toggle
      .flex.border.rounded-lg.overflow-hidden(style="border-color: var(--border-default);")
        button.px-3.py-2.text-sm.font-medium.transition-colors(
          :style="viewMode === 'grid' ? 'background: #7849ff; color: white;' : 'background: var(--bg-elevated); color: var(--text-muted);'"
          @click="viewMode = 'grid'"
        )
          Icon(name="ph:squares-four-bold" size="16")
        button.px-3.py-2.text-sm.font-medium.transition-colors(
          :style="viewMode === 'list' ? 'background: #7849ff; color: white;' : 'background: var(--bg-elevated); color: var(--text-muted);'"
          @click="viewMode = 'list'"
        )
          Icon(name="ph:list-bold" size="16")
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('ecommerce.products.addProduct') }}

  //- Filters Bar
  .flex.flex-wrap.items-center.gap-3
    el-input(
      v-model="search"
      :placeholder="$t('common.search') + ' ' + $t('ecommerce.products.title') + '...'"
      clearable
      size="large"
      @input="debounceLoad"
      class="!rounded-xl"
      style="max-width: 280px"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
    el-select(
      v-model="categoryFilter"
      clearable
      :placeholder="$t('ecommerce.products.allCategories')"
      @change="resetAndLoad"
      size="large"
      style="width: 180px"
    )
      el-option(v-for="cat in categories" :key="cat.id || cat" :value="cat.name || cat" :label="cat.name || cat")
    el-select(
      v-model="statusFilter"
      clearable
      :placeholder="$t('ecommerce.products.allStatuses')"
      @change="resetAndLoad"
      size="large"
      style="width: 160px"
    )
      el-option(:label="$t('ecommerce.products.active')" value="true")
      el-option(:label="$t('ecommerce.products.inactive')" value="false")
    .flex.items-center.gap-2
      el-input-number(
        v-model="priceMin"
        :min="0"
        :placeholder="$t('ecommerce.products.minPrice')"
        size="large"
        controls-position="right"
        style="width: 120px"
        @change="debounceLoad"
      )
      span.text-sm(style="color: var(--text-muted);") -
      el-input-number(
        v-model="priceMax"
        :min="0"
        :placeholder="$t('ecommerce.products.maxPrice')"
        size="large"
        controls-position="right"
        style="width: 120px"
        @change="debounceLoad"
      )

  //- Stats Row
  .grid.grid-cols-2.gap-4(class="lg_grid-cols-4")
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:package-bold" size="20" style="color: #7849ff")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.products.totalProducts') }}
          p.text-2xl.font-black(class="mt-0.5" style="color: var(--text-primary);") {{ pagination.totalItems }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.products.activeProducts') }}
          p.text-2xl.font-black(class="mt-0.5" style="color: #22c55e;") {{ activeCount }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:tag-bold" size="20" style="color: #3b82f6")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.products.categories') }}
          p.text-2xl.font-black(class="mt-0.5" style="color: #3b82f6;") {{ categories.length }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:money-bold" size="20" style="color: #f59e0b")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.products.inventoryValue') }}
          p.text-2xl.font-black(class="mt-0.5" style="color: #f59e0b;") {{ formatCurrency(inventoryValue) }}

  //- Product Grid View
  div(v-if="viewMode === 'grid'" v-loading="loading")
    .grid.grid-cols-1.gap-4(class="sm_grid-cols-2 lg_grid-cols-3 xl_grid-cols-4")
      .rounded-2xl.border.overflow-hidden.transition-all.group(
        v-for="prod in products"
        :key="prod.id"
        style="border-color: var(--border-default); background: var(--bg-elevated);"
        class="hover_shadow-lg hover_border-violet-200 cursor-pointer"
        @click="navigateTo(`/e-commerce/products/${prod.id}`)"
      )
        //- Image placeholder
        .h-44.flex.items-center.justify-center.relative(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);")
          Icon(name="ph:package-bold" size="52" style="color: #7849ff; opacity: 0.6;")
          //- Hover actions
          .absolute.inset-0.flex.items-center.justify-center.gap-2.opacity-0.transition-opacity(
            class="group-hover_opacity-100"
            style="background: rgba(0,0,0,0.3);"
            @click.stop
          )
            el-button(circle size="large" @click.stop="editProduct(prod)")
              Icon(name="ph:pencil-bold" size="16")
            el-button(circle size="large" type="danger" @click.stop="confirmDeleteProduct(prod)")
              Icon(name="ph:trash-bold" size="16")
          //- Status badge
          .absolute.top-3.right-3
            el-tag(
              :type="prod.isActive ? 'success' : 'danger'"
              size="small"
              effect="dark"
              round
            ) {{ prod.isActive ? $t('ecommerce.products.active') : $t('ecommerce.products.inactive') }}
        .p-4
          .flex.items-center.justify-between.mb-1
            el-tag(size="small" round effect="plain") {{ prod.category || 'General' }}
            span.text-xs.font-mono(style="color: var(--text-muted);") {{ prod.sku || '--' }}
          h3.text-sm.font-bold.mt-2.line-clamp-1(style="color: var(--text-primary);") {{ prod.name }}
          p.text-xs.line-clamp-2.mt-1.mb-3(style="color: var(--text-muted);") {{ prod.description || $t('ecommerce.products.noDescription') }}
          .flex.items-center.justify-between
            span.text-lg.font-black(style="color: #7c3aed;") {{ (prod.unitPrice || 0).toLocaleString() }}
              span.text-xs.font-normal.ml-1 {{ prod.currency || 'SAR' }}

    //- Empty State
    .rounded-2xl.border-2.border-dashed.text-center.p-12(v-if="!loading && products.length === 0" style="border-color: var(--border-default); color: var(--text-muted);")
      Icon(name="ph:package" size="52")
      p.text-sm.mt-3.font-medium {{ $t('ecommerce.products.noProducts') }}
      el-button.mt-4(type="primary" @click="openCreateDialog" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('ecommerce.products.addProduct') }}

  //- Product List View
  .rounded-2xl.border.overflow-hidden(v-if="viewMode === 'list'" style="border-color: var(--border-default); background: var(--bg-elevated);")
    el-table(:data="products" v-loading="loading" style="width: 100%" :row-style="{ cursor: 'pointer' }" @row-click="(row: any) => navigateTo(`/e-commerce/products/${row.id}`)")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('ecommerce.products.product')" min-width="240")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-10.h-10.rounded-lg.flex.items-center.justify-center.flex-shrink-0(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);")
              Icon(name="ph:package-bold" size="20" style="color: #7849ff;")
            div
              .font-bold(style="color: var(--text-primary);") {{ row.name }}
              .text-xs(style="color: var(--text-muted);") {{ row.sku || '--' }}
      el-table-column(:label="$t('common.category')" width="140")
        template(#default="{ row }")
          el-tag(v-if="row.category" size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ row.category }}
          span(v-else) --
      el-table-column(:label="$t('ecommerce.products.price')" width="140" align="right" sortable sort-by="unitPrice")
        template(#default="{ row }")
          span.font-bold(style="color: #7c3aed;") {{ formatCurrency(row.unitPrice || 0) }}
      el-table-column(:label="$t('common.status')" width="120" align="center")
        template(#default="{ row }")
          el-tag(
            :type="row.isActive ? 'success' : 'danger'"
            size="small"
            effect="dark"
            round
          ) {{ row.isActive ? $t('ecommerce.products.active') : $t('ecommerce.products.inactive') }}
      el-table-column(:label="$t('common.actions')" width="120" fixed="right" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1(@click.stop)
            el-button(size="small" @click.stop="editProduct(row)" class="!rounded-lg")
              Icon(name="ph:pencil-bold" size="14")
            el-button(size="small" type="danger" plain @click.stop="confirmDeleteProduct(row)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")
      template(#empty)
        .text-center.py-8
          Icon(name="ph:package" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('ecommerce.products.noProducts') }}

  //- Pagination
  .flex.items-center.flex-wrap.gap-2(class="sm_justify-between justify-center" v-if="pagination.totalPages > 1")
    span.text-xs(style="color: var(--text-muted);") {{ pagination.totalItems }} {{ $t('common.entries') }}
    el-pagination(
      background
      style="direction:ltr"
      :pager-count="4"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      layout="prev, pager, next"
      :total="pagination.totalItems"
      @current-change="loadProducts"
    )

  //- Create/Edit Product Dialog
  el-dialog(
    v-model="showDialog"
    :title="editingId ? $t('ecommerce.products.editProduct') : $t('ecommerce.products.addProduct')"
    width="600px"
    :close-on-click-modal="false"
  )
    el-form(ref="formRef" :model="form" :rules="formRules" label-position="top" size="large")
      el-form-item(:label="$t('ecommerce.products.productName')" prop="name")
        el-input(v-model="form.name" :placeholder="$t('ecommerce.products.productNamePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('ecommerce.products.sku')")
          el-input(v-model="form.sku" placeholder="SKU-001")
        el-form-item(:label="$t('common.category')")
          el-select(v-model="form.category" class="w-full" allow-create filterable :placeholder="$t('ecommerce.products.selectCategory')")
            el-option(v-for="cat in categories" :key="cat.id || cat" :value="cat.name || cat" :label="cat.name || cat")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('ecommerce.products.price')" prop="unitPrice")
          el-input-number(v-model="form.unitPrice" :min="0" :precision="2" class="!w-full")
        el-form-item(:label="$t('ecommerce.products.currency')")
          el-select(v-model="form.currency" class="w-full")
            el-option(label="SAR" value="SAR")
            el-option(label="USD" value="USD")
            el-option(label="EUR" value="EUR")
            el-option(label="GBP" value="GBP")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="form.description" type="textarea" :rows="3" :placeholder="$t('ecommerce.products.descriptionPlaceholder')")
      el-form-item
        el-switch(v-model="form.isActive" :active-text="$t('ecommerce.products.active')" :inactive-text="$t('ecommerce.products.inactive')")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveProduct" class="!rounded-xl") {{ $t('common.save') }}

  //- Delete Confirmation
  el-dialog(v-model="showDeleteConfirm" :title="$t('common.confirm')" width="400px")
    .text-center.py-4
      Icon(name="ph:warning-bold" size="48" style="color: #ef4444;")
      p.mt-4.text-sm(style="color: var(--text-primary);") {{ $t('common.confirmDelete') }}
      p.text-xs.mt-1(style="color: var(--text-muted);") {{ deletingProduct?.name }}
    template(#footer)
      el-button(@click="showDeleteConfirm = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="deleting" @click="handleDelete" class="!rounded-xl") {{ $t('common.delete') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElNotification } from 'element-plus';
import type { FormRules } from 'element-plus';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type CatalogProduct
} from '~/composables/useProductCatalog';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

// View mode
const viewMode = ref<'grid' | 'list'>('grid');

// Loading states
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

// Data
const products = ref<CatalogProduct[]>([]);
const categories = ref<any[]>([]);

// Filters
const search = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const priceMin = ref<number | undefined>(undefined);
const priceMax = ref<number | undefined>(undefined);

// Pagination
const currentPage = ref(1);
const pageSize = 20;
const pagination = ref({ page: 1, limit: pageSize, totalItems: 0, totalPages: 0 });

// Dialog
const showDialog = ref(false);
const editingId = ref<string | null>(null);
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

// Delete
const showDeleteConfirm = ref(false);
const deletingProduct = ref<CatalogProduct | null>(null);

// Computed
const activeCount = computed(() => products.value.filter(p => p.isActive).length);

const inventoryValue = computed(() => {
  return products.value.reduce((sum, p) => sum + (p.unitPrice || 0), 0);
});

// Debounce
let debounceTimer: ReturnType<typeof setTimeout>;
function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadProducts();
  }, 400);
}

function resetAndLoad() {
  currentPage.value = 1;
  loadProducts();
}

// Data loading
async function loadProducts() {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      page: String(currentPage.value),
      limit: String(pageSize)
    };
    if (search.value) params.searchKey = search.value;
    if (categoryFilter.value) params.category = categoryFilter.value;
    if (statusFilter.value) params.isActive = statusFilter.value;
    if (priceMin.value !== undefined && priceMin.value > 0) params.minPrice = String(priceMin.value);
    if (priceMax.value !== undefined && priceMax.value > 0) params.maxPrice = String(priceMax.value);

    const result = await fetchProducts(params);
    products.value = result.docs || [];
    pagination.value = result.pagination || pagination.value;
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  try {
    const res = await useApiFetch('ecommerce/categories');
    if (res?.success && res.body) {
      const data = res.body as any;
      categories.value = data?.docs || data?.rows || data || [];
    }
  } catch {
    // Fallback: extract unique categories from products
    const uniqueCats = [...new Set(products.value.map(p => p.category).filter(Boolean))];
    categories.value = uniqueCats.map(c => ({ name: c }));
  }
}

// CRUD
function openCreateDialog() {
  editingId.value = null;
  Object.assign(form, {
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currency: 'SAR',
    description: '',
    isActive: true
  });
  showDialog.value = true;
}

function editProduct(prod: CatalogProduct) {
  editingId.value = prod.id;
  Object.assign(form, {
    name: prod.name,
    sku: prod.sku || '',
    category: prod.category || '',
    unitPrice: prod.unitPrice || 0,
    currency: prod.currency || 'SAR',
    description: prod.description || '',
    isActive: prod.isActive !== false
  });
  showDialog.value = true;
}

async function saveProduct() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    if (editingId.value) {
      const res = await updateProduct(editingId.value, { ...form });
      if (res.success) {
        ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
        showDialog.value = false;
        await loadProducts();
      }
    } else {
      const res = await createProduct({ ...form });
      if (res.success) {
        ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
        showDialog.value = false;
        await loadProducts();
      }
    }
  } finally {
    saving.value = false;
  }
}

function confirmDeleteProduct(prod: CatalogProduct) {
  deletingProduct.value = prod;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (!deletingProduct.value) return;
  deleting.value = true;
  try {
    const res = await deleteProduct(deletingProduct.value.id);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      showDeleteConfirm.value = false;
      deletingProduct.value = null;
      await loadProducts();
    }
  } finally {
    deleting.value = false;
  }
}

// Helpers
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);
}

// Check for ?action=new in query
watch(() => route.query.action, (action) => {
  if (action === 'new') openCreateDialog();
}, { immediate: true });

onMounted(async () => {
  await Promise.all([loadProducts(), loadCategories()]);
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
