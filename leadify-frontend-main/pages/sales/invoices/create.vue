<template lang="pug">
div
  //- Header
  .flex.items-center.gap-3.mb-5.mt-5
    el-button(circle plain @click="goBack")
      Icon(name="ph:arrow-left-bold" size="18")
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") Create Invoice
      p.text-sm(style="color: var(--text-muted)") Build and send a new invoice

  el-form(
    ref="formRef"
    :model="form"
    label-position="top"
    @submit.prevent
  )
    //- Client & deal selection
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Invoice Details
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(label="Deal" required)
          el-select(
            v-model="form.dealId"
            filterable
            placeholder="Select a deal"
            style="width: 100%"
            @change="onDealChange"
          )
            el-option(
              v-for="deal in deals"
              :key="deal.id"
              :label="deal.name"
              :value="deal.id"
            )
        el-form-item(label="Sales Order (Optional)")
          el-select(
            v-model="form.salesOrderId"
            filterable
            clearable
            placeholder="Import from sales order"
            style="width: 100%"
            @change="onSalesOrderSelect"
          )
            el-option(
              v-for="order in salesOrders"
              :key="order.id"
              :label="order.orderNumber"
              :value="order.id"
            )
        el-form-item(label="Invoice Date")
          el-date-picker(
            v-model="form.invoiceDate"
            type="date"
            placeholder="Invoice date"
            style="width: 100%"
          )
        el-form-item(label="Payment Terms")
          el-select(
            v-model="form.paymentTerms"
            placeholder="Select payment terms"
            style="width: 100%"
            @change="calculateDueDate"
          )
            el-option(
              v-for="term in paymentTermsOptions"
              :key="term.value"
              :label="term.label"
              :value="term.value"
            )
        el-form-item(label="Due Date")
          el-date-picker(
            v-model="form.dueDate"
            type="date"
            placeholder="Due date"
            style="width: 100%"
          )

    //- Line items
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Line Items
      InvoiceInvoiceLineItems(
        :items="form.lineItems"
        :editable="true"
        @update:items="onLineItemsUpdate"
      )

    //- Totals
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Summary
      .max-w-md.ml-auto
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Subtotal
          span.font-semibold(style="color: var(--text-primary)") {{ fmtCurrency(computedTotals.subtotal) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Tax
          span(style="color: var(--text-primary)") + {{ fmtCurrency(computedTotals.tax) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Discount
          span(style="color: #ef4444") - {{ fmtCurrency(computedTotals.discount) }}
        .flex.justify-between.py-3
          span.font-bold.text-lg(style="color: var(--text-primary)") Total
          span.font-bold.text-xl(style="color: #7849ff") {{ fmtCurrency(computedTotals.total) }}

    //- Notes
    .glass-card.p-8.rounded-3xl.mb-6
      el-form-item(label="Notes")
        el-input(
          v-model="form.notes"
          type="textarea"
          :rows="4"
          placeholder="Additional notes for the invoice..."
        )

    //- Actions
    .flex.justify-end.gap-3
      el-button(size="large" @click="goBack") Cancel
      el-button(size="large" type="info" plain @click="saveDraft" :loading="saving") Save as Draft
      el-button(size="large" type="primary" @click="saveAndSend" :loading="saving") Save & Send
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { createInvoice, createFromOrder, PAYMENT_TERMS_OPTIONS, formatCurrency } from '~/composables/useInvoiceBilling';

definePageMeta({ middleware: 'permissions' });

const router = useRouter();

interface LineItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

const saving = ref(false);
const deals = ref<Array<{ id: string; name: string }>>([]);
const salesOrders = ref<Array<{ id: string; orderNumber: string }>>([]);
const paymentTermsOptions = PAYMENT_TERMS_OPTIONS;

const form = ref({
  dealId: '',
  salesOrderId: '',
  invoiceDate: new Date(),
  paymentTerms: 'NET_30',
  dueDate: null as Date | null,
  notes: '',
  lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, lineTotal: 0 }] as LineItem[]
});

const computedTotals = computed(() => {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;

  for (const item of form.value.lineItems) {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = itemSubtotal * (item.discountRate / 100);
    const taxable = itemSubtotal - itemDiscount;
    const itemTax = taxable * (item.taxRate / 100);

    subtotal += itemSubtotal;
    discount += itemDiscount;
    tax += itemTax;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round((subtotal - discount + tax) * 100) / 100
  };
});

function fmtCurrency(amount: number): string {
  return formatCurrency(amount);
}

function goBack() {
  router.push('/sales/invoices');
}

function onLineItemsUpdate(items: LineItem[]) {
  form.value.lineItems = items;
}

function calculateDueDate() {
  const invoiceDate = form.value.invoiceDate ? new Date(form.value.invoiceDate) : new Date();
  const daysMap: Record<string, number> = {
    NET_15: 15,
    NET_30: 30,
    NET_60: 60,
    NET_90: 90,
    DUE_ON_RECEIPT: 0
  };
  const days = daysMap[form.value.paymentTerms];
  if (days !== undefined) {
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + days);
    form.value.dueDate = due;
  }
}

async function onDealChange() {
  // Reset sales order when deal changes
  form.value.salesOrderId = '';
  await loadSalesOrders();
}

async function onSalesOrderSelect(orderId: string) {
  if (!orderId) return;
  // When a sales order is selected, create from order
  saving.value = true;
  try {
    const result = await createFromOrder(orderId);
    if (result) {
      router.push(`/sales/invoices/${result.id}`);
    }
  } finally {
    saving.value = false;
  }
}

async function loadDeals() {
  try {
    const { body, success } = await useApiFetch('deal?limit=200');
    if (success && body) {
      const data = body as any;
      deals.value = (data.docs || data || []).map((d: any) => ({ id: d.id, name: d.name }));
    }
  } catch {
    /* silent */
  }
}

async function loadSalesOrders() {
  if (!form.value.dealId) return;
  try {
    const { body, success } = await useApiFetch(`sales-orders?dealId=${form.value.dealId}&limit=100`);
    if (success && body) {
      const data = body as any;
      salesOrders.value = (data.docs || data || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber
      }));
    }
  } catch {
    /* silent */
  }
}

