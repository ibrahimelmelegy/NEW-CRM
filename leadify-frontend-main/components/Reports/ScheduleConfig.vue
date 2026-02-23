<template lang="pug">
.schedule-config

  //- Enable/Disable Toggle
  .flex.items-center.justify-between.mb-6
    .flex.items-center.gap-3
      Icon(name="ph:clock" size="20" style="color: #7849ff" aria-hidden="true")
      div
        p.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('reportBuilder.scheduleDelivery') }}
        p.text-xs(style="color: var(--text-muted)") {{ $t('reportBuilder.scheduleDescription') }}
    el-switch(
      v-model="enabled"
      active-color="#7849ff"
    )

  //- Schedule Configuration (shown when enabled)
  transition(name="fade")
    .schedule-form.space-y-5(v-if="enabled")

      //- Frequency
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.frequency') }}
        el-radio-group(v-model="frequency" size="default")
          el-radio-button(value="daily")
            Icon(name="ph:sun" size="14" class="mr-1" aria-hidden="true")
            span {{ $t('reportBuilder.daily') }}
          el-radio-button(value="weekly")
            Icon(name="ph:calendar-blank" size="14" class="mr-1" aria-hidden="true")
            span {{ $t('reportBuilder.weekly') }}
          el-radio-button(value="monthly")
            Icon(name="ph:calendar" size="14" class="mr-1" aria-hidden="true")
            span {{ $t('reportBuilder.monthly') }}

      //- Day of week picker (for weekly)
      .form-group(v-if="frequency === 'weekly'")
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.dayOfWeek') }}
        .flex.gap-2
          .day-btn.px-3.py-2.rounded-lg.cursor-pointer.text-center.text-sm.font-medium(
            v-for="(day, i) in weekDays"
            :key="i"
            :class="{ 'day-selected': dayOfWeek === i }"
            @click="dayOfWeek = i"
            style="min-width: 44px; border: 1px solid var(--glass-border-color); transition: all 0.2s"
          ) {{ day }}

      //- Day of month picker (for monthly)
      .form-group(v-if="frequency === 'monthly'")
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.dayOfMonth') }}
        el-select(v-model="dayOfMonth" size="default" class="w-full")
          el-option(
            v-for="d in 28"
            :key="d"
            :value="d"
            :label="ordinal(d)"
          )

      //- Time picker
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.time') }}
        el-time-select(
          v-model="time"
          start="06:00"
          step="00:30"
          end="22:00"
          :placeholder="$t('reportBuilder.selectTime')"
          size="default"
          class="w-full"
        )

      //- Recipients
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.recipients') }}
        .recipients-input
          .flex.flex-wrap.gap-2.mb-2(v-if="recipients.length")
            el-tag(
              v-for="(email, i) in recipients"
              :key="i"
              closable
              effect="dark"
              size="default"
              @close="removeRecipient(i)"
              style="background: rgba(120, 73, 255, 0.15); border-color: rgba(120, 73, 255, 0.3); color: #7849ff"
            )
              Icon(name="ph:envelope" size="12" class="mr-1" aria-hidden="true")
              span {{ email }}
          .flex.gap-2
            el-input(
              v-model="newEmail"
              :placeholder="$t('reportBuilder.enterEmail')"
              size="default"
              class="flex-1"
              @keyup.enter="addRecipient"
            )
            el-button(
              size="default"
              @click="addRecipient"
              :disabled="!isValidEmail(newEmail)"
            )
              Icon(name="ph:plus" size="14" aria-hidden="true")
          p.text-xs.mt-1.text-red-400(v-if="emailError") {{ emailError }}

      //- Format
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.format') }}
        el-radio-group(v-model="format" size="default")
          el-radio-button(value="pdf")
            Icon(name="ph:file-pdf" size="14" class="mr-1" aria-hidden="true")
            span PDF
          el-radio-button(value="excel")
            Icon(name="ph:file-xls" size="14" class="mr-1" aria-hidden="true")
            span Excel

      //- Schedule Preview
      .schedule-preview.p-4.rounded-xl(
        v-if="scheduleDescription"
        style="background: rgba(120, 73, 255, 0.05); border: 1px solid rgba(120, 73, 255, 0.15)"
      )
        .flex.items-start.gap-3
          Icon(name="ph:bell-ringing" size="20" style="color: #7849ff" aria-hidden="true")
          div
            p.text-sm.font-medium(style="color: var(--text-primary)") {{ $t('reportBuilder.schedulePreview') }}
            p.text-sm.mt-1(style="color: var(--text-secondary)") {{ scheduleDescription }}
