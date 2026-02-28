<template lang="pug">
.products-page.p-8
  .header.mb-8
    .flex.items-center.justify-between
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.products') }}
        p(style="color: var(--text-muted)") {{ $t('products.description') }}
      el-button(type="primary" @click="openCreateDialog" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('products.addProduct') }}

  //- Stats
  .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('products.totalProducts') }}
      p.text-3xl.font-bold(style="color: #7849ff") {{ products.length }}
    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('products.activeProducts') }}
      p.text-3xl.font-bold(style="color: #22c55e") {{ products.filter(p => p.isActive).length }}
    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('products.categories') }}
      p.text-3xl.font-bold(style="color: #3b82f6") {{ uniqueCategories.length }}
    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('products.avgPrice') }}
      p.text-3xl.font-bold(style="color: #f59e0b") {{ formatCurrency(avgPrice) }}

  //- Filters
  .flex.items-center.gap-4.mb-6(class="flex-col md:flex-row")
    el-input(v-model="searchQuery" :placeholder="$t('products.searchProducts')" clearable style="max-width: 300px")
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16")
    el-select(v-model="categoryFilter" :placeholder="$t('products.allCategories')" clearable style="width: 180px")
      el-option(v-for="cat in uniqueCategories" :key="cat" :label="cat" :value="cat")
    el-select(v-model="statusFilter" :placeholder="$t('products.allStatuses')" clearable style="width: 150px")
      el-option(:label="$t('common.active')" value="active")
      el-option(:label="$t('common.inactive')" value="inactive")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Products Table
    el-table(:data="filteredProducts" stripe style="width: 100%" v-if="products.length")
      el-table-column(prop="name" :label="$t('products.name')" min-width="180")
        template(#default="scope")
          .flex.items-center.gap-3
            .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
              Icon(name="ph:package-bold" size="16" style="color: #7849ff")
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ scope.row.name }}
              p.text-xs(style="color: var(--text-muted)" v-if="scope.row.sku") SKU: {{ scope.row.sku }}
      el-table-column(prop="category" :label="$t('products.category')" min-width="120")
        template(#default="scope")
          el-tag(v-if="scope.row.category" size="small") {{ scope.row.category }}
          span.text-xs(v-else style="color: var(--text-muted)") -
      el-table-column(:label="$t('products.unitPrice')" min-width="120")
        template(#default="scope")
          span.font-semibold {{ formatCurrency(scope.row.unitPrice) }}
      el-table-column(:label="$t('products.currency')" min-width="80")
        template(#default="scope")
          span.text-xs {{ scope.row.currency }}
      el-table-column(:label="$t('products.status')" min-width="100")
        template(#default="scope")
          el-tag(size="small" :type="scope.row.isActive ? 'success' : 'info'") {{ scope.row.isActive ? $t('common.active') : $t('common.inactive') }}
      el-table-column(:label="$t('common.actions')" width="160" fixed="right")
        template(#default="scope")
          .flex.gap-1
            el-button(size="small" plain @click="openEditDialog(scope.row)" class="!rounded-lg")
              Icon(name="ph:pencil-bold" size="14")
            el-button(type="danger" size="small" plain @click="handleDelete(scope.row)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

    //- Empty State
    .text-center.py-12(v-else)
      Icon(name="ph:package-bold" size="48" style="color: var(--text-muted)")
      p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('products.noProducts') }}

  //- Create/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="isEditing ? $t('products.editProduct') : $t('products.addProduct')" width="600px")
    el-form(:model="form" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('products.name')" required)
          el-input(v-model="form.name" :placeholder="$t('products.namePlaceholder')")
        el-form-item(:label="$t('products.sku')")
          el-input(v-model="form.sku" placeholder="SKU-001")
      el-form-item(:label="$t('products.descriptionLabel')")
        el-input(v-model="form.description" type="textarea" :rows="3")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('products.category')")
          el-input(v-model="form.category" :placeholder="$t('products.categoryPlaceholder')")
        el-form-item(:label="$t('products.unitPrice')" required)
          el-input-number(v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('products.currency')")
          el-select(v-model="form.currency" style="width: 100%")
            el-option(label="SAR" value="SAR")
            el-option(label="USD" value="USD")
            el-option(label="EUR" value="EUR")
            el-option(label="GBP" value="GBP")
      el-form-item(:label="$t('products.activeStatus')")
        el-switch(v-model="form.isActive")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '~/composables/useProductCatalog';
import type { CatalogProduct } from '~/composables/useProductCatalog';

definePageMeta({ title: 'Product Catalog' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref('');
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');

const products = ref<CatalogProduct[]>([]);

const form = reactive({
  name: '',
  sku: '',
  description: '',
  category: '',
  unitPrice: 0,
  currency: 'SAR',
  isActive: true
});

const uniqueCategories = computed(() => {
  const cats = new Set(products.value.map(p => p.category).filter(Boolean));
  return [...cats] as string[];
});

const avgPrice = computed(() => {
  if (!products.value.length) return 0;
  return products.value.reduce((sum, p) => sum + (p.unitPrice || 0), 0) / products.value.length;
});

const filteredProducts = computed(() => {
  let result = products.value;
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }
  if (categoryFilter.value) {
    result = result.filter(p => p.category === categoryFilter.value);
  }
  if (statusFilter.value) {
    result = result.filter(p => (statusFilter.value === 'active' ? p.isActive : !p.isActive));
  }
  return result;
});

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchProducts();
    products.value = res.docs;
  } catch (e) {
    console.error('Failed to load products', e);
  } finally {
    loading.value = false;
  }
}

await loadData().catch(() => {
  loading.value = false;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

function resetForm() {
  form.name = '';
  form.sku = '';
  form.description = '';
  form.category = '';
  form.unitPrice = 0;
  form.currency = 'SAR';
  form.isActive = true;
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(product: CatalogProduct) {
  isEditing.value = true;
  editingId.value = product.id;
  form.name = product.name;
  form.sku = product.sku || '';
  form.description = product.description || '';
  form.category = product.category || '';
  form.unitPrice = product.unitPrice;
  form.currency = product.currency;
  form.isActive = product.isActive;
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.name) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    if (isEditing.value) {
      const res = await updateProduct(editingId.value, payload as any);
      if (res?.success) {
        const idx = products.value.findIndex(p => p.id === editingId.value);
        if (idx >= 0) Object.assign(products.value[idx]!, payload);
        dialogVisible.value = false;
        ElNotification({ type: 'success', title: t('common.success'), message: t('common.updatedSuccessfully') });
      }
    } else {
      const res = await createProduct(payload);
      if (res?.success) {
        const refreshed = await fetchProducts();
        products.value = refreshed.docs;
        dialogVisible.value = false;
        ElNotification({ type: 'success', title: t('common.success'), message: t('common.createdSuccessfully') });
      }
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(product: CatalogProduct) {
  try {
    await ElMessageBox.confirm(t('products.confirmDelete'), t('common.warning'), { type: 'warning' });
    await deleteProduct(product.id);
    products.value = products.value.filter(p => p.id !== product.id);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deletedSuccessfully') });
  } catch (e: any) { ElMessage.error(t('common.error')); }
}
</script>

<style lang="scss" scoped>
.products-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
