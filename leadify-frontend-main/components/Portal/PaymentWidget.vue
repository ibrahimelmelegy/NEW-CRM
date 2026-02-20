<template lang="pug">
.payment-widget
  .glass-card.p-6
    //- Header
    .flex.items-center.justify-between.mb-6
      div
        h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('portal.payment.invoiceDetails') }}
        p.text-sm(style="color: var(--text-muted)") {{ invoice.invoiceNumber || '—' }}
      el-tag(:type="statusTagType" size="default" effect="dark" round)
        | {{ $t(`portal.payment.status.${invoice.status?.toLowerCase() || 'unpaid'}`) }}

    //- Invoice Info
    .invoice-info-grid.mb-6
      .info-item
        span.info-label {{ $t('portal.payment.invoiceNumber') }}
        span.info-value {{ invoice.invoiceNumber || '—' }}
      .info-item
        span.info-label {{ $t('portal.payment.deal') }}
        span.info-value {{ invoice.deal?.name || '—' }}
      .info-item
        span.info-label {{ $t('portal.payment.issueDate') }}
        span.info-value {{ formattedDate }}
      .info-item
        span.info-label {{ $t('portal.payment.dueDate') }}
        span.info-value(:class="{ 'text-red-500': isOverdue }") {{ formattedDueDate }}

    //- Payment Breakdown
    .payment-breakdown.mb-6
      .breakdown-row
        span {{ $t('portal.payment.subtotal') }}
        span.font-semibold {{ formatCurrency(subtotal) }}
      .breakdown-row
        span {{ $t('portal.payment.tax') }} (15%)
        span.font-semibold {{ formatCurrency(taxAmount) }}
      .breakdown-divider
      .breakdown-row.total
        span.font-bold {{ $t('portal.payment.totalDue') }}
        span.text-xl.font-bold(style="color: #7849ff") {{ formatCurrency(invoice.amount || 0) }}

    //- Payment Status Indicator
    .payment-status-section.mb-6(v-if="invoice.status === 'PAID'")
      .flex.items-center.gap-3.p-4.rounded-xl(style="background: rgba(34, 197, 94, 0.1)")
        .w-10.h-10.rounded-full.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.2)")
          Icon(name="ph:check-circle-bold" size="24" class="text-green-500" aria-label="Paid")
        div
          p.font-semibold.text-sm(class="text-green-600") {{ $t('portal.payment.paidConfirmation') }}
          p.text-xs(style="color: var(--text-muted)") {{ invoice.collectedDate ? new Date(invoice.collectedDate).toLocaleDateString() : '' }}

    //- Pay Now Section (for unpaid invoices)
    .pay-now-section(v-if="invoice.status !== 'PAID'")
      .payment-method-selector.mb-4
        p.text-sm.font-medium.mb-3(style="color: var(--text-primary)") {{ $t('portal.payment.paymentMethod') }}
        .grid.grid-cols-2.gap-3(class="sm:grid-cols-3")
          .method-card(
            :class="{ active: selectedMethod === 'card' }"
            @click="selectedMethod = 'card'"
          )
            Icon(name="ph:credit-card-bold" size="24" aria-label="Card")
            span.text-xs {{ $t('portal.payment.creditCard') }}
          .method-card(
            :class="{ active: selectedMethod === 'bank' }"
            @click="selectedMethod = 'bank'"
          )
            Icon(name="ph:bank-bold" size="24" aria-label="Bank Transfer")
            span.text-xs {{ $t('portal.payment.bankTransfer') }}
          .method-card(
            :class="{ active: selectedMethod === 'wallet' }"
            @click="selectedMethod = 'wallet'"
          )
            Icon(name="ph:wallet-bold" size="24" aria-label="Digital Wallet")
            span.text-xs {{ $t('portal.payment.digitalWallet') }}

      .flex.items-center.gap-3
        el-button(
          type="primary"
          size="large"
          class="flex-1"
          @click="handlePayNow"
        )
          Icon(name="ph:lightning-bold" size="16" aria-label="Pay Now")
          span.ml-2 {{ $t('portal.payment.payNow') }} - {{ formatCurrency(invoice.amount || 0) }}

    //- Download Invoice
    .flex.items-center.justify-center.mt-4
      el-button(text @click="handleDownload")
        Icon(name="ph:download-simple-bold" size="16" aria-label="Download")
        span.ml-2 {{ $t('portal.payment.downloadInvoice') }}
</template>

<script setup lang="ts">
import type { PortalInvoice } from '~/composables/usePortal';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  invoice: PortalInvoice;
}>();

const selectedMethod = ref('card');

const statusTagType = computed(() => {
  const map: Record<string, string> = {
    PAID: 'success',
    UNPAID: 'danger',
    OVERDUE: 'warning',
    PARTIAL: ''
  };
  return map[props.invoice.status] || 'info';
});

const isOverdue = computed(() => props.invoice.status === 'OVERDUE');

const formattedDate = computed(() => {
  if (!props.invoice.invoiceDate) return '—';
  return new Date(props.invoice.invoiceDate).toLocaleDateString();
});

const formattedDueDate = computed(() => {
  if (!props.invoice.invoiceDate) return '—';
  // Due date is 30 days after invoice date
  const due = new Date(props.invoice.invoiceDate);
  due.setDate(due.getDate() + 30);
  return due.toLocaleDateString();
});

const taxRate = 0.15;

const subtotal = computed(() => {
  const amount = props.invoice.amount || 0;
  return Math.round(amount / (1 + taxRate));
});

const taxAmount = computed(() => {
  return (props.invoice.amount || 0) - subtotal.value;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function handlePayNow() {
  ElMessage({
    type: 'info',
    message: 'Payment gateway integration coming soon. Please contact support for payment instructions.'
  });
}

function handleDownload() {
  ElMessage({
    type: 'info',
    message: 'Invoice PDF download will be available soon.'
  });
}
</script>

<style scoped>
.invoice-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.payment-breakdown {
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-input);
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.breakdown-row.total {
  padding-top: 12px;
}

.breakdown-divider {
  border-top: 1px dashed var(--border-default);
  margin: 4px 0;
}

.method-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid var(--border-default);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}

.method-card:hover {
  border-color: rgba(120, 73, 255, 0.3);
  color: var(--text-primary);
}

.method-card.active {
  border-color: #7849ff;
  background: rgba(120, 73, 255, 0.05);
  color: #7849ff;
}

@media (max-width: 640px) {
  .invoice-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
