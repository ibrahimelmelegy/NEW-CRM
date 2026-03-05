<template lang="pug">
div
  ModuleHeader(
    :title="$t('inventory.title')"
    :subtitle="$t('inventory.subtitle')"
    :actions="headerActions"
  )
    template(#actions)
      ExportButton(:data="products" :columns="exportColumns" :filename="'inventory-export'" :title="$t('inventory.title')")
      el-button(size="large" @click="showMovementDialog = true" class="premium-btn-secondary")
        Icon(name="ph:swap-bold" size="20")
        span.mx-1 {{ $t('inventory.addMovement') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.flex.items-center.flex-wrap.gap-2.mb-6.justify-start
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" :placeholder="$t('common.search') + ' ' + $t('inventory.title')" clearable @input="debounceLoad")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16")
      el-select(v-model="categoryFilter" clearable :placeholder="$t('inventory.allCategories')" @change="loadProducts" class="w-44" size="large")
        el-option(v-for="cat in categories" :key="cat" :value="cat" :label="cat")

    el-table(:data="products" v-loading="loading" style="width: 100%" :row-style="{cursor:'pointer'}" @current-change="handleRowClick")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('inventory.product')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-10.h-10.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
              Icon(name="ph:package-bold" size="20" style="color: #7849ff")
            div
              .font-bold(style="color: var(--text-primary)") {{ row.name }}
              .text-xs(style="color: var(--text-muted)") {{ row.sku || '—' }}
      el-table-column(:label="$t('inventory.category')" width="140")
        template(#default="{ row }")
          el-tag(v-if="row.category" size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ row.category }}
          span(v-else) —
      el-table-column(:label="$t('inventory.quantity')" width="120" align="center")
        template(#default="{ row }")
          span.font-bold(:style="{ color: row.quantity <= (row.reorderPoint || 5) ? '#ef4444' : 'var(--text-primary)' }") {{ row.quantity }}
      el-table-column(:label="$t('inventory.price')" width="120" align="right")
        template(#default="{ row }")
          span.font-medium {{ formatCurrency(row.price || 0) }}
      el-table-column(:label="$t('inventory.warehouse')" width="140")
        template(#default="{ row }")
          span {{ row.warehouse || '—' }}
      el-table-column(:label="$t('common.action')" width="120" fixed="right")
        template(#default="{ row }")
          .flex.items-center(@click.stop)
            el-dropdown(trigger="click")
              span.el-dropdown-link
                .toggle-icon.text-md: Icon(name="IconToggle" size="22")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click="editProduct(row)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconEdit")
                      p.text-sm {{ $t('common.edit') }}
                  el-dropdown-item(@click="[selectedProduct = row, showMovementDialog = true]")
                    .flex.items-center
                      Icon.text-md.mr-2(name="ph:swap-bold")
                      p.text-sm {{ $t('inventory.addMovement') }}
                  el-dropdown-item(@click="[deleteId = row.id, deletePopup = true]")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconDelete")
                      p.text-sm {{ $t('common.delete') }}
      template(#empty)
        el-empty(:description="$t('common.noData')" image="/images/empty.png")

    .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
      el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="20" layout="prev, pager, next" :total="pagination.totalItems" @current-change="loadProducts")

  //- Create/Edit Dialog
  el-dialog(v-model="showForm" :title="editingId ? $t('inventory.editProduct') : $t('inventory.addProduct')" width="600px")
    el-form(ref="formRef" :model="form" :rules="formRules" label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('inventory.product')" prop="name")
          el-input(v-model="form.name")
        el-form-item(:label="$t('inventory.sku')" prop="sku")
          el-input(v-model="form.sku")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('inventory.quantity')")
          el-input-number(v-model="form.quantity" :min="0" class="w-full")
        el-form-item(:label="$t('inventory.price')" prop="price")
          el-input-number(v-model="form.price" :min="0" :precision="2" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('inventory.category')")
          el-input(v-model="form.category")
        el-form-item(:label="$t('inventory.warehouse')")
          el-input(v-model="form.warehouse")
      el-form-item(:label="$t('inventory.reorderPoint')")
        el-input-number(v-model="form.reorderPoint" :min="0" class="w-full")
      el-form-item(:label="$t('inventory.description')")
        el-input(v-model="form.description" type="textarea" :rows="2")
    template(#footer)
      el-button(@click="showForm = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveProduct" class="!rounded-2xl") {{ $t('common.save') }}

  //- Movement Dialog
  el-dialog(v-model="showMovementDialog" :title="$t('inventory.addMovement')" width="500px")
    el-form(ref="movementFormRef" :model="movementForm" :rules="movementRules" label-position="top" size="large")
      el-form-item(:label="$t('inventory.product')" v-if="!selectedProduct")
        el-select(v-model="movementForm.productId" class="w-full")
          el-option(v-for="p in products" :key="p.id" :label="p.name" :value="p.id")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('inventory.type')" prop="type")
          el-select(v-model="movementForm.type" class="w-full")
            el-option(value="IN" :label="$t('inventory.stockIn')")
            el-option(value="OUT" :label="$t('inventory.stockOut')")
            el-option(value="ADJUSTMENT" :label="$t('inventory.adjustment')")
            el-option(value="TRANSFER" :label="$t('inventory.transfer')")
        el-form-item(:label="$t('inventory.quantity')" prop="quantity")
          el-input-number(v-model="movementForm.quantity" :min="1" class="w-full")
      el-form-item(:label="$t('inventory.notes')")
        el-input(v-model="movementForm.notes" type="textarea" :rows="2")
    template(#footer)
      el-button(@click="showMovementDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="movementSaving" @click="submitMovement" class="!rounded-2xl") {{ $t('common.save') }}

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useInventory } from '~/composables/useInventory';

const { fetchProducts, createProduct, updateProduct, deleteProduct, addMovement, fetchCategories } = useInventory();

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

// Export columns
const exportColumns = [
  { prop: 'name', label: t('inventory.product') },
  { prop: 'sku', label: t('inventory.sku') },
  { prop: 'category', label: t('inventory.category') },
  { prop: 'quantity', label: t('inventory.quantity') },
  { prop: 'price', label: t('inventory.price') },
  { prop: 'warehouse', label: t('inventory.warehouse') }
];

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const movementSaving = ref(false);
const products = ref<Record<string, unknown>[]>([]);
const categories = ref<string[]>([]);
const search = ref('');
const categoryFilter = ref('');
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
const showForm = ref(false);
const showMovementDialog = ref(false);
const deletePopup = ref(false);
const deleteId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const selectedProduct = ref<Record<string, unknown> | null>(null);

const formRef = ref();
const movementFormRef = ref();

const form = reactive({ name: '', sku: '', quantity: 0, price: 0, category: '', warehouse: '', reorderPoint: 5, description: '' });
const movementForm = reactive({ productId: null as number | null, type: 'IN', quantity: 1, notes: '' });

const formRules = {
  name: [{ required: true, message: t('inventory.nameRequired'), trigger: 'blur' }],
  sku: [{ required: true, message: t('inventory.skuRequired'), trigger: 'blur' }],
};

const movementRules = {
  type: [{ required: true, message: t('inventory.typeRequired'), trigger: 'change' }],
  quantity: [{ required: true, message: t('inventory.quantityRequired'), trigger: 'blur' }],
};

const headerActions = computed(() => [{ label: t('inventory.addProduct'), onClick: () => openForm(), type: 'primary' }]);

const summaryStats = computed(() => {
  const totalValue = products.value.reduce((sum, p) => sum + (p.quantity || 0) * (p.price || 0), 0);
  const lowStock = products.value.filter(p => p.quantity <= (p.reorderPoint || 5)).length;
  return [
    { label: t('inventory.totalProducts'), value: products.value.length, icon: 'ph:package-bold', color: '#7849ff' },
    { label: t('inventory.lowStock'), value: lowStock, icon: 'ph:warning-bold', color: '#ef4444' },
    { label: t('inventory.totalValue'), value: formatCurrency(totalValue), icon: 'ph:money-bold', color: '#22c55e' }
  ];
});

let debounceTimer: ReturnType<typeof setTimeout>;
function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadProducts();
  }, 400);
}

onMounted(async () => {
  await Promise.all([loadProducts(), loadCategories()]);
});

async function loadProducts() {
  loading.value = true;
  try {
    const params: Record<string, string> = { page: String(currentPage.value), limit: '20' };
    if (search.value) params.search = search.value;
    if (categoryFilter.value) params.category = categoryFilter.value;
    const { body, success } = await fetchProducts(params);
    if (success && body) {
      products.value = (body as unknown).docs || [];
      pagination.value = (body as unknown).pagination || pagination.value;
    }
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  const { body, success } = await fetchCategories();
  if (success && body) categories.value = body as string[];
}

function handleRowClick(row: Record<string, unknown>) {
  router.push(`/inventory/${row.id}`);
}

function openForm() {
  editingId.value = null;
  Object.assign(form, { name: '', sku: '', quantity: 0, price: 0, category: '', warehouse: '', reorderPoint: 5, description: '' });
  showForm.value = true;
}

function editProduct(row: unknown) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    sku: row.sku || '',
    quantity: row.quantity,
    price: row.price || 0,
    category: row.category || '',
    warehouse: row.warehouse || '',
    reorderPoint: row.reorderPoint || 5,
    description: row.description || ''
  });
  showForm.value = true;
}

async function saveProduct() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const res = editingId.value ? await updateProduct(editingId.value, form) : await createProduct(form);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showForm.value = false;
      await loadProducts();
    }
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await deleteProduct(deleteId.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await loadProducts();
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

async function submitMovement() {
  const valid = await movementFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  movementSaving.value = true;
  try {
    const productId = selectedProduct.value?.id || movementForm.productId;
    if (!productId) return;
    const res = await addMovement({ productId, type: movementForm.type, quantity: movementForm.quantity, notes: movementForm.notes });
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showMovementDialog.value = false;
      selectedProduct.value = null;
      movementForm.quantity = 1;
      movementForm.notes = '';
      await loadProducts();
    }
  } finally {
    movementSaving.value = false;
  }
}

function handleExport() {
  const csvHeaders = ['Name', 'SKU', 'Category', 'Quantity', 'Price', 'Warehouse'];
  const rows = products.value.map(p => [p.name, p.sku || '', p.category || '', p.quantity, p.price || 0, p.warehouse || '']);
  const csv = [csvHeaders, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'inventory.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}
</script>
