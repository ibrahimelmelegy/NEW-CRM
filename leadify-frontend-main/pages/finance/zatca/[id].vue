<template lang="pug">
div(v-loading="loading")
  DetailLayout(
    :title="invoice ? `${$t('zatca.invoice')} #${invoice.invoiceNumber}` : $t('common.loading')"
    :breadcrumbs="breadcrumbs"
    :hasSidebar="true"
  )
    template(#header-actions)
      el-tag.mr-2(v-if="invoice" :type="getStatusType(invoice.status)" size="large" effect="dark")
        | {{ $t(`zatca.status.${invoice.status.toLowerCase()}`) }}
      el-button(
        v-if="invoice && (invoice.status === 'DRAFT' || invoice.status === 'REJECTED')"
        type="success"
        :loading="submitting"
        @click="handleSubmit"
        class="!rounded-2xl"
      )
        Icon(name="ph:paper-plane-tilt-bold" size="16" class="mr-1")
        span {{ $t('zatca.submitToZatca') }}
      el-button(@click="handleDownloadXml" class="!rounded-2xl")
        Icon(name="ph:file-xml-bold" size="16" class="mr-1")
        span {{ $t('zatca.downloadXml') }}
      el-button(@click="handlePrint" class="!rounded-2xl")
        Icon(name="ph:printer-bold" size="16" class="mr-1")
        span {{ $t('zatca.print') }}

    //- Main content
    template(v-if="invoice")
      //- Seller & Buyer Info
      .grid.grid-cols-1.gap-6(class="md:grid-cols-2")
        .glass-card.p-6.animate-entrance
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:buildings-bold" size="20" style="color: var(--accent-color)")
            h3.font-bold.text-lg {{ $t('zatca.sellerInfo') }}
          .space-y-2
            .flex.justify-between
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.name') }}
              span.text-sm.font-medium {{ invoice.sellerName }}
            .flex.justify-between
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.vatNumber') }}
              span.text-sm.font-mono {{ invoice.sellerVatNumber }}
            .flex.justify-between
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.address') }}
              span.text-sm {{ invoice.sellerAddress }}, {{ invoice.sellerCity }}
            .flex.justify-between(v-if="invoice.sellerCRNumber")
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.crNumber') }}
              span.text-sm.font-mono {{ invoice.sellerCRNumber }}

        .glass-card.p-6.animate-entrance(style="animation-delay: 0.05s")
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:user-bold" size="20" style="color: var(--accent-color)")
            h3.font-bold.text-lg {{ $t('zatca.buyerInfo') }}
          .space-y-2
            .flex.justify-between
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.name') }}
              span.text-sm.font-medium {{ invoice.buyerName }}
            .flex.justify-between(v-if="invoice.buyerVatNumber")
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.vatNumber') }}
              span.text-sm.font-mono {{ invoice.buyerVatNumber }}
            .flex.justify-between(v-if="invoice.buyerAddress")
              span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.fields.address') }}
              span.text-sm {{ invoice.buyerAddress }}{{ invoice.buyerCity ? `, ${invoice.buyerCity}` : '' }}

      //- Line Items Table
      .glass-card.p-6.mt-6.animate-entrance(style="animation-delay: 0.1s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:list-bullets-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zatca.lineItems') }}
        el-table(:data="invoice.lineItems || []" stripe)
          el-table-column(type="index" width="50" :label="'#'")
          el-table-column(:label="$t('zatca.fields.itemName')" prop="name" min-width="200")
          el-table-column(:label="$t('zatca.fields.quantity')" prop="quantity" width="100" align="center")
          el-table-column(:label="$t('zatca.fields.unitPrice')" width="130" align="right")
            template(#default="{ row }")
              span {{ formatCurrency(row.unitPrice) }}
          el-table-column(:label="$t('zatca.fields.discount')" width="120" align="right")
            template(#default="{ row }")
              span {{ formatCurrency(row.discount) }}
          el-table-column(:label="$t('zatca.fields.taxRate')" width="100" align="center")
            template(#default="{ row }")
              span {{ row.taxRate }}%
          el-table-column(:label="$t('zatca.fields.taxAmount')" width="120" align="right")
            template(#default="{ row }")
              span {{ formatCurrency(row.taxAmount) }}
          el-table-column(:label="$t('zatca.fields.total')" width="130" align="right")
            template(#default="{ row }")
              span.font-bold {{ formatCurrency(row.total) }}

      //- Totals
      .glass-card.p-6.mt-6.animate-entrance(style="animation-delay: 0.15s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:calculator-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zatca.totals') }}
        .max-w-md.ml-auto
          .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
            span(style="color: var(--text-muted)") {{ $t('zatca.fields.subtotal') }}
            span.font-medium {{ formatCurrency(invoice.subtotal) }}
          .flex.justify-between.py-2.border-b(v-if="invoice.discount" style="border-color: var(--border-color)")
            span(style="color: var(--text-muted)") {{ $t('zatca.fields.discount') }}
            span.font-medium.text-red-500 -{{ formatCurrency(invoice.discount) }}
          .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
            span(style="color: var(--text-muted)") {{ $t('zatca.fields.taxableAmount') }}
            span.font-medium {{ formatCurrency(invoice.taxableAmount) }}
          .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
            span(style="color: var(--text-muted)") {{ $t('zatca.fields.vatAmount') }} (15%)
            span.font-medium {{ formatCurrency(invoice.vatAmount) }}
          .flex.justify-between.py-3
            span.text-lg.font-bold {{ $t('zatca.fields.totalAmount') }}
            span.text-lg.font-bold(style="color: var(--accent-color)") {{ formatCurrency(invoice.totalAmount) }}

      //- ZATCA Submission Section
      .glass-card.p-6.mt-6.animate-entrance(v-if="invoice.status !== 'DRAFT'" style="animation-delay: 0.2s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:cloud-check-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zatca.zatcaSubmission') }}
        .space-y-3
          .flex.justify-between(v-if="invoice.submittedAt")
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.submittedAt') }}
            span.text-sm {{ formatDate(invoice.submittedAt) }}
          .flex.justify-between(v-if="invoice.clearedAt")
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.clearedAt') }}
            span.text-sm {{ formatDate(invoice.clearedAt) }}
          div(v-if="invoice.invoiceHash")
            p.text-sm.mb-1(style="color: var(--text-muted)") {{ $t('zatca.invoiceHash') }}
            .p-3.rounded-lg.font-mono.text-xs.break-all(style="background: var(--bg-secondary)") {{ invoice.invoiceHash }}
          div(v-if="invoice.zatcaResponse")
            p.text-sm.mb-1(style="color: var(--text-muted)") {{ $t('zatca.zatcaResponse') }}
            .p-3.rounded-lg.text-sm(style="background: var(--bg-secondary)")
              pre.whitespace-pre-wrap {{ invoice.zatcaResponse }}
          div(v-if="invoice.zatcaWarnings && invoice.zatcaWarnings.length")
            p.text-sm.mb-1.text-amber-500 {{ $t('zatca.warnings') }}
            ul.list-disc.pl-5
              li.text-sm.text-amber-500(v-for="(w, i) in invoice.zatcaWarnings" :key="i") {{ w }}
          div(v-if="invoice.zatcaErrors && invoice.zatcaErrors.length")
            p.text-sm.mb-1.text-red-500 {{ $t('zatca.errors') }}
            ul.list-disc.pl-5
              li.text-sm.text-red-500(v-for="(e, i) in invoice.zatcaErrors" :key="i") {{ e }}

    //- Sidebar
    template(#sidebar v-if="invoice")
      //- Invoice Details Card
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.05s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:info-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zatca.invoiceDetails') }}
        .space-y-3
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.invoiceNumber') }}
            span.text-sm.font-bold {{ invoice.invoiceNumber }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.invoiceType') }}
            el-tag(size="small" effect="plain") {{ $t(`zatca.types.${invoice.invoiceType.toLowerCase()}`) }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.issueDate') }}
            span.text-sm {{ formatDate(invoice.issueDate) }}
          .flex.justify-between(v-if="invoice.supplyDate")
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.supplyDate') }}
            span.text-sm {{ formatDate(invoice.supplyDate) }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zatca.currency') }}
            span.text-sm {{ invoice.currency || 'SAR' }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") UUID
            p.font-mono.text-xs.break-all(style="color: var(--text-primary)") {{ invoice.uuid }}

      //- QR Code Card
      .glass-card.p-6.animate-entrance(v-if="invoice.qrCode" style="animation-delay: 0.1s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:qr-code-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zatca.qrCode') }}
        .flex.justify-center.p-4.bg-white.rounded-2xl
          img(:src="invoice.qrCode" alt="QR Code" style="width: 180px; height: 180px")

      //- Notes
      .glass-card.p-6.animate-entrance(v-if="invoice.notes" style="animation-delay: 0.15s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:note-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zatca.notes') }}
        p.text-sm(style="color: var(--text-muted)") {{ invoice.notes }}
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchZatcaInvoice, submitToZatca, downloadZatcaXml, type ZatcaInvoice, type ZatcaInvoiceStatus } from '~/composables/useZatca';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const invoice = ref<ZatcaInvoice | null>(null);

const breadcrumbs = computed(() => [
  { label: t('navigation.finance'), to: '/finance/expenses' },
  { label: t('zatca.title'), to: '/finance/zatca' },
  { label: invoice.value ? `#${invoice.value.invoiceNumber}` : '...' }
]);

function getStatusType(status: ZatcaInvoiceStatus): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING: 'warning',
    REPORTED: '',
    CLEARED: 'success',
    REJECTED: 'danger'
  };
  return map[status] || 'info';
}

async function loadInvoice() {
  loading.value = true;
  try {
    invoice.value = await fetchZatcaInvoice(route.params.id as string);
    if (!invoice.value) {
      ElMessage.error(t('errors.notFound'));
      router.push('/finance/zatca');
    }
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!invoice.value) return;
  try {
    await ElMessageBox.confirm(t('zatca.submitConfirm'), t('zatca.submitToZatca'), {
      confirmButtonText: t('common.submit'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    submitting.value = true;
    const res = await submitToZatca(invoice.value.id);
    if (res.success) {
      ElMessage.success(t('zatca.submitSuccess'));
      await loadInvoice();
    } else {
      ElMessage.error(res.message || t('zatca.submitFailed'));
    }
  } catch {
    // cancelled
  } finally {
    submitting.value = false;
  }
}

async function handleDownloadXml() {
  if (!invoice.value) return;
  try {
    await downloadZatcaXml(invoice.value.id);
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

function handlePrint() {
  window.print();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

onMounted(loadInvoice);
</script>