function validate(): boolean {
  if (!form.value.dealId) {
    ElNotification({ type: 'warning', title: 'Validation', message: 'Please select a deal' });
    return false;
  }
  const validItems = form.value.lineItems.filter(item => item.description.trim());
  if (validItems.length === 0) {
    ElNotification({ type: 'warning', title: 'Validation', message: 'Please add at least one line item with a description' });
    return false;
  }
  return true;
}

async function saveDraft() {
  if (!validate()) return;
  saving.value = true;
  try {
    const result = await createInvoice({
      dealId: form.value.dealId,
      invoiceDate: form.value.invoiceDate ? new Date(form.value.invoiceDate).toISOString() : undefined,
      notes: form.value.notes || undefined,
      paymentTerms: form.value.paymentTerms,
      dueDate: form.value.dueDate ? new Date(form.value.dueDate).toISOString() : undefined,
      lineItems: form.value.lineItems.filter(item => item.description.trim()).map(({ lineTotal, id, ...item }) => item)
    });
    if (result) {
      router.push(`/sales/invoices/${result.id}`);
    }
  } finally {
    saving.value = false;
  }
}

async function saveAndSend() {
  if (!validate()) return;
  saving.value = true;
  try {
    const result = await createInvoice({
      dealId: form.value.dealId,
      invoiceDate: form.value.invoiceDate ? new Date(form.value.invoiceDate).toISOString() : undefined,
      notes: form.value.notes || undefined,
      paymentTerms: form.value.paymentTerms,
      dueDate: form.value.dueDate ? new Date(form.value.dueDate).toISOString() : undefined,
      lineItems: form.value.lineItems.filter(item => item.description.trim()).map(({ lineTotal, id, ...item }) => item)
    });
    if (result) {
      // After creating, mark as sent
      const { markInvoiceSent } = await import('~/composables/useInvoiceBilling');
      await markInvoiceSent(result.id);
      router.push(`/sales/invoices/${result.id}`);
    }
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  calculateDueDate();
  await loadDeals();
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}
</style>
