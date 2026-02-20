<template lang="pug">
.call-logger
  .call-logger-header
    .header-icon
      Icon(name="ph:phone-bold" size="20")
    h4.header-title {{ $t('communication.logCall') || 'Log Call' }}

  .call-logger-body
    //- Phone Number
    .form-row
      label.form-label {{ $t('communication.phoneNumber') || 'Phone Number' }}
      .phone-input-wrapper
        el-input(
          v-model="form.phoneNumber"
          :placeholder="$t('communication.enterPhone') || 'Enter phone number'"
          size="default"
        )
          template(#prefix)
            Icon(name="ph:phone-bold" size="16")
        a.click-to-call(
          v-if="form.phoneNumber"
          :href="'tel:' + form.phoneNumber"
          :title="$t('communication.clickToCall') || 'Click to call'"
        )
          Icon(name="ph:phone-outgoing-bold" size="16")

    //- Timer / Duration
    .form-row
      label.form-label {{ $t('communication.duration') || 'Duration' }}
      .timer-section
        .timer-display
          span.timer-value {{ formattedTimer }}
        .timer-controls
          el-button(
            v-if="!callTimerRunning"
            type="success"
            size="small"
            round
            @click="startTimer"
          )
            Icon(name="ph:play-bold" size="14")
            span {{ $t('communication.start') || 'Start' }}
          el-button(
            v-else
            type="danger"
            size="small"
            round
            @click="stopTimer"
          )
            Icon(name="ph:stop-bold" size="14")
            span {{ $t('communication.stop') || 'Stop' }}
          el-button(
            size="small"
            round
            @click="resetTimer"
            :disabled="callTimerRunning"
          )
            Icon(name="ph:arrow-counter-clockwise-bold" size="14")
        .manual-duration
          el-input-number(
            v-model="manualMinutes"
            :min="0"
            :max="999"
            size="small"
            :placeholder="'min'"
            controls-position="right"
          )
          span.duration-label min
          el-input-number(
            v-model="manualSeconds"
            :min="0"
            :max="59"
            size="small"
            :placeholder="'sec'"
            controls-position="right"
          )
          span.duration-label sec

    //- Outcome
    .form-row
      label.form-label {{ $t('communication.outcome') || 'Outcome' }}
      .outcome-buttons
        el-radio-group(v-model="form.outcome" size="small")
          el-radio-button(
            v-for="opt in outcomeOptions"
            :key="opt.value"
            :value="opt.value"
          ) {{ opt.label }}

    //- Direction
    .form-row
      label.form-label {{ $t('communication.direction') || 'Direction' }}
      el-radio-group(v-model="form.direction" size="small")
        el-radio-button(value="OUTBOUND") {{ $t('communication.outbound') || 'Outbound' }}
        el-radio-button(value="INBOUND") {{ $t('communication.inbound') || 'Inbound' }}

    //- Subject
    .form-row
      label.form-label {{ $t('communication.subject') || 'Subject' }}
      el-input(
        v-model="form.subject"
        :placeholder="$t('communication.callSubject') || 'Brief call subject'"
        size="default"
      )

    //- Notes
    .form-row
      label.form-label {{ $t('communication.notes') || 'Notes' }}
      el-input(
        v-model="form.notes"
        type="textarea"
        :rows="3"
        :placeholder="$t('communication.callNotes') || 'Key points discussed...'"
        resize="none"
      )

  //- Footer
  .call-logger-footer
    el-button(
      type="primary"
      :loading="submitting"
      :disabled="!isValid"
      @click="handleSubmit"
      round
    )
      Icon(name="ph:phone-bold" size="16")
      span {{ $t('communication.logCall') || 'Log Call' }}
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
  useCommunication,
  CallOutcome,
  ActivityDirection,
  ContactType,
  callOutcomeOptions as outcomeOptions,
  formatCallDuration as formatDuration
} from '../../composables/useCommunication';

interface Props {
  contactId: string;
  contactType: 'CLIENT' | 'LEAD' | 'DEAL';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'saved'): void;
}>();

const { t } = useI18n();

const {
  logCall,
  callTimerRunning,
  callTimerSeconds,
  startCallTimer,
  stopCallTimer,
  resetCallTimer
} = useCommunication(props.contactId, props.contactType);

const submitting = ref(false);
const manualMinutes = ref(0);
const manualSeconds = ref(0);

const form = ref({
  phoneNumber: '',
  outcome: CallOutcome.CONNECTED as string,
  direction: ActivityDirection.OUTBOUND as string,
  subject: '',
  notes: ''
});

const formattedTimer = computed(() => formatDuration(callTimerSeconds.value));

const effectiveDuration = computed(() => {
  if (callTimerSeconds.value > 0) return callTimerSeconds.value;
  return manualMinutes.value * 60 + manualSeconds.value;
});

const isValid = computed(() => {
  return form.value.phoneNumber.trim().length > 0 && form.value.subject.trim().length > 0;
});

function startTimer() {
  startCallTimer();
}

function stopTimer() {
  const duration = stopCallTimer();
  manualMinutes.value = Math.floor(duration / 60);
  manualSeconds.value = duration % 60;
}

function resetTimer() {
  resetCallTimer();
  manualMinutes.value = 0;
  manualSeconds.value = 0;
}

async function handleSubmit() {
  if (!isValid.value) return;

  submitting.value = true;
  try {
    const res = await logCall({
      contactId: props.contactId,
      contactType: props.contactType as ContactType,
      subject: form.value.subject,
      direction: form.value.direction as ActivityDirection,
      phoneNumber: form.value.phoneNumber,
      duration: effectiveDuration.value,
      outcome: form.value.outcome as CallOutcome,
      notes: form.value.notes || undefined
    });

    if (res?.success) {
      ElMessage.success(t('communication.callLogged') || 'Call logged successfully');
      // Reset form
      form.value = {
        phoneNumber: '',
        outcome: CallOutcome.CONNECTED,
        direction: ActivityDirection.OUTBOUND,
        subject: '',
        notes: ''
      };
      resetTimer();
      emit('saved');
    } else {
      ElMessage.error(res?.message || 'Failed to log call');
    }
  } finally {
    submitting.value = false;
  }
}

// Cleanup timer on unmount
onUnmounted(() => {
  if (callTimerRunning.value) {
    stopCallTimer();
  }
});
</script>

<style lang="scss" scoped>
.call-logger {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color);
  border-radius: 1rem;
  box-shadow: var(--glass-shadow);
  overflow: hidden;

  .call-logger-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--glass-border-color);

    .header-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .header-title {
      font-size: 0.938rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
  }

  .call-logger-body {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .form-row {
      .form-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.375rem;
      }
    }

    .phone-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .el-input { flex: 1; }

      .click-to-call {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        transition: all 0.2s ease;
        text-decoration: none;

        &:hover {
          background: rgba(16, 185, 129, 0.2);
          transform: scale(1.05);
        }
      }
    }

    .timer-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .timer-display {
        .timer-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }
      }

      .timer-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .manual-duration {
        display: flex;
        align-items: center;
        gap: 0.375rem;

        .el-input-number { width: 90px; }

        .duration-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .outcome-buttons {
      .el-radio-group {
        flex-wrap: wrap;
      }
    }
  }

  .call-logger-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--glass-border-color);
    display: flex;
    justify-content: flex-end;
  }
}
</style>
