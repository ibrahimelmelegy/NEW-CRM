<template lang="pug">
.employee-card.glass-card.p-4.rounded-2xl.cursor-pointer.transition-all.hover-shadow(
  @click="$emit('click', employee)"
  class="hover:scale-[1.02]"
)
  .flex.items-center.gap-3.mb-3
    .avatar-circle.flex-shrink-0
      span.text-white.font-bold.text-sm {{ initials }}
    div(class="min-w-0 flex-1")
      h4.font-semibold.truncate(style="color: var(--text-primary)") {{ fullName }}
      p.text-xs.truncate(style="color: var(--text-muted)") {{ employee.employeeNumber }}

  .space-y-2
    .flex.items-center.gap-2(v-if="employee.jobTitle")
      Icon(name="ph:briefcase-bold" size="14" style="color: var(--text-muted)")
      span.text-sm.truncate(style="color: var(--text-primary)") {{ employee.jobTitle }}

    .flex.items-center.gap-2(v-if="employee.department")
      Icon(name="ph:buildings-bold" size="14" style="color: var(--text-muted)")
      span.text-sm.truncate(style="color: var(--text-primary)") {{ employee.department?.name || employee.department }}

    .flex.items-center.gap-2(v-if="employee.email")
      Icon(name="ph:envelope-bold" size="14" style="color: var(--text-muted)")
      span.text-xs.truncate(style="color: var(--text-muted)") {{ employee.email }}

    .flex.items-center.gap-2(v-if="employee.phone")
      Icon(name="ph:phone-bold" size="14" style="color: var(--text-muted)")
      span.text-xs(style="color: var(--text-muted)") {{ employee.phone }}

  .mt-3.flex.items-center.justify-between
    el-tag(
      :type="statusType"
      size="small"
      round
    ) {{ statusLabel }}
    el-tag(
      v-if="employee.employmentType"
      size="small"
      type="info"
      round
    ) {{ employmentTypeLabel }}
</template>

<script setup lang="ts">
import { getEmployeeStatusType, getEmployeeStatusLabel, getEmploymentTypeLabel } from '~/composables/useEmployees';
import type { Employee } from '~/composables/useEmployees';

const props = defineProps<{
  employee: Employee;
}>();

defineEmits<{
  click: [employee: Employee];
}>();

const fullName = computed(() => `${props.employee.firstName} ${props.employee.lastName}`);

const initials = computed(() => {
  const first = props.employee.firstName?.charAt(0) || '';
  const last = props.employee.lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
});

const statusType = computed(() => getEmployeeStatusType(props.employee.status));
const statusLabel = computed(() => getEmployeeStatusLabel(props.employee.status));
const employmentTypeLabel = computed(() => getEmploymentTypeLabel(props.employee.employmentType));
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7849ff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hover-shadow:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}
</style>
