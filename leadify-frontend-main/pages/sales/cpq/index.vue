<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('cpq.title') || 'CPQ — Configure, Price, Quote'" :subtitle="$t('cpq.subtitle') || 'Manage price books and product pricing entries.'")
    template(#actions)
      el-button(type="primary" size="large" @click="openCreateDialog" class="premium-btn")
        Icon(name="ph:plus-bold" size="20")
        span.mx-1 {{ activeTab === 'books' ? ($t('cpq.addPriceBook') || 'Add Price Book') : ($t('cpq.addEntry') || 'Add Entry') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    el-tabs(v-model="activeTab" class="px-4")
      //- Price Books Tab
      el-tab-pane(:label="$t('cpq.priceBooks') || 'Price Books'" name="books")
        el-table(:data="books" v-loading="loadingBooks" style="width: 100%")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('cpq.bookName') || 'Name'" min-width="180")
            template(#default="{ row }")
              span.font-bold {{ row.name || '—' }}
          el-table-column(:label="$t('cpq.currency') || 'Currency'" width="100" align="center")
            template(#default="{ row }")
              span {{ row.currency || 'SAR' }}
          el-table-column(:label="$t('cpq.isActive') || 'Active'" width="100" align="center")
            template(#default="{ row }")
              el-tag(:type="row.isActive ? 'success' : 'info'" size="small" round) {{ row.isActive ? 'Yes' : 'No' }}
          el-table-column(:label="$t('cpq.effectiveDate') || 'Effective Date'" width="140")
            template(#default="{ row }")
              span.text-xs.font-mono {{ row.effectiveDate ? new Date(row.effectiveDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—' }}
          el-table-column(:label="$t('cpq.expiryDate') || 'Expiry Date'" width="140")
            template(#default="{ row }")
              span.text-xs.font-mono {{ row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—' }}
          el-table-column(:label="$t('common.action') || ''" width="100" fixed="right")
            template(#default="{ row }")
              el-button(text circle size="small" type="primary" @click="openEditBookDialog(row)")
                Icon(name="ph:pencil-simple" size="14")
              el-button(text circle size="small" type="danger" @click="handleDeleteBook(row.id)")
                Icon(name="ph:trash" size="14")
          template(#empty)
            el-empty(:description="$t('common.noData') || 'No price books yet'")

      //- Entries Tab
      el-tab-pane(:label="$t('cpq.entries') || 'Entries'" name="entries")
        el-table(:data="entries" v-loading="loadingEntries" style="width: 100%")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('cpq.productName') || 'Product'" min-width="170")
            template(#default="{ row }")
              span.font-bold {{ row.productName || '—' }}
          el-table-column(:label="$t('cpq.sku') || 'SKU'" width="120")
            template(#default="{ row }")
              span.font-mono.text-xs {{ row.sku || '—' }}
          el-table-column(:label="$t('cpq.unitPrice') || 'Unit Price'" width="130" align="right")
            template(#default="{ row }")
              span.font-bold {{ Number(row.unitPrice || 0).toLocaleString() }} SAR
          el-table-column(:label="$t('cpq.costPrice') || 'Cost Price'" width="130" align="right")
            template(#default="{ row }")
              span {{ Number(row.costPrice || 0).toLocaleString() }} SAR
          el-table-column(:label="$t('cpq.minQty') || 'Min Qty'" width="90" align="center")
            template(#default="{ row }")
              span {{ row.minQty ?? 1 }}
          el-table-column(:label="$t('cpq.maxDiscount') || 'Max Discount'" width="120" align="center")
            template(#default="{ row }")
              span {{ row.maxDiscount != null ? row.maxDiscount + '%' : '—' }}
          el-table-column(:label="$t('common.action') || ''" width="100" fixed="right")
            template(#default="{ row }")
              el-button(text circle size="small" type="primary" @click="openEditEntryDialog(row)")
                Icon(name="ph:pencil-simple" size="14")
              el-button(text circle size="small" type="danger" @click="handleDeleteEntry(row.id)")
                Icon(name="ph:trash" size="14")
          template(#empty)
            el-empty(:description="$t('common.noData') || 'No pricing entries yet'")

  //- Price Book Dialog
  el-dialog(v-model="showBookDialog" :title="editingBookId ? ($t('cpq.editPriceBook') || 'Edit Price Book') : ($t('cpq.addPriceBook') || 'Add Price Book')" width="500px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('cpq.bookName') || 'Name'" required)
        el-input(v-model="bookForm.name" :placeholder="$t('cpq.bookNamePlaceholder') || 'Price book name'")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.currency') || 'Currency'")
          el-select(v-model="bookForm.currency" class="w-full")
            el-option(label="SAR" value="SAR")
            el-option(label="USD" value="USD")
            el-option(label="EUR" value="EUR")
            el-option(label="GBP" value="GBP")
        el-form-item(:label="$t('cpq.isActive') || 'Active'")
          el-select(v-model="bookForm.isActive" class="w-full")
            el-option(:label="$t('common.yes') || 'Yes'" :value="true")
            el-option(:label="$t('common.no') || 'No'" :value="false")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.effectiveDate') || 'Effective Date'")
          el-date-picker(v-model="bookForm.effectiveDate" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('cpq.expiryDate') || 'Expiry Date'")
          el-date-picker(v-model="bookForm.expiryDate" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
    template(#footer)
      el-button(@click="showBookDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="savingBook" @click="saveBook") {{ $t('common.save') || 'Save' }}

  //- Entry Dialog
  el-dialog(v-model="showEntryDialog" :title="editingEntryId ? ($t('cpq.editEntry') || 'Edit Entry') : ($t('cpq.addEntry') || 'Add Entry')" width="550px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.productName') || 'Product Name'" required)
          el-input(v-model="entryForm.productName" :placeholder="$t('cpq.productNamePlaceholder') || 'Product name'")
        el-form-item(:label="$t('cpq.sku') || 'SKU'")
          el-input(v-model="entryForm.sku" placeholder="SKU-001")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.unitPrice') || 'Unit Price'" required)
          el-input-number(v-model="entryForm.unitPrice" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('cpq.costPrice') || 'Cost Price'")
          el-input-number(v-model="entryForm.costPrice" :min="0" :precision="2" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.minQty') || 'Min Quantity'")
          el-input-number(v-model="entryForm.minQty" :min="1" class="w-full")
        el-form-item(:label="$t('cpq.maxDiscount') || 'Max Discount %'")
          el-input-number(v-model="entryForm.maxDiscount" :min="0" :max="100" :precision="2" class="w-full")
      el-form-item(:label="$t('cpq.priceBook') || 'Price Book'")
        el-select(v-model="entryForm.priceBookId" class="w-full" :placeholder="$t('cpq.selectPriceBook') || 'Select price book'")
          el-option(v-for="book in books" :key="book.id" :label="book.name" :value="book.id")
    template(#footer)
      el-button(@click="showEntryDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="savingEntry" @click="saveEntry") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const activeTab = ref('books');

// --- Price Books ---
const loadingBooks = ref(false);
const savingBook = ref(false);
const showBookDialog = ref(false);
const editingBookId = ref<number | null>(null);
const books = ref<any[]>([]);

const defaultBookForm = () => ({
  name: '',
  currency: 'SAR',
  isActive: true,
  effectiveDate: '',
  expiryDate: ''
});

const bookForm = reactive(defaultBookForm());

// --- Entries ---
const loadingEntries = ref(false);
const savingEntry = ref(false);
const showEntryDialog = ref(false);
const editingEntryId = ref<number | null>(null);
const entries = ref<any[]>([]);

const defaultEntryForm = () => ({
  productName: '',
  sku: '',
  unitPrice: 0,
  costPrice: 0,
  minQty: 1,
  maxDiscount: 0,
  priceBookId: null as number | null
});

const entryForm = reactive(defaultEntryForm());

// --- Summary Stats ---
const summaryStats = computed(() => {
  const activeBooks = books.value.filter(b => b.isActive).length;
  const totalEntries = entries.value.length;
  const avgPrice = totalEntries > 0 ? Math.round(entries.value.reduce((s, e) => s + Number(e.unitPrice || 0), 0) / totalEntries) : 0;
  const avgMargin = totalEntries > 0
    ? Math.round(entries.value.reduce((s, e) => {
        const unit = Number(e.unitPrice || 0);
        const cost = Number(e.costPrice || 0);
        return s + (unit > 0 ? ((unit - cost) / unit) * 100 : 0);
      }, 0) / totalEntries)
    : 0;
  return [
    { label: 'Price Books', value: books.value.length, icon: 'ph:book-open-bold', color: '#7849ff' },
    { label: 'Active Books', value: activeBooks, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: 'Total Entries', value: totalEntries, icon: 'ph:list-bullets-bold', color: '#3b82f6' },
    { label: 'Avg Margin', value: avgMargin + '%', icon: 'ph:chart-line-up-bold', color: '#f59e0b' }
  ];
});

// --- Lifecycle ---
onMounted(() => {
  fetchBooks();
  fetchEntries();
});

// --- Price Book CRUD ---
async function fetchBooks() {
  loadingBooks.value = true;
  try {
    const { body, success } = await useApiFetch('cpq/price-books?limit=100');
    if (success && body) books.value = (body as any).docs || [];
  } finally { loadingBooks.value = false; }
}

function openEditBookDialog(row: any) {
  editingBookId.value = row.id;
  Object.assign(bookForm, {
    name: row.name || '',
    currency: row.currency || 'SAR',
    isActive: row.isActive ?? true,
    effectiveDate: row.effectiveDate || '',
    expiryDate: row.expiryDate || ''
  });
  showBookDialog.value = true;
}

async function saveBook() {
  if (!bookForm.name?.trim()) {
    ElMessage.warning('Name is required');
    return;
  }
  savingBook.value = true;
  try {
    if (editingBookId.value) {
      const { success } = await useApiFetch(`cpq/price-books/${editingBookId.value}`, 'PUT', { ...bookForm });
      if (success) { showBookDialog.value = false; ElMessage.success('Price book updated'); await fetchBooks(); }
    } else {
      const { success } = await useApiFetch('cpq/price-books', 'POST', { ...bookForm });
      if (success) { showBookDialog.value = false; ElMessage.success('Price book created'); await fetchBooks(); }
    }
  } finally { savingBook.value = false; }
}

async function handleDeleteBook(id: number) {
  const { success } = await useApiFetch(`cpq/price-books/${id}`, 'DELETE');
  if (success) { ElMessage.success('Deleted'); await fetchBooks(); }
}

// --- Entry CRUD ---
async function fetchEntries() {
  loadingEntries.value = true;
  try {
    const { body, success } = await useApiFetch('cpq/entries?limit=100');
    if (success && body) entries.value = (body as any).docs || [];
  } finally { loadingEntries.value = false; }
}

function openEditEntryDialog(row: any) {
  editingEntryId.value = row.id;
  Object.assign(entryForm, {
    productName: row.productName || '',
    sku: row.sku || '',
    unitPrice: row.unitPrice || 0,
    costPrice: row.costPrice || 0,
    minQty: row.minQty ?? 1,
    maxDiscount: row.maxDiscount ?? 0,
    priceBookId: row.priceBookId || null
  });
  showEntryDialog.value = true;
}

async function saveEntry() {
  if (!entryForm.productName?.trim()) {
    ElMessage.warning('Product name is required');
    return;
  }
  savingEntry.value = true;
  try {
    if (editingEntryId.value) {
      const { success } = await useApiFetch(`cpq/entries/${editingEntryId.value}`, 'PUT', { ...entryForm });
      if (success) { showEntryDialog.value = false; ElMessage.success('Entry updated'); await fetchEntries(); }
    } else {
      const { success } = await useApiFetch('cpq/entries', 'POST', { ...entryForm });
      if (success) { showEntryDialog.value = false; ElMessage.success('Entry created'); await fetchEntries(); }
    }
  } finally { savingEntry.value = false; }
}

async function handleDeleteEntry(id: number) {
  const { success } = await useApiFetch(`cpq/entries/${id}`, 'DELETE');
  if (success) { ElMessage.success('Deleted'); await fetchEntries(); }
}

// --- Shared ---
function openCreateDialog() {
  if (activeTab.value === 'books') {
    editingBookId.value = null;
    Object.assign(bookForm, defaultBookForm());
    showBookDialog.value = true;
  } else {
    editingEntryId.value = null;
    Object.assign(entryForm, defaultEntryForm());
    showEntryDialog.value = true;
  }
}
</script>
