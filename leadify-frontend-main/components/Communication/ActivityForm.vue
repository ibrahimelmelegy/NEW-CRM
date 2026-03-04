<template lang="pug">
el-dialog(
  :model-value="visible"
  :title="isEditing ? ($t('communication.editActivity') || 'Edit Activity') : ($t('communication.logActivity') || 'Log Activity')"
  width="560px"
  @close="handleClose"
  append-to-body
  destroy-on-close
)
  .activity-form
    //- Activity Type Tabs
    .type-tabs(v-if="!isEditing")
      button.type-tab(
        v-for="typeOpt in activityTypes"
        :key="typeOpt.value"
        :class="{ active: form.type === typeOpt.value }"
        :style="form.type === typeOpt.value ? getActiveTabStyle(typeOpt.color) : {}"
        @click="form.type = typeOpt.value"
      )
        Icon(:name="typeOpt.icon" size="18")
        span {{ typeOpt.label }}

    //- Subject
    .form-field
      label.field-label {{ $t('communication.subject') || 'Subject' }}
      span.required-star *
      el-input(
        v-model="form.subject"
        :placeholder="getSubjectPlaceholder()"
        maxlength="255"
        show-word-limit
      )

    //- Body / Notes
    .form-field
      label.field-label {{ $t('communication.bodyNotes') || 'Body / Notes' }}
      el-input(
        v-model="form.body"
        type="textarea"
        :rows="4"
        :placeholder="getBodyPlaceholder()"
        resize="vertical"
      )

    //- Direction (for Email and Call)
    .form-field(v-if="showDirection")
      label.field-label {{ $t('communication.direction') || 'Direction' }}
      el-radio-group(v-model="form.direction")
        el-radio-button(value="INBOUND")
          Icon(name="ph:arrow-down-left-bold" size="14")
          span(class="ml-1") {{ $t('communication.inbound') || 'Inbound' }}
        el-radio-button(value="OUTBOUND")
          Icon(name="ph:arrow-up-right-bold" size="14")
          span(class="ml-1") {{ $t('communication.outbound') || 'Outbound' }}

    //- Duration (for Call and Meeting)
    .form-field(v-if="showDuration")
      label.field-label {{ $t('communication.duration') || 'Duration' }}
      .duration-inputs
        el-input-number(
          v-model="durationMinutes"
          :min="0"
          :max="999"
          controls-position="right"
          :placeholder="'min'"
        )
        span.duration-separator min
        el-input-number(
          v-model="durationSeconds"
          :min="0"
          :max="59"
          controls-position="right"
          :placeholder="'sec'"
        )
        span.duration-separator sec

    //- Date/Time picker
    .form-field
      label.field-label {{ $t('communication.dateTime') || 'Date & Time' }}
      el-date-picker(
        v-model="form.dateTime"
        type="datetime"
        :placeholder="$t('communication.selectDateTime') || 'Select date and time'"
        style="width: 100%"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DDTHH:mm:ss"
      )

  template(#footer)
    .dialog-footer
      el-button(@click="handleClose") {{ $t('common.cancel') || 'Cancel' }}
      el-button(
        type="primary"
        :loading="submitting"
        :disabled="!isValid"
        @click="handleSubmit"
      ) {{ isEditing ? ($t('common.save') || 'Save') : ($t('communication.logActivity') || 'Log Activity') }}
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
  useCommunication,
  ActivityType,
  ActivityDirection,
  ContactType,
  activityTypeOptions,
  type CommunicationActivity as Activity
} from '../../composables/useCommunication';

interface Props {
  visible: boolean;
  contactId: string;
  contactType: 'CLIENT' | 'LEAD' | 'DEAL';
  editingActivity?: Activity | null;
}

