<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      .flex.items-center.gap-3.mb-1
        NuxtLink.text-sm(to="/hr/payroll" style="color: var(--text-muted)")
          .flex.items-center.gap-1
            Icon(name="ph:arrow-left-bold" size="14")
            span Payroll
        span.text-sm(style="color: var(--text-muted)") /
        span.text-sm(style="color: var(--text-primary)") End of Service Calculator
      h1.text-2xl.font-bold(style="color: var(--text-primary)") End of Service Calculator
      p.text-sm.mt-1(style="color: var(--text-muted)") Calculate end of service benefits per Saudi Labor Law

  //- Calculator Form
  .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
    .glass-card.p-6.rounded-2xl
      h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
        .flex.items-center.gap-2
          Icon(name="ph:user-bold" size="20")
          span Select Employee
      el-form(label-position="top")
        el-form-item(label="Employee" required)
          el-select(
            v-model="selectedEmployeeId"
            filterable
            remote
            :remote-method="searchEmployees"
            placeholder="Search employee by name or number..."
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
              .text-xs(style="color: var(--text-muted)") Employee Number
              .text-sm.font-medium(style="color: var(--text-primary)") {{ selectedEmployee.employeeNumber }}
            div
              .text-xs(style="color: var(--text-muted)") Full Name
              .text-sm.font-medium(style="color: var(--text-primary)") {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
            div
              .text-xs(style="color: var(--text-muted)") Hire Date
              .text-sm.font-medium(style="color: var(--text-primary)") {{ selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 'N/A' }}
            div
              .text-xs(style="color: var(--text-muted)") Status
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
        span Calculate End of Service

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
            span Approve
          el-button(
            v-if="eosResult.status === 'APPROVED'"
            type="primary"
            size="large"
            :loading="payingEos"
            @click="handlePayEos"
            class="flex-1 !rounded-2xl"
          )
            Icon(name="ph:money-bold" size="16" class="mr-1")
            span Mark as Paid
      .glass-card.p-8.rounded-2xl.text-center(v-else)
        Icon(name="ph:calculator-bold" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") Select an employee and click calculate to see the end of service benefit breakdown

  //- Info Card
  .glass-card.p-6.rounded-2xl.mt-6
    h3.text-lg.font-semibold.mb-3(style="color: var(--text-primary)")
      .flex.items-center.gap-2
        Icon(name="ph:info-bold" size="20")
        span Saudi Labor Law - EOS Calculation Rules
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
      .border.rounded-xl.p-4(style="border-color: var(--border-color)")
        .flex.items-center.gap-2.mb-2
          .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
            span.text-sm.font-bold(style="color: #7849ff") 1
          .font-semibold.text-sm(style="color: var(--text-primary)") First 5 Years
        p.text-sm(style="color: var(--text-muted)") Half month salary for each year of service (0.5x monthly salary per year)
      .border.rounded-xl.p-4(style="border-color: var(--border-color)")
        .flex.items-center.gap-2.mb-2
          .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
            span.text-sm.font-bold(style="color: #22c55e") 2
          .font-semibold.text-sm(style="color: var(--text-primary)") After 5 Years
        p.text-sm(style="color: var(--text-muted)") Full month salary for each additional year of service (1x monthly salary per year)
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { calculateEndOfService, approveEndOfService, payEndOfService, type EOSResult } from '~/composables/usePayroll';

definePageMeta({ middleware: 'permissions' });

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
      ElNotification({ type: 'success', title: 'Success', message: 'End of service calculated' });
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
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
      ElNotification({ type: 'success', title: 'Success', message: 'EOS benefit approved' });
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
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
      ElNotification({ type: 'success', title: 'Success', message: 'EOS benefit marked as paid' });
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally {
    payingEos.value = false;
  }
}
</script>
