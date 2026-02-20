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
        span.text-sm(style="color: var(--text-primary)") Salary Structures
      h1.text-2xl.font-bold(style="color: var(--text-primary)") Salary Structures
      p.text-sm.mt-1(style="color: var(--text-muted)") Define and manage salary structures for employees
    el-button(type="primary" size="large" class="!rounded-2xl" @click="openCreateDialog")
      Icon(name="ph:plus-bold" size="16" class="mr-1")
      span New Structure

  //- Structures Table
  .glass-card.rounded-2xl.overflow-hidden
    el-table(:data="structures" style="width: 100%" v-loading="loading")
      el-table-column(label="Employee" min-width="200")
        template(#default="{ row }")
          .font-semibold(style="color: var(--text-primary)") {{ row.employee?.firstName }} {{ row.employee?.lastName }}
          .text-xs(style="color: var(--text-muted)") {{ row.employee?.employeeNumber }}
      el-table-column(label="Basic Salary" width="140" align="right")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ formatCurrency(row.basicSalary) }}
      el-table-column(label="Housing" width="130" align="right")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ formatCurrency(row.housingAllowance) }}
      el-table-column(label="Transport" width="130" align="right")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ formatCurrency(row.transportAllowance) }}
      el-table-column(label="Other" width="130" align="right")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ formatCurrency(row.otherAllowances) }}
      el-table-column(label="GOSI Rate" width="110" align="center")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ (Number(row.gosiEmployeeRate) * 100).toFixed(2) }}%
      el-table-column(label="Effective Date" width="140")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ row.effectiveDate }}
      el-table-column(label="Actions" width="100" align="center")
        template(#default="{ row }")
          el-button(link type="primary" @click="openEditDialog(row)")
            Icon(name="ph:pencil-bold" size="16")

  //- Create/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingId ? 'Edit Salary Structure' : 'New Salary Structure'" width="600px")
    el-form(label-position="top" :model="form")
      el-form-item(label="Employee" required)
        el-select(
          v-model="form.employeeId"
          filterable
          remote
          :remote-method="searchEmployees"
          placeholder="Search employee..."
          class="w-full"
          size="large"
          :disabled="!!editingId"
          :loading="searchingEmployees"
        )
          el-option(
            v-for="emp in employeeOptions"
            :key="emp.id"
            :label="`${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`"
            :value="emp.id"
          )
      .grid.gap-4(class="grid-cols-2")
        el-form-item(label="Basic Salary" required)
          el-input-number(v-model="form.basicSalary" :min="0" :precision="2" controls-position="right" class="w-full" size="large")
        el-form-item(label="Housing Allowance")
          el-input-number(v-model="form.housingAllowance" :min="0" :precision="2" controls-position="right" class="w-full" size="large")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(label="Transport Allowance")
          el-input-number(v-model="form.transportAllowance" :min="0" :precision="2" controls-position="right" class="w-full" size="large")
        el-form-item(label="Other Allowances")
          el-input-number(v-model="form.otherAllowances" :min="0" :precision="2" controls-position="right" class="w-full" size="large")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(label="GOSI Employee Rate")
          el-input-number(v-model="form.gosiEmployeeRate" :min="0" :max="1" :step="0.0025" :precision="4" controls-position="right" class="w-full" size="large")
        el-form-item(label="Effective Date" required)
          el-date-picker(v-model="form.effectiveDate" type="date" value-format="YYYY-MM-DD" placeholder="Select date" class="w-full" size="large")
      .glass-card.p-4.rounded-xl.mt-2
        .text-sm.font-semibold.mb-2(style="color: var(--text-primary)") Summary
        .flex.justify-between.text-sm
          span(style="color: var(--text-muted)") Total Monthly Salary
          span.font-bold(style="color: #22c55e") {{ formatCurrency(totalMonthlySalary) }}
    template(#footer)
      el-button(@click="dialogVisible = false" size="large") Cancel
      el-button(type="primary" :loading="saving" @click="handleSave" size="large" class="!rounded-2xl") {{ editingId ? 'Update' : 'Create' }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  type SalaryStructureItem
} from '~/composables/usePayroll';

definePageMeta({ middleware: 'permissions' });

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const searchingEmployees = ref(false);

const employeeOptions = ref<any[]>([]);

const form = ref({
  employeeId: '',
  basicSalary: 0,
  housingAllowance: 0,
  transportAllowance: 0,
  otherAllowances: 0,
  gosiEmployeeRate: 0.0975,
  effectiveDate: ''
});

const totalMonthlySalary = computed(() => {
  return (form.value.basicSalary || 0) + (form.value.housingAllowance || 0) + (form.value.transportAllowance || 0) + (form.value.otherAllowances || 0);
});

const result = ref(await fetchSalaryStructures());
const structures = computed(() => result.value.docs || []);

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(value || 0);
}

async function searchEmployees(query: string) {
  if (!query || query.length < 2) return;
  searchingEmployees.value = true;
  try {
    const { body, success } = await useApiFetch(`hr/employees?search=${encodeURIComponent(query)}&limit=20`);
    if (success && body) {
      const data = body as any;
      employeeOptions.value = data.docs || data || [];
    }
  } finally { searchingEmployees.value = false; }
}

function resetForm() {
  form.value = {
    employeeId: '',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    gosiEmployeeRate: 0.0975,
    effectiveDate: ''
  };
  editingId.value = null;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: SalaryStructureItem) {
  editingId.value = row.id;
  form.value = {
    employeeId: row.employeeId,
    basicSalary: Number(row.basicSalary),
    housingAllowance: Number(row.housingAllowance),
    transportAllowance: Number(row.transportAllowance),
    otherAllowances: Number(row.otherAllowances),
    gosiEmployeeRate: Number(row.gosiEmployeeRate),
    effectiveDate: row.effectiveDate
  };
  // Pre-populate employee in the select
  if (row.employee) {
    employeeOptions.value = [row.employee];
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.employeeId || !form.value.basicSalary || !form.value.effectiveDate) {
    ElNotification({ type: 'warning', title: 'Validation', message: 'Please fill in all required fields' });
    return;
  }

  saving.value = true;
  try {
    let res;
    if (editingId.value) {
      res = await updateSalaryStructure(editingId.value, form.value);
    } else {
      res = await createSalaryStructure(form.value);
    }

    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: editingId.value ? 'Salary structure updated' : 'Salary structure created' });
      dialogVisible.value = false;
      result.value = await fetchSalaryStructures();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally { saving.value = false; }
}
</script>
