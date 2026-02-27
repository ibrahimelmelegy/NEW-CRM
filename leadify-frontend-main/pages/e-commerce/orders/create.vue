<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    .flex.items-center.gap-3
      el-button(size="large" @click="navigateTo('/e-commerce/orders')" class="!rounded-xl")
        Icon(name="ph:arrow-left-bold" size="16")
      div
        h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.newOrder') || 'Create New Order' }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('salesOrders.title') || 'Fill in the details to create a sales order' }}

  .grid.gap-6(class="grid-cols-1 lg_grid-cols-3")
    //- Main form area (2 columns)
    .col-span-1(class="lg_col-span-2")
      //- Step 1: Client Selection
      el-card.rounded-2xl.mb-6(shadow="never" style="border: 1px solid var(--border-default)")
        template(#header)
          .flex.items-center.gap-2
            .w-7.h-7.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              span.text-xs.font-bold(style="color: #7849ff") 1
            span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.selectClient') || 'Select Client' }}
        el-form(label-position="top")
          el-form-item(:label="$t('salesOrders.client') || 'Client'" required)
            el-select(
              v-model="selectedClientId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchClients"
              :loading="loadingClients"
              :placeholder="$t('salesOrders.selectClient') || 'Search and select a client...'"
              size="large"
              style="width: 100%"
              @change="onClientSelect"
            )
              el-option(
                v-for="c in clientOptions"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              )
        //- Selected client info
        .p-4.rounded-xl.mt-2(
          v-if="selectedClient"
          style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
        )
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:user-bold" size="18" style="color: #7849ff")
            div
              p.text-sm.font-bold(style="color: var(--text-primary)") {{ selectedClient.name }}
              p.text-xs(style="color: var(--text-muted)") {{ selectedClient.email || selectedClient.phone || 'Client selected' }}

      //- Step 2: Add Items
      el-card.rounded-2xl.mb-6(shadow="never" style="border: 1px solid var(--border-default)")
        template(#header)
          .flex.items-center.justify-between
            .flex.items-center.gap-2
              .w-7.h-7.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                span.text-xs.font-bold(style="color: #7849ff") 2
              span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.items') || 'Order Items' }}
            el-button(type="primary" size="small" @click="addBlankItem" class="!rounded-lg")
              Icon(name="ph:plus-bold" size="14" class="mr-1")
              | {{ $t('salesOrders.addItem') || 'Add Item' }}

        //- Product search
        .mb-4
          el-select(
            v-model="productSearchId"
            filterable
            remote
            reserve-keyword
            :remote-method="searchProducts"
            :loading="loadingProducts"
            :placeholder="$t('common.search') || 'Search products to add...'"
            size="large"
            style="width: 100%"
            @change="addProductItem"
          )
            el-option(
              v-for="p in productOptions"
              :key="p.id"
              :label="`${p.name} - ${p.sku || 'N/A'} (${formatCurrency(p.unitPrice, p.currency)})`"
              :value="p.id"
            )

        //- Items list
        .space-y-3(v-if="orderItems.length")
          .p-4.rounded-xl(
            v-for="(item, idx) in orderItems"
            :key="idx"
            style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
          )
            .flex.items-start.justify-between.mb-3
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ ($t('salesOrders.items') || 'Item') + ' #' + (idx + 1) }}
              el-button(
                type="danger"
                size="small"
                plain
                circle
                @click="removeItem(idx)"
              )
                Icon(name="ph:x-bold" size="12")
            .grid.gap-3(class="grid-cols-1 md_grid-cols-2")
              el-form-item.mb-0(:label="$t('salesOrders.description') || 'Description'")
                el-input(v-model="item.description" :placeholder="$t('salesOrders.description') || 'Item description'")
              el-form-item.mb-0(:label="$t('salesOrders.quantity') || 'Quantity'")
                el-input-number(v-model="item.quantity" :min="1" style="width: 100%")
            .grid.gap-3.mt-3(class="grid-cols-1 md_grid-cols-3")
              el-form-item.mb-0(:label="$t('salesOrders.unitPrice') || 'Unit Price'")
                el-input-number(v-model="item.unitPrice" :min="0" :precision="2" style="width: 100%")
              el-form-item.mb-0(:label="$t('salesOrders.taxRate') || 'Tax Rate %'")
                el-input-number(v-model="item.taxRate" :min="0" :max="100" :precision="2" style="width: 100%")
              el-form-item.mb-0(:label="$t('salesOrders.discountRate') || 'Discount %'")
                el-input-number(v-model="item.discountRate" :min="0" :max="100" :precision="2" style="width: 100%")
            .flex.justify-end.mt-3
              span.text-sm.font-bold(style="color: #7849ff") {{ $t('salesOrders.lineTotal') || 'Line Total' }}: {{ formatCurrency(calcLineTotal(item)) }}

        //- Empty items
        .text-center.py-8(v-else)
          Icon(name="ph:shopping-cart" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No items added yet. Search products or add a blank item.' }}

      //- Step 3: Order Details
      el-card.rounded-2xl.mb-6(shadow="never" style="border: 1px solid var(--border-default)")
        template(#header)
          .flex.items-center.gap-2
            .w-7.h-7.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              span.text-xs.font-bold(style="color: #7849ff") 3
            span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.title') || 'Order Details' }}
        el-form(:model="form" label-position="top")
          .grid.gap-4(class="grid-cols-1 md_grid-cols-2")
            el-form-item(:label="$t('salesOrders.paymentTerms') || 'Payment Terms'")
              el-input(v-model="form.paymentTerms" :placeholder="$t('salesOrders.paymentTerms') || 'e.g. Net 30'")
            el-form-item(:label="$t('salesOrders.currency') || 'Currency'")
              el-select(v-model="form.currency" style="width: 100%")
                el-option(label="SAR" value="SAR")
                el-option(label="USD" value="USD")
                el-option(label="EUR" value="EUR")
                el-option(label="GBP" value="GBP")
          el-form-item(:label="$t('salesOrders.shippingAddress') || 'Shipping Address'")
            el-input(v-model="form.shippingAddress" type="textarea" :rows="3" :placeholder="$t('salesOrders.shippingAddress') || 'Enter shipping address...'")
          el-form-item(:label="$t('salesOrders.notes') || 'Notes'")
            el-input(v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('salesOrders.notes') || 'Any additional notes...'")

    //- Summary Sidebar
    .col-span-1
      .glass-card.p-5.rounded-2xl.sticky(style="top: 80px")
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:receipt-bold" size="20" class="mr-2" style="color: #7849ff")
          | {{ $t('common.summary') || 'Summary' }}

        //- Client
        .mb-4(v-if="selectedClient")
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.client') || 'Client' }}
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedClient.name }}

        //- Items summary
        .mb-4(v-if="orderItems.length")
          p.text-xs.mb-2(style="color: var(--text-muted)") {{ $t('salesOrders.items') || 'Items' }} ({{ orderItems.length }})
          .space-y-1
            .flex.justify-between.text-sm(v-for="(item, idx) in orderItems" :key="idx")
              span.truncate.flex-1.mr-2(style="color: var(--text-primary)") {{ item.description || `Item ${idx + 1}` }}
              span.font-mono.whitespace-nowrap(style="color: var(--text-muted)") x{{ item.quantity }}

        el-divider

        //- Totals
        .space-y-2
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('salesOrders.subtotal') || 'Subtotal' }}
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(summarySubtotal) }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('salesOrders.taxAmount') || 'Tax' }}
            span.text-sm(style="color: var(--text-primary)") {{ formatCurrency(summaryTax) }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('salesOrders.discountAmount') || 'Discount' }}
            span.text-sm(style="color: var(--text-primary)") -{{ formatCurrency(summaryDiscount) }}

        el-divider

        .flex.justify-between.mb-6
          span.text-base.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.total') || 'Total' }}
          span.text-xl.font-black(style="color: #7849ff") {{ formatCurrency(summaryTotal) }}

        //- Validation warnings
        .mb-4(v-if="validationErrors.length")
          .p-3.rounded-lg(style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3)")
            .flex.items-center.gap-2.mb-1(v-for="err in validationErrors" :key="err")
              Icon(name="ph:warning-bold" size="14" style="color: #ef4444")
              span.text-xs(style="color: #ef4444") {{ err }}

        el-button(
          type="primary"
          size="large"
          style="width: 100%"
          :loading="saving"
          :disabled="!!validationErrors.length"
          @click="submitOrder"
          class="!rounded-xl"
        )
          Icon(name="ph:check-bold" size="16" class="mr-1")
          | {{ $t('common.create') || 'Create Order' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { createSalesOrder } from '~/composables/useSalesOrders';
import { fetchProducts } from '~/composables/useProductCatalog';
import type { CatalogProduct } from '~/composables/useProductCatalog';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const saving = ref(false);

// Client selection
const selectedClientId = ref('');
const selectedClient = ref<any>(null);
const clientOptions = ref<any[]>([]);
const loadingClients = ref(false);

// Product search
const productSearchId = ref('');
const productOptions = ref<CatalogProduct[]>([]);
const loadingProducts = ref(false);

// Order items
interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  productId?: string;
}

const orderItems = ref<OrderItem[]>([]);

// Form
const form = reactive({
  paymentTerms: '',
  currency: 'SAR',
  shippingAddress: '',
  notes: ''
});

// Client search
async function searchClients(query: string) {
  if (!query || query.length < 1) return;
  loadingClients.value = true;
  try {
    const res = await useApiFetch(`client?search=${encodeURIComponent(query)}&limit=20`);
    if (res?.success && res.body) {
      const data = res.body as any;
      clientOptions.value = data?.docs || data?.rows || data || [];
    }
  } catch {
    // silent
  } finally {
    loadingClients.value = false;
  }
}

function onClientSelect(id: string) {
  selectedClient.value = clientOptions.value.find(c => c.id === id) || null;
}

// Product search
async function searchProducts(query: string) {
  if (!query || query.length < 1) return;
  loadingProducts.value = true;
  try {
    const result = await fetchProducts({ search: query, limit: '20' });
    productOptions.value = result.docs;
  } catch {
    // silent
  } finally {
    loadingProducts.value = false;
  }
}

function addProductItem(productId: string) {
  const product = productOptions.value.find(p => p.id === productId);
  if (!product) return;
  orderItems.value.push({
    description: product.name || '',
    quantity: 1,
    unitPrice: product.unitPrice || 0,
    taxRate: 15,
    discountRate: 0,
    productId: product.id
  });
  // Reset the product search selector
  nextTick(() => {
    productSearchId.value = '';
  });
}

function addBlankItem() {
  orderItems.value.push({
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 15,
    discountRate: 0
  });
}

function removeItem(idx: number) {
  orderItems.value.splice(idx, 1);
}

// Calculations
function calcLineTotal(item: OrderItem): number {
  const base = item.quantity * item.unitPrice;
  const discount = base * (item.discountRate / 100);
  const taxable = base - discount;
  const tax = taxable * (item.taxRate / 100);
  return taxable + tax;
}

const summarySubtotal = computed(() =>
  orderItems.value.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
);

const summaryDiscount = computed(() =>
  orderItems.value.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice;
    return sum + base * (item.discountRate / 100);
  }, 0)
);

