<template lang="pug">
div(v-loading="loading")
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      .flex.items-center.gap-3.mb-1
        NuxtLink.text-sm(to="/hr/payroll" style="color: var(--text-muted)")
          .flex.items-center.gap-1
            Icon(name="ph:arrow-left-bold" size="14")
            span Payroll
        span.text-sm(style="color: var(--text-muted)") /
        span.text-sm(style="color: var(--text-primary)") {{ periodLabel }}
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ periodLabel }}
      .mt-1
        el-tag(:type="statusType" effect="light" round size="large") {{ payrollRun?.status }}
    .flex.items-center.gap-3
      el-button(
        v-if="payrollRun?.status === 'DRAFT'"
        type="warning"
        size="large"
        :loading="calculating"
        @click="handleCalculate"
        class="!rounded-2xl"
      )
        Icon(name="ph:calculator-bold" size="16" class="mr-1")
        span Calculate Payslips
      el-button(
        v-if="payrollRun?.status === 'CALCULATED'"
        type="success"
        size="large"
        :loading="approving"
        @click="handleApprove"
        class="!rounded-2xl"
      )
        Icon(name="ph:check-circle-bold" size="16" class="mr-1")
        span Approve
      el-button(
        v-if="payrollRun?.status === 'APPROVED'"
        type="primary"
        size="large"
        :loading="processing"
        @click="handleProcess"
        class="!rounded-2xl"
      )
        Icon(name="ph:paper-plane-tilt-bold" size="16" class="mr-1")
        span Process Payment

  //- Summary Cards
  PayrollSummary(:data="summaryData")

  //- Payslips Table
  .glass-card.rounded-2xl.overflow-hidden.mt-6
    .p-4.flex.items-center.justify-between
      h3.text-lg.font-semibold(style="color: var(--text-primary)") Payslips
      .text-sm(style="color: var(--text-muted)") {{ payslips.length }} employee(s)
    PayslipTable(:payslips="payslips")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchPayrollRunById,
  calculatePayslips,
  approvePayrollRun,
  processPayrollRun,
  PAYROLL_RUN_STATUSES,
  type PayrollRun,
  type PayslipItem
} from '~/composables/usePayroll';

definePageMeta({ middleware: 'permissions' });
const route = useRoute();

const loading = ref(false);
const calculating = ref(false);
const approving = ref(false);
const processing = ref(false);

const payrollRun = ref<PayrollRun | null>(await fetchPayrollRunById(route.params.id as string));

const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const periodLabel = computed(() => {
  if (!payrollRun.value) return '';
  return `${months[payrollRun.value.month]} ${payrollRun.value.year}`;
});

const statusType = computed(() => {
  const found = PAYROLL_RUN_STATUSES.find(s => s.value === payrollRun.value?.status);
  return found?.type || 'info';
});

const payslips = computed<PayslipItem[]>(() => payrollRun.value?.payslips || []);

const summaryData = computed(() => ({
  totalGross: Number(payrollRun.value?.totalGross) || 0,
  totalDeductions: Number(payrollRun.value?.totalDeductions) || 0,
  totalNet: Number(payrollRun.value?.totalNet) || 0,
  employeeCount: payrollRun.value?.employeeCount || 0
}));

async function refreshData() {
  loading.value = true;
  try {
    payrollRun.value = await fetchPayrollRunById(route.params.id as string);
  } finally { loading.value = false; }
}

async function handleCalculate() {
  calculating.value = true;
  try {
    const res = await calculatePayslips(route.params.id as string);
    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Payslips calculated successfully' });
      await refreshData();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally { calculating.value = false; }
}

async function handleApprove() {
  approving.value = true;
  try {
    const res = await approvePayrollRun(route.params.id as string);
    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Payroll run approved' });
      await refreshData();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally { approving.value = false; }
}

async function handleProcess() {
  processing.value = true;
  try {
    const res = await processPayrollRun(route.params.id as string);
    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Payroll run processed for payment' });
      await refreshData();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally { processing.value = false; }
}
</script>
