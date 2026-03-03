<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") Employees
      p.text-sm.mt-1(style="color: var(--text-muted)") Manage your organization's employees
    .flex.items-center.gap-3
      ExportButton(
        :data="exportData"
        :columns="exportColumns"
        filename="employees-export"
        title="Employees Report"
      )
      el-button(type="primary" size="large" class="!rounded-2xl" @click="navigateTo('/hr/employees/create')")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        span Add Employee

  //- Filters
  .glass-card.p-4.rounded-2xl.mb-6
    .flex.flex-wrap.items-center.gap-4
      el-input(
        v-model="searchQuery"
        :placeholder="'Search employees...'"
        size="large"
        clearable
        class="max-w-xs"
        @input="debouncedSearch"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass-bold" size="16")

      el-select(
        v-model="filterDepartment"
        placeholder="All Departments"
        size="large"
        clearable
        class="w-48"
        @change="loadEmployees"
      )
        el-option(
          v-for="dept in departments"
          :key="dept.id"
          :label="dept.name"
          :value="dept.id"
        )

      el-select(
        v-model="filterStatus"
        placeholder="All Statuses"
        size="large"
        clearable
        class="w-40"
        @change="loadEmployees"
      )
        el-option(
          v-for="st in EMPLOYEE_STATUSES"
          :key="st.value"
          :label="st.label"
          :value="st.value"
        )

      .flex-1
      .flex.items-center.gap-2
        el-button(
          :type="viewMode === 'grid' ? 'primary' : 'default'"
          size="large"
          circle
          @click="viewMode = 'grid'"
        )
          Icon(name="ph:squares-four-bold" size="16")
        el-button(
          :type="viewMode === 'list' ? 'primary' : 'default'"
          size="large"
          circle
          @click="viewMode = 'list'"
        )
          Icon(name="ph:list-bold" size="16")

  //- Stats
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-green-100
          Icon(name="ph:users-bold" size="20" class="text-green-600")
        div
          p.text-xs(style="color: var(--text-muted)") Total
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ pagination.totalItems }}
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-blue-100
          Icon(name="ph:check-circle-bold" size="20" class="text-blue-600")
        div
          p.text-xs(style="color: var(--text-muted)") Active
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ activeCount }}
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-yellow-100
          Icon(name="ph:clock-bold" size="20" class="text-yellow-600")
        div
          p.text-xs(style="color: var(--text-muted)") On Leave
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ onLeaveCount }}
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-purple-100
          Icon(name="ph:user-plus-bold" size="20" class="text-purple-600")
        div
          p.text-xs(style="color: var(--text-muted)") Probation
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ probationCount }}

  //- Loading
  .flex.justify-center.py-12(v-if="loading")
    el-skeleton(:rows="5" animated)

  //- Grid View
  template(v-else-if="viewMode === 'grid'")
    .grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" v-if="employees.length")
      HREmployeeCard(
        v-for="emp in employees"
        :key="emp.id"
        :employee="emp"
        @click="navigateTo(`/hr/employees/${emp.id}`)"
      )
    .text-center.py-12(v-else)
      Icon(name="ph:users-bold" size="48" style="color: var(--text-muted)")
      p.mt-2(style="color: var(--text-muted)") No employees found

  //- List View
  template(v-else)
    .glass-card.rounded-2xl.overflow-hidden(v-if="employees.length")
      el-table(:data="employees" style="width: 100%" @row-click="(row) => navigateTo(`/hr/employees/${row.id}`)")
        el-table-column(label="Employee" min-width="220")
          template(#default="{ row }")
            .flex.items-center.gap-3
              .avatar-circle-sm
                span.text-white.font-bold.text-xs {{ (row.firstName?.charAt(0) || '') + (row.lastName?.charAt(0) || '') }}
              div
                p.font-semibold(style="color: var(--text-primary)") {{ row.firstName }} {{ row.lastName }}
                p.text-xs(style="color: var(--text-muted)") {{ row.employeeNumber }}
        el-table-column(prop="jobTitle" label="Job Title" min-width="160")
          template(#default="{ row }")
            span(style="color: var(--text-primary)") {{ row.jobTitle || '---' }}
        el-table-column(label="Department" min-width="140")
          template(#default="{ row }")
            span(style="color: var(--text-primary)") {{ row.department?.name || '---' }}
        el-table-column(label="Status" width="130")
          template(#default="{ row }")
            el-tag(:type="getEmployeeStatusType(row.status)" size="small" round) {{ getEmployeeStatusLabel(row.status) }}
        el-table-column(prop="email" label="Email" min-width="200")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.email }}
        el-table-column(prop="phone" label="Phone" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.phone || '---' }}
    .text-center.py-12(v-else)
      Icon(name="ph:users-bold" size="48" style="color: var(--text-muted)")
      p.mt-2(style="color: var(--text-muted)") No employees found

  //- Pagination
  .flex.justify-center.mt-6(v-if="pagination.totalPages > 1")
    el-pagination(
      v-model:current-page="currentPage"
      :page-size="pagination.limit"
      :total="pagination.totalItems"
      layout="prev, pager, next"
      @current-change="handlePageChange"
    )
</template>

<script setup lang="ts">
import { fetchEmployees, fetchDepartments, EMPLOYEE_STATUSES, getEmployeeStatusType, getEmployeeStatusLabel } from '~/composables/useEmployees';
import type { Employee, DepartmentItem } from '~/composables/useEmployees';

definePageMeta({ middleware: 'permissions' });

const loading = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const filterDepartment = ref('');
const filterStatus = ref('');
const currentPage = ref(1);

const employees = ref<Employee[]>([]);
const departments = ref<DepartmentItem[]>([]);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

const activeCount = computed(() => employees.value.filter(e => e.status === 'ACTIVE').length);
const onLeaveCount = computed(() => employees.value.filter(e => e.status === 'ON_LEAVE').length);
const probationCount = computed(() => employees.value.filter(e => e.status === 'PROBATION').length);

const exportColumns = [
  { prop: 'fullName', label: 'Name' },
  { prop: 'employeeNumber', label: 'Employee #' },
  { prop: 'jobTitle', label: 'Job Title' },
  { prop: 'departmentName', label: 'Department' },
  { prop: 'status', label: 'Status' },
  { prop: 'email', label: 'Email' },
  { prop: 'phone', label: 'Phone' }
];

const exportData = computed(() =>
  employees.value.map(e => ({
    fullName: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
    employeeNumber: e.employeeNumber || '',
    jobTitle: e.jobTitle || '',
    departmentName: e.department?.name || '',
    status: getEmployeeStatusLabel(e.status),
    email: e.email || '',
    phone: e.phone || ''
  }))
);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadEmployees();
  }, 400);
}

async function loadEmployees() {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      page: String(currentPage.value),
      limit: '20'
    };
    if (searchQuery.value) params.search = searchQuery.value;
    if (filterDepartment.value) params.departmentId = filterDepartment.value;
    if (filterStatus.value) params.status = filterStatus.value;

    const result = await fetchEmployees(params);
    employees.value = result.docs;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadEmployees();
}

// Initial load
departments.value = await fetchDepartments();
const initialResult = await fetchEmployees();
employees.value = initialResult.docs;
pagination.value = initialResult.pagination;
</script>

<style scoped>
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-circle-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7849ff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
