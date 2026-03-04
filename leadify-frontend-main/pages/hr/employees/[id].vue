<template lang="pug">
div
  //- Back button & Header
  .flex.items-center.gap-3.mb-6
    el-button(circle size="large" @click="navigateTo('/hr/employees')")
      Icon(name="ph:arrow-left-bold" size="18")
    div(v-if="employee" class="flex-1")
      .flex.items-center.gap-3
        .avatar-lg
          span.text-white.font-bold.text-lg {{ initials }}
        div
          h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ employee.firstName }} {{ employee.lastName }}
          .flex.items-center.gap-3.mt-1
            span.text-sm(style="color: var(--text-muted)") {{ employee.jobTitle || $t('hr.employees.noTitle') }}
            span.text-sm(v-if="employee.department" style="color: var(--text-muted)") | {{ employee.department?.name }}
            el-tag(:type="statusType" size="small" round) {{ statusLabel }}
    div(v-else)
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('hr.employees.employeeNotFound') }}

  template(v-if="employee")
    //- Tabs
    el-tabs(v-model="activeTab")
      //- Personal Info Tab
      el-tab-pane(:label="$t('hr.employees.personalInfo')" name="personal")
        .glass-card.p-8.rounded-3xl.mt-3
          .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
            .info-field
              .field-label
                Icon(name="ph:identification-card-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.employeeNumber') }}
              p.field-value {{ employee.employeeNumber }}

            .info-field
              .field-label
                Icon(name="ph:envelope-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.email') }}
              p.field-value {{ employee.email }}

            .info-field
              .field-label
                Icon(name="ph:phone-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.phone') }}
              p.field-value {{ employee.phone || '---' }}

            .info-field
              .field-label
                Icon(name="ph:identification-badge-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.nationalId') }}
              p.field-value {{ employee.nationalId || '---' }}

            .info-field
              .field-label
                Icon(name="ph:passport-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.passportNumber') }}
              p.field-value {{ employee.passportNumber || '---' }}

            .info-field
              .field-label
                Icon(name="ph:card-holder-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.iqamaNumber') }}
              p.field-value {{ employee.iqamaNumber || '---' }}

      //- Job Info Tab
      el-tab-pane(:label="$t('hr.employees.jobInfo')" name="job")
        .glass-card.p-8.rounded-3xl.mt-3
          .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
            .info-field
              .field-label
                Icon(name="ph:calendar-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.hireDate') }}
              p.field-value {{ formatDate(employee.hireDate) }}

            .info-field
              .field-label
                Icon(name="ph:briefcase-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.employmentType') }}
              p.field-value {{ employmentTypeLabel }}

            .info-field
              .field-label
                Icon(name="ph:buildings-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.department') }}
              p.field-value {{ employee.department?.name || '---' }}

            .info-field
              .field-label
                Icon(name="ph:user-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.manager') }}
              .field-value(v-if="employee.manager")
                nuxt-link.text-purple-500.hover-underline(:to="`/hr/employees/${employee.manager.id}`") {{ employee.manager.firstName }} {{ employee.manager.lastName }}
              p.field-value(v-else) ---

            .info-field(v-if="canViewSalary")
              .field-label
                Icon(name="ph:money-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.salary') }}
              p.field-value {{ employee.salary ? `SAR ${Number(employee.salary).toLocaleString()}` : '---' }}

            .info-field(v-if="canViewSalary")
              .field-label
                Icon(name="ph:clock-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.salaryFrequency') }}
              p.field-value {{ employee.salaryFrequency || '---' }}

            .info-field(v-if="canViewSalary")
              .field-label
                Icon(name="ph:bank-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.bankName') }}
              p.field-value {{ employee.bankName || '---' }}

            .info-field(v-if="canViewSalary")
              .field-label
                Icon(name="ph:credit-card-bold" size="18" class="mr-2")
                span {{ $t('hr.employees.bankAccount') }}
              p.field-value {{ employee.bankAccount || '---' }}

        //- Direct Reports
        .glass-card.p-6.rounded-3xl.mt-6(v-if="employee.directReports && employee.directReports.length")
          h3.font-semibold.mb-4(style="color: var(--text-primary)")
            Icon(name="ph:users-bold" size="20" class="mr-2")
            | {{ $t('hr.employees.directReports') }} ({{ employee.directReports.length }})
          .grid.gap-3(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")
            .flex.items-center.gap-3.p-3.rounded-xl.glass-card.cursor-pointer(
              v-for="report in employee.directReports"
              :key="report.id"
              @click="navigateTo(`/hr/employees/${report.id}`)"
            )
              .avatar-sm-report
                span.text-white.font-bold.text-xs {{ (report.firstName?.charAt(0) || '') + (report.lastName?.charAt(0) || '') }}
              div
                p.font-medium.text-sm(style="color: var(--text-primary)") {{ report.firstName }} {{ report.lastName }}
                p.text-xs(style="color: var(--text-muted)") {{ report.jobTitle || $t('hr.employees.noTitle') }}

      //- Documents Tab
      el-tab-pane(:label="$t('hr.employees.documents')" name="documents")
        .mt-3
          .flex.items-center.justify-between.mb-4
            h3.font-semibold(style="color: var(--text-primary)") {{ $t('hr.employees.employeeDocuments') }}
            el-button(type="primary" size="default" class="!rounded-xl" @click="docDialogVisible = true")
              Icon(name="ph:upload-bold" size="14" class="mr-1")
              span {{ $t('hr.employees.uploadDocument') }}

          .glass-card.rounded-2xl.overflow-hidden
            HRDocumentList(:documents="documents")

      //- Attendance Summary Tab
      el-tab-pane(:label="$t('hr.employees.attendance')" name="attendance")
        .glass-card.p-8.rounded-3xl.mt-3
          .text-center.py-8
            Icon(name="ph:chart-bar-bold" size="48" style="color: var(--text-muted)")
            p.mt-2(style="color: var(--text-muted)") {{ $t('hr.employees.attendanceSummary') }}
            nuxt-link.text-purple-500.text-sm(v-if="employee.userId" to="/hr/attendance") {{ $t('hr.employees.viewAttendance') }}

  //- Upload Document Dialog
  el-dialog(v-model="docDialogVisible" :title="$t('hr.employees.uploadDocument')" width="500px")
    el-form(ref="docFormRef" :model="docForm" :rules="docRules" label-position="top" size="large")
      el-form-item(:label="$t('hr.employees.documentName')" prop="name")
        el-input(v-model="docForm.name" :placeholder="$t('hr.employees.enterDocumentName')")

      el-form-item(:label="$t('hr.employees.documentType')" prop="type")
        el-select(v-model="docForm.type" class="w-full" :placeholder="$t('hr.employees.selectType')")
          el-option(v-for="dt in DOCUMENT_TYPES" :key="dt.value" :value="dt.value" :label="dt.label")

      el-form-item(:label="$t('hr.employees.fileUrl')" prop="fileUrl")
        el-input(v-model="docForm.fileUrl" :placeholder="$t('hr.employees.enterFileUrl')")

      el-form-item(:label="$t('hr.employees.expiryDate')")
        el-date-picker(v-model="docForm.expiryDate" type="date" class="w-full" value-format="YYYY-MM-DD" :placeholder="$t('hr.employees.selectExpiryDate')")

      el-form-item(:label="$t('hr.employees.notes')")
        el-input(v-model="docForm.notes" type="textarea" :rows="2" :placeholder="$t('hr.employees.optionalNotes')")

    template(#footer)
      el-button(@click="docDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="uploadingDoc" @click="handleDocUpload" class="!rounded-2xl") {{ $t('hr.employees.upload') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchEmployeeById,
  fetchEmployeeDocuments,
  addEmployeeDocument,
  getEmployeeStatusType,
  getEmployeeStatusLabel,
  getEmploymentTypeLabel,
  DOCUMENT_TYPES
} from '~/composables/useEmployees';
import { usePermissionsSync } from '~/composables/usePermissions';
import type { Employee, EmployeeDocumentItem } from '~/composables/useEmployees';

definePageMeta({ middleware: 'permissions' });
const route = useRoute();
const { t } = useI18n();

const { hasPermission } = usePermissionsSync();
const canViewSalary = computed(() => hasPermission('VIEW_SALARY'));

const activeTab = ref('personal');
const docDialogVisible = ref(false);
const uploadingDoc = ref(false);
const docFormRef = ref();

const employee = ref<Employee | null>(await fetchEmployeeById(route.params.id as string));
const documents = ref<EmployeeDocumentItem[]>([]);

if (employee.value) {
  documents.value = await fetchEmployeeDocuments(employee.value.id);
  // Also use documents from the include if available
  if (employee.value.documents && employee.value.documents.length && !documents.value.length) {
    documents.value = employee.value.documents;
  }
}

const initials = computed(() => {
  if (!employee.value) return '';
  return `${employee.value.firstName?.charAt(0) || ''}${employee.value.lastName?.charAt(0) || ''}`.toUpperCase();
});

const statusType = computed(() => (employee.value ? getEmployeeStatusType(employee.value.status) : ''));
const statusLabel = computed(() => (employee.value ? getEmployeeStatusLabel(employee.value.status) : ''));
const employmentTypeLabel = computed(() => (employee.value ? getEmploymentTypeLabel(employee.value.employmentType) : ''));

function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const docForm = reactive({
  name: '',
  type: '',
  fileUrl: '',
  expiryDate: '',
  notes: ''
});

const docRules = computed(() => ({
  name: [{ required: true, message: t('hr.employees.documentNameRequired'), trigger: 'blur' }],
  type: [{ required: true, message: t('hr.employees.documentTypeRequired'), trigger: 'change' }],
  fileUrl: [{ required: true, message: t('hr.employees.fileUrlRequired'), trigger: 'blur' }]
}));

async function handleDocUpload() {
  const valid = await docFormRef.value?.validate().catch(() => false);
  if (!valid || !employee.value) return;

  uploadingDoc.value = true;
  try {
    const res = await addEmployeeDocument(employee.value.id, {
      name: docForm.name,
      type: docForm.type,
      fileUrl: docForm.fileUrl,
      expiryDate: docForm.expiryDate || undefined,
      notes: docForm.notes || undefined
    });
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.employees.documentUploaded') });
      docDialogVisible.value = false;
      documents.value = await fetchEmployeeDocuments(employee.value.id);
      // Reset form
      docForm.name = '';
      docForm.type = '';
      docForm.fileUrl = '';
      docForm.expiryDate = '';
      docForm.notes = '';
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    uploadingDoc.value = false;
  }
}
</script>

<style scoped>
.avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7849ff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-sm-report {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7849ff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-field {
  margin-bottom: 0;
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.field-value {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.hover-underline:hover {
  text-decoration: underline;
}
</style>
