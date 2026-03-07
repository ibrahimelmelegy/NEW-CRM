<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('hr.employees.employees') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('hr.employees.manageEmployees') }}
    .flex.items-center.gap-3
      ExportButton(
        :data="exportData"
        :columns="exportColumns"
        filename="employees-export"
        :title="$t('hr.employees.employeesReport')"
      )
      el-button(type="primary" size="large" class="!rounded-2xl" @click="navigateTo('/hr/employees/create')")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        span {{ $t('hr.employees.addEmployee') }}

  //- Filters
  .glass-card.p-4.rounded-2xl.mb-6
    .flex.flex-wrap.items-center.gap-4
      el-input(
        v-model="searchQuery"
        :placeholder="$t('hr.employees.searchEmployees')"
        size="large"
        clearable
        class="max-w-xs"
        @input="debouncedSearch"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass-bold" size="16")

      el-select(
        v-model="filterDepartment"
        :placeholder="$t('hr.employees.allDepartments')"
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
        :placeholder="$t('hr.employees.allStatuses')"
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
          p.text-xs(style="color: var(--text-muted)") {{ $t('hr.employees.total') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ pagination.totalItems }}
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-blue-100
          Icon(name="ph:check-circle-bold" size="20" class="text-blue-600")
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('hr.employees.active') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ activeCount }}
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-yellow-100
          Icon(name="ph:clock-bold" size="20" class="text-yellow-600")
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('hr.employees.onLeave') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ onLeaveCount }}
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .stat-icon.bg-purple-100
          Icon(name="ph:user-plus-bold" size="20" class="text-purple-600")
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('hr.employees.probation') }}
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ probationCount }}

  //- Loading
  .flex.justify-center.py-12(v-if="loading")
    el-skeleton(:rows="5" animated)

  //- Grid View
  template(v-else-if="viewMode === 'grid'")
    .grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" v-if="employees.length")
      .relative(v-for="emp in employees" :key="emp.id")
        HREmployeeCard(
          :employee="emp"
          @click="navigateTo(`/hr/employees/${emp.id}`)"
        )
        .absolute.top-2.right-2(@click.stop)
          el-dropdown(trigger="click")
            el-button(text circle size="small")
              Icon(name="ph:dots-three-vertical-bold" size="16")
            template(#dropdown)
              el-dropdown-menu
                el-dropdown-item(@click="navigateTo(`/hr/employees/${emp.id}`)")
                  .flex.items-center.gap-2
                    Icon(name="ph:eye-bold" size="16")
                    span {{ $t('common.view') }}
                el-dropdown-item(@click="navigateTo(`/hr/employees/${emp.id}`)")
                  .flex.items-center.gap-2
                    Icon(name="ph:pencil-bold" size="16")
                    span {{ $t('common.edit') }}
                el-dropdown-item(@click="handleDeleteClick(emp.id)")
                  .flex.items-center.gap-2
                    Icon(name="ph:trash-bold" size="16" style="color: #ef4444")
                    span(style="color: #ef4444") {{ $t('common.delete') }}
    .text-center.py-12(v-else)
      Icon(name="ph:users-bold" size="48" style="color: var(--text-muted)")
      p.mt-2(style="color: var(--text-muted)") {{ $t('hr.employees.noEmployeesFound') }}

  //- List View
  template(v-else)
    .glass-card.rounded-2xl.overflow-hidden(v-if="employees.length")
      el-table(:data="employees" style="width: 100%" @row-click="(row) => navigateTo(`/hr/employees/${row.id}`)")
        el-table-column(:label="$t('hr.employees.employee')" min-width="220")
          template(#default="{ row }")
            .flex.items-center.gap-3
              .avatar-circle-sm
                span.text-white.font-bold.text-xs {{ (row.firstName?.charAt(0) || '') + (row.lastName?.charAt(0) || '') }}
              div
                p.font-semibold(style="color: var(--text-primary)") {{ row.firstName }} {{ row.lastName }}
                p.text-xs(style="color: var(--text-muted)") {{ row.employeeNumber }}
        el-table-column(prop="jobTitle" :label="$t('hr.employees.jobTitle')" min-width="160")
          template(#default="{ row }")
            span(style="color: var(--text-primary)") {{ row.jobTitle || '---' }}
        el-table-column(:label="$t('hr.employees.department')" min-width="140")
          template(#default="{ row }")
            span(style="color: var(--text-primary)") {{ row.department?.name || '---' }}
        el-table-column(:label="$t('hr.employees.status')" width="130")
          template(#default="{ row }")
            el-tag(:type="getEmployeeStatusType(row.status)" size="small" round) {{ getEmployeeStatusLabel(row.status) }}
        el-table-column(prop="email" :label="$t('hr.employees.email')" min-width="200")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.email }}
        el-table-column(prop="phone" :label="$t('hr.employees.phone')" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.phone || '---' }}
        el-table-column(label="" width="80" align="center")
          template(#default="{ row }")
            el-dropdown(trigger="click" @click.stop)
              el-button(text circle)
                Icon(name="ph:dots-three-vertical-bold" size="18")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click.stop="navigateTo(`/hr/employees/${row.id}`)")
                    .flex.items-center.gap-2
                      Icon(name="ph:eye-bold" size="16")
                      span {{ $t('common.view') }}
                  el-dropdown-item(@click.stop="navigateTo(`/hr/employees/${row.id}`)")
                    .flex.items-center.gap-2
                      Icon(name="ph:pencil-bold" size="16")
                      span {{ $t('common.edit') }}
                  el-dropdown-item(@click.stop="handleDeleteClick(row.id)")
                    .flex.items-center.gap-2
                      Icon(name="ph:trash-bold" size="16" style="color: #ef4444")
                      span(style="color: #ef4444") {{ $t('common.delete') }}
    .text-center.py-12(v-else)
      Icon(name="ph:users-bold" size="48" style="color: var(--text-muted)")
      p.mt-2(style="color: var(--text-muted)") {{ $t('hr.employees.noEmployeesFound') }}

  //- Pagination
  .flex.justify-center.mt-6(v-if="pagination.totalPages > 1")
    el-pagination(
      v-model:current-page="currentPage"
      :page-size="pagination.limit"
      :total="pagination.totalItems"
      layout="prev, pager, next"
      @current-change="handlePageChange"
    )

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import {
  fetchEmployees,
  fetchDepartments,
  deleteEmployee,
  EMPLOYEE_STATUSES,
  getEmployeeStatusType,
  getEmployeeStatusLabel
} from '~/composables/useEmployees';
import type { Employee, DepartmentItem } from '~/composables/useEmployees';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const loading = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const filterDepartment = ref('');
const filterStatus = ref('');
const currentPage = ref(1);

const employees = ref<Employee[]>([]);
const departments = ref<DepartmentItem[]>([]);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

const deletePopup = ref(false);
const deleting = ref(false);
const deleteTargetId = ref<string | null>(null);

const activeCount = computed(() => employees.value.filter(e => e.status === 'ACTIVE').length);
const onLeaveCount = computed(() => employees.value.filter(e => e.status === 'ON_LEAVE').length);
const probationCount = computed(() => employees.value.filter(e => e.status === 'PROBATION').length);

const exportColumns = computed(() => [
  { prop: 'fullName', label: t('hr.employees.name') },
  { prop: 'employeeNumber', label: t('hr.employees.employeeNumber') },
  { prop: 'jobTitle', label: t('hr.employees.jobTitle') },
  { prop: 'departmentName', label: t('hr.employees.department') },
  { prop: 'status', label: t('hr.employees.status') },
  { prop: 'email', label: t('hr.employees.email') },
  { prop: 'phone', label: t('hr.employees.phone') }
]);

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

function handleDeleteClick(id: string) {
  deleteTargetId.value = id;
  deletePopup.value = true;
}

async function confirmDelete() {
  if (!deleteTargetId.value) return;
  deleting.value = true;
  try {
    const res = await deleteEmployee(deleteTargetId.value);
    if (res.success) {
      employees.value = employees.value.filter(e => e.id !== deleteTargetId.value);
      ElMessage.success(t('common.deleted'));
    } else {
      ElMessage.error(t('common.error'));
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
    deleteTargetId.value = null;
  }
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
