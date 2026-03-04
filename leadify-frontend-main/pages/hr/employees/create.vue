<template lang="pug">
div
  //- Header
  .flex.items-center.gap-3.mb-6
    el-button(circle size="large" @click="navigateTo('/hr/employees')")
      Icon(name="ph:arrow-left-bold" size="18")
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('hr.employees.addEmployee') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('hr.employees.createNewRecord') }}

  el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
    //- Personal Info Section
    .glass-card.p-6.rounded-2xl.mb-6
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:user-bold" size="20" class="mr-2")
        | {{ $t('hr.employees.personalInformation') }}
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(:label="$t('hr.employees.firstName')" prop="firstName")
          el-input(v-model="form.firstName" :placeholder="$t('hr.employees.enterFirstName')")

        el-form-item(:label="$t('hr.employees.lastName')" prop="lastName")
          el-input(v-model="form.lastName" :placeholder="$t('hr.employees.enterLastName')")

        el-form-item(:label="$t('hr.employees.email')" prop="email")
          el-input(v-model="form.email" :placeholder="$t('hr.employees.enterEmail')" type="email")

        el-form-item(:label="$t('hr.employees.phone')")
          el-input(v-model="form.phone" :placeholder="$t('hr.employees.enterPhone')")

        el-form-item(:label="$t('hr.employees.nationalId')")
          el-input(v-model="form.nationalId" :placeholder="$t('hr.employees.enterNationalId')")

        el-form-item(:label="$t('hr.employees.passportNumber')")
          el-input(v-model="form.passportNumber" :placeholder="$t('hr.employees.enterPassportNumber')")

        el-form-item(:label="$t('hr.employees.iqamaNumber')")
          el-input(v-model="form.iqamaNumber" :placeholder="$t('hr.employees.enterIqamaNumber')")

    //- Job Info Section
    .glass-card.p-6.rounded-2xl.mb-6
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:briefcase-bold" size="20" class="mr-2")
        | {{ $t('hr.employees.jobInformation') }}
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(:label="$t('hr.employees.jobTitle')")
          el-input(v-model="form.jobTitle" :placeholder="$t('hr.employees.enterJobTitle')")

        el-form-item(:label="$t('hr.employees.department')")
          el-select(v-model="form.departmentId" class="w-full" :placeholder="$t('hr.employees.selectDepartment')" clearable)
            el-option(
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            )

        el-form-item(:label="$t('hr.employees.manager')")
          el-select(v-model="form.managerId" class="w-full" :placeholder="$t('hr.employees.selectManager')" clearable filterable)
            el-option(
              v-for="mgr in managers"
              :key="mgr.id"
              :label="`${mgr.firstName} ${mgr.lastName}`"
              :value="mgr.id"
            )

        el-form-item(:label="$t('hr.employees.employmentType')" prop="employmentType")
          el-select(v-model="form.employmentType" class="w-full" :placeholder="$t('hr.employees.selectType')")
            el-option(
              v-for="et in EMPLOYMENT_TYPES"
              :key="et.value"
              :label="et.label"
              :value="et.value"
            )

        el-form-item(:label="$t('hr.employees.hireDate')" prop="hireDate")
          el-date-picker(v-model="form.hireDate" type="date" class="w-full" value-format="YYYY-MM-DD" :placeholder="$t('hr.employees.selectHireDate')")

        el-form-item(:label="$t('hr.employees.status')")
          el-select(v-model="form.status" class="w-full" :placeholder="$t('hr.employees.selectStatus')")
            el-option(
              v-for="st in EMPLOYEE_STATUSES"
              :key="st.value"
              :label="st.label"
              :value="st.value"
            )

        el-form-item(:label="$t('hr.employees.salary')")
          el-input-number(v-model="form.salary" :min="0" :precision="2" class="w-full" :placeholder="$t('hr.employees.enterSalary')" controls-position="right")

        el-form-item(:label="$t('hr.employees.salaryFrequency')")
          el-select(v-model="form.salaryFrequency" class="w-full" :placeholder="$t('hr.employees.selectFrequency')")
            el-option(
              v-for="sf in SALARY_FREQUENCIES"
              :key="sf.value"
              :label="sf.label"
              :value="sf.value"
            )

    //- Bank Details Section
    .glass-card.p-6.rounded-2xl.mb-6
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:bank-bold" size="20" class="mr-2")
        | {{ $t('hr.employees.bankDetails') }}
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(:label="$t('hr.employees.bankName')")
          el-input(v-model="form.bankName" :placeholder="$t('hr.employees.enterBankName')")

        el-form-item(:label="$t('hr.employees.bankAccountNumber')")
          el-input(v-model="form.bankAccount" :placeholder="$t('hr.employees.enterAccountNumber')")

    //- Actions
    .flex.justify-end.gap-3
      el-button(size="large" @click="navigateTo('/hr/employees')" class="!rounded-2xl") {{ $t('common.cancel') }}
      el-button(type="primary" size="large" :loading="saving" @click="handleSubmit" class="!rounded-2xl")
        Icon(name="ph:check-bold" size="16" class="mr-1")
        span {{ $t('hr.employees.saveEmployee') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  createEmployee,
  fetchDepartments,
  fetchEmployees,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES,
  SALARY_FREQUENCIES
} from '~/composables/useEmployees';
import type { DepartmentItem, Employee } from '~/composables/useEmployees';

definePageMeta({ middleware: 'permissions' });
const router = useRouter();
const { t } = useI18n();

const saving = ref(false);
const formRef = ref();
const departments = ref<DepartmentItem[]>([]);
const managers = ref<Employee[]>([]);

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationalId: '',
  passportNumber: '',
  iqamaNumber: '',
  jobTitle: '',
  departmentId: '',
  managerId: '',
  employmentType: 'FULL_TIME',
  hireDate: '',
  status: 'ACTIVE',
  salary: undefined as number | undefined,
  salaryFrequency: 'MONTHLY',
  bankName: '',
  bankAccount: ''
});

const rules = computed(() => ({
  firstName: [{ required: true, message: t('hr.employees.firstNameRequired'), trigger: 'blur' }],
  lastName: [{ required: true, message: t('hr.employees.lastNameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('hr.employees.emailRequired'), trigger: 'blur' },
    { type: 'email' as const, message: t('hr.employees.emailInvalid'), trigger: 'blur' }
  ],
  employmentType: [{ required: true, message: t('hr.employees.employmentTypeRequired'), trigger: 'change' }],
  hireDate: [{ required: true, message: t('hr.employees.hireDateRequired'), trigger: 'change' }]
}));

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    const payload: Record<string, any> = { ...form };
    // Remove empty optional fields
    if (!payload.departmentId) delete payload.departmentId;
    if (!payload.managerId) delete payload.managerId;
    if (!payload.phone) delete payload.phone;
    if (!payload.nationalId) delete payload.nationalId;
    if (!payload.passportNumber) delete payload.passportNumber;
    if (!payload.iqamaNumber) delete payload.iqamaNumber;
    if (!payload.bankName) delete payload.bankName;
    if (!payload.bankAccount) delete payload.bankAccount;
    if (payload.salary === undefined || payload.salary === null) delete payload.salary;

    const res = await createEmployee(payload);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.employees.employeeCreated') });
      router.push('/hr/employees');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}

// Load departments and managers
departments.value = await fetchDepartments();
const mgrResult = await fetchEmployees({ limit: '500', status: 'ACTIVE' });
managers.value = mgrResult.docs;
</script>
