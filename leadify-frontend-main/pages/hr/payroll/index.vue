<template lang="pug">
div
  ModuleHeader(
    :title="$t('payroll.title')"
    :subtitle="$t('payroll.subtitle')"
  )
    template(#actions)
      NuxtLink(to="/hr/payroll/salary-structures")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:money-bold" size="16" class="mr-1")
          span {{ $t('payroll.salaryStructures') }}
      NuxtLink(to="/hr/payroll/end-of-service")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:calculator-bold" size="16" class="mr-1")
          span {{ $t('payroll.eosCalculator') }}
      el-button(type="primary" size="large" class="!rounded-2xl" @click="showNewRunDialog = true")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        span {{ $t('payroll.newRun') }}

  //- Filters
  .glass-card.p-4.rounded-2xl.mb-4
    .flex.items-center.gap-4
      el-select(v-model="filterMonth" :placeholder="$t('payroll.month')" clearable class="w-40" size="large")
        el-option(v-for="m in months" :key="m.value" :label="m.label" :value="m.value")
      el-input-number(v-model="filterYear" :min="2020" :max="2099" :placeholder="$t('payroll.year')" size="large" controls-position="right" class="w-40")
      el-select(v-model="filterStatus" :placeholder="$t('common.status')" clearable class="w-40" size="large")
        el-option(v-for="s in PAYROLL_RUN_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      el-button(size="large" @click="applyFilters" class="!rounded-2xl")
        Icon(name="ph:funnel-bold" size="16" class="mr-1")
        span {{ $t('common.filter') }}

  //- Summary Stats
  .grid.gap-4.mb-6(class="grid-cols-1 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #7849ff") {{ runs.length }}
      .text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payroll.totalRuns') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #22c55e") {{ draftCount }}
      .text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payroll.draft') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f59e0b") {{ calculatedCount }}
      .text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payroll.calculated') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #3b82f6") {{ processedCount }}
      .text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payroll.processed') }}

  //- Runs Table
  .glass-card.rounded-2xl.overflow-hidden
    el-table(:data="runs" style="width: 100%" @row-click="handleRowClick" row-class-name="cursor-pointer" v-loading="loading")
      el-table-column(:label="$t('payroll.period')" min-width="140")
        template(#default="{ row }")
          .font-semibold(style="color: var(--text-primary)") {{ getMonthName(row.month) }} {{ row.year }}
      el-table-column(:label="$t('common.status')" width="140")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" effect="light" round) {{ row.status }}
      el-table-column(:label="$t('payroll.employees')" width="120" align="center")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ row.employeeCount }}
      el-table-column(:label="$t('payroll.totalGross')" width="160" align="right")
        template(#default="{ row }")
          span.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(row.totalGross) }}
      el-table-column(:label="$t('payroll.totalDeductions')" width="160" align="right")
        template(#default="{ row }")
          span(style="color: #ef4444") {{ formatCurrency(row.totalDeductions) }}
      el-table-column(:label="$t('payroll.totalNet')" width="160" align="right")
        template(#default="{ row }")
          span.font-bold(style="color: #22c55e") {{ formatCurrency(row.totalNet) }}
      el-table-column(:label="$t('common.actions')" width="80" align="center")
        template(#default="{ row }")
          el-button(link type="primary" @click.stop="router.push(`/hr/payroll/${row.id}`)")
            Icon(name="ph:arrow-right-bold" size="18")

  //- New Run Dialog
  el-dialog(v-model="showNewRunDialog" :title="$t('payroll.createPayrollRun')" width="460px")
    el-form(label-position="top")
      el-form-item(:label="$t('payroll.month')" required)
        el-select(v-model="newRun.month" :placeholder="$t('payroll.selectMonth')" class="w-full" size="large")
          el-option(v-for="m in months" :key="m.value" :label="m.label" :value="m.value")
      el-form-item(:label="$t('payroll.year')" required)
        el-input-number(v-model="newRun.year" :min="2020" :max="2099" class="w-full" size="large" controls-position="right")
    template(#footer)
      el-button(@click="showNewRunDialog = false" size="large") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="creating" @click="handleCreateRun" size="large" class="!rounded-2xl") {{ $t('payroll.createRun') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchPayrollRuns, createPayrollRun, PAYROLL_RUN_STATUSES, PayrollRunStatusEnum, type PayrollRun } from '~/composables/usePayroll';

definePageMeta({ middleware: 'permissions' });
const router = useRouter();

const loading = ref(false);
const creating = ref(false);
const showNewRunDialog = ref(false);

const filterMonth = ref<number | undefined>(undefined);
const filterYear = ref<number>(new Date().getFullYear());
const filterStatus = ref<string>('');

const newRun = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
});

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const result = ref(await fetchPayrollRuns());
const runs = computed(() => result.value.docs || []);

const draftCount = computed(() => runs.value.filter((r: PayrollRun) => r.status === PayrollRunStatusEnum.DRAFT).length);
const calculatedCount = computed(() => runs.value.filter((r: PayrollRun) => r.status === PayrollRunStatusEnum.CALCULATED).length);
const processedCount = computed(() => runs.value.filter((r: PayrollRun) => r.status === PayrollRunStatusEnum.PROCESSED).length);

function getMonthName(month: number) {
  return months.find(m => m.value === month)?.label || `Month ${month}`;
}

function getStatusType(status: string) {
  const found = PAYROLL_RUN_STATUSES.find(s => s.value === status);
  return found?.type || 'info';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(value || 0);
}

function handleRowClick(row: PayrollRun) {
  router.push(`/hr/payroll/${row.id}`);
}

async function applyFilters() {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (filterMonth.value) params.month = String(filterMonth.value);
    if (filterYear.value) params.year = String(filterYear.value);
    if (filterStatus.value) params.status = filterStatus.value;
    result.value = await fetchPayrollRuns(params);
  } finally {
    loading.value = false;
  }
}

async function handleCreateRun() {
  creating.value = true;
  try {
    const res = await createPayrollRun(newRun.value);
    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Payroll run created successfully' });
      showNewRunDialog.value = false;
      result.value = await fetchPayrollRuns();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally {
    creating.value = false;
  }
}
</script>
