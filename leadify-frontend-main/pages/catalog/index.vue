<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('catalog.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('catalog.subtitle') }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | {{ $t('catalog.addProduct') }}

  .grid.grid-cols-2.gap-4.mb-6(class="md:grid-cols-5")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.totalProducts') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ products.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.categories') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ uniqueCategories.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.active') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ products.filter(p => p.isActive).length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.catalogValue') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ catalogValue.toLocaleString() }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.lowStock') }}
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ lowStockCount }}

  //- Advanced Filters & View Toggle
  .glass-card.p-4.rounded-2xl.mb-4
    .flex.items-center.justify-between.flex-wrap.gap-3
      .flex.items-center.gap-2.flex-wrap
        el-input(v-model="searchQuery" :placeholder="$t('common.search')" clearable style="width: 220px" size="default")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16")
        el-select(v-model="filterCategory" clearable :placeholder="$t('catalog.category')" style="width: 160px" size="default")
          el-option(v-for="cat in uniqueCategories" :key="cat" :label="cat" :value="cat")
        el-select(v-model="filterStockStatus" clearable :placeholder="$t('catalog.stockStatus')" style="width: 160px" size="default")
          el-option(label="In Stock" value="in_stock")
          el-option(label="Low Stock" value="low_stock")
          el-option(label="Out of Stock" value="out_of_stock")
        el-input-number(v-model="priceMin" :placeholder="$t('catalog.minPrice')" :min="0" :controls="false" style="width: 120px" size="default")
        span.text-sm(style="color: var(--text-muted)") -
        el-input-number(v-model="priceMax" :placeholder="$t('catalog.maxPrice')" :min="0" :controls="false" style="width: 120px" size="default")
      .flex.items-center.gap-2
        el-button-group
          el-button(:type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'" size="default")
            Icon(name="ph:squares-four" size="16")
          el-button(:type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'" size="default")
            Icon(name="ph:list-bullets" size="16")
        el-button(type="success" size="default" @click="showImportDialog = true")
          Icon(name="ph:upload-simple" size="14" class="mr-1")
          | {{ $t('catalog.import') }}

  //- Bulk Operations Toolbar
  .glass-card.p-3.rounded-2xl.mb-4(v-if="selectedProducts.length")
    .flex.items-center.justify-between
      .flex.items-center.gap-2
        Icon(name="ph:check-square-bold" size="18" style="color: #7849ff")
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedProducts.length }} {{ $t('catalog.selected') }}
      .flex.items-center.gap-2
        el-button(type="warning" size="small" @click="bulkStatusChange")
          Icon(name="ph:arrows-clockwise" size="14" class="mr-1")
          | {{ $t('catalog.bulkStatusChange') }}
        el-button(type="danger" size="small" @click="bulkDeleteProducts")
          Icon(name="ph:trash" size="14" class="mr-1")
          | {{ $t('catalog.bulkDelete') }}

  //- Grid View
  .grid.grid-cols-1.gap-4(v-if="viewMode === 'grid'" class="md:grid-cols-2 lg:grid-cols-4" v-loading="loading")
    .rounded-2xl.border.overflow-hidden.transition-all.relative(
      v-for="prod in filteredProducts"
      :key="prod.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:shadow-lg hover:border-violet-200"
    )
      //- Selection checkbox
      .absolute.top-2.left-2.z-10
        el-checkbox(v-model="prod.selected" @change="toggleProductSelection(prod)")
      //- Image placeholder
      .h-40.flex.items-center.justify-center.text-4xl(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);")
        Icon(name="ph:package-bold" size="48" style="color: #7849ff;")
      .p-4
        .flex.items-center.justify-between.mb-1
          el-tag(size="small" round effect="plain") {{ prod.category || 'General' }}
          .w-2.h-2.rounded-full(:style="{ backgroundColor: prod.isActive ? '#22c55e' : '#ef4444' }")
        h3.text-sm.font-bold.mb-1(style="color: var(--text-primary);") {{ prod.name }}
        p.text-xs.line-clamp-2.mb-2(style="color: var(--text-muted);") {{ prod.description }}
        .flex.items-center.justify-between
          span.text-lg.font-black(style="color: #7c3aed;") {{ (prod.unitPrice || 0).toLocaleString() }}
            span.text-xs.font-normal.ml-1 {{ prod.currency || 'SAR' }}
          span.text-xs.font-mono(style="color: var(--text-muted);") SKU: {{ prod.sku || '—' }}
        .flex.items-center.gap-2.mt-3
          el-button(size="small" text @click="editProduct(prod)")
            Icon(name="ph:pencil" size="14")
          el-button(size="small" text @click="handleDelete(prod.id)" type="danger")
            Icon(name="ph:trash" size="14")

    //- Empty
    .rounded-2xl.border-2.border-dashed.text-center.p-12.col-span-4(v-if="!loading && filteredProducts.length === 0" style="border-color: var(--border-default); color: var(--text-muted);")
      Icon(name="ph:package" size="48")
      p.text-sm.mt-3 {{ $t('catalog.noProducts') }}

  //- List View
  el-card.rounded-2xl(v-else shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    el-table(:data="filteredProducts" style="width: 100%" @selection-change="handleSelectionChange")
      el-table-column(type="selection" width="55")
      el-table-column(:label="$t('catalog.productName')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-10.h-10.rounded-lg.flex.items-center.justify-center.shrink-0(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb)")
              Icon(name="ph:package-bold" size="20" style="color: #7849ff")
            div
              p.text-sm.font-bold(style="color: var(--text-primary)") {{ row.name }}
              p.text-xs(style="color: var(--text-muted)") {{ row.sku }}
      el-table-column(:label="$t('catalog.category')" width="140")
        template(#default="{ row }")
          el-tag(size="small" round effect="plain") {{ row.category || 'General' }}
      el-table-column(:label="$t('catalog.price')" width="140" align="right")
        template(#default="{ row }")
          span.text-sm.font-bold(style="color: #7c3aed") {{ (row.unitPrice || 0).toLocaleString() }} {{ row.currency || 'SAR' }}
      el-table-column(:label="$t('catalog.stock')" width="120" align="center")
        template(#default="{ row }")
          el-tag(:type="getStockType(row.stock)" size="small" round) {{ row.stock != null ? row.stock : '--' }}
      el-table-column(:label="$t('common.status')" width="100")
        template(#default="{ row }")
          el-tag(:type="row.isActive ? 'success' : 'danger'" size="small" round) {{ row.isActive ? $t('catalog.active') : $t('catalog.inactive') }}
      el-table-column(:label="$t('common.actions')" width="100" align="center")
        template(#default="{ row }")
          .flex.items-center.gap-1
            el-button(text size="small" @click="editProduct(row)")
              Icon(name="ph:pencil" size="14")
            el-button(text size="small" @click="handleDelete(row.id)" type="danger")
              Icon(name="ph:trash" size="14")

  //- Import Dialog
  el-dialog(v-model="showImportDialog" :title="$t('catalog.importProducts')" width="560px")
    .glass-card.p-5.mb-4
      .flex.items-center.gap-3.mb-3
        Icon(name="ph:info-bold" size="20" style="color: #3b82f6")
        h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('catalog.importInstructions') }}
      p.text-xs(style="color: var(--text-muted)") {{ $t('catalog.importInstructionsText') }}
    el-upload(
      drag
      :auto-upload="false"
      :limit="1"
      accept=".csv,.xlsx"
      :on-change="handleImportFileChange"
    )
      Icon(name="ph:upload-simple-bold" size="48" style="color: #7849ff")
      .text-sm.mt-2(style="color: var(--text-primary)") {{ $t('catalog.dropFileHere') }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('catalog.supportedFormats') }}
    template(#footer)
      el-button(@click="showImportDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="importing" @click="processImport" :disabled="!importFile") {{ $t('catalog.import') }}

  el-dialog(v-model="showDialog" :title="editingId ? $t('catalog.editProduct') : $t('catalog.addProduct')" width="560px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('catalog.productName')")
        el-input(v-model="form.name" placeholder="Premium Widget")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('catalog.sku')")
          el-input(v-model="form.sku" placeholder="SKU-001")
        el-form-item(:label="$t('catalog.category')")
          el-select(v-model="form.category" class="w-full" allow-create filterable)
            el-option(label="Electronics" value="Electronics")
            el-option(label="Software" value="Software")
            el-option(label="Services" value="Services")
            el-option(label="Hardware" value="Hardware")
            el-option(label="Accessories" value="Accessories")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('catalog.price')")
          el-input-number(v-model="form.unitPrice" :min="0" class="!w-full")
        el-form-item(:label="$t('catalog.currency')")
          el-input(v-model="form.currency" placeholder="SAR")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('catalog.stock')")
          el-input-number(v-model="form.stock" :min="0" class="!w-full")
        el-form-item(:label="$t('catalog.lowStockThreshold')")
          el-input-number(v-model="form.lowStockThreshold" :min="0" class="!w-full")
      el-form-item(:label="$t('catalog.description')")
        el-input(v-model="form.description" type="textarea" :rows="3")
      el-form-item
        el-checkbox(v-model="form.isActive") {{ $t('catalog.active') }}
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveProduct" style="border-radius: 12px;") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type CatalogProduct
} from '~/composables/useProductCatalog';

definePageMeta({});

const { $t, $i18n } = useNuxtApp();
const t = $i18n.t;

const products = ref<CatalogProduct[]>([]);
const loading = ref(false);
const saving = ref(false);
const importing = ref(false);
const showDialog = ref(false);
const showImportDialog = ref(false);
const editingId = ref<string | null>(null);
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const filterCategory = ref('');
const filterStockStatus = ref('');
const priceMin = ref<number | null>(null);
const priceMax = ref<number | null>(null);
const selectedProducts = ref<CatalogProduct[]>([]);
const importFile = ref<File | null>(null);

const form = reactive({
  name: '',
  sku: '',
  category: 'Electronics',
  unitPrice: 0,
  currency: 'SAR',
  description: '',
  isActive: true,
  stock: 0,
  lowStockThreshold: 10
});

// Computed
const uniqueCategories = computed(() => {
  return Array.from(new Set(products.value.map(p => p.category).filter(Boolean))) as string[];
});

const catalogValue = computed(() => {
  return products.value.reduce((sum, p) => sum + (p.unitPrice || 0), 0);
});

const lowStockCount = computed(() => {
  return products.value.filter(p => {
    const stock = (p as any).stock || 0;
    const threshold = (p as any).lowStockThreshold || 10;
    return stock <= threshold && stock > 0;
  }).length;
});

const filteredProducts = computed(() => {
  let result = products.value.map(p => ({ ...p, selected: selectedProducts.value.some(s => s.id === p.id) }));

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  // Category filter
  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value);
  }

  // Stock status filter
  if (filterStockStatus.value) {
    result = result.filter(p => {
      const stock = (p as any).stock || 0;
      const threshold = (p as any).lowStockThreshold || 10;
      if (filterStockStatus.value === 'in_stock') return stock > threshold;
      if (filterStockStatus.value === 'low_stock') return stock > 0 && stock <= threshold;
      if (filterStockStatus.value === 'out_of_stock') return stock === 0;
      return true;
    });
  }

  // Price range filter
  if (priceMin.value != null) {
    result = result.filter(p => (p.unitPrice || 0) >= (priceMin.value || 0));
  }
  if (priceMax.value != null) {
    result = result.filter(p => (p.unitPrice || 0) <= (priceMax.value || 0));
  }

  return result;
});

onMounted(() => {
  loadProducts();
});

async function loadProducts() {
  loading.value = true;
  try {
    const result = await fetchProducts();
    products.value = result.docs || [];
  } finally {
    loading.value = false;
  }
}

function editProduct(prod: CatalogProduct) {
  editingId.value = prod.id;
  Object.assign(form, {
    name: prod.name,
    sku: prod.sku || '',
    category: prod.category || 'Electronics',
    unitPrice: prod.unitPrice || 0,
    currency: prod.currency || 'SAR',
    description: prod.description || '',
    isActive: prod.isActive !== false
  });
  showDialog.value = true;
}

async function saveProduct() {
  saving.value = true;
  try {
    if (editingId.value) {
      const res = await updateProduct(editingId.value, { ...form });
      if (res.success) {
        showDialog.value = false;
        editingId.value = null;
        await loadProducts();
        ElMessage.success(t('common.saved'));
      }
    } else {
      const res = await createProduct({ ...form });
      if (res.success) {
        Object.assign(form, {
          name: '',
          sku: '',
          category: 'Electronics',
          unitPrice: 0,
          currency: 'SAR',
          description: '',
          isActive: true
        });
        showDialog.value = false;
        await loadProducts();
        ElMessage.success(t('common.saved'));
      }
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  const res = await deleteProduct(id);
  if (res.success) {
    await loadProducts();
    ElMessage.success(t('common.deleted'));
  }
}

// Bulk operations
function toggleProductSelection(prod: any) {
  if (prod.selected) {
    selectedProducts.value.push(prod);
  } else {
    selectedProducts.value = selectedProducts.value.filter(p => p.id !== prod.id);
  }
}

function handleSelectionChange(val: CatalogProduct[]) {
  selectedProducts.value = val;
}

async function bulkStatusChange() {
  if (!selectedProducts.value.length) return;
  try {
    await ElMessageBox.confirm($t('catalog.confirmBulkStatusChange'), $t('common.warning'), {
      type: 'warning',
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel')
    });
    const ids = selectedProducts.value.map(p => p.id);
    const newStatus = !selectedProducts.value[0].isActive;
    const { success } = await useApiFetch('catalog/bulk-status', 'PUT', { ids, isActive: newStatus });
    if (success) {
      ElMessage.success($t('catalog.statusUpdated'));
      selectedProducts.value = [];
      await loadProducts();
    }
  } catch {
    // cancelled
  }
}

async function bulkDeleteProducts() {
  if (!selectedProducts.value.length) return;
  try {
    await ElMessageBox.confirm($t('catalog.confirmBulkDelete'), $t('common.warning'), {
      type: 'warning',
      confirmButtonText: $t('common.delete'),
      cancelButtonText: $t('common.cancel')
    });
    const ids = selectedProducts.value.map(p => p.id);
    const { success } = await useApiFetch('catalog/bulk-delete', 'DELETE', { ids });
    if (success) {
      ElMessage.success($t('catalog.productsDeleted'));
      selectedProducts.value = [];
      await loadProducts();
    }
  } catch {
    // cancelled
  }
}

// Import
function handleImportFileChange(file: any) {
  importFile.value = file.raw;
}

async function processImport() {
  if (!importFile.value) return;
  importing.value = true;
  try {
    const formData = new FormData();
    formData.append('file', importFile.value);
    const { success, body } = await useApiFetch('catalog/import', 'POST', formData);
    if (success) {
      ElMessage.success($t('catalog.importSuccess', { count: (body as any)?.imported || 0 }));
      showImportDialog.value = false;
      importFile.value = null;
      await loadProducts();
    }
  } catch (e) {
    ElMessage.error($t('catalog.importFailed'));
  } finally {
    importing.value = false;
  }
}

function getStockType(stock: number): string {
  if (stock === 0) return 'danger';
  if (stock <= 10) return 'warning';
  return 'success';
}
</script>