</template>

<script setup lang="ts">
import type { ScheduleConfig } from '~/composables/useReportBuilderPro';

interface Props {
  modelValue: ScheduleConfig | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [schedule: ScheduleConfig | null];
}>();

const newEmail = ref('');
const emailError = ref('');

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Reactive schedule fields
const enabled = computed({
  get: () => props.modelValue?.enabled ?? false,
  set: (val) => {
    if (val) {
      emit('update:modelValue', {
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        time: '08:00',
        recipients: [],
        format: 'pdf'
      });
    } else {
      emit('update:modelValue', null);
    }
  }
});

const frequency = computed({
  get: () => props.modelValue?.frequency ?? 'weekly',
  set: (val) => emitUpdate({ frequency: val })
});

const dayOfWeek = computed({
  get: () => props.modelValue?.dayOfWeek ?? 1,
  set: (val) => emitUpdate({ dayOfWeek: val })
});

const dayOfMonth = computed({
  get: () => props.modelValue?.dayOfMonth ?? 1,
  set: (val) => emitUpdate({ dayOfMonth: val })
});

const time = computed({
  get: () => props.modelValue?.time ?? '08:00',
  set: (val) => emitUpdate({ time: val })
});

const recipients = computed({
  get: () => props.modelValue?.recipients ?? [],
  set: (val) => emitUpdate({ recipients: val })
});

const format = computed({
  get: () => props.modelValue?.format ?? 'pdf',
  set: (val) => emitUpdate({ format: val })
});

function emitUpdate(partial: Partial<ScheduleConfig>) {
  if (!props.modelValue) return;
  emit('update:modelValue', {
    ...props.modelValue,
    ...partial
  });
}

function addRecipient() {
  emailError.value = '';
  if (!newEmail.value) return;

  if (!isValidEmail(newEmail.value)) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  if (recipients.value.includes(newEmail.value)) {
    emailError.value = 'Email already added';
    return;
  }

  emitUpdate({ recipients: [...recipients.value, newEmail.value] });
  newEmail.value = '';
}

function removeRecipient(index: number) {
  const updated = [...recipients.value];
  updated.splice(index, 1);
  emitUpdate({ recipients: updated });
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]!);
}

const scheduleDescription = computed(() => {
  if (!props.modelValue?.enabled) return '';

  const freq = props.modelValue.frequency;
  const t = props.modelValue.time || '08:00';
  const recipientCount = props.modelValue.recipients?.length || 0;
  const fmt = props.modelValue.format?.toUpperCase() || 'PDF';

  let when = '';
  if (freq === 'daily') {
    when = `Every day at ${t}`;
  } else if (freq === 'weekly') {
    const day = weekDays[props.modelValue.dayOfWeek || 0];
    when = `Every ${day} at ${t}`;
  } else if (freq === 'monthly') {
    when = `On the ${ordinal(props.modelValue.dayOfMonth || 1)} of each month at ${t}`;
  }

  const to = recipientCount > 0
    ? ` to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''} (${props.modelValue.recipients?.join(', ')})`
    : '';

  return `${when}${to} as ${fmt}`;
});
</script>

<style lang="scss" scoped>
.day-btn:hover {
  border-color: rgba(120, 73, 255, 0.4) !important;
  color: #7849ff;
}

.day-btn.day-selected {
  border-color: #7849ff !important;
  background: rgba(120, 73, 255, 0.12);
  color: #7849ff;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
