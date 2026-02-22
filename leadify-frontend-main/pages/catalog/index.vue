<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 🏷️ Product Catalog
      p.text-sm.mt-1(style="color: var(--text-muted);") Browse, manage, and showcase your products with images and pricing.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | Add Product

  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Products
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ products.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Categories
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ new Set(products.map(p => p.category)).size }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") In Stock
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ products.filter(p => p.inStock).length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Catalog Value
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ products.reduce((s, p) => s + p.price, 0).toLocaleString() }}

  //- Product Grid
  .grid.grid-cols-4.gap-4
    .rounded-2xl.border.overflow-hidden.transition-all(
      v-for="prod in products"
      :key="prod.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:shadow-lg hover:border-violet-200"
    )
      //- Image placeholder
      .h-40.flex.items-center.justify-center.text-4xl(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);") {{ prod.emoji || '📦' }}
      .p-4
        .flex.items-center.justify-between.mb-1
          el-tag(size="small" round effect="plain") {{ prod.category }}
          .w-2.h-2.rounded-full(:style="{ backgroundColor: prod.inStock ? '#22c55e' : '#ef4444' }")
        h3.text-sm.font-bold.mb-1(style="color: var(--text-primary);") {{ prod.name }}
        p.text-xs.line-clamp-2.mb-2(style="color: var(--text-muted);") {{ prod.description }}
        .flex.items-center.justify-between
          span.text-lg.font-black(style="color: #7c3aed;") {{ prod.price.toLocaleString() }}
            span.text-xs.font-normal.ml-1 SAR
          span.text-xs.font-mono(style="color: var(--text-muted);") SKU: {{ prod.sku }}
        .flex.items-center.gap-2.mt-3
          el-button(size="small" text @click="removeProduct(prod.id)" type="danger")
            Icon(name="ph:trash" size="14")

    //- Empty
    .rounded-2xl.border-2.border-dashed.text-center.p-12.col-span-4(v-if="products.length === 0" style="border-color: var(--border-default); color: var(--text-muted);")
      Icon(name="ph:package" size="48")
      p.text-sm.mt-3 Add your first product

  el-dialog(v-model="showDialog" title="Add Product" width="560px")
    el-form(label-position="top" size="large")
      el-form-item(label="Product Name")
        el-input(v-model="form.name" placeholder="Premium Widget")
      .grid.grid-cols-2.gap-4
        el-form-item(label="SKU")
          el-input(v-model="form.sku" placeholder="SKU-001")
        el-form-item(label="Category")
          el-select(v-model="form.category" class="w-full" allow-create filterable)
            el-option(label="Electronics" value="Electronics")
            el-option(label="Software" value="Software")
            el-option(label="Services" value="Services")
            el-option(label="Hardware" value="Hardware")
            el-option(label="Accessories" value="Accessories")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Price (SAR)")
          el-input-number(v-model="form.price" :min="0" class="!w-full")
        el-form-item(label="Emoji / Icon")
          el-input(v-model="form.emoji" placeholder="📦")
      el-form-item(label="Description")
        el-input(v-model="form.description" type="textarea" :rows="3")
      el-form-item
        el-checkbox(v-model="form.inStock") In Stock
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveProduct" style="border-radius: 12px;") Save Product
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
definePageMeta({ layout: 'main', middleware: 'auth' });
interface Product { id: string; name: string; sku: string; category: string; price: number; description: string; emoji: string; inStock: boolean; }
const KEY = 'crm_products_catalog';
const products = ref<Product[]>(JSON.parse(localStorage.getItem(KEY) || '[]'));
const showDialog = ref(false);
const form = reactive({ name: '', sku: '', category: 'Electronics', price: 0, description: '', emoji: '📦', inStock: true });

function saveProduct() {
  products.value.unshift({ ...form, id: `prod_${Date.now()}` });
  localStorage.setItem(KEY, JSON.stringify(products.value));
  Object.assign(form, { name: '', sku: '', category: 'Electronics', price: 0, description: '', emoji: '📦', inStock: true });
  showDialog.value = false;
  ElMessage.success('Product added to catalog!');
}
function removeProduct(id: string) { products.value = products.value.filter(p => p.id !== id); localStorage.setItem(KEY, JSON.stringify(products.value)); }
</script>