const summaryTax = computed(() =>
  orderItems.value.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice;
    const discount = base * (item.discountRate / 100);
    const taxable = base - discount;
    return sum + taxable * (item.taxRate / 100);
  }, 0)
);

const summaryTotal = computed(() =>
  summarySubtotal.value - summaryDiscount.value + summaryTax.value
);

// Validation
const validationErrors = computed(() => {
  const errors: string[] = [];
  if (!selectedClientId.value) errors.push(t('salesOrders.selectClient') || 'Please select a client');
  if (!orderItems.value.length) errors.push(t('salesOrders.addItem') || 'Add at least one item');
  orderItems.value.forEach((item, idx) => {
    if (item.quantity < 1) errors.push(`Item ${idx + 1}: ${t('salesOrders.quantity') || 'Quantity'} must be > 0`);
  });
  return errors;
});

function formatCurrency(amount?: number, currency?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || form.currency || 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

// Submit
async function submitOrder() {
  if (validationErrors.value.length) return;
  saving.value = true;
  try {
    const payload = {
      clientId: selectedClientId.value,
      currency: form.currency,
      paymentTerms: form.paymentTerms,
      shippingAddress: form.shippingAddress,
      notes: form.notes,
      items: orderItems.value.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discountRate: item.discountRate
      }))
    };
    const result = await createSalesOrder(payload);
    if (result) navigateTo('/e-commerce/orders');
  } finally {
    saving.value = false;
  }
}

// Load initial client list
onMounted(async () => {
  try {
    const res = await useApiFetch('client?limit=20');
    if (res?.success && res.body) {
      const data = res.body as any;
      clientOptions.value = data?.docs || data?.rows || data || [];
    }
  } catch {
    // silent
  }
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
