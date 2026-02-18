<template lang="pug">
FormPage(
  :title="$t('zatca.createInvoice')"
  :breadcrumbs="breadcrumbs"
  :loading="saving"
  :submitLabel="$t('common.save')"
  @submit="handleSave"
)
  //- Invoice Type & Basic Info
  .mb-8
    h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:file-text-bold" size="20" class="mr-2" style="color: var(--accent-color)")
      | {{ $t('zatca.invoiceInfo') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-3")
      el-form-item(:label="$t('zatca.invoiceType')" required)
        el-select(v-model="form.invoiceType" :placeholder="$t('zatca.selectType')" style="width: 100%")
          el-option(
            v-for="t in invoiceTypes"
            :key="t.value"
            :label="$t(`zatca.types.${t.value.toLowerCase()}`)"
            :value="t.value"
          )
      el-form-item(:label="$t('zatca.issueDate')" required)
        el-date-picker(v-model="form.issueDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" :placeholder="$t('zatca.selectDate')")
      el-form-item(:label="$t('zatca.supplyDate')")
        el-date-picker(v-model="form.supplyDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" :placeholder="$t('zatca.selectDate')")
      el-form-item(:label="$t('zatca.currency')")
        el-input(v-model="form.currency" placeholder="SAR")

  //- Seller Information
  .mb-8
    h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:buildings-bold" size="20" class="mr-2" style="color: var(--accent-color)")
      | {{ $t('zatca.sellerInfo') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
      el-form-item(:label="$t('zatca.fields.name')" required)
        el-input(v-model="form.sellerName" :placeholder="$t('zatca.placeholders.sellerName')")
      el-form-item(:label="$t('zatca.fields.vatNumber')" required)
        el-input(v-model="form.sellerVatNumber" placeholder="3XXXXXXXX00003" maxlength="15")
      el-form-item(:label="$t('zatca.fields.address')" required)
        el-input(v-model="form.sellerAddress" :placeholder="$t('zatca.placeholders.address')")
      el-form-item(:label="$t('zatca.fields.city')" required)
        el-input(v-model="form.sellerCity" :placeholder="$t('zatca.placeholders.city')")
      el-form-item(:label="$t('zatca.fields.postalCode')")
        el-input(v-model="form.sellerPostalCode" placeholder="12345")
      el-form-item(:label="$t('zatca.fields.crNumber')")
        el-input(v-model="form.sellerCRNumber" :placeholder="$t('zatca.placeholders.crNumber')")

  //- Buyer Information
  .mb-8
    h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:user-bold" size="20" class="mr-2" style="color: var(--accent-color)")
      | {{ $t('zatca.buyerInfo') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
      el-form-item(:label="$t('zatca.fields.name')" required)
        el-input(v-model="form.buyerName" :placeholder="$t('zatca.placeholders.buyerName')")
      el-form-item(:label="$t('zatca.fields.vatNumber')")
        el-input(v-model="form.buyerVatNumber" placeholder="3XXXXXXXX00003" maxlength="15")
      el-form-item(:label="$t('zatca.fields.address')")
        el-input(v-model="form.buyerAddress" :placeholder="$t('zatca.placeholders.address')")
      el-form-item(:label="$t('zatca.fields.city')")
        el-input(v-model="form.buyerCity" :placeholder="$t('zatca.placeholders.city')")

  //- Line Items
  .mb-8
    .flex.items-center.justify-between.mb-4
      h3.font-bold.text-lg(style="color: var(--text-primary)")
        Icon(name="ph:list-bullets-bold" size="20" class="mr-2" style="color: var(--accent-color)")
        | {{ $t('zatca.lineItems') }}
      el-button(type="primary" @click="addLineItem" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="14" class="mr-1")
        | {{ $t('zatca.addItem') }}

    el-table(:data="form.lineItems")
      el-table-column(:label="$t('zatca.fields.itemName')" min-width="200")
        template(#default="{ row, $index }")
          el-input(v-model="row.name" :placeholder="$t('zatca.placeholders.itemName')" @input="recalculate")
      el-table-column(:label="$t('zatca.fields.quantity')" width="100")
        template(#default="{ row }")
          el-input-number(v-model="row.quantity" :min="1" :precision="0" size="small" style="width: 80px" @change="recalculate")
      el-table-column(:label="$t('zatca.fields.unitPrice')" width="140")
        template(#default="{ row }")
          el-input-number(v-model="row.unitPrice" :min="0" :precision="2" size="small" style="width: 120px" @change="recalculate")
      el-table-column(:label="$t('zatca.fields.discount')" width="120")
        template(#default="{ row }")
          el-input-number(v-model="row.discount" :min="0" :precision="2" size="small" style="width: 100px" @change="recalculate")
      el-table-column(:label="$t('zatca.fields.taxRate') + ' %'" width="100")
        template(#default="{ row }")
          el-input-number(v-model="row.taxRate" :min="0" :max="100" :precision="2" size="small" style="width: 80px" @change="recalculate")
      el-table-column(:label="$t('zatca.fields.total')" width="130" align="right")
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.total || 0) }}
      el-table-column(width="60" align="center")
        template(#default="{ $index }")
          el-button(link type="danger" @click="removeLineItem($index)" :disabled="form.lineItems.length <= 1")
            Icon(name="ph:trash-bold" size="16")

  //- Totals Summary
  .max-w-md.ml-auto.mb-8
    .glass-card.p-6
      h3.font-bold.text-lg.mb-4 {{ $t('zatca.totals') }}
      .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
        span(style="color: var(--text-muted)") {{ $t('zatca.fields.subtotal') }}
        span.font-medium {{ formatCurrency(totals.subtotal) }}
      .flex.justify-between.py-2.border-b(v-if="totals.discount" style="border-color: var(--border-color)")
        span(style="color: var(--text-muted)") {{ $t('zatca.fields.discount') }}
        span.font-medium.text-red-500 -{{ formatCurrency(totals.discount) }}
      .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
        span(style="color: var(--text-muted)") {{ $t('zatca.fields.taxableAmount') }}
        span.font-medium {{ formatCurrency(totals.taxableAmount) }}
      .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
        span(style="color: var(--text-muted)") {{ $t('zatca.fields.vatAmount') }}
        span.font-medium {{ formatCurrency(totals.vatAmount) }}
      .flex.justify-between.py-3
        span.text-lg.font-bold {{ $t('zatca.fields.totalAmount') }}
        span.text-lg.font-bold(style="color: var(--accent-color)") {{ formatCurrency(totals.totalAmount) }}

  //- Notes
  el-form-item(:label="$t('zatca.notes')")
    el-input(v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('zatca.placeholders.notes')")
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { createZatcaInvoice, zatcaInvoiceTypes as invoiceTypes } from '~/composables/useZatca';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const router = useRouter();

const saving = ref(false);

const breadcrumbs = [
  { label: t('navigation.finance'), to: '/finance/expenses' },
  { label: t('zatca.title'), to: '/finance/zatca' },
  { label: t('zatca.createInvoice') }
];

interface LineItemForm {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

function createEmptyLineItem(): LineItemForm {
  return {
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxRate: 15,
    taxAmount: 0,
    subtotal: 0,
    total: 0
  };
}

const form = ref({
  invoiceType: 'STANDARD' as string,
  issueDate: new Date().toISOString().split('T')[0],
  supplyDate: '',
  currency: 'SAR',
  sellerName: '',
  sellerVatNumber: '',
  sellerAddress: '',
  sellerCity: '',
  sellerPostalCode: '',
  sellerCountry: 'SA',
  sellerCRNumber: '',
  buyerName: '',
  buyerVatNumber: '',
  buyerAddress: '',
  buyerCity: '',
  buyerPostalCode: '',
  buyerCountry: 'SA',
  lineItems: [createEmptyLineItem()] as LineItemForm[],
  notes: ''
});

const totals = computed(() => {
  let subtotal = 0;
  let discount = 0;
  let vatAmount = 0;

  for (const item of form.value.lineItems) {
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineDiscount = item.discount || 0;
    const taxable = lineSubtotal - lineDiscount;
    const lineTax = taxable * (item.taxRate / 100);

    subtotal += lineSubtotal;
    discount += lineDiscount;
    vatAmount += lineTax;
  }

  const taxableAmount = subtotal - discount;
  const totalAmount = taxableAmount + vatAmount;

  return { subtotal, discount, taxableAmount, vatAmount, totalAmount };
});

function recalculate() {
  for (const item of form.value.lineItems) {
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineDiscount = item.discount || 0;
    const taxable = lineSubtotal - lineDiscount;
    item.subtotal = lineSubtotal;
    item.taxAmount = taxable * (item.taxRate / 100);
    item.total = taxable + item.taxAmount;
  }
}

function addLineItem() {
  form.value.lineItems.push(createEmptyLineItem());
}

function removeLineItem(index: number) {
  form.value.lineItems.splice(index, 1);
}

async function handleSave() {
  if (!form.value.invoiceType || !form.value.issueDate) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  if (!form.value.sellerName || !form.value.sellerVatNumber) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  if (!form.value.buyerName) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  if (form.value.lineItems.length === 0 || !form.value.lineItems[0].name) {
    ElMessage.warning(t('zatca.addItemRequired'));
    return;
  }

  saving.value = true;
  try {
    recalculate();
    const payload = {
      ...form.value,
      subtotal: totals.value.subtotal,
      discount: totals.value.discount,
      taxableAmount: totals.value.taxableAmount,
      vatAmount: totals.value.vatAmount,
      totalAmount: totals.value.totalAmount
    };
    const res = await createZatcaInvoice(payload);
    if (res.success) {
      ElMessage.success(t('common.created'));
      router.push('/finance/zatca');
    } else {
      ElMessage.error(res.message || t('errors.generic'));
    }
  } finally {
    saving.value = false;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}
</script>
