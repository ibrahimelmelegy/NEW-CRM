<template lang="pug">
FormPage(
  :title="$t('hr.leave.requestLeave')"
  :subtitle="$t('hr.leave.subtitle')"
  :breadcrumbs="[{ label: $t('navigation.hr'), to: '/hr/leave-requests' }, { label: $t('hr.leave.title'), to: '/hr/leave-requests' }, { label: $t('common.create') }]"
  :loading="saving"
  @submit="handleSubmit"
)
  el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
    .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
      el-form-item(:label="$t('hr.leave.type')" prop="leaveType")
        el-select(v-model="form.leaveType" class="w-full" :placeholder="$t('common.choose') + $t('hr.leave.type')")
          el-option(v-for="lt in LEAVE_TYPES" :key="lt.value" :value="lt.value" :label="lt.label")

      .hidden(class="md:block")

      el-form-item(:label="$t('hr.leave.from')" prop="startDate")
        el-date-picker(v-model="form.startDate" type="date" class="w-full" value-format="YYYY-MM-DD")

      el-form-item(:label="$t('hr.leave.to')" prop="endDate")
        el-date-picker(v-model="form.endDate" type="date" class="w-full" value-format="YYYY-MM-DD")

    el-form-item(:label="$t('hr.leave.reason')")
      el-input(v-model="form.reason" type="textarea" :rows="3" :placeholder="$t('common.enter') + $t('hr.leave.reason')")

    //- Days summary
    .glass-card.p-4.mt-4.flex.items-center.gap-3(v-if="form.startDate && form.endDate")
      Icon(name="ph:calendar-check-bold" size="24" style="color: #7849ff")
      span.font-medium(style="color: var(--text-primary)") {{ dayCount }} {{ $t('common.days') }}
      span.text-sm(style="color: var(--text-muted)") ({{ form.startDate }} → {{ form.endDate }})
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { createLeaveRequest, LEAVE_TYPES } from '~/composables/useHR';

definePageMeta({ middleware: 'permissions' });
const { t } = useI18n();
const router = useRouter();

const saving = ref(false);
const formRef = ref();

const form = reactive({
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: ''
});

const rules = {
  leaveType: [{ required: true, message: 'Leave type is required', trigger: 'change' }],
  startDate: [{ required: true, message: 'Start date is required', trigger: 'change' }],
  endDate: [{ required: true, message: 'End date is required', trigger: 'change' }]
};

const dayCount = computed(() => {
  if (!form.startDate || !form.endDate) return 0;
  const start = new Date(form.startDate);
  const end = new Date(form.endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
});

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const res = await createLeaveRequest(form);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      router.push('/hr/leave-requests');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally { saving.value = false; }
}
</script>