const props = withDefaults(defineProps<Props>(), {
  editingActivity: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { logActivity, updateActivity } = useCommunication(props.contactId, props.contactType);

const submitting = ref(false);
const durationMinutes = ref(0);
const durationSeconds = ref(0);

const activityTypes = activityTypeOptions;

const form = ref({
  type: ActivityType.NOTE as string,
  subject: '',
  body: '',
  direction: ActivityDirection.OUTBOUND as string,
  dateTime: new Date().toISOString().slice(0, 19)
});

const isEditing = computed(() => !!props.editingActivity);

const showDirection = computed(() => {
  return form.value.type === ActivityType.EMAIL || form.value.type === ActivityType.CALL;
});

const showDuration = computed(() => {
  return form.value.type === ActivityType.CALL || form.value.type === ActivityType.MEETING;
});

const isValid = computed(() => {
  return form.value.subject.trim().length > 0;
});

function getActiveTabStyle(color: string) {
  return {
    color,
    background: `${color}15`,
    borderColor: `${color}40`
  };
}

function getSubjectPlaceholder(): string {
  const placeholders: Record<string, string> = {
    EMAIL: t('communication.emailSubject') || 'Email subject...',
    CALL: t('communication.callSubject') || 'Call summary...',
    NOTE: t('communication.noteSubject') || 'Note title...',
    MEETING: t('communication.meetingSubject') || 'Meeting topic...',
    TASK: t('communication.taskSubject') || 'Task description...'
  };
  return placeholders[form.value.type] || 'Subject...';
}

function getBodyPlaceholder(): string {
  const placeholders: Record<string, string> = {
    EMAIL: t('communication.emailBody') || 'Email content or summary...',
    CALL: t('communication.callNotes') || 'Key points discussed...',
    NOTE: t('communication.noteBody') || 'Write your note...',
    MEETING: t('communication.meetingNotes') || 'Meeting agenda and notes...',
    TASK: t('communication.taskDetails') || 'Task details...'
  };
  return placeholders[form.value.type] || 'Details...';
}

function handleClose() {
  emit('close');
}

async function handleSubmit() {
  if (!isValid.value) return;

  submitting.value = true;
  try {
    const duration = durationMinutes.value * 60 + durationSeconds.value;

    if (isEditing.value && props.editingActivity) {
      // Update existing
      const res = await updateActivity(props.editingActivity.id, {
        subject: form.value.subject,
        body: form.value.body || undefined,
        direction: showDirection.value ? form.value.direction : undefined,
        duration: showDuration.value ? duration : undefined
      });

      if (res?.success) {
        ElMessage.success(t('communication.activityUpdated') || 'Activity updated');
        emit('saved');
      } else {
        ElMessage.error(res?.message || 'Failed to update activity');
      }
    } else {
      // Create new
      const res = await logActivity({
        type: form.value.type as ActivityType,
        contactId: props.contactId,
        contactType: props.contactType as ContactType,
        subject: form.value.subject,
        body: form.value.body || undefined,
        direction: showDirection.value ? (form.value.direction as ActivityDirection) : undefined,
        duration: showDuration.value ? duration : undefined,
        metadata: form.value.dateTime ? { scheduledAt: form.value.dateTime } : undefined
      });

      if (res?.success) {
        ElMessage.success(t('communication.activityLogged') || 'Activity logged');
        emit('saved');
      } else {
        ElMessage.error(res?.message || 'Failed to log activity');
      }
    }
  } finally {
    submitting.value = false;
  }
}

// Populate form when editing
watch(
  () => props.editingActivity,
  activity => {
    if (activity) {
      form.value.type = activity.type;
      form.value.subject = activity.subject;
      form.value.body = activity.body || '';
      form.value.direction = activity.direction || ActivityDirection.OUTBOUND;
      if (activity.duration) {
        durationMinutes.value = Math.floor(activity.duration / 60);
        durationSeconds.value = activity.duration % 60;
      }
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.activity-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .type-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .type-tab {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      border: 1px solid var(--glass-border-color);
      background: var(--glass-bg);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.813rem;
      font-weight: 600;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
      }

      &.active {
        font-weight: 700;
      }
    }
  }

  .form-field {
    .field-label {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.375rem;
    }

    .required-star {
      color: #ef4444;
      margin-left: 2px;
    }
  }

  .duration-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .el-input-number {
      width: 100px;
    }

    .duration-separator {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
