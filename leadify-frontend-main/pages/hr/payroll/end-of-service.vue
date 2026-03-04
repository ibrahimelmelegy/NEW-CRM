<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      .flex.items-center.gap-3.mb-1
        NuxtLink.text-sm(to="/hr/payroll" style="color: var(--text-muted)")
          .flex.items-center.gap-1
            Icon(name="ph:arrow-left-bold" size="14")
            span {{ $t('hr.payroll.payroll') }}
        span.text-sm(style="color: var(--text-muted)") /
        span.text-sm(style="color: var(--text-primary)") {{ $t('hr.payroll.endOfService') }}
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('hr.payroll.endOfService') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('hr.payroll.endOfServiceSubtitle') }}

  //- Calculator Form
  .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
    .glass-card.p-6.rounded-2xl
      h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
        .flex.items-center.gap-2
          Icon(name="ph:user-bold" size="20")
          span {{ $t('hr.payroll.selectEmployee') }}
      el-form(label-position="top")
        el-form-item(:label="$t('hr.payroll.employee')" required)
          el-select(
            v-model="selectedEmployeeId"
            filterable
            remote
            :remote-method="searchEmployees"
            :placeholder="$t('hr.payroll.searchEmployee')"
            class="w-full"
            size="large"
            :loading="searchingEmployees"
            @change="onEmployeeChange"
          )
            el-option(
              v-for="emp in employeeOptions"
              :key="emp.id"
              :label="`${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`"
              :value="emp.id"
            )

      //- Selected Employee Info
      div(v-if="selectedEmployee")
        .border.rounded-xl.p-4.mt-4(style="border-color: var(--border-color)")
          .grid.gap-3(class="grid-cols-2")
            div
              .text-xs(style="color: var(--text-muted)") {{ $t('hr.payroll.employeeNumber') }}
              .text-sm.font-medium(style="color: var(--text-primary)") {{ selectedEmployee.employeeNumber }}
            div
              .text-xs(style="color: var(--text-muted)") {{ $t('hr.payroll.fullName') }}
              .text-sm.font-medium(style="color: var(--text-primary)") {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
            div
              .text-xs(style="color: var(--text-muted)") {{ $t('hr.payroll.hireDate') }}
              .text-sm.font-medium(style="color: var(--text-primary)") {{ selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 'N/A' }}
            div
              .text-xs(style="color: var(--text-muted)") {{ $t('hr.payroll.status') }}
              el-tag(:type="selectedEmployee.status === 'ACTIVE' ? 'success' : 'danger'" size="small" round) {{ selectedEmployee.status }}

      el-button.mt-6(
        type="primary"
        size="large"
        :loading="calculating"
        :disabled="!selectedEmployeeId"
        @click="handleCalculate"
        class="w-full !rounded-2xl"
      )
        Icon(name="ph:calculator-bold" size="16" class="mr-1")
        span {{ $t('hr.payroll.calculateEndOfService') }}

    //- Results Panel
    div
      div(v-if="eosResult")
        EOSCalculator(:result="eosResult")
        .flex.gap-3.mt-4
          el-button(
            v-if="eosResult.status === 'CALCULATED'"
            type="success"
            size="large"
            :loading="approvingEos"
            @click="handleApproveEos"
            class="flex-1 !rounded-2xl"
          )
            Icon(name="ph:check-circle-bold" size="16" class="mr-1")
            span {{ $t('hr.payroll.approveEos') }}
          el-button(
            v-if="eosResult.status === 'APPROVED'"
            type="primary"
            size="large"
            :loading="payingEos"
            @click="handlePayEos"
            class="flex-1 !rounded-2xl"
          )
            Icon(name="ph:money-bold" size="16" class="mr-1")
            span {{ $t('hr.payroll.markAsPaid') }}
      .glass-card.p-8.rounded-2xl.text-center(v-else)
        Icon(name="ph:calculator-bold" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('hr.payroll.eosPlaceholder') }}

  //- Info Card
  .glass-card.p-6.rounded-2xl.mt-6
    h3.text-lg.font-semibold.mb-3(style="color: var(--text-primary)")
      .flex.items-center.gap-2
        Icon(name="ph:info-bold" size="20")
        span {{ $t('hr.payroll.eosRules') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
      .border.rounded-xl.p-4(style="border-color: var(--border-color)")
        .flex.items-center.gap-2.mb-2
          .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
            span.text-sm.font-bold(style="color: #7849ff") 1
          .font-semibold.text-sm(style="color: var(--text-primary)") {{ $t('hr.payroll.first5Years') }}
        p.text-sm(style="color: var(--text-muted)") {{ $t('hr.payroll.first5YearsDesc') }}
      .border.rounded-xl.p-4(style="border-color: var(--border-color)")
        .flex.items-center.gap-2.mb-2
          .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
            span.text-sm.font-bold(style="color: #22c55e") 2
          .font-semibold.text-sm(style="color: var(--text-primary)") {{ $t('hr.payroll.after5Years') }}
        p.text-sm(style="color: var(--text-muted)") {{ $t('hr.payroll.after5YearsDesc') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { calculateEndOfService, approveEndOfService, payEndOfService, type EOSResult } from '~/composables/usePayroll';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const calculating = ref(false);
const approvingEos = ref(false);
const payingEos = ref(false);
const searchingEmployees = ref(false);

const selectedEmployeeId = ref<string>('');
const selectedEmployee = ref<any>(null);
const employeeOptions = ref<any[]>([]);
const eosResult = ref<EOSResult | null>(null);

async function searchEmployees(query: string) {
  if (!query || query.length < 2) return;
  searchingEmployees.value = true;
  try {
    const { body, success } = await useApiFetch(`hr/employees?search=${encodeURIComponent(query)}&limit=20`);
    if (success && body) {
      const data = body as any;
      employeeOptions.value = data.docs || data || [];
    }
  } finally {
    searchingEmployees.value = false;
  }
}

function onEmployeeChange(empId: string) {
  selectedEmployee.value = employeeOptions.value.find(e => e.id === empId) || null;
  eosResult.value = null;
}

async function handleCalculate() {
  if (!selectedEmployeeId.value) return;
  calculating.value = true;
  try {
    const res = await calculateEndOfService(selectedEmployeeId.value);
    if (res.success && res.body) {
      eosResult.value = res.body as EOSResult;
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.payroll.eosCalculated') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    calculating.value = false;
  }
}

async function handleApproveEos() {
  if (!eosResult.value?.id) return;
  approvingEos.value = true;
  try {
    const res = await approveEndOfService(eosResult.value.id);
    if (res.success) {
      eosResult.value = { ...eosResult.value, status: 'APPROVED' };
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.payroll.eosApproved') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    approvingEos.value = false;
  }
}

async function handlePayEos() {
  if (!eosResult.value?.id) return;
  payingEos.value = true;
  try {
    const res = await payEndOfService(eosResult.value.id);
    if (res.success) {
      eosResult.value = { ...eosResult.value, status: 'PAID' };
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.payroll.eosPaid') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    payingEos.value = false;
  }
}
</script>
