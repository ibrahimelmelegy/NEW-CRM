<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('catalog.title') || 'Product Catalog' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('catalog.subtitle') || 'Browse, manage, and showcase your products with images and pricing.' }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | {{ $t('catalog.addProduct') || 'Add Product' }}

  .grid.grid-cols-2.gap-4.mb-8(class="md:grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.totalProducts') || 'Total Products' }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ products.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.categories') || 'Categories' }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ new Set(products.map(p => p.category).filter(Boolean)).size }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.active') || 'Active' }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ products.filter(p => p.isActive).length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('catalog.catalogValue') || 'Catalog Value' }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ products.reduce((s, p) => s + (p.unitPrice || 0), 0).toLocaleString() }}

  //- Product Grid
  .grid.grid-cols-1.gap-4(class="md:grid-cols-2 lg:grid-cols-4" v-loading="loading")
    .rounded-2xl.border.overflow-hidden.transition-all(
      v-for="prod in products"
      :key="prod.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:shadow-lg hover:border-violet-200"
    )
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
    .rounded-2xl.border-2.border-dashed.text-center.p-12.col-span-4(v-if="!loading && products.length === 0" style="border-color: var(--border-default); color: var(--text-muted);")
      Icon(name="ph:package" size="48")
      p.text-sm.mt-3 {{ $t('catalog.addFirst') || 'Add your first product' }}

  el-dialog(v-model="showDialog" :title="editingId ? ($t('catalog.editProduct') || 'Edit Product') : ($t('catalog.addProduct') || 'Add Product')" width="560px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('catalog.productName') || 'Product Name'")
        el-input(v-model="form.name" placeholder="Premium Widget")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('catalog.sku') || 'SKU'")
          el-input(v-model="form.sku" placeholder="SKU-001")
        el-form-item(:label="$t('catalog.category') || 'Category'")
          el-select(v-model="form.category" class="w-full" allow-create filterable)
            el-option(label="Electronics" value="Electronics")
            el-option(label="Software" value="Software")
            el-option(label="Services" value="Services")
            el-option(label="Hardware" value="Hardware")
            el-option(label="Accessories" value="Accessories")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('catalog.price') || 'Price (SAR)'")
          el-input-number(v-model="form.unitPrice" :min="0" class="!w-full")
        el-form-item(:label="$t('catalog.currency') || 'Currency'")
          el-input(v-model="form.currency" placeholder="SAR")
      el-form-item(:label="$t('catalog.description') || 'Description'")
        el-input(v-model="form.description" type="textarea" :rows="3")
      el-form-item
        el-checkbox(v-model="form.isActive") {{ $t('catalog.active') || 'Active' }}
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveProduct" style="border-radius: 12px;") {{ $t('common.save') || 'Save Product' }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type CatalogProduct
} from '~/composables/useProductCatalog';

definePageMeta({});

const products = ref<CatalogProduct[]>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: '',
  sku: '',
  category: 'Electronics',
  unitPrice: 0,
  currency: 'SAR',
  description: '',
  isActive: true
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
        ElMessage.success('Product updated!');
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
        ElMessage.success('Product added to catalog!');
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
    ElMessage.success('Product removed');
  }
}
</script>
