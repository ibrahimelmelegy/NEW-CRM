<template lang="pug">
el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
  .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
    //- Invoice selector
    el-form-item(label="Invoice" prop="invoiceId")
      el-select(
        v-model="form.invoiceId"
        filterable
        clearable
        remote
        :remote-method="searchInvoices"
        :loading="loadingInvoices"
        placeholder="Search invoice number or amount..."
        class="w-full"
        @change="handleInvoiceChange"
      )
        el-option(
          v-for="inv in invoiceOptions"
          :key="inv.id"
          :label="`${inv.invoiceNumber} - ${formatCurrency(inv.amount)}`"
          :value="inv.id"
        )
          .flex.items-center.justify-between.w-full
            span.font-medium {{ inv.invoiceNumber }}
            span.text-sm(style="color: var(--text-muted)") {{ formatCurrency(inv.amount) }}

    //- Client selector
    el-form-item(label="Client" prop="clientId")
      el-select(
        v-model="form.clientId"
        filterable
        remote
        :remote-method="searchClients"
        :loading="loadingClients"
        placeholder="Select client..."
        class="w-full"
        :disabled="!!form.invoiceId"
      )
        el-option(
          v-for="client in clientOptions"
          :key="client.id"
          :label="client.clientName"
          :value="client.id"
        )

    //- Amount
    el-form-item(label="Amount" prop="amount")
      el-input-number(
        v-model="form.amount"
        :min="0"
        :precision="2"
        :controls="false"
        class="w-full"
        placeholder="Enter payment amount"
      )

    //- Date
    el-form-item(label="Payment Date" prop="date")
      el-date-picker(
        v-model="form.date"
        type="date"
        class="w-full"
        value-format="YYYY-MM-DD"
        placeholder="Select date"
      )

    //- Payment Method
    el-form-item(label="Payment Method" prop="method")
      el-select(v-model="form.method" placeholder="Select method" class="w-full")
        el-option(v-for="opt in paymentMethodOptions" :key="opt.value" :label="opt.label" :value="opt.value")
          .flex.items-center.gap-2
            Icon(:name="getMethodIcon(opt.value)" size="16")
            span {{ opt.label }}

    //- Reference
    el-form-item(label="Reference / Transaction ID" prop="reference")
      el-input(v-model="form.reference" placeholder="e.g. TXN-12345, Check #456")

  //- Notes (full width)
  el-form-item(label="Notes")
    el-input(
      v-model="form.notes"
      type="textarea"
      :rows="3"
      placeholder="Additional notes about this payment..."
    )

  //- Invoice balance hint
  .glass-card.p-4.mt-2.mb-4(v-if="selectedInvoice")
    .flex.items-center.gap-3
      Icon(name="ph:info-bold" size="20" style="color: #3b82f6")
      div
        p.text-sm.font-medium(style="color: var(--text-primary)") Invoice {{ selectedInvoice.invoiceNumber }}
        p.text-xs(style="color: var(--text-muted)") Total: {{ formatCurrency(selectedInvoice.amount) }} | Collected: {{ selectedInvoice.collected ? 'Yes' : 'No' }}
</template>

<script setup lang="ts">
import { paymentMethodOptions } from '~/composables/usePayments';
import { fetchInvoices, type InvoiceItem } from '~/composables/useInvoices';

const props = defineProps<{
  invoiceId?: string;
}>();

const emit = defineEmits<{
  submitted: [data: any];
}>();

const formRef = ref();
const loadingInvoices = ref(false);
const loadingClients = ref(false);
const invoiceOptions = ref<InvoiceItem[]>([]);
const clientOptions = ref<Array<{ id: string; clientName: string }>>([]);
const selectedInvoice = ref<InvoiceItem | null>(null);

const form = reactive({
  invoiceId: '' as string | number | null,
  clientId: '',
  amount: 0,
  date: '',
  method: '',
  reference: '',
  notes: ''
});

const rules = {
  clientId: [{ required: true, message: 'Client is required', trigger: 'change' }],
  amount: [{ required: true, message: 'Amount is required', trigger: 'blur' }],
  date: [{ required: true, message: 'Payment date is required', trigger: 'change' }],
  method: [{ required: true, message: 'Payment method is required', trigger: 'change' }]
};

// Set today as default date
form.date = new Date().toISOString().split('T')[0];

// Load invoice if preselected
if (props.invoiceId) {
  form.invoiceId = props.invoiceId;
  loadInvoiceDetails(props.invoiceId);
}

async function searchInvoices(query: string) {
  if (!query && !props.invoiceId) return;
  loadingInvoices.value = true;
  try {
    const result = await fetchInvoices({ search: query, limit: 20 });
    invoiceOptions.value = result.docs;
  } finally {
    loadingInvoices.value = false;
  }
}

async function loadInvoiceDetails(invoiceId: string | number) {
  loadingInvoices.value = true;
  try {
    const result = await fetchInvoices({ search: String(invoiceId), limit: 20 });
    invoiceOptions.value = result.docs;
    const found = result.docs.find(inv => String(inv.id) === String(invoiceId));
    if (found) {
      selectedInvoice.value = found;
      form.amount = found.amount;
    }
  } finally {
    loadingInvoices.value = false;
  }
}

async function handleInvoiceChange(invoiceId: number | string | null) {
  if (!invoiceId) {
    selectedInvoice.value = null;
    return;
  }
  const invoice = invoiceOptions.value.find(inv => inv.id === invoiceId);
  if (invoice) {
    selectedInvoice.value = invoice;
    form.amount = invoice.amount;

    // Try to auto-fill client from deal association
    // If the invoice has deal info with a client, we could populate it
  }
}

async function searchClients(query: string) {
  if (!query) return;
  loadingClients.value = true;
  try {
    const { body, success } = await useApiFetch(`client?searchKey=${encodeURIComponent(query)}&limit=20`);
    if (success && body?.docs) {
      clientOptions.value = body.docs.map((c: any) => ({ id: c.id, clientName: c.clientName }));
    }
  } finally {
    loadingClients.value = false;
  }
}

// Also load initial clients list
async function loadInitialClients() {
  try {
    const { body, success } = await useApiFetch('client?limit=50');
    if (success && body?.docs) {
      clientOptions.value = body.docs.map((c: any) => ({ id: c.id, clientName: c.clientName }));
    }
  } catch {
    // Silently fail
  }
}
loadInitialClients();

// Also load initial invoices
async function loadInitialInvoices() {
  try {
    const result = await fetchInvoices({ limit: 50 });
    invoiceOptions.value = result.docs;
  } catch {
    // Silently fail
  }
}
loadInitialInvoices();

function getMethodIcon(method: string): string {
  const icons: Record<string, string> = {
    CASH: 'ph:money-bold',
    BANK_TRANSFER: 'ph:bank-bold',
    CREDIT_CARD: 'ph:credit-card-bold',
    CHECK: 'ph:note-bold',
    ONLINE: 'ph:globe-bold'
  };
  return icons[method] || 'ph:money-bold';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  emit('submitted', { ...form });
}

defineExpose({ submit });
</script>
