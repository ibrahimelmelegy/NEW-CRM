<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('cpq.title')" :subtitle="$t('cpq.subtitle')")
    template(#actions)
      el-button(type="primary" size="large" @click="openCreateDialog" class="premium-btn")
        Icon(name="ph:plus-bold" size="20")
        span.mx-1 {{ activeTab === 'books' ? $t('cpq.addPriceBook') : $t('cpq.addEntry') }}

  StatCards(:stats="summaryStats")

  //- Generate Quote Button
  .mb-4.animate-entrance
    el-button(type="success" size="large" @click="showQuoteDialog = true" class="premium-btn")
      Icon(name="ph:calculator-bold" size="20")
      span.mx-1 {{ $t('cpq.generateQuote') }}

  .glass-card.py-8.animate-entrance
    el-tabs(v-model="activeTab" class="px-4")
      //- Price Books Tab
      el-tab-pane(:label="$t('cpq.priceBooks')" name="books")
        el-table(:data="books" v-loading="loadingBooks" style="width: 100%")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('cpq.bookName')" min-width="180")
            template(#default="{ row }")
              span.font-bold {{ row.name || '—' }}
          el-table-column(:label="$t('cpq.currency')" width="100" align="center")
            template(#default="{ row }")
              span {{ row.currency || 'SAR' }}
          el-table-column(:label="$t('cpq.isActive')" width="100" align="center")
            template(#default="{ row }")
              el-tag(:type="row.isActive ? 'success' : 'info'" size="small" round) {{ row.isActive ? 'Yes' : 'No' }}
          el-table-column(:label="$t('cpq.effectiveDate')" width="140")
            template(#default="{ row }")
              span.text-xs.font-mono {{ row.effectiveDate ? new Date(row.effectiveDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—' }}
          el-table-column(:label="$t('cpq.expiryDate')" width="140")
            template(#default="{ row }")
              span.text-xs.font-mono {{ row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—' }}
          el-table-column(:label="$t('common.action')" width="100" fixed="right")
            template(#default="{ row }")
              el-button(text circle size="small" type="primary" @click="openEditBookDialog(row)")
                Icon(name="ph:pencil-simple" size="14")
              el-button(text circle size="small" type="danger" @click="handleDeleteBook(row.id)")
                Icon(name="ph:trash" size="14")
          template(#empty)
            el-empty(:description="$t('common.noData')")

        .flex.justify-end.mt-4
          el-pagination(
            :current-page="booksPagination.page"
            :page-size="booksPagination.limit"
            :total="booksPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { booksPagination.page = p; fetchBooks() }"
          )

      //- Discount Rules Tab
      el-tab-pane(:label="$t('cpq.discountRules')" name="discounts")
        .mb-4.flex.justify-between.items-center
          p.text-sm(style="color: var(--text-muted)") {{ $t('cpq.discountRulesDesc') }}
          el-button(type="primary" size="default" @click="showDiscountDialog = true")
            Icon(name="ph:plus-bold" size="16")
            span.mx-1 {{ $t('cpq.addDiscountRule') }}

        .space-y-3
          .glass-card.p-4.rounded-xl(v-for="rule in discountRules" :key="rule.id" style="border: 1px solid var(--border-default)")
            .flex.items-start.justify-between
              div
                p.text-sm.font-bold(style="color: var(--text-primary)") {{ rule.name }}
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ rule.type }}: {{ rule.description }}
                .flex.items-center.gap-3.mt-2
                  el-tag(size="small" effect="dark") {{ rule.discountValue }}% off
                  el-tag(v-if="rule.minQuantity" size="small" type="info") Min Qty: {{ rule.minQuantity }}
                  el-tag(v-if="rule.isActive" size="small" type="success") Active
                  el-tag(v-else size="small" type="info") Inactive
              .flex.gap-1
                el-button(text size="small" type="primary" @click="editDiscountRule(rule)")
                  Icon(name="ph:pencil-simple" size="14")
                el-button(text size="small" type="danger" @click="deleteDiscountRule(rule.id)")
                  Icon(name="ph:trash" size="14")

          .text-center.py-6(v-if="!discountRules.length")
            Icon(name="ph:percent" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('cpq.noDiscountRules') }}

      //- Entries Tab
      el-tab-pane(:label="$t('cpq.entries')" name="entries")
        el-table(:data="entries" v-loading="loadingEntries" style="width: 100%")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('cpq.productName')" min-width="170")
            template(#default="{ row }")
              span.font-bold {{ row.productName || '—' }}
          el-table-column(:label="$t('cpq.sku')" width="120")
            template(#default="{ row }")
              span.font-mono.text-xs {{ row.sku || '—' }}
          el-table-column(:label="$t('cpq.unitPrice')" width="130" align="right")
            template(#default="{ row }")
              span.font-bold {{ Number(row.unitPrice || 0).toLocaleString() }} SAR
          el-table-column(:label="$t('cpq.costPrice')" width="130" align="right")
            template(#default="{ row }")
              span {{ Number(row.costPrice || 0).toLocaleString() }} SAR
          el-table-column(:label="$t('cpq.minQty')" width="90" align="center")
            template(#default="{ row }")
              span {{ row.minQty ?? 1 }}
          el-table-column(:label="$t('cpq.maxDiscount')" width="120" align="center")
            template(#default="{ row }")
              span {{ row.maxDiscount != null ? row.maxDiscount + '%' : '—' }}
          el-table-column(:label="$t('common.action')" width="100" fixed="right")
            template(#default="{ row }")
              el-button(text circle size="small" type="primary" @click="openEditEntryDialog(row)")
                Icon(name="ph:pencil-simple" size="14")
              el-button(text circle size="small" type="danger" @click="handleDeleteEntry(row.id)")
                Icon(name="ph:trash" size="14")
          template(#empty)
            el-empty(:description="$t('common.noData')")

        .flex.justify-end.mt-4
          el-pagination(
            :current-page="entriesPagination.page"
            :page-size="entriesPagination.limit"
            :total="entriesPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { entriesPagination.page = p; fetchEntries() }"
          )

  //- Price Book Dialog
  el-dialog(v-model="showBookDialog" :title="editingBookId ? $t('cpq.editPriceBook') : $t('cpq.addPriceBook')" width="500px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('cpq.bookName')" required)
        el-input(v-model="bookForm.name" :placeholder="$t('cpq.bookNamePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.currency')")
          el-select(v-model="bookForm.currency" class="w-full")
            el-option(:label="$t('common.currencySAR')" value="SAR")
            el-option(:label="$t('common.currencyUSD')" value="USD")
            el-option(:label="$t('common.currencyEUR')" value="EUR")
            el-option(:label="$t('common.currencyGBP')" value="GBP")
        el-form-item(:label="$t('cpq.isActive')")
          el-select(v-model="bookForm.isActive" class="w-full")
            el-option(:label="$t('common.yes')" :value="true")
            el-option(:label="$t('common.no')" :value="false")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.effectiveDate')")
          el-date-picker(v-model="bookForm.effectiveDate" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('cpq.expiryDate')")
          el-date-picker(v-model="bookForm.expiryDate" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
    template(#footer)
      el-button(@click="showBookDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingBook" @click="saveBook") {{ $t('common.save') }}

  //- Entry Dialog
  el-dialog(v-model="showEntryDialog" :title="editingEntryId ? $t('cpq.editEntry') : $t('cpq.addEntry')" width="550px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.productName')" required)
          el-input(v-model="entryForm.productName" :placeholder="$t('cpq.productNamePlaceholder')")
        el-form-item(:label="$t('cpq.sku')")
          el-input(v-model="entryForm.sku" placeholder="SKU-001")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.unitPrice')" required)
          el-input-number(v-model="entryForm.unitPrice" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('cpq.costPrice')")
          el-input-number(v-model="entryForm.costPrice" :min="0" :precision="2" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('cpq.minQty')")
          el-input-number(v-model="entryForm.minQty" :min="1" class="w-full")
        el-form-item(:label="$t('cpq.maxDiscount')")
          el-input-number(v-model="entryForm.maxDiscount" :min="0" :max="100" :precision="2" class="w-full")
      el-form-item(:label="$t('cpq.priceBook')")
        el-select(v-model="entryForm.priceBookId" class="w-full" :placeholder="$t('cpq.selectPriceBook')")
          el-option(v-for="book in books" :key="book.id" :label="book.name" :value="book.id")
    template(#footer)
      el-button(@click="showEntryDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingEntry" @click="saveEntry") {{ $t('common.save') }}

  //- Generate Quote Dialog
  el-dialog(v-model="showQuoteDialog" :title="$t('cpq.generateQuote')" width="700px" destroy-on-close)
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('cpq.selectPriceBook')" required)
        el-select(v-model="quoteForm.priceBookId" class="w-full" :placeholder="$t('cpq.selectPriceBook')")
          el-option(v-for="book in books.filter(b => b.isActive)" :key="book.id" :label="book.name" :value="book.id")

      .flex.items-center.justify-between.mb-3
        h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('cpq.lineItems') }}
        el-button(type="primary" text size="small" @click="addQuoteLineItem")
          Icon(name="ph:plus-bold" size="14")
          span.ml-1 {{ $t('cpq.addItem') }}

      .space-y-3
        .grid.grid-cols-12.gap-3.items-end(v-for="(item, idx) in quoteForm.items" :key="idx")
          .col-span-6
            el-form-item(:label="idx === 0 ? $t('cpq.entry') : ''" class="!mb-0")
              el-select(v-model="item.entryId" class="w-full" :placeholder="$t('cpq.selectEntry')" filterable)
                el-option(v-for="entry in entries" :key="entry.id" :label="`${entry.productName} — ${Number(entry.unitPrice || 0).toLocaleString()} SAR`" :value="entry.id")
          .col-span-3
            el-form-item(:label="idx === 0 ? $t('cpq.quantity') : ''" class="!mb-0")
              el-input-number(v-model="item.quantity" :min="1" class="w-full" size="large")
          .col-span-3.flex.items-center.gap-2
            el-form-item(:label="idx === 0 ? ' ' : ''" class="!mb-0 flex-1")
              span.text-sm.font-bold(style="color: var(--text-secondary)") {{ getLineItemPrice(item) }}
            el-button(v-if="quoteForm.items.length > 1" text circle size="small" type="danger" @click="quoteForm.items.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")

      el-form-item(:label="$t('cpq.taxRate')" class="mt-4")
        el-input-number(v-model="quoteForm.taxRate" :min="0" :max="100" :precision="2" class="w-full")

    //- Quote Result
    .glass-card.p-5.rounded-2xl.mt-4(v-if="quoteResult")
      h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('cpq.quoteResult') }}
      el-table(:data="quoteResult.lineItems || []" size="small" style="width: 100%" class="mb-4")
        el-table-column(:label="$t('cpq.product')" min-width="160")
          template(#default="{ row }")
            span.font-bold {{ row.productName || row.entryId }}
        el-table-column(:label="$t('cpq.qty')" width="80" align="center")
          template(#default="{ row }")
            span {{ row.quantity }}
        el-table-column(:label="$t('cpq.unitPrice')" width="120" align="right")
          template(#default="{ row }")
            span {{ Number(row.unitPrice || 0).toLocaleString() }} SAR
        el-table-column(:label="$t('cpq.amount')" width="130" align="right")
          template(#default="{ row }")
            span.font-bold {{ Number(row.amount || 0).toLocaleString() }} SAR

      .space-y-2(style="border-top: 1px solid var(--glass-border, rgba(255,255,255,0.1))" class="pt-3")
        .flex.justify-between.text-sm
          span(style="color: var(--text-muted)") {{ $t('cpq.subtotal') }}
          span.font-bold(style="color: var(--text-primary)") {{ Number(quoteResult.subtotal || 0).toLocaleString() }} SAR
        .flex.justify-between.text-sm(v-if="quoteResult.discount")
          span(style="color: var(--text-muted)") {{ $t('cpq.discount') }}
          span.font-bold.text-green-500 -{{ Number(quoteResult.discount || 0).toLocaleString() }} SAR
        .flex.justify-between.text-sm
          span(style="color: var(--text-muted)") {{ $t('cpq.tax') }} ({{ quoteForm.taxRate }}%)
          span.font-bold(style="color: var(--text-primary)") {{ Number(quoteResult.tax || 0).toLocaleString() }} SAR
        .flex.justify-between.text-lg.font-bold.pt-2(style="border-top: 1px solid var(--glass-border, rgba(255,255,255,0.1))")
          span(style="color: var(--text-primary)") {{ $t('cpq.total') }}
          span(style="color: #22c55e") {{ Number(quoteResult.total || 0).toLocaleString() }} SAR

    template(#footer)
      el-button(@click="showQuoteDialog = false") {{ $t('common.cancel') }}
      el-button(type="success" :loading="calculatingQuote" @click="calculateQuote")
        Icon(name="ph:calculator-bold" size="16")
        span.ml-1 {{ $t('cpq.calculate') }}
      el-button(v-if="quoteResult" type="primary" :loading="convertingToDeal" @click="convertQuoteToDeal")
        Icon(name="ph:handshake-bold" size="16")
        span.ml-1 {{ $t('cpq.convertToDeal') }}
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const activeTab = ref('books');

// --- Price Books ---
const loadingBooks = ref(false);
const savingBook = ref(false);
const showBookDialog = ref(false);
const editingBookId = ref<number | null>(null);
const books = ref<Record<string, unknown>[]>([]);
const booksPagination = reactive({ page: 1, limit: 20, total: 0 });

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
const entries = ref<Record<string, unknown>[]>([]);
const entriesPagination = reactive({ page: 1, limit: 20, total: 0 });

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
  const avgMargin =
    totalEntries > 0
      ? Math.round(
          entries.value.reduce((s, e) => {
            const unit = Number(e.unitPrice || 0);
            const cost = Number(e.costPrice || 0);
            return s + (unit > 0 ? ((unit - cost) / unit) * 100 : 0);
          }, 0) / totalEntries
        )
      : 0;
  return [
    { label: t('cpq.priceBooks'), value: books.value.length, icon: 'ph:book-open-bold', color: '#7849ff' },
    { label: t('cpq.activeBooks'), value: activeBooks, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('cpq.totalEntries'), value: totalEntries, icon: 'ph:list-bullets-bold', color: '#3b82f6' },
    { label: t('cpq.avgMargin'), value: avgMargin + '%', icon: 'ph:chart-line-up-bold', color: '#f59e0b' }
  ];
});

// --- Lifecycle ---
onMounted(() => {
  fetchBooks();
  fetchEntries();
  fetchDiscountRules();
});

// --- Price Book CRUD ---
async function fetchBooks() {
  loadingBooks.value = true;
  try {
    const { body, success } = await useApiFetch(`cpq/price-books?page=${booksPagination.page}&limit=${booksPagination.limit}`);
    if (success && body) {
      const data = body as unknown;
      books.value = data.docs || data.rows || [];
      booksPagination.total = data.pagination?.totalItems ?? data.count ?? data.total ?? books.value.length;
    }
  } finally {
    loadingBooks.value = false;
  }
}

function openEditBookDialog(row: unknown) {
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
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  savingBook.value = true;
  try {
    if (editingBookId.value) {
      const { success } = await useApiFetch(`cpq/price-books/${editingBookId.value}`, 'PUT', { ...bookForm });
      if (success) {
        showBookDialog.value = false;
        ElMessage.success(t('common.saved'));
        await fetchBooks();
      }
    } else {
      const { success } = await useApiFetch('cpq/price-books', 'POST', { ...bookForm });
      if (success) {
        showBookDialog.value = false;
        ElMessage.success(t('common.saved'));
        await fetchBooks();
      }
    }
  } finally {
    savingBook.value = false;
  }
}

async function handleDeleteBook(id: number) {
  const { success } = await useApiFetch(`cpq/price-books/${id}`, 'DELETE');
  if (success) {
    ElMessage.success(t('common.deleted'));
    await fetchBooks();
  }
}

// --- Entry CRUD ---
async function fetchEntries() {
  loadingEntries.value = true;
  try {
    const { body, success } = await useApiFetch(`cpq/entries?page=${entriesPagination.page}&limit=${entriesPagination.limit}`);
    if (success && body) {
      const data = body as unknown;
      entries.value = data.docs || data.rows || [];
      entriesPagination.total = data.pagination?.totalItems ?? data.count ?? data.total ?? entries.value.length;
    }
  } finally {
    loadingEntries.value = false;
  }
}

function openEditEntryDialog(row: unknown) {
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
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  savingEntry.value = true;
  try {
    if (editingEntryId.value) {
      const { success } = await useApiFetch(`cpq/entries/${editingEntryId.value}`, 'PUT', { ...entryForm });
      if (success) {
        showEntryDialog.value = false;
        ElMessage.success(t('common.saved'));
        await fetchEntries();
      }
    } else {
      const { success } = await useApiFetch('cpq/entries', 'POST', { ...entryForm });
      if (success) {
        showEntryDialog.value = false;
        ElMessage.success(t('common.saved'));
        await fetchEntries();
      }
    }
  } finally {
    savingEntry.value = false;
  }
}

async function handleDeleteEntry(id: number) {
  const { success } = await useApiFetch(`cpq/entries/${id}`, 'DELETE');
  if (success) {
    ElMessage.success(t('common.deleted'));
    await fetchEntries();
  }
}

// --- Generate Quote ---
const showQuoteDialog = ref(false);
const showDiscountDialog = ref(false);
const calculatingQuote = ref(false);
const convertingToDeal = ref(false);
const quoteResult = ref<Record<string, unknown> | null>(null);
const discountRules = ref<Record<string, unknown>[]>([]);

const quoteForm = reactive({
  priceBookId: null as number | null,
  items: [{ entryId: null as number | null, quantity: 1 }] as { entryId: number | null; quantity: number }[],
  taxRate: 15
});

function addQuoteLineItem() {
  quoteForm.items.push({ entryId: null, quantity: 1 });
}

function getLineItemPrice(item: { entryId: number | null; quantity: number }): string {
  if (!item.entryId) return '—';
  const entry = entries.value.find((e) => e.id === item.entryId);
  if (!entry) return '—';
  const total = Number(entry.unitPrice || 0) * item.quantity;
  return total.toLocaleString() + ' SAR';
}

async function calculateQuote() {
  if (!quoteForm.priceBookId) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  const validItems = quoteForm.items.filter(i => i.entryId);
  if (!validItems.length) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  calculatingQuote.value = true;
  try {
    const payload = {
      priceBookId: quoteForm.priceBookId,
      items: validItems.map(i => ({ entryId: i.entryId, quantity: i.quantity })),
      taxRate: quoteForm.taxRate
    };
    const { body, success } = await useApiFetch('cpq/generate-quote', 'POST', payload);
    if (success && body) {
      quoteResult.value = body;
    } else {
      ElMessage.error(t('common.error'));
    }
  } finally {
    calculatingQuote.value = false;
  }
}

async function convertQuoteToDeal() {
  if (!quoteResult.value) return;
  convertingToDeal.value = true;
  try {
    const { success } = await useApiFetch('cpq/convert-to-deal', 'POST', {
      quote: quoteResult.value,
      priceBookId: quoteForm.priceBookId
    });
    if (success) {
      ElMessage.success(t('common.saved'));
      showQuoteDialog.value = false;
      quoteResult.value = null;
    } else {
      ElMessage.error(t('common.error'));
    }
  } finally {
    convertingToDeal.value = false;
  }
}

// Discount Rules
async function fetchDiscountRules() {
  try {
    const { body, success } = await useApiFetch('cpq/discount-rules');
    if (success && body) {
      discountRules.value = Array.isArray(body) ? body : body.docs || body.rows || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

function editDiscountRule(rule: unknown) {
  ElMessage.info(rule.name);
}

async function deleteDiscountRule(id: number) {
  try {
    const { success } = await useApiFetch(`cpq/discount-rules/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(t('common.deleted'));
      await fetchDiscountRules();
    }
  } catch {
    ElMessage.error(t('common.error'));
  }
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
