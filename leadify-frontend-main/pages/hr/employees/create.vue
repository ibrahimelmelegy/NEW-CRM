<template lang="pug">
div
  //- Header
  .flex.items-center.gap-3.mb-6
    el-button(circle size="large" @click="navigateTo('/hr/employees')")
      Icon(name="ph:arrow-left-bold" size="18")
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") Add Employee
      p.text-sm.mt-1(style="color: var(--text-muted)") Create a new employee record

  el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
    //- Personal Info Section
    .glass-card.p-6.rounded-2xl.mb-6
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:user-bold" size="20" class="mr-2")
        | Personal Information
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(label="First Name" prop="firstName")
          el-input(v-model="form.firstName" placeholder="Enter first name")

        el-form-item(label="Last Name" prop="lastName")
          el-input(v-model="form.lastName" placeholder="Enter last name")

        el-form-item(label="Email" prop="email")
          el-input(v-model="form.email" placeholder="Enter email address" type="email")

        el-form-item(label="Phone")
          el-input(v-model="form.phone" placeholder="Enter phone number")

        el-form-item(label="National ID")
          el-input(v-model="form.nationalId" placeholder="Enter national ID")

        el-form-item(label="Passport Number")
          el-input(v-model="form.passportNumber" placeholder="Enter passport number")

        el-form-item(label="Iqama Number")
          el-input(v-model="form.iqamaNumber" placeholder="Enter iqama number")

    //- Job Info Section
    .glass-card.p-6.rounded-2xl.mb-6
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:briefcase-bold" size="20" class="mr-2")
        | Job Information
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(label="Job Title")
          el-input(v-model="form.jobTitle" placeholder="Enter job title")

        el-form-item(label="Department")
          el-select(v-model="form.departmentId" class="w-full" placeholder="Select department" clearable)
            el-option(
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            )

        el-form-item(label="Manager")
          el-select(v-model="form.managerId" class="w-full" placeholder="Select manager" clearable filterable)
            el-option(
              v-for="mgr in managers"
              :key="mgr.id"
              :label="`${mgr.firstName} ${mgr.lastName}`"
              :value="mgr.id"
            )

        el-form-item(label="Employment Type" prop="employmentType")
          el-select(v-model="form.employmentType" class="w-full" placeholder="Select type")
            el-option(
              v-for="et in EMPLOYMENT_TYPES"
              :key="et.value"
              :label="et.label"
              :value="et.value"
            )

        el-form-item(label="Hire Date" prop="hireDate")
          el-date-picker(v-model="form.hireDate" type="date" class="w-full" value-format="YYYY-MM-DD" placeholder="Select hire date")

        el-form-item(label="Status")
          el-select(v-model="form.status" class="w-full" placeholder="Select status")
            el-option(
              v-for="st in EMPLOYEE_STATUSES"
              :key="st.value"
              :label="st.label"
              :value="st.value"
            )

        el-form-item(label="Salary")
          el-input-number(v-model="form.salary" :min="0" :precision="2" class="w-full" placeholder="Enter salary" controls-position="right")

        el-form-item(label="Salary Frequency")
          el-select(v-model="form.salaryFrequency" class="w-full" placeholder="Select frequency")
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
        | Bank Details
      .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
        el-form-item(label="Bank Name")
          el-input(v-model="form.bankName" placeholder="Enter bank name")

        el-form-item(label="Bank Account Number")
          el-input(v-model="form.bankAccount" placeholder="Enter account number")

    //- Actions
    .flex.justify-end.gap-3
      el-button(size="large" @click="navigateTo('/hr/employees')" class="!rounded-2xl") Cancel
      el-button(type="primary" size="large" :loading="saving" @click="handleSubmit" class="!rounded-2xl")
        Icon(name="ph:check-bold" size="16" class="mr-1")
        span Save Employee
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

const rules = {
  firstName: [{ required: true, message: 'First name is required', trigger: 'blur' }],
  lastName: [{ required: true, message: 'Last name is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email' as const, message: 'Please enter a valid email', trigger: 'blur' }
  ],
  employmentType: [{ required: true, message: 'Employment type is required', trigger: 'change' }],
  hireDate: [{ required: true, message: 'Hire date is required', trigger: 'change' }]
};

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
      ElNotification({ type: 'success', title: 'Success', message: 'Employee created successfully' });
      router.push('/hr/employees');
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
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
